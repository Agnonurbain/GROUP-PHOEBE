-- Commission d'intermédiation + période de location.
-- Créée le 2026-07-29.
--
-- Décisions métier actées :
--   · les biens du catalogue appartiennent à des propriétaires tiers ;
--     GROUP PHOEBE perçoit une commission, pilotable par le propriétaire de la
--     plateforme (usuellement 10 à 12 %), due dès l'acceptation de l'offre ;
--   · une location a une date de début et une durée. Sans elles,
--     `montant_convenu` ne disait pas s'il s'agissait d'un loyer ou d'un total,
--     et le registre des transactions restait ambigu.

-- ── Taux pilotable ──────────────────────────────────────────────────────────
alter table public.parametres_immobilier
  add column if not exists taux_commission numeric(5,2) not null default 10;

alter table public.parametres_immobilier
  drop constraint if exists parametres_immobilier_taux_commission_borne;

alter table public.parametres_immobilier
  add constraint parametres_immobilier_taux_commission_borne
  check (taux_commission >= 0 and taux_commission <= 100);

comment on column public.parametres_immobilier.taux_commission is
  'Commission GROUP PHOEBE en %, appliquee au montant convenu. Usuellement 10 a 12.';

-- ── Commission figée sur la demande ─────────────────────────────────────────
-- Le taux vit dans les paramètres et peut changer ; la commission due, elle, est
-- arrêtée au moment de l'accord. On conserve donc le taux appliqué en plus du
-- montant, pour que la ligne reste lisible même après un changement de barème.
alter table public.demandes_immobilier
  add column if not exists taux_commission numeric(5,2),
  add column if not exists montant_commission numeric(14,2);

alter table public.demandes_immobilier
  drop constraint if exists demandes_immobilier_commission_coherente;

-- Les deux colonnes vont de pair : un montant sans taux ne se relit pas.
-- Le `is not null` explicite est indispensable — `taux_commission >= 0` sur un
-- taux NULL vaut NULL, et Postgres n'invalide un CHECK que sur FALSE, jamais sur
-- NULL. Sans lui, la contrainte laissait passer un montant sans taux.
alter table public.demandes_immobilier
  add constraint demandes_immobilier_commission_coherente
  check (
    (taux_commission is null and montant_commission is null)
    or (
      taux_commission is not null
      and montant_commission is not null
      and taux_commission >= 0
      and taux_commission <= 100
      and montant_commission >= 0
    )
  );

comment on column public.demandes_immobilier.montant_commission is
  'Part GROUP PHOEBE, due a l''acceptation. Figee comme montant_convenu.';

-- ── Période de location ─────────────────────────────────────────────────────
-- Renseignées pour une demande portant sur un bien en location. Pour ces
-- demandes, `montant_convenu` s'entend comme le loyer par mois.
alter table public.demandes_immobilier
  add column if not exists location_debut date,
  add column if not exists location_duree_mois int;

alter table public.demandes_immobilier
  drop constraint if exists demandes_immobilier_location_duree_positive;

alter table public.demandes_immobilier
  add constraint demandes_immobilier_location_duree_positive
  check (location_duree_mois is null or location_duree_mois > 0);

comment on column public.demandes_immobilier.location_duree_mois is
  'Duree souhaitee en mois. Pour une location, montant_convenu est le loyer mensuel.';

-- ── Le gel couvre les nouveaux montants ─────────────────────────────────────
create or replace function public.garde_montants_demandes_immobilier()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  montant_modifie boolean;
begin
  -- 1. Gel. Comparaison sur OLD.statut : l'UPDATE qui accepte doit pouvoir
  -- écrire montant_convenu et la commission dans le même mouvement ; ce sont les
  -- écritures SUIVANTES qui sont refusées. Vaut pour tous les rôles, y compris
  -- service_role — sinon les server actions passeraient outre.
  if tg_op = 'UPDATE' and old.statut in ('acceptee', 'finalisee') then
    if new.montant_offre is distinct from old.montant_offre
       or new.montant_contre_offre is distinct from old.montant_contre_offre
       or new.montant_convenu is distinct from old.montant_convenu
       or new.montant_commission is distinct from old.montant_commission
       or new.taux_commission is distinct from old.taux_commission then
      raise exception
        'Les montants d''une demande % ne sont plus modifiables', old.statut
        using errcode = '42501';
    end if;
  end if;

  -- 2. Garde par rôle : ne vise que les rôles PostgREST de bout de chaîne.
  -- Cf. 00047 pour le raisonnement (security invoker compris).
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    montant_modifie := new.montant_offre is not null
                    or new.montant_contre_offre is not null
                    or new.montant_convenu is not null
                    or new.montant_commission is not null;
  else
    montant_modifie := new.montant_offre is distinct from old.montant_offre
                    or new.montant_contre_offre is distinct from old.montant_contre_offre
                    or new.montant_convenu is distinct from old.montant_convenu
                    or new.montant_commission is distinct from old.montant_commission;
  end if;

  if montant_modifie and not public.is_proprietaire() then
    raise exception
      'Seul le proprietaire peut ecrire un montant sur demandes_immobilier'
      using errcode = '42501';
  end if;

  return new;
end;
$$;
