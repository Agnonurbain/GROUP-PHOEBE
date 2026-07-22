-- Phase 1 : Zones tarifaires, communes, intervalles de prix, assurance, caméra

-- ============================================================
-- 1.1 Nouveaux champs sur vehicules
-- ============================================================

alter table vehicules
  add column if not exists assurance_url text,
  add column if not exists camera_interieure boolean not null default true,
  add column if not exists gps boolean not null default false,
  add column if not exists niveau_carburant text check (niveau_carburant in ('vide', 'quart', 'demi', 'trois_quarts', 'plein'));

-- ============================================================
-- 1.2 Zones tarifaires
-- ============================================================

create table zones_tarifaires (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  description text,
  ordre int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 1.3 Communes
-- ============================================================

create table communes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  zone_id uuid not null references zones_tarifaires(id) on delete cascade,
  ajoutee_par_client boolean not null default false,
  created_at timestamptz not null default now(),
  unique (nom, zone_id)
);

create index idx_communes_zone on communes(zone_id);

-- ============================================================
-- 1.4 Intervalles de prix par zone et catégorie
-- ============================================================

create table intervalles_prix (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references zones_tarifaires(id) on delete cascade,
  categorie_vehicule text not null check (categorie_vehicule in ('leger', 'car', 'minibus')),
  type text not null check (type in ('location', 'vente')),
  prix_min numeric(12,2) not null,
  prix_max numeric(12,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (zone_id, categorie_vehicule, type),
  check (prix_min <= prix_max)
);

-- ============================================================
-- 1.7 Seed : 3 zones + communes principales
-- ============================================================

insert into zones_tarifaires (nom, description, ordre) values
  ('Abidjan', 'Communes d''Abidjan', 1),
  ('Grand Abidjan', 'Villes périphériques et régions proches (Yamoussoukro, etc.)', 2),
  ('Intérieur du pays', 'Destinations éloignées (nord, ouest, etc.)', 3);

-- Communes d'Abidjan
insert into communes (nom, zone_id) values
  ('Cocody',        (select id from zones_tarifaires where nom = 'Abidjan')),
  ('Plateau',       (select id from zones_tarifaires where nom = 'Abidjan')),
  ('Marcory',       (select id from zones_tarifaires where nom = 'Abidjan')),
  ('Treichville',   (select id from zones_tarifaires where nom = 'Abidjan')),
  ('Adjamé',        (select id from zones_tarifaires where nom = 'Abidjan')),
  ('Abobo',         (select id from zones_tarifaires where nom = 'Abidjan')),
  ('Yopougon',      (select id from zones_tarifaires where nom = 'Abidjan')),
  ('Koumassi',      (select id from zones_tarifaires where nom = 'Abidjan')),
  ('Port-Bouët',    (select id from zones_tarifaires where nom = 'Abidjan')),
  ('Attécoubé',     (select id from zones_tarifaires where nom = 'Abidjan')),
  ('Bingerville',   (select id from zones_tarifaires where nom = 'Abidjan')),
  ('Songon',        (select id from zones_tarifaires where nom = 'Abidjan')),
  ('Anyama',        (select id from zones_tarifaires where nom = 'Abidjan'));

-- Grand Abidjan
insert into communes (nom, zone_id) values
  ('Yamoussoukro',   (select id from zones_tarifaires where nom = 'Grand Abidjan')),
  ('Grand-Bassam',   (select id from zones_tarifaires where nom = 'Grand Abidjan')),
  ('Dabou',          (select id from zones_tarifaires where nom = 'Grand Abidjan')),
  ('Jacqueville',    (select id from zones_tarifaires where nom = 'Grand Abidjan')),
  ('Assinie',        (select id from zones_tarifaires where nom = 'Grand Abidjan')),
  ('Aboisso',        (select id from zones_tarifaires where nom = 'Grand Abidjan')),
  ('Agboville',      (select id from zones_tarifaires where nom = 'Grand Abidjan')),
  ('Adzopé',         (select id from zones_tarifaires where nom = 'Grand Abidjan')),
  ('Tiassalé',       (select id from zones_tarifaires where nom = 'Grand Abidjan'));

-- Intérieur du pays
insert into communes (nom, zone_id) values
  ('Bouaké',         (select id from zones_tarifaires where nom = 'Intérieur du pays')),
  ('Korhogo',        (select id from zones_tarifaires where nom = 'Intérieur du pays')),
  ('San-Pédro',      (select id from zones_tarifaires where nom = 'Intérieur du pays')),
  ('Daloa',          (select id from zones_tarifaires where nom = 'Intérieur du pays')),
  ('Man',            (select id from zones_tarifaires where nom = 'Intérieur du pays')),
  ('Gagnoa',         (select id from zones_tarifaires where nom = 'Intérieur du pays')),
  ('Divo',           (select id from zones_tarifaires where nom = 'Intérieur du pays')),
  ('Séguéla',        (select id from zones_tarifaires where nom = 'Intérieur du pays')),
  ('Odienné',        (select id from zones_tarifaires where nom = 'Intérieur du pays')),
  ('Bondoukou',      (select id from zones_tarifaires where nom = 'Intérieur du pays')),
  ('Ferkessédougou', (select id from zones_tarifaires where nom = 'Intérieur du pays'));

-- Intervalles de prix par défaut (en FCFA) — à ajuster par le propriétaire
insert into intervalles_prix (zone_id, categorie_vehicule, type, prix_min, prix_max) values
  -- Abidjan - Location
  ((select id from zones_tarifaires where nom = 'Abidjan'), 'leger',   'location', 25000, 50000),
  ((select id from zones_tarifaires where nom = 'Abidjan'), 'car',     'location', 150000, 350000),
  ((select id from zones_tarifaires where nom = 'Abidjan'), 'minibus', 'location', 80000, 180000),
  -- Grand Abidjan - Location
  ((select id from zones_tarifaires where nom = 'Grand Abidjan'), 'leger',   'location', 40000, 80000),
  ((select id from zones_tarifaires where nom = 'Grand Abidjan'), 'car',     'location', 200000, 500000),
  ((select id from zones_tarifaires where nom = 'Grand Abidjan'), 'minibus', 'location', 120000, 280000),
  -- Intérieur - Location
  ((select id from zones_tarifaires where nom = 'Intérieur du pays'), 'leger',   'location', 60000, 120000),
  ((select id from zones_tarifaires where nom = 'Intérieur du pays'), 'car',     'location', 300000, 700000),
  ((select id from zones_tarifaires where nom = 'Intérieur du pays'), 'minibus', 'location', 180000, 400000),
  -- Abidjan - Vente
  ((select id from zones_tarifaires where nom = 'Abidjan'), 'leger',   'vente', 3000000, 15000000),
  ((select id from zones_tarifaires where nom = 'Abidjan'), 'car',     'vente', 20000000, 80000000),
  ((select id from zones_tarifaires where nom = 'Abidjan'), 'minibus', 'vente', 10000000, 40000000);

-- ============================================================
-- 1.8 RLS policies
-- ============================================================

alter table zones_tarifaires enable row level security;
alter table communes enable row level security;
alter table intervalles_prix enable row level security;

-- Lecture publique (tout le monde peut voir les zones, communes, prix)
create policy "zones_select_all" on zones_tarifaires for select using (true);
create policy "communes_select_all" on communes for select using (true);
create policy "intervalles_select_all" on intervalles_prix for select using (true);

-- Insertion communes par les clients connectés (pour "Autre")
create policy "communes_insert_authenticated" on communes
  for insert to authenticated
  with check (ajoutee_par_client = true);

-- Gestion complète par staff (operateur / proprietaire)
create policy "zones_staff_all" on zones_tarifaires
  for all to authenticated
  using (
    exists (select 1 from users where id = (select auth.uid()) and role in ('operateur', 'proprietaire'))
  )
  with check (
    exists (select 1 from users where id = (select auth.uid()) and role in ('operateur', 'proprietaire'))
  );

create policy "communes_staff_all" on communes
  for all to authenticated
  using (
    exists (select 1 from users where id = (select auth.uid()) and role in ('operateur', 'proprietaire'))
  )
  with check (
    exists (select 1 from users where id = (select auth.uid()) and role in ('operateur', 'proprietaire'))
  );

create policy "intervalles_staff_all" on intervalles_prix
  for all to authenticated
  using (
    exists (select 1 from users where id = (select auth.uid()) and role in ('operateur', 'proprietaire'))
  )
  with check (
    exists (select 1 from users where id = (select auth.uid()) and role in ('operateur', 'proprietaire'))
  );
