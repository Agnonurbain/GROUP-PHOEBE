-- Paramètres des billets d'avion, pilotés par le propriétaire.
-- Créée le 2026-07-29.
--
-- Ce qui était figé dans le code : frais de service, durée de validité de
-- passeport exigée, plafond de voyageurs, délai de réponse annoncé au client.
-- Même motif que `parametres_immobilier` (00045) : table singleton, lecture
-- publique — le client doit voir les frais avant de s'engager — écriture
-- réservée au propriétaire.

create table public.parametres_billet (
  id bigint primary key default 1 check (id = 1),

  -- Frais de dossier GROUP PHOEBE, par billet, en sus du prix du vol.
  frais_service numeric(14,2) not null default 15000 check (frais_service >= 0),

  -- Validité résiduelle du passeport exigée APRÈS la date de départ. Six mois est
  -- la règle la plus répandue, mais elle varie selon la destination.
  mois_validite_passeport int not null default 6
    check (mois_validite_passeport >= 0 and mois_validite_passeport <= 24),

  -- Au-delà, la réservation passe par un tarif groupe négocié à part.
  max_voyageurs int not null default 9 check (max_voyageurs >= 1 and max_voyageurs <= 50),

  -- Délai de réponse annoncé sur le formulaire : un engagement, donc pilotable.
  delai_reponse_heures int not null default 48
    check (delai_reponse_heures >= 1 and delai_reponse_heures <= 720),

  updated_at timestamptz not null default now()
);

alter table public.parametres_billet enable row level security;

create policy "parametres_billet_select_public"
  on public.parametres_billet for select
  using (true);

create policy "parametres_billet_proprietaire_manage"
  on public.parametres_billet for all
  using (public.is_proprietaire())
  with check (public.is_proprietaire());

insert into public.parametres_billet (id) values (1) on conflict (id) do nothing;

-- ── Les frais sont figés sur la demande ─────────────────────────────────────
-- Le paramètre peut changer ; les frais annoncés au client le jour de sa demande
-- ne doivent pas bouger dans son dos. Même raisonnement que `montant_convenu` et
-- la commission immobilière.
alter table public.demandes_billet
  add column if not exists frais_service numeric(14,2)
    check (frais_service is null or frais_service >= 0);

comment on column public.demandes_billet.frais_service is
  'Frais de service en vigueur au moment de la demande. Figes : le bareme peut changer ensuite.';

-- Le garde-fou couvre ce montant comme les autres.
create or replace function public.garde_montant_billet()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if (tg_op = 'INSERT' and (new.montant_propose is not null or new.frais_service is not null))
     or (tg_op = 'UPDATE' and (new.montant_propose is distinct from old.montant_propose
                               or new.frais_service is distinct from old.frais_service)) then
    if not public.is_proprietaire() then
      raise exception 'Seul le proprietaire peut chiffrer un billet'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;
