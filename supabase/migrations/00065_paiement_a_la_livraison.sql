-- ─────────────────────────────────────────────────────────────────────────────
-- 00065 — Paiement à la livraison
--
-- Le colis n'était créé qu'après un paiement en ligne intégral, par carte ou
-- Mobile Money. En Côte d'Ivoire, le paiement à la remise est le mode dominant :
-- exiger l'avance écartait du service la clientèle qu'il vise.
--
-- Le paiement existe dès la commande, comme pour les autres modes — c'est son
-- encaissement qui est différé. Rien de nouveau dans le cycle : un paiement
-- `en_attente` qui passe `capture`, sauf que c'est le livreur qui l'encaisse,
-- au moment de la remise et pas avant. Un colis remis sans avoir été payé serait
-- une perte sèche : les deux gestes sont donc indissociables côté application.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Une méthode de paiement dédiée ──────────────────────────────────────────
-- Ni « agence » (payé au comptoir avant l'envoi) ni « especes » : le livreur
-- encaisse indifféremment en liquide ou par transfert Mobile Money au pas de la
-- porte. Ce qui compte est *quand* et *par qui*, pas la forme du règlement.
alter table public.paiements drop constraint if exists paiements_methode_check;

alter table public.paiements add constraint paiements_methode_check
  check (methode in ('cinetpay', 'stripe', 'agence', 'virement', 'a_la_livraison'));

-- ── Ce que le livreur a effectivement encaissé ──────────────────────────────
alter table public.expeditions
  add column if not exists paiement_encaisse_at timestamptz,
  add column if not exists paiement_encaisse_par uuid references public.livreurs(id);

comment on column public.expeditions.paiement_encaisse_at is
  'Horodatage de l''encaissement à la remise. NULL pour un colis payé en ligne.';

comment on column public.expeditions.paiement_encaisse_par is
  'Livreur ayant encaissé. Sert la remontée de caisse : qui doit combien à l''entreprise.';

-- ── Garde : un livreur n'écrit pas ces colonnes depuis l'API REST ───────────
-- Même raisonnement que le prix et l'affectation. L'encaissement se fait par la
-- server action, en clé de service, qui vérifie que le colis lui est affecté et
-- que le paiement est bien en attente. Laisser le chemin REST ouvert
-- permettrait de marquer un colis encaissé sans jamais toucher l'argent.
create or replace function public.garde_livreur_expedition()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if public.own_livreur_id() is null then
    return new;
  end if;

  if new.prix is distinct from old.prix then
    raise exception 'Un livreur ne peut pas modifier le prix d''une expédition';
  end if;

  if new.livreur_id is distinct from old.livreur_id then
    raise exception 'Un livreur ne peut pas modifier l''affectation d''une expédition';
  end if;

  if new.client_id is distinct from old.client_id then
    raise exception 'Un livreur ne peut pas réaffecter une expédition à un autre client';
  end if;

  if new.paiement_encaisse_at is distinct from old.paiement_encaisse_at
     or new.paiement_encaisse_par is distinct from old.paiement_encaisse_par then
    raise exception 'L''encaissement se déclare depuis l''espace livreur, pas par écriture directe';
  end if;

  return new;
end;
$$;

comment on function public.garde_livreur_expedition() is
  'Refuse à un livreur toute écriture de prix, d''affectation, de client ou d''encaissement sur une expédition. RLS borne les lignes, pas les colonnes : cette garde complète expeditions_update_livreur.';
