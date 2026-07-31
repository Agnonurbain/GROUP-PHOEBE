-- Avis cross-vertical, factures PDF automatiques, blog/guides, et infrastructure
-- i18n — pilotables depuis /admin. Créée le 2026-07-30.
--
-- Quelques principes communs :
--   · Les tables « parametres_* » sont des singletons (une seule ligne, upsert).
--   · Les valeurs de repli (defaut) vivent dans le code Next.js.
--   · Les clés i18n sont libres ; l'interpréteur est côté client.

-- ─── 1. Avis cross-vertical ───────────────────────────────────────────────────
-- Remplace avis_transport (transport seulement) par un modèle polymorphique
-- qui couvre tous les services : transport, immobilier, assistance, billet, livraison.

create table public.avis (
  id uuid primary key default gen_random_uuid(),
  reference_table text not null check (reference_table in (
    'demandes_transport', 'demandes_immobilier', 'dossiers_voyage',
    'demandes_billet', 'expeditions'
  )),
  reference_id uuid not null,
  client_id uuid not null references public.users(id),
  note int not null check (note between 1 and 5),
  titre text,
  commentaire text,
  reponse_admin text,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'publie', 'refuse')),
  created_at timestamptz not null default now(),
  modere_at timestamptz,
  modere_par uuid references public.users(id),
  unique (reference_table, reference_id)
);

comment on table public.avis is
  'Avis clients sur n importe quel service. Un seul avis par réservation.';

comment on column public.avis.reference_table is
  'Table cible : demandes_transport, demandes_immobilier, dossiers_voyage, demandes_billet, expeditions.';

comment on column public.avis.reference_id is
  'ID de la ligne dans reference_table.';

comment on column public.avis.statut is
  'en_attente → publié/refusé. Modéré par l équipe avant publication publique.';

alter table public.avis enable row level security;

-- Lecture publique : seuls les avis publiés sont visibles de tous
create policy "avis_select_public" on public.avis for select
  using (statut = 'publie');

-- Le client peut voir ses propres avis (quel que soit le statut)
create policy "avis_select_own" on public.avis for select
  using (client_id = auth.uid());

-- Insertion : le client connecté, sur une réservation terminée le concernant
create policy "avis_insert_client" on public.avis for insert
  with check (
    client_id = auth.uid()
    and exists (
      select 1 from public.users
      where id = auth.uid() and role = 'client'
    )
  );

-- Staff (operateur, proprietaire) : tout modifier (modération)
create policy "avis_staff_all" on public.avis for all
  using (public.is_staff())
  with check (public.is_staff());

-- ─── 1b. Paramètres des avis (singleton) ──────────────────────────────────────

create table public.parametres_avis (
  id bool not null default true primary key,
  moderation_obligatoire bool not null default true,
  delai_apres_terme_jours int not null default 30
    check (delai_apres_terme_jours between 1 and 365),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parametres_avis_singleton check (id)
);

comment on table public.parametres_avis is
  'Paramétrage du module avis. Singleton : une seule ligne, id = true.';

comment on column public.parametres_avis.moderation_obligatoire is
  'Si vrai, un avis doit être modéré (publie/refuse) avant d être visible publiquement.';

comment on column public.parametres_avis.delai_apres_terme_jours is
  'Fenêtre pendant laquelle le client peut laisser un avis après la fin de sa réservation.';

insert into public.parametres_avis (id) values (true);

alter table public.parametres_avis enable row level security;

create policy "parametres_avis_select" on public.parametres_avis for select
  using (true);

create policy "parametres_avis_staff_update" on public.parametres_avis for update
  using (public.is_staff())
  with check (public.is_staff());

-- ─── 2. Factures PDF ──────────────────────────────────────────────────────────
-- Chaque facture correspond à un paiement capturé. Le PDF est stocké dans
-- Supabase Storage ; un job (côté app) le génère et enregistre l'URL ici.

create table public.factures (
  id uuid primary key default gen_random_uuid(),
  paiement_id uuid not null references public.paiements(id) on delete cascade,
  numero text not null unique,
  reference_table text not null,
  reference_id uuid not null,
  client_id uuid not null references public.users(id),
  montant_ht numeric(12,2) not null check (montant_ht >= 0),
  taux_tva numeric(5,2) not null default 0,
  montant_ttc numeric(12,2) not null check (montant_ttc >= 0),
  devis text not null default 'XOF',
  pdf_url text,
  created_at timestamptz not null default now(),
  annulee bool not null default false
);

comment on table public.factures is
  'Factures générées automatiquement après confirmation de paiement.';

