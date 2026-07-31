-- ─────────────────────────────────────────────────────────────────────────────
-- 00063 — Espace livreur : accès RLS et preuve de livraison
--
-- Le rôle `livreur` existait sans aucun accès : `expeditions_select_own` filtre
-- sur `client_id`, et `expeditions_select_staff` repose sur `is_staff()`, qui ne
-- couvre que `operateur` et `proprietaire`. Un livreur affecté à un colis ne
-- pouvait donc pas le lire.
--
-- Le piège à éviter est connu, il a déjà mordu sur les biens avec l'agent
-- immobilier : une garde applicative qui laisse passer, une RLS qui filtre, un
-- UPDATE qui touche zéro ligne — et l'interface qui répond « enregistré ». Un
-- livreur à qui l'on confirme une livraison qui n'a pas été écrite, c'est un
-- colis perdu de vue.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Helper : le livreur courant ──────────────────────────────────────────
-- `security definer` pour la même raison que `is_staff()` : les policies
-- interrogent `public.users` et `public.livreurs`, qui sont elles-mêmes sous
-- RLS — sans cela, la récursion.

create or replace function public.own_livreur_id()
returns uuid
language sql
security definer
set search_path = ''
as $$
  select l.id
  from public.livreurs l
  where l.user_id = auth.uid()
    and l.actif
  limit 1;
$$;

comment on function public.own_livreur_id() is
  'Identifiant livreur de l''utilisateur courant, ou NULL. Un livreur désactivé ne renvoie rien : il perd l''accès sans qu''il faille toucher aux policies.';

-- ─── 2. Colonnes de preuve de livraison ──────────────────────────────────────
-- Un colis était « livré » parce qu'un opérateur l'avait tapé. Rien n'attestait
-- de la remise, et un échec n'avait pas de motif : la seule trace était un
-- statut terminal, sans suite possible.

alter table public.expeditions
  add column if not exists preuve_photo text,
  add column if not exists preuve_latitude double precision,
  add column if not exists preuve_longitude double precision,
  add column if not exists livree_at timestamptz,
  add column if not exists echec_motif text,
  add column if not exists recu_par text;

comment on column public.expeditions.preuve_photo is
  'Photo prise à la remise du colis (bucket colis-photos). Preuve de livraison.';
comment on column public.expeditions.preuve_latitude is
  'Position du livreur au moment de la remise. Déclarative, pas un suivi continu.';
comment on column public.expeditions.recu_par is
  'Nom de la personne qui a réceptionné — pas toujours le destinataire déclaré.';
comment on column public.expeditions.echec_motif is
  'Motif d''un echec_livraison. Sans lui, le statut est un cul-de-sac : ni seconde présentation, ni retour, ni remboursement instruits.';

-- ─── 3. RLS — le livreur lit ses propres expéditions ─────────────────────────

create policy "expeditions_select_livreur"
  on public.expeditions for select
  using (livreur_id = public.own_livreur_id());

-- L'écriture passe par les server actions en clé de service, comme partout
-- ailleurs dans le projet. Cette policy ne sert donc pas le chemin nominal :
-- elle borne l'appel REST direct avec la clé anon, publique par nature. Sans
-- elle, `for all using (is_staff())` étant la seule policy d'écriture, un
-- livreur ne pourrait rien écrire — et avec une policy trop large, il pourrait
-- écrire sur les colis des autres.
create policy "expeditions_update_livreur"
  on public.expeditions for update
  using (livreur_id = public.own_livreur_id())
  with check (livreur_id = public.own_livreur_id());

-- ─── 4. RLS — historique des statuts ─────────────────────────────────────────

create policy "exp_hist_select_livreur"
  on public.expedition_statut_historique for select
  using (
    exists (
      select 1 from public.expeditions e
      where e.id = expedition_id
        and e.livreur_id = public.own_livreur_id()
    )
  );

-- ─── 5. Le livreur lit sa propre fiche ───────────────────────────────────────
-- L'espace terrain a besoin de son nom et de sa capacité ; `livreurs` n'avait
-- que des policies staff.

create policy "livreurs_select_own"
  on public.livreurs for select
  using (user_id = auth.uid());

-- ─── 6. Garde : un livreur ne touche ni au prix ni à son affectation ─────────
-- Même raisonnement que `garde_montants` sur l'immobilier. La policy d'update
-- ci-dessus borne *quelles lignes* un livreur peut écrire, jamais *quelles
-- colonnes* — RLS ne sait pas faire. Sans ce trigger, un livreur pourrait, via
-- l'API REST avec la clé anon, se réaffecter un colis ou en changer le prix.
--
-- Volontairement `security invoker` : en `security definer`, `current_user`
-- vaudrait le propriétaire de la fonction et la garde ne verrait jamais le vrai
-- appelant. Elle ne s'applique qu'aux rôles `anon` et `authenticated`, donc au
-- chemin REST — les server actions écrivent en `service_role` et sont gardées
-- côté application.

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

  return new;
end;
$$;

drop trigger if exists garde_livreur on public.expeditions;
create trigger garde_livreur
  before update on public.expeditions
  for each row execute function public.garde_livreur_expedition();

comment on function public.garde_livreur_expedition() is
  'Refuse à un livreur toute écriture de prix, d''affectation ou de client sur une expédition. RLS borne les lignes, pas les colonnes : cette garde complète expeditions_update_livreur.';
