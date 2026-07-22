-- Propositions de modification des coefficients de zone (opérateur → propriétaire)

create table propositions_zones_tarifaires (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references zones_tarifaires(id) on delete cascade,
  operateur_id uuid not null references users(id),
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
  statut text not null default 'en_attente' check (statut in ('en_attente', 'acceptee', 'refusee')),
  commentaire text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_propositions_zones_statut on propositions_zones_tarifaires(statut) where statut = 'en_attente';

alter table propositions_zones_tarifaires enable row level security;

create policy "propositions_zones_select_staff" on propositions_zones_tarifaires
  for select using (
    exists (select 1 from users u where u.id = auth.uid() and u.role in ('operateur', 'proprietaire'))
  );

create policy "propositions_zones_insert_operateur" on propositions_zones_tarifaires
  for insert with check (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'operateur')
    and operateur_id = auth.uid()
  );

create policy "propositions_zones_update_proprietaire" on propositions_zones_tarifaires
  for update using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'proprietaire')
  );