comment on column public.factures.numero is
  'Numéro unique de facture (ex: FAC-2026-0001).';

comment on column public.factures.pdf_url is
  'URL du fichier PDF stocké dans Supabase Storage.';

alter table public.factures enable row level security;

create policy "factures_select_own" on public.factures for select
  using (client_id = auth.uid());

create policy "factures_staff_select" on public.factures for select
  using (public.is_staff());

-- L'insertion est faite côté serveur (service role)
create policy "factures_server_insert" on public.factures for insert
  with check (public.is_staff());

-- ─── 2b. Paramètres de facturation (singleton) ────────────────────────────────

create table public.parametres_facturation (
  id bool not null default true primary key,
  taux_tva numeric(5,2) not null default 18 check (taux_tva >= 0 and taux_tva <= 100),
  numero_suivant int not null default 1,
  prefixe_facture text not null default 'FAC',
  email_cc text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parametres_facturation_singleton check (id)
);

comment on table public.parametres_facturation is
  'Paramétrage de la facturation. Singleton : une seule ligne, id = true.';

insert into public.parametres_facturation (id) values (true);

alter table public.parametres_facturation enable row level security;

create policy "parametres_facturation_select" on public.parametres_facturation for select
  using (true);

create policy "parametres_facturation_staff_update" on public.parametres_facturation for update
  using (public.is_staff())
  with check (public.is_staff());

-- ─── 3. Blog / Guides ─────────────────────────────────────────────────────────

create table public.categories_article (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nom text not null,
  description text,
  ordre int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.categories_article is
  'Catégories du blog / guides.';

alter table public.categories_article enable row level security;

create policy "categories_article_select" on public.categories_article for select
  using (true);

create policy "categories_article_staff_all" on public.categories_article for all
  using (public.is_staff())
  with check (public.is_staff());

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  categorie_id uuid references public.categories_article(id) on delete set null,
  titre text not null,
  resume text,
  contenu text not null,
  image_couverture text,
  auteur text,
  publie bool not null default false,
  date_publication timestamptz,
  meta_description text,
  meta_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.articles is
  'Articles du blog / guides.';

alter table public.articles enable row level security;

create policy "articles_select_published" on public.articles for select
  using (publie = true);

create policy "articles_staff_select" on public.articles for select
  using (public.is_staff());

create policy "articles_staff_all" on public.articles for all
  using (public.is_staff())
  with check (public.is_staff());

-- ─── 4. Infrastructure i18n ───────────────────────────────────────────────────
-- Table des langues disponibles et paramètres. Les traductions réelles sont
-- stockées côté application (fichiers JSON ou table dédiée ultérieure).

create table public.langues (
  code text primary key,
  nom text not null,
  drapeau text,
  defaut bool not null default false,
  actif bool not null default true,
  ordre int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.langues is
  'Langues disponibles sur le site public.';

alter table public.langues enable row level security;

create policy "langues_select" on public.langues for select
  using (true);

create policy "langues_staff_all" on public.langues for all
  using (public.is_staff())
  with check (public.is_staff());

insert into public.langues (code, nom, drapeau, defaut, ordre) values
  ('fr', 'Français', '🇫🇷', true, 1),
  ('en', 'English', '🇬🇧', false, 2);

-- ─── 5. Storage buckets ───────────────────────────────────────────────────────
-- Deux nouveaux buckets : factures (privé) et blog (public).

insert into storage.buckets (id, name, public)
values ('factures', 'factures', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

-- factures : le service role peut uploader ; le client peut lire les siennes
create policy "factures_insert_service"
  on storage.objects for insert
  with check (
    bucket_id = 'factures'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('operateur', 'proprietaire')
    )
  );

create policy "factures_select_own"
  on storage.objects for select
  using (
    bucket_id = 'factures'
    and exists (
      select 1 from public.factures f
      where f.client_id = auth.uid()
        and f.pdf_url like '%' || storage.objects.name
    )
  );

-- blog-images : staff upload/delete, public read (bucket public)
create policy "blog_images_insert_staff"
  on storage.objects for insert
  with check (
    bucket_id = 'blog-images'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('operateur', 'proprietaire')
    )
  );

create policy "blog_images_delete_staff"
  on storage.objects for delete
  using (
    bucket_id = 'blog-images'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('operateur', 'proprietaire')
    )
  );

-- ─── 6. Mise à jour des commentaires sur la table existante ───────────────────
comment on table public.avis_transport is
  'Ancienne table — préférer public.avis pour les nouveaux avis. Conservée pour la rétrocompatibilité.';
