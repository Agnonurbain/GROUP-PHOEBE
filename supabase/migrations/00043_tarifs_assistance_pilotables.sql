-- GROUP PHOEBE — Tarifs d'assistance pilotables depuis l'administration
--
-- Dernier module dont les prix étaient figés dans le code (lib/assistance.ts).
-- Même modèle que le transport (00017) et la livraison (00042).
--
-- `prix` est NULLABLE et c'est volontaire : null = « Sur devis ». Les
-- destinations Europe sont seedées à null, faute de tarifs communiqués — le
-- propriétaire pourra les renseigner lui-même dès qu'il les aura, sans
-- déploiement.

create table if not exists public.tarifs_assistance (
  id uuid primary key default gen_random_uuid(),
  pays_slug text not null,
  prestation_key text not null,
  prix numeric(14,2) check (prix is null or prix > 0),
  updated_at timestamptz not null default now(),
  unique (pays_slug, prestation_key)
);

-- Seed : reprend EXACTEMENT les valeurs de lib/assistance.ts.
insert into public.tarifs_assistance (pays_slug, prestation_key, prix) values
  -- Chine (études) — tarifs confirmés par GROUP PHOEBE
  ('chine',    'etude',    1800000),
  ('chine',    'tourisme',  500000),
  ('chine',    'affaires',  750000),
  -- Europe / Schengen — tarifs non communiqués => « Sur devis »
  ('norvege',  'visa', null),
  ('france',   'visa', null),
  ('italie',   'visa', null),
  ('portugal', 'visa', null),
  ('grece',    'visa', null)
on conflict (pays_slug, prestation_key) do nothing;

-- RLS : lecture publique (les prix sont affichés aux clients),
-- écriture réservée au propriétaire.
alter table public.tarifs_assistance enable row level security;

create policy "tarifs_assistance_select_public"
  on public.tarifs_assistance for select
  using (true);

create policy "tarifs_assistance_proprietaire_manage"
  on public.tarifs_assistance for all
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
