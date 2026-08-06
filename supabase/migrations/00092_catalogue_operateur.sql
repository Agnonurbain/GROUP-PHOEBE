-- ─────────────────────────────────────────────────────────────────────────────
-- 00092 — Le catalogue s'alimente à deux mains
--
-- Ajouter un modèle au catalogue était réservé au propriétaire (00088), au motif
-- que « le catalogue engage l'image de la maison ». C'était un jugement, pas une
-- règle de sûreté : un article ne porte AUCUN prix — c'est le trait central du
-- module (00087). Le laisser au seul propriétaire fait donc du remplissage de la
-- vitrine un goulot, pour un risque qui n'existe pas.
--
-- L'opérateur peut désormais ajouter et retirer un modèle. Ce qui reste au
-- propriétaire : la marge revendeur et les gammes — la première détermine un
-- montant facturé, la seconde déclare ce que la maison vend.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "articles_pagne_manage_proprietaire" on public.articles_pagne;

create policy "articles_pagne_manage_staff"
  on public.articles_pagne for all
  using (public.is_staff()) with check (public.is_staff());

comment on table public.articles_pagne is
  'Catalogue photo des pagnes. AUCUN prix, pour la même raison qu''en 00087 : le marché n''a pas de prix de référence tenable. Alimenté par le personnel depuis 00092 — un article sans prix n''engage rien qu''un opérateur ne puisse engager.';

-- ─── Les photos suivent ──────────────────────────────────────────────────────
-- Elles montent du NAVIGATEUR vers le bucket, avec la session de celui qui
-- dépose : sans cette policy, l'opérateur verrait le formulaire et son envoi
-- échouerait — un écran qui promet ce que la base refuse.

drop policy if exists "catalogue_pagnes_manage_proprietaire" on storage.objects;

create policy "catalogue_pagnes_manage_staff"
  on storage.objects for all
  using (bucket_id = 'catalogue-pagnes' and public.is_staff())
  with check (bucket_id = 'catalogue-pagnes' and public.is_staff());
