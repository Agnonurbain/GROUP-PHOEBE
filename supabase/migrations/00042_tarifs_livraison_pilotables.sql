-- GROUP PHOEBE — Tarifs de livraison pilotables depuis l'administration
--
-- Jusqu'ici la grille (zone × mode) et les paliers de poids étaient des
-- constantes TypeScript : seul un déploiement pouvait les changer, alors que
-- les tarifs transport sont déjà éditables en base par le propriétaire.
-- On aligne la livraison sur ce modèle.
--
-- Les valeurs seedées ci-dessous reprennent EXACTEMENT les constantes en place
-- (lib/livraison.ts) : rien ne bouge à l'écran tant que le propriétaire ne
-- modifie rien.

-- ============================================================
-- 1. Grille zone × mode
-- ============================================================
create table if not exists public.tarifs_livraison (
  id uuid primary key default gen_random_uuid(),
  zone text not null check (zone in ('intracommunale', 'intercommunale', 'nationale')),
  mode text not null check (mode in ('standard', 'express', 'meme_jour', 'programmee')),
  prix numeric(12,2) not null check (prix > 0),
  updated_at timestamptz not null default now(),
  unique (zone, mode)
);

insert into public.tarifs_livraison (zone, mode, prix) values
  ('intracommunale', 'standard',   1500),
  ('intracommunale', 'express',    2500),
  ('intracommunale', 'meme_jour',  3500),
  ('intracommunale', 'programmee', 2000),
  ('intercommunale', 'standard',   2500),
  ('intercommunale', 'express',    4000),
  ('intercommunale', 'meme_jour',  5500),
  ('intercommunale', 'programmee', 3000),
  ('nationale',      'standard',   5000),
  ('nationale',      'express',    8000),
  ('nationale',      'meme_jour', 11000),
  ('nationale',      'programmee', 6000)
on conflict (zone, mode) do nothing;

-- ============================================================
-- 2. Paliers de poids
-- ============================================================
-- `max_kg` est la borne haute incluse. Le palier de plus grand `ordre` fixe
-- aussi le poids maximum accepté en ligne : au-delà, la livraison passe sur
-- devis.
create table if not exists public.paliers_poids (
  id uuid primary key default gen_random_uuid(),
  ordre int not null unique,
  label text not null,
  max_kg numeric(6,2) not null check (max_kg > 0),
  multiplicateur numeric(5,2) not null check (multiplicateur > 0),
  updated_at timestamptz not null default now()
);

insert into public.paliers_poids (ordre, label, max_kg, multiplicateur) values
  (1, 'Jusqu''à 5 kg', 5,  1.0),
  (2, '5 à 15 kg',    15,  1.5),
  (3, '15 à 50 kg',   50,  2.5)
on conflict (ordre) do nothing;

-- ============================================================
-- 3. RLS — lecture publique (grille affichée au client), écriture propriétaire
-- ============================================================
alter table public.tarifs_livraison enable row level security;
alter table public.paliers_poids enable row level security;

create policy "tarifs_livraison_select_public"
  on public.tarifs_livraison for select
  using (true);

create policy "tarifs_livraison_proprietaire_manage"
  on public.tarifs_livraison for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'proprietaire'
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'proprietaire'
    )
  );

create policy "paliers_poids_select_public"
  on public.paliers_poids for select
  using (true);

create policy "paliers_poids_proprietaire_manage"
  on public.paliers_poids for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'proprietaire'
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'proprietaire'
    )
  );
