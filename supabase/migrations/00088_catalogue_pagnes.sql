-- ─────────────────────────────────────────────────────────────────────────────
-- 00088 — Catalogue de pagnes
--
-- Le service ne montrait rien : le client décrivait ce qu'il cherchait en
-- toutes lettres, sans savoir ce que GROUP PHOEBE a réellement en rayon. Un
-- catalogue photo lui donne quelque chose à regarder — et à désigner.
--
-- ─── Ce que le catalogue NE change PAS ───────────────────────────────────────
-- La description libre RESTE. Un client qui a vu un pagne au marché, ou qui
-- cherche un motif qu'on n'a pas encore photographié, doit pouvoir le dire.
-- Le catalogue ajoute un chemin, il n'en ferme aucun.
--
-- Et le prix reste absent, pour la même raison qu'en 00087 : « on ne peut pas
-- afficher un prix comme ça ». Un article de catalogue n'a donc PAS de prix —
-- montrer une photo avec un montant serait exactement ce que l'exploitant a
-- refusé.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.articles_pagne (
  id uuid primary key default gen_random_uuid(),
  type_pagne text not null references public.types_pagne(cle) on delete cascade,

  -- La référence du fabricant quand elle existe (« UW23458 ») : c'est ainsi
  -- qu'un client fidèle redemande le même motif.
  reference text,
  nom text not null check (length(trim(nom)) between 1 and 120),
  description text,

  -- Décrites en toutes lettres plutôt qu'en codes : le client cherche « bleu et
  -- or », pas « #1E40AF ».
  couleurs text,

  -- Chemins dans le bucket `catalogue-pagnes`. Plusieurs photos par article :
  -- un pagne se juge de près comme de loin.
  photos text[] not null default '{}',

  -- Un article épuisé disparaît du catalogue sans être effacé : des demandes
  -- passées le désignent, et son nom doit rester lisible dans leur historique.
  disponible boolean not null default true,

  -- Mis en avant sur la page : la vitrine, avant la grille complète.
  vedette boolean not null default false,

  ordre int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_pagne_type_idx on public.articles_pagne (type_pagne);
create index if not exists articles_pagne_dispo_idx
  on public.articles_pagne (disponible, ordre) where disponible;

comment on table public.articles_pagne is
  'Catalogue photo des pagnes. AUCUN prix, pour la même raison qu''en 00087 : le marché n''a pas de prix de référence tenable. Le catalogue montre, il ne chiffre pas.';

comment on column public.articles_pagne.photos is
  'Chemins dans le bucket catalogue-pagnes. Plusieurs par article : un pagne se juge de près comme de loin.';

comment on column public.articles_pagne.disponible is
  'Un article épuisé sort du catalogue sans être effacé : des demandes passées le désignent.';

alter table public.articles_pagne enable row level security;

-- Lecture publique : c'est une vitrine, elle se consulte sans compte.
create policy "articles_pagne_select_public"
  on public.articles_pagne for select using (true);

create policy "articles_pagne_manage_proprietaire"
  on public.articles_pagne for all
  using (public.is_proprietaire()) with check (public.is_proprietaire());

-- ─── Le bucket des photos ────────────────────────────────────────────────────
-- PUBLIC, contrairement à `dossiers-documents` : ce sont des photos de vitrine,
-- pas des pièces d'identité. Les servir en URL signée obligerait à signer
-- chaque vignette à chaque affichage, pour protéger ce qu'on cherche justement
-- à montrer.

insert into storage.buckets (id, name, public)
values ('catalogue-pagnes', 'catalogue-pagnes', true)
on conflict (id) do nothing;

drop policy if exists "catalogue_pagnes_select_public" on storage.objects;
create policy "catalogue_pagnes_select_public"
  on storage.objects for select
  using (bucket_id = 'catalogue-pagnes');

-- Dépôt et retrait : propriétaire seul. Le catalogue engage l'image de la
-- maison, et une photo déposée par n'importe quel compte connecté s'y
-- retrouverait en vitrine.
drop policy if exists "catalogue_pagnes_manage_proprietaire" on storage.objects;
create policy "catalogue_pagnes_manage_proprietaire"
  on storage.objects for all
  using (bucket_id = 'catalogue-pagnes' and public.is_proprietaire())
  with check (bucket_id = 'catalogue-pagnes' and public.is_proprietaire());

-- ─── Le lien entre une demande et un article ─────────────────────────────────
-- Nullable, et c'est le point : le client peut désigner un article du
-- catalogue OU décrire ce qu'il cherche. Rendre ce lien obligatoire
-- reviendrait à ne plus vendre que ce qui est déjà photographié.

alter table public.demandes_textile
  add column if not exists article_id uuid references public.articles_pagne(id) on delete set null;

comment on column public.demandes_textile.article_id is
  'Article du catalogue désigné par le client, s''il en a choisi un. NULL quand il décrit ce qu''il cherche : les deux chemins restent ouverts. `on delete set null` — retirer un article du catalogue ne doit pas effacer les demandes qui le visaient.';
