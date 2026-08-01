-- ─────────────────────────────────────────────────────────────────────────────
-- 00069 — Abonnements : créneaux récurrents, chauffeur durable, échéances
--
-- `contrats_recurrents` existait depuis la migration initiale — table vide,
-- policies posées, **zéro ligne de code**. Trois choses manquaient, dont deux
-- structurantes.
--
-- 1. La facturation récurrente n'existait nulle part : un paiement naît d'une
--    commande. Un abonnement demande une échéance générée, encaissée, relancée.
--    D'où `echeances_contrat`, et surtout son unicité `(contrat_id,
--    periode_debut)` : la génération est un cron, donc rejouable, et sans cette
--    contrainte un second passage facturerait deux fois le même mois.
--
-- 2. Le modèle de disponibilité s'y prêtait mal. `disponibilites_vehicule`
--    protège les chevauchements par exclusion GiST, réservation par
--    réservation. Un ramassage scolaire de neuf mois y entrerait comme un
--    intervalle continu et immobiliserait le véhicule en bloc, alors qu'il ne
--    sert que matin et soir. Le contrat porte donc un **créneau** — des jours de
--    semaine et une plage horaire — que l'affectation confronte à la période
--    demandée, sans bloquer quoi que ce soit entre-temps.
--
-- 3. Le chauffeur d'un abonnement est le même toute la durée, pas choisi course
--    par course.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Le contrat décrit un créneau, pas un intervalle continu ──────────────

alter table public.contrats_recurrents
  add column if not exists chauffeur_id uuid references public.chauffeurs(id),
  add column if not exists jours_semaine smallint[] not null default '{}',
  add column if not exists heure_debut time,
  add column if not exists heure_fin time,
  add column if not exists jour_facturation smallint not null default 1,
  add column if not exists updated_at timestamptz not null default now();

comment on column public.contrats_recurrents.jours_semaine is
  'Jours desservis, 1 = lundi … 7 = dimanche (ISO). Vide = aucun jour, donc contrat sans effet sur les disponibilités.';
comment on column public.contrats_recurrents.heure_debut is
  'Début du créneau quotidien. Avec heure_fin, délimite ce que le contrat immobilise — le reste de la journée demeure louable.';
comment on column public.contrats_recurrents.jour_facturation is
  'Jour du mois où l''échéance est émise (1-28). Au-delà de 28, un mois court décalerait la facturation.';

alter table public.contrats_recurrents
  drop constraint if exists contrats_recurrents_jour_facturation_check;
alter table public.contrats_recurrents
  add constraint contrats_recurrents_jour_facturation_check
  check (jour_facturation between 1 and 28);

-- Un créneau n'a de sens que complet : une heure de début sans fin ne délimite
-- rien, et l'affectation ne saurait pas quoi en faire.
alter table public.contrats_recurrents
  drop constraint if exists contrats_recurrents_creneau_check;
alter table public.contrats_recurrents
  add constraint contrats_recurrents_creneau_check
  check (
    (heure_debut is null and heure_fin is null)
    or (heure_debut is not null and heure_fin is not null and heure_debut < heure_fin)
  );

alter table public.contrats_recurrents
  drop constraint if exists contrats_recurrents_periode_check;
alter table public.contrats_recurrents
  add constraint contrats_recurrents_periode_check
  check (date_fin is null or date_fin >= date_debut);

-- ─── 2. Les échéances ────────────────────────────────────────────────────────

create table if not exists public.echeances_contrat (
  id uuid primary key default gen_random_uuid(),
  contrat_id uuid not null references public.contrats_recurrents(id) on delete cascade,
  periode_debut date not null,
  periode_fin date not null,
  montant numeric(12,2) not null check (montant > 0),
  statut text not null default 'a_facturer'
    check (statut in ('a_facturer', 'facturee', 'payee', 'impayee', 'annulee')),
  paiement_id uuid references public.paiements(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Le verrou de l'idempotence. La génération est un cron : sans cette contrainte,
-- un second passage — relance, rejeu, deux instances — facturerait deux fois la
-- même période au même client.
create unique index if not exists echeances_contrat_periode_unique
  on public.echeances_contrat (contrat_id, periode_debut);

create index if not exists echeances_contrat_statut_idx
  on public.echeances_contrat (statut);

comment on table public.echeances_contrat is
  'Échéances de facturation d''un abonnement. Une ligne par période ; l''unicité (contrat_id, periode_debut) rend la génération rejouable sans double facturation.';

-- ─── 3. RLS ──────────────────────────────────────────────────────────────────
-- `contrats_recurrents` a déjà ses policies staff (00048). Le client doit voir
-- son propre abonnement : il le paie.

create policy "contrats_recurrents_select_own"
  on public.contrats_recurrents for select
  using (client_id = auth.uid());

alter table public.echeances_contrat enable row level security;

create policy "echeances_select_staff"
  on public.echeances_contrat for select
  using (public.is_staff());

create policy "echeances_staff_manage"
  on public.echeances_contrat for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "echeances_select_own"
  on public.echeances_contrat for select
  using (
    exists (
      select 1 from public.contrats_recurrents c
      where c.id = contrat_id
        and c.client_id = auth.uid()
    )
  );

-- ─── 4. Les catégories de demande servaient déjà `scolaire` et `personnel` ───
-- Elles étaient inutilisées — tout est écrit en dur à `classique`. Elles
-- trouvent ici leur emploi : une demande née d'un abonnement porte sa catégorie.

comment on column public.demandes_transport.categorie is
  'Nature de la demande : classique, evenementiel, ou scolaire / personnel lorsqu''elle découle d''un abonnement (contrats_recurrents). À ne pas confondre avec vehicules.categorie (leger | car | minibus).';
