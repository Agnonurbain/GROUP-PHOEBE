-- Prompt 5 — Table favoris (absente du schéma initial)

create table favoris (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  vehicule_id uuid not null references vehicules(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, vehicule_id)
);

alter table public.favoris enable row level security;

create policy "favoris_select_own"
  on public.favoris for select
  using (auth.uid() = user_id);

create policy "favoris_insert_own"
  on public.favoris for insert
  with check (auth.uid() = user_id);

create policy "favoris_delete_own"
  on public.favoris for delete
  using (auth.uid() = user_id);
