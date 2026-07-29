-- Les favoris acceptent aussi les biens immobiliers.
-- Créée le 2026-07-29.
--
-- La table ne portait que `vehicule_id`, NOT NULL : l'immobilier n'avait pas de
-- favoris alors que le transport en a. Une ligne cible désormais soit un
-- véhicule, soit un bien — jamais les deux, jamais aucun.

alter table public.favoris
  alter column vehicule_id drop not null;

alter table public.favoris
  add column if not exists bien_id uuid references public.biens(id) on delete cascade;

-- Exactement une cible par ligne. Sans cette contrainte, une ligne sans cible
-- (ou avec les deux) serait possible et fausserait les comptages.
alter table public.favoris
  drop constraint if exists favoris_une_seule_cible;

alter table public.favoris
  add constraint favoris_une_seule_cible
  check ((vehicule_id is not null) <> (bien_id is not null));

-- Un même favori ne se pose qu'une fois. Deux index partiels plutôt qu'une
-- contrainte unique sur (user_id, vehicule_id, bien_id) : en SQL, NULL n'est
-- jamais égal à NULL, donc une telle contrainte laisserait passer les doublons.
create unique index if not exists favoris_user_vehicule_unique
  on public.favoris (user_id, vehicule_id)
  where vehicule_id is not null;

create unique index if not exists favoris_user_bien_unique
  on public.favoris (user_id, bien_id)
  where bien_id is not null;

-- La cascade manquait aussi côté véhicule : supprimer un véhicule laissait des
-- favoris orphelins pointant dans le vide.
alter table public.favoris
  drop constraint if exists favoris_vehicule_id_fkey;

alter table public.favoris
  add constraint favoris_vehicule_id_fkey
  foreign key (vehicule_id) references public.vehicules(id) on delete cascade;
