-- ─────────────────────────────────────────────────────────────────────────────
-- 00061 — La facture vit dans un bucket privé : on stocke un chemin, pas une URL
--
-- Le bucket `factures` est privé, à raison : une facture porte le nom, le
-- téléphone, l'email et les montants d'un client. Mais la génération y stockait
-- le résultat de `getPublicUrl()`, qui ne résout pas sur un bucket privé — le
-- lien était mort dès l'émission, côté client comme côté admin.
--
-- La colonne porte désormais le chemin de l'objet ; l'URL est signée à la
-- demande, après contrôle du demandeur. Le renommage est sans risque : la
-- génération n'a jamais abouti (cf. 00060), la table est vide.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.factures rename column pdf_url to pdf_chemin;

comment on column public.factures.pdf_chemin is
  'Chemin de l''objet dans le bucket privé `factures` (ex: FAC-2026-0001.pdf). Jamais une URL : elle est signée à la demande, le bucket étant privé.';

-- La policy comparait `pdf_url` : elle suivait la colonne renommée, mais son
-- motif visait une URL. Sur un chemin nu, l'égalité suffit et se lit mieux.
drop policy if exists "factures_select_own" on storage.objects;

create policy "factures_select_own"
  on storage.objects for select
  using (
    bucket_id = 'factures'
    and exists (
      select 1 from public.factures f
      where f.client_id = auth.uid()
        and f.pdf_chemin = storage.objects.name
    )
  );
