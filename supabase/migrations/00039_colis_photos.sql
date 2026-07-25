-- GROUP PHOEBE — Photos de colis (livraison)
-- Bucket de stockage public + colonne photos sur expeditions.

-- Bucket public pour les photos de colis (upload en service-role, lecture publique).
insert into storage.buckets (id, name, public)
values ('colis-photos', 'colis-photos', true)
on conflict (id) do nothing;

-- URLs publiques des photos jointes à une expédition.
alter table public.expeditions
  add column if not exists photos text[] not null default '{}';
