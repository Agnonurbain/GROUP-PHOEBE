-- 00011: Propositions de prix (opérateur → propriétaire) + vue stats

create table propositions_prix (
  id uuid primary key default gen_random_uuid(),
  vehicule_id uuid not null references vehicules(id) on delete cascade,
  operateur_id uuid not null references users(id),
  champ text not null check (champ in ('prix_journalier', 'prix_mensuel', 'prix_vente')),
  valeur_actuelle numeric,
  valeur_proposee numeric not null check (valeur_proposee > 0),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'acceptee', 'refusee')),
  commentaire text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_propositions_prix_statut on propositions_prix(statut) where statut = 'en_attente';

alter table propositions_prix enable row level security;

create policy "propositions_select_staff" on propositions_prix
  for select using (
    exists (
      select 1 from users u where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );

create policy "propositions_insert_operateur" on propositions_prix
  for insert with check (
    exists (
      select 1 from users u where u.id = auth.uid()
        and u.role = 'operateur'
    )
    and operateur_id = auth.uid()
  );

create policy "propositions_update_proprietaire" on propositions_prix
  for update using (
    exists (
      select 1 from users u where u.id = auth.uid()
        and u.role = 'proprietaire'
    )
  );
