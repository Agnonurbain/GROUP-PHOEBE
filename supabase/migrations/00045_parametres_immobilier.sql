-- Table singleton : paramétrage du module immobilier.
-- Ligne unique (id fixe), modifiable uniquement par le propriétaire.
-- Créée le 2026-07-29.

create table public.parametres_immobilier (
  id bigint primary key default 1 check (id = 1),
  caution_visite numeric(14,2) not null default 50000,
  taux_max_reduction numeric(5,2) not null default 10,
  max_offres_client int not null default 3,
  updated_at timestamptz not null default now()
);

alter table public.parametres_immobilier enable row level security;

create policy "parametres_immobilier_select_public"
  on public.parametres_immobilier for select
  using (true);

create policy "parametres_immobilier_proprietaire_manage"
  on public.parametres_immobilier for all
  using (public.is_staff())
  with check (public.is_staff());

-- Ligne par défaut
insert into public.parametres_immobilier (id, caution_visite, taux_max_reduction, max_offres_client)
values (1, 50000, 10, 3)
on conflict (id) do nothing;
