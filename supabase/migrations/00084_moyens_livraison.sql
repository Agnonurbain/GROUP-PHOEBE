-- ─────────────────────────────────────────────────────────────────────────────
-- 00084 — Le moyen de livraison : moto ou cargo
--
-- Retour de GROUP PHOEBE (notes vocales, dossier `oth/`) :
--
--   « Il y a les types de moyens de livraison : il y a moto et puis il y a le
--     cargo. Quand la personne va demander sa livraison, tu attends sur les
--     deux types de moyens de livraison. »
--
--   « Si la personne a opté pour une moto, elle tombe sur les grilles
--     tarifaires. Si elle a cliqué sur un cargo, elle aurait 3 types de cargo :
--     petit, moyen, grand. En fonction des types de cargo, il y a aussi les
--     tarifs qui vont avec. »
--
-- ─── Ce que le moyen remplace ────────────────────────────────────────────────
-- Le prix se calculait `tarif(zone × mode) × multiplicateur(palier de poids)`.
-- Le moyen et le poids disent la même chose sous deux formes : on prend un
-- cargo parce que le colis est lourd. Les garder tous les deux ferait payer
-- deux fois la même réalité, et laisserait choisir « moto » pour 40 kg.
--
-- Décision de l'exploitant : LE MOYEN REMPLACE LE POIDS dans le prix. Le poids
-- reste saisi — le livreur doit le connaître — mais il ne sert plus qu'à
-- écarter les moyens trop justes.
--
-- ─── Ce que le moyen ne remplace pas ─────────────────────────────────────────
-- Le mode est le DÉLAI (standard, express, même jour, programmée), le moyen est
-- le VÉHICULE. Une moto peut être express, un cargo peut être programmé : ils
-- sont indépendants. Mais une grille complète ferait 3 zones × 4 moyens × 4
-- modes = 48 prix à saisir. Le mode devient donc un COEFFICIENT, la forme
-- qu'avait déjà le palier de poids :
--
--   prix = tarif(zone × moyen) × coefficient(mode)
--
-- 12 prix de base + 4 coefficients. Les deux pilotables.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Les moyens ───────────────────────────────────────────────────────────
-- Charges utiles établies sur les véhicules que ce type de service met en
-- ligne à Abidjan — moto ~10 kg, fourgonnette, camionnette bâchée type Kia
-- K2700 (charge utile jusqu'à 1,7 t, catégorie < 3,5 t). Ce sont des ordres de
-- grandeur : le propriétaire les corrige avec sa flotte réelle.

create table if not exists public.moyens_livraison (
  cle text primary key check (cle ~ '^[a-z_]+$'),
  label text not null,
  -- Regroupement affiché au client. Volontairement LIBRE : l'exploitant doit
  -- pouvoir ajouter d'autres types de moyens — un fourgon, un camion, une
  -- barque — sans migration. Une liste fermée aurait obligé à déployer pour
  -- vendre un nouveau service.
  famille text not null check (length(trim(famille)) between 1 and 40),
  charge_max_kg numeric(8,2) not null check (charge_max_kg > 0),
  -- Ordre d'affichage : du plus léger au plus lourd, comme le client raisonne.
  ordre int not null unique,
  actif boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.moyens_livraison (cle, label, famille, charge_max_kg, ordre) values
  ('moto',         'Moto',          'moto',   10,   1),
  ('cargo_petit',  'Cargo petit',   'cargo',  500,  2),
  ('cargo_moyen',  'Cargo moyen',   'cargo',  1000, 3),
  ('cargo_grand',  'Cargo grand',   'cargo',  1700, 4)
on conflict (cle) do nothing;

comment on table public.moyens_livraison is
  'Moyens de livraison proposés au client : une moto, et trois tailles de cargo. La charge utile n''entre pas dans le prix — elle écarte les moyens trop justes pour le colis annoncé.';

comment on column public.moyens_livraison.famille is
  'Regroupement libre. Le client choisit d''abord la famille, puis le moyen dans cette famille — c''est le parcours décrit par l''exploitant (moto, puis les trois tailles de cargo). Une famille à un seul moyen se choisit en un clic.';

comment on column public.moyens_livraison.actif is
  'Un moyen retiré du catalogue passe à faux, il ne se supprime pas : des expéditions passées le référencent, et effacer son nom rendrait leur historique illisible.';

alter table public.moyens_livraison enable row level security;

create policy "moyens_livraison_select_public"
  on public.moyens_livraison for select using (true);

create policy "moyens_livraison_manage_proprietaire"
  on public.moyens_livraison for all
  using (public.is_proprietaire()) with check (public.is_proprietaire());

-- ─── 2. Le coefficient de mode ───────────────────────────────────────────────
-- Le délai reste un levier commercial : l'express se facture plus cher. Les
-- valeurs reprennent les rapports de l'ancienne grille — express ≈ 1,6 fois le
-- standard sur l'intracommunale, même jour ≈ 2,3, programmée ≈ 1,3.

create table if not exists public.coefficients_mode_livraison (
  mode text primary key check (mode in ('standard', 'express', 'meme_jour', 'programmee')),
  coefficient numeric(5,2) not null check (coefficient > 0 and coefficient <= 10),
  updated_at timestamptz not null default now()
);

insert into public.coefficients_mode_livraison (mode, coefficient) values
  ('standard',   1.00),
  ('express',    1.60),
  ('meme_jour',  2.30),
  ('programmee', 1.30)
on conflict (mode) do nothing;

comment on table public.coefficients_mode_livraison is
  'Multiplicateur appliqué au tarif zone × moyen selon le délai. Une grille complète aurait fait 48 prix à saisir pour la même information.';

alter table public.coefficients_mode_livraison enable row level security;

create policy "coefficients_mode_select_public"
  on public.coefficients_mode_livraison for select using (true);

create policy "coefficients_mode_manage_proprietaire"
  on public.coefficients_mode_livraison for all
  using (public.is_proprietaire()) with check (public.is_proprietaire());

-- ─── 3. La grille passe de zone × mode à zone × moyen ────────────────────────
-- On repart d'une table neuve plutôt que de muter l'ancienne : la clé change
-- de sens, et une colonne `mode` qui contiendrait un moyen serait un piège
-- durable pour qui lirait le schéma.

create table if not exists public.tarifs_livraison_moyen (
  zone text not null check (zone in ('intracommunale', 'intercommunale', 'nationale')),
  moyen text not null references public.moyens_livraison(cle) on delete cascade,
  prix numeric(12,2) not null check (prix > 0),
  updated_at timestamptz not null default now(),
  primary key (zone, moyen)
);

insert into public.tarifs_livraison_moyen (zone, moyen, prix) values
  -- La moto reprend EXACTEMENT les tarifs standard de l'ancienne grille :
  -- c'est le moyen qu'elle décrivait sans le nommer.
  ('intracommunale', 'moto',        1500),
  ('intercommunale', 'moto',        2500),
  ('nationale',      'moto',        5000),
  -- Les cargos sont des points de départ défendables, pas des tarifs
  -- communiqués : environ 4, 7 et 11 fois la moto, à ajuster depuis
  -- /admin/tarifs dès que GROUP PHOEBE aura ses vrais montants.
  ('intracommunale', 'cargo_petit',  6000),
  ('intercommunale', 'cargo_petit', 10000),
  ('nationale',      'cargo_petit', 20000),
  ('intracommunale', 'cargo_moyen', 10500),
  ('intercommunale', 'cargo_moyen', 17500),
  ('nationale',      'cargo_moyen', 35000),
  ('intracommunale', 'cargo_grand', 16500),
  ('intercommunale', 'cargo_grand', 27500),
  ('nationale',      'cargo_grand', 55000)
on conflict (zone, moyen) do nothing;

comment on table public.tarifs_livraison_moyen is
  'Prix de base par zone et par moyen. Le mode (délai) s''y applique en coefficient. Les tarifs cargo sont des points de départ : ils n''ont pas été communiqués et attendent d''être ajustés.';

alter table public.tarifs_livraison_moyen enable row level security;

create policy "tarifs_livraison_moyen_select_public"
  on public.tarifs_livraison_moyen for select using (true);

create policy "tarifs_livraison_moyen_manage_proprietaire"
  on public.tarifs_livraison_moyen for all
  using (public.is_proprietaire()) with check (public.is_proprietaire());

-- ─── 4. Le moyen sur l'expédition ────────────────────────────────────────────
-- Nullable : les expéditions déjà créées n'ont pas de moyen, et leur en
-- inventer un réécrirait l'histoire. L'absence se lit « avant les moyens ».

alter table public.expeditions
  add column if not exists moyen text references public.moyens_livraison(cle);

comment on column public.expeditions.moyen is
  'Moyen choisi par le client. NULL pour les expéditions antérieures au 04/08/2026, où seul le poids entrait dans le prix.';

-- ─── 5. Ce qui devient obsolète ──────────────────────────────────────────────
-- `paliers_poids` et `tarifs_livraison` ne pilotent plus aucun prix. On ne les
-- supprime PAS ici : le code qui les lit vit encore dans la même livraison, et
-- une migration qui casse le déploiement en cours ne rend service à personne.
-- Leur retrait suit, une fois le nouveau chemin en production.

comment on table public.tarifs_livraison is
  'OBSOLÈTE depuis 00084 : la grille est désormais zone × moyen (tarifs_livraison_moyen), le mode s''applique en coefficient. Conservée le temps que le nouveau chemin soit éprouvé en production.';

comment on table public.paliers_poids is
  'OBSOLÈTE depuis 00084 : le poids n''entre plus dans le prix, le moyen l''a remplacé. Le poids reste saisi et sert à écarter les moyens trop justes.';
