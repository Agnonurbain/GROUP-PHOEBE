-- Cartes (panier serveur) pour persistance entre sessions
create table if not exists paniers (
  client_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_paniers_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_paniers_updated_at on paniers;
create trigger trg_paniers_updated_at
  before update on paniers
  for each row
  execute function update_paniers_updated_at();

-- RLS
alter table paniers enable row level security;

create policy "Users can read own cart"
  on paniers for select
  using (client_id = auth.uid());

create policy "Users can insert own cart"
  on paniers for insert
  with check (client_id = auth.uid());

create policy "Users can update own cart"
  on paniers for update
  using (client_id = auth.uid());

create policy "Users can delete own cart"
  on paniers for delete
  using (client_id = auth.uid());
