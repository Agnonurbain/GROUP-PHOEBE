-- RLS sur disponibilites_vehicule et disponibilites_chauffeur
-- Table de jonction vehicule_chauffeurs (un véhicule peut avoir plusieurs chauffeurs, §5.11)

alter table disponibilites_vehicule enable row level security;
alter table disponibilites_chauffeur enable row level security;

-- Lecture publique (vérification de disponibilité côté client)
create policy "Lecture publique disponibilites vehicule"
  on disponibilites_vehicule for select
  using (true);

create policy "Lecture publique disponibilites chauffeur"
  on disponibilites_chauffeur for select
  using (true);

-- Écriture réservée au staff (opérateur/propriétaire)
create policy "Staff gère disponibilites vehicule"
  on disponibilites_vehicule for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and role in ('operateur', 'proprietaire')
    )
  )
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and role in ('operateur', 'proprietaire')
    )
  );

create policy "Staff gère disponibilites chauffeur"
  on disponibilites_chauffeur for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and role in ('operateur', 'proprietaire')
    )
  )
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and role in ('operateur', 'proprietaire')
    )
  );

-- Table de jonction véhicule ↔ chauffeurs (§5.11 : un ou plusieurs chauffeurs par véhicule)
create table vehicule_chauffeurs (
  id uuid primary key default gen_random_uuid(),
  vehicule_id uuid not null references vehicules(id) on delete cascade,
  chauffeur_id uuid not null references chauffeurs(id) on delete cascade,
  unique (vehicule_id, chauffeur_id)
);

alter table vehicule_chauffeurs enable row level security;

create policy "Lecture publique vehicule_chauffeurs"
  on vehicule_chauffeurs for select
  using (true);

create policy "Staff gère vehicule_chauffeurs"
  on vehicule_chauffeurs for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and role in ('operateur', 'proprietaire')
    )
  )
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and role in ('operateur', 'proprietaire')
    )
  );

-- RPC transactionnelle : remplace les chauffeurs affectés à un véhicule en une seule transaction.
-- Appelée par l'action modifierVehicule pour garantir que le delete + insert est atomique.
create or replace function sync_vehicule_chauffeurs(
  p_vehicule_id uuid,
  p_chauffeur_ids uuid[]
) returns void as $$
begin
  if not exists (
    select 1 from public.users
    where id = auth.uid()
    and role in ('operateur', 'proprietaire')
  ) then
    raise exception 'Accès refusé : rôle opérateur ou propriétaire requis';
  end if;

  delete from vehicule_chauffeurs where vehicule_id = p_vehicule_id;
  insert into vehicule_chauffeurs (vehicule_id, chauffeur_id)
  select p_vehicule_id, unnest(p_chauffeur_ids);
end;
$$ language plpgsql security definer;
