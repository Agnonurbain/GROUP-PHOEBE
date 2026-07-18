-- Phase 5 : Support multi-véhicules par demande
-- Chaque ligne = 1 véhicule avec option chauffeur

create table lignes_demande (
  id uuid primary key default gen_random_uuid(),
  demande_id uuid not null references demandes_transport(id) on delete cascade,
  vehicule_id uuid not null references vehicules(id),
  avec_chauffeur boolean not null default false,
  chauffeur_id uuid references chauffeurs(id),
  montant_ligne numeric(12,2),
  caution_ligne numeric(12,2),
  created_at timestamptz not null default now()
);

create index idx_lignes_demande_demande on lignes_demande(demande_id);

-- RLS
alter table lignes_demande enable row level security;

create policy "Client voit ses propres lignes"
  on lignes_demande for select using (
    exists (
      select 1 from demandes_transport d
      where d.id = lignes_demande.demande_id
        and d.client_id = auth.uid()
    )
  );

create policy "Staff voit toutes les lignes"
  on lignes_demande for select using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );

create policy "Service role insert lignes"
  on lignes_demande for insert with check (true);

create policy "Service role update lignes"
  on lignes_demande for update using (true);
