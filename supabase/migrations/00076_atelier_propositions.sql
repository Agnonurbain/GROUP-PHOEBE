-- ─────────────────────────────────────────────────────────────────────────────
-- 00076 — L'atelier de propositions tarifaires : garder un chemin, en fermer un
--
-- Trois ateliers de proposition coexistaient. Deux sont branchés et servent :
--
--   • propositions_prix              — un opérateur propose un prix véhicule
--   • propositions_zones_tarifaires  — un opérateur propose un coefficient zone
--
-- Le troisième, `propositions_tarifs` (00034), n'a JAMAIS été appelé : aucun
-- écran, aucun formulaire. C'est un doublon du deuxième, et un doublon défait —
-- son type accepte « prix_base » et « intervalles », mais la fonction qui
-- applique une proposition acceptée ne traite que « coefficients » et
-- « geojson ». Accepter une proposition des deux autres types la marquait
-- « acceptée » SANS RIEN APPLIQUER. Le propriétaire aurait cru avoir validé un
-- tarif qui n'aurait jamais bougé.
--
-- On garde le chemin qui marche, on ferme celui qui ment. La table est vide.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- Au passage : `propositions_zones_tarifaires` n'existait dans AUCUNE migration
-- de ce dossier. Sa seule définition vivait dans
-- `packages/database/supabase/migrations/`, un ancien dossier figé au 00034 et
-- qui, pire, réutilise le numéro 00032 pour un tout autre fichier. La table
-- existe en production parce qu'elle y a été créée à l'époque — mais un
-- environnement reconstruit depuis ce dossier-ci ne l'aurait pas eue, et le
-- workflow de proposition zone serait tombé sans que rien ne prévienne.
--
-- On la redéclare ici à l'identique, en idempotent : sans effet sur la base
-- existante, indispensable pour toute reconstruction.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.propositions_zones_tarifaires (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.zones_tarifaires(id) on delete cascade,
  operateur_id uuid not null references public.users(id),
  champ text not null check (champ in (
    'coefficient_majoration',
    'caution_multiplicateur',
    'km_inclus_par_jour',
    'supplement_km_fcfa',
    'chauffeur_statut',
    'tarif_chauffeur_journalier',
    'intervalles_prix'
  )),
  valeur_actuelle text,
  valeur_proposee text not null,
  statut text not null default 'en_attente'
    check (statut in ('en_attente', 'acceptee', 'refusee')),
  commentaire text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.propositions_zones_tarifaires is
  'Modifications de coefficients de zone proposées par un opérateur. Aucune ne s''applique sans validation du propriétaire : un coefficient multiplie un prix facturé.';

create index if not exists idx_propositions_zones_statut
  on public.propositions_zones_tarifaires(statut)
  where statut = 'en_attente';

alter table public.propositions_zones_tarifaires enable row level security;

drop policy if exists "propositions_zones_select_staff" on public.propositions_zones_tarifaires;
create policy "propositions_zones_select_staff"
  on public.propositions_zones_tarifaires for select
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('operateur', 'proprietaire'))
  );

-- Un opérateur propose en son nom, jamais au nom d'un autre.
drop policy if exists "propositions_zones_insert_operateur" on public.propositions_zones_tarifaires;
create policy "propositions_zones_insert_operateur"
  on public.propositions_zones_tarifaires for insert
  with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'operateur')
    and operateur_id = auth.uid()
  );

-- Trancher appartient au propriétaire seul.
drop policy if exists "propositions_zones_update_proprietaire" on public.propositions_zones_tarifaires;
create policy "propositions_zones_update_proprietaire"
  on public.propositions_zones_tarifaires for update
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'proprietaire')
  );

-- Le doublon jamais branché. Vide au moment de cette migration : rien à
-- reprendre, et l'écran /admin/propositions ne l'a jamais lu.
drop table if exists public.propositions_tarifs;
