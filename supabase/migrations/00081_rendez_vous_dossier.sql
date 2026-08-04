-- ─────────────────────────────────────────────────────────────────────────────
-- 00081 — Rendez-vous de dépôt de dossier
--
-- Retour de GROUP PHOEBE : « pour rendez-vous de dépôt de dossier, il faut
-- qu'il y ait cette option-là. Il choisit la date et puis il prend le
-- rendez-vous de dépôt de dossier. » (v3, confirmé par v2)
--
-- C'est ce qui remplace le règlement en ligne, retiré au même moment : le
-- parcours s'arrête désormais sur une date convenue, pas sur un paiement.
--
-- ─── Où vivent les jours ouvrables ───────────────────────────────────────────
-- Ils NE SONT PAS redéfinis ici. Les jours et heures d'ouverture de GROUP
-- PHOEBE existent déjà, posés en 00075 sur `parametres_transport` pour le
-- décompte des délais transport. Ce sont les mêmes murs et les mêmes horaires :
-- en créer un second jeu produirait deux calendriers qui finiraient par
-- diverger — le défaut corrigé trois fois ailleurs dans ce dépôt.
--
-- Le nom de la table est trompeur, ces horaires n'ayant rien de propre au
-- transport. Le renommer touche les crons d'expiration : c'est un chantier
-- distinct, signalé plutôt qu'entrepris au milieu de celui-ci.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Ce qui se règle, au-delà des heures d'ouverture ──────────────────────

create table if not exists public.parametres_rendez_vous (
  id boolean primary key default true check (id),

  -- Une demi-heure : le temps de vérifier des pièces et de répondre aux
  -- questions, sans immobiliser le comptoir.
  duree_minutes int not null default 30
    check (duree_minutes between 5 and 240),

  -- Combien de clients l'équipe reçoit en même temps.
  capacite_par_creneau int not null default 1
    check (capacite_par_creneau between 1 and 20),

  -- Délai de prévenance. Sans lui, un client réserverait pour dans dix minutes
  -- et personne ne serait prévenu à temps.
  delai_min_heures int not null default 24
    check (delai_min_heures between 0 and 720),

  -- Jusqu'où l'agenda est ouvert. Au-delà, les disponibilités annoncées ne
  -- veulent plus rien dire.
  horizon_jours int not null default 60
    check (horizon_jours between 1 and 400),

  updated_at timestamptz not null default now()
);

insert into public.parametres_rendez_vous (id) values (true) on conflict (id) do nothing;

comment on table public.parametres_rendez_vous is
  'Paramétrage des rendez-vous de dépôt. Les JOURS ET HEURES d''ouverture ne sont pas ici : ils vivent sur parametres_transport (00075) et sont partagés, pour qu''il n''existe qu''un seul calendrier.';

alter table public.parametres_rendez_vous enable row level security;

-- Lecture publique : le client doit voir les créneaux avant de se connecter.
create policy "parametres_rendez_vous_select_public"
  on public.parametres_rendez_vous for select using (true);

create policy "parametres_rendez_vous_manage_proprietaire"
  on public.parametres_rendez_vous for all
  using (public.is_proprietaire()) with check (public.is_proprietaire());

-- ─── 2. Les fermetures exceptionnelles ───────────────────────────────────────
-- Jours fériés, congés, inventaire. Sans elles, l'agenda proposerait un
-- rendez-vous le 1er janvier parce que c'est un mercredi.

create table if not exists public.fermetures_agence (
  jour date primary key,
  motif text,
  created_at timestamptz not null default now()
);

comment on table public.fermetures_agence is
  'Jours de fermeture exceptionnelle. Un jour listé ici ne propose aucun créneau, même s''il est ouvré.';

alter table public.fermetures_agence enable row level security;

create policy "fermetures_agence_select_public"
  on public.fermetures_agence for select using (true);

create policy "fermetures_agence_manage_proprietaire"
  on public.fermetures_agence for all
  using (public.is_proprietaire()) with check (public.is_proprietaire());

-- ─── 3. Les rendez-vous ──────────────────────────────────────────────────────

create table if not exists public.rendez_vous_dossier (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers_voyage(id) on delete cascade,
  client_id uuid not null references public.users(id) on delete cascade,

  debut timestamptz not null,
  fin timestamptz not null check (fin > debut),

  statut text not null default 'reserve'
    check (statut in ('reserve', 'honore', 'annule')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un dossier n'a qu'un rendez-vous vivant à la fois. Sans cela, un client qui
-- reclique en réserverait un second et occuperait deux places.
create unique index if not exists rendez_vous_dossier_actif
  on public.rendez_vous_dossier (dossier_id)
  where statut = 'reserve';

create index if not exists rendez_vous_dossier_debut
  on public.rendez_vous_dossier (debut)
  where statut = 'reserve';

comment on table public.rendez_vous_dossier is
  'Rendez-vous de dépôt d''un dossier d''assistance. Remplace le règlement en ligne : le parcours s''arrête sur une date convenue.';

comment on index public.rendez_vous_dossier_actif is
  'Un seul rendez-vous « reserve » par dossier. La capacité d''un créneau, elle, se vérifie côté applicatif : elle est paramétrable et peut valoir plus de un.';

alter table public.rendez_vous_dossier enable row level security;

-- Le client voit et prend ses propres rendez-vous, sur SES dossiers.
create policy "rendez_vous_select_own"
  on public.rendez_vous_dossier for select
  using (client_id = auth.uid() or public.is_staff());

create policy "rendez_vous_insert_own"
  on public.rendez_vous_dossier for insert
  with check (
    client_id = auth.uid()
    and exists (
      select 1 from public.dossiers_voyage
      where id = dossier_id and client_id = auth.uid()
    )
  );

-- Annuler ou honorer : le client annule le sien, l'équipe gère tout.
create policy "rendez_vous_update_own"
  on public.rendez_vous_dossier for update
  using (client_id = auth.uid() or public.is_staff())
  with check (client_id = auth.uid() or public.is_staff());

create policy "rendez_vous_staff_manage"
  on public.rendez_vous_dossier for all
  using (public.is_staff()) with check (public.is_staff());
