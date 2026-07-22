-- Propositions de modification des tarifs/coéfficients (opérateur → propriétaire)

create table propositions_tarifs (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references zones_tarifaires(id) on delete cascade,
  operateur_id uuid not null references users(id),
  type text not null check (type in ('coefficients', 'geojson', 'prix_base', 'intervalles')),
  champ text,
  valeur_actuelle jsonb,
  valeur_proposee jsonb not null,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'acceptee', 'refusee')),
  commentaire text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_propositions_tarifs_statut on propositions_tarifs(statut) where statut = 'en_attente';
create index idx_propositions_tarifs_zone on propositions_tarifs(zone_id);
create index idx_propositions_tarifs_operateur on propositions_tarifs(operateur_id);

alter table propositions_tarifs enable row level security;

create policy "propositions_tarifs_select_staff" on propositions_tarifs
  for select using (
    exists (select 1 from users u where u.id = auth.uid() and u.role in ('operateur', 'proprietaire'))
  );

create policy "propositions_tarifs_insert_operateur" on propositions_tarifs
  for insert with check (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'operateur')
    and operateur_id = auth.uid()
  );

create policy "propositions_tarifs_update_proprietaire" on propositions_tarifs
  for update using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'proprietaire')
  );