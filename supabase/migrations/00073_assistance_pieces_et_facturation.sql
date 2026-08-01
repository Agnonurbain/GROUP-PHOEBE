-- ─────────────────────────────────────────────────────────────────────────────
-- 00073 — Assistance : pièces justificatives et facturation des dossiers
--
-- Deux manques, dont un qui coûte de l'argent.
--
-- 1. `documents_dossier_voyage` existe depuis la migration initiale, avec ses
--    policies posées en 00038 — et **zéro ligne de code**. Or le statut
--    `pieces_complementaires_requises` existe précisément pour dire au client
--    « il nous manque des pièces », sans qu'aucun canal ne lui permette de les
--    envoyer. Un statut qui nomme une action que personne ne peut faire.
--
-- 2. Un dossier n'était jamais facturé. `montant_estime` est écrit à la
--    création depuis le tarif de la prestation, mais aucun paiement de module
--    `voyage` n'était créé nulle part : le service est rendu et jamais encaissé.
--    Ailleurs les défauts empêchaient de vendre ; ici on vendait gratuitement.
--
-- Les pièces du billet, elles, n'étaient que des cases déclaratives — le client
-- cochait « j'ai le certificat ». Il n'y avait donc rien à vérifier, ce qui
-- explique que les deux drapeaux `_valide` n'aient jamais été écrits par
-- personne tout en étant affichés en admin avec un ✓ ou un ✗.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Bucket privé des pièces ──────────────────────────────────────────────
-- Passeports, diplômes, actes de naissance, autorisations parentales : le
-- contenu le plus sensible du produit. Privé, chemin stocké, URL signée à la
-- demande — le traitement des factures et des preuves de livraison.

insert into storage.buckets (id, name, public)
values ('dossiers-documents', 'dossiers-documents', false)
on conflict (id) do nothing;

-- Dépôt : le client pour ses propres dossiers, le staff pour tous. Les server
-- actions écrivent en clé de service ; ces policies bornent l'appel REST direct.
create policy "dossiers_documents_insert"
  on storage.objects for insert
  with check (bucket_id = 'dossiers-documents' and auth.uid() is not null);

create policy "dossiers_documents_select_staff"
  on storage.objects for select
  using (bucket_id = 'dossiers-documents' and public.is_staff());

create policy "dossiers_documents_select_own"
  on storage.objects for select
  using (
    bucket_id = 'dossiers-documents'
    and exists (
      select 1
      from public.documents_dossier_voyage d
      join public.dossiers_voyage v on v.id = d.dossier_id
      where d.url = storage.objects.name
        and v.client_id = auth.uid()
    )
  );

-- ─── 2. Le motif d'un rejet ──────────────────────────────────────────────────
-- Rejeter une pièce sans dire pourquoi oblige le client à deviner ce qu'il doit
-- corriger — et il redéposera la même.

alter table public.documents_dossier_voyage
  add column if not exists commentaire text,
  add column if not exists updated_at timestamptz not null default now();

comment on column public.documents_dossier_voyage.url is
  'Chemin de l''objet dans le bucket privé `dossiers-documents`. Jamais une URL : elle est signée à la demande, après contrôle du demandeur.';
comment on column public.documents_dossier_voyage.commentaire is
  'Motif d''un rejet, destiné au client. Sans lui, il redépose la même pièce.';

-- Le client ne doit pas pouvoir déposer deux fois la même pièce pour un dossier :
-- l'équipe verrait deux lignes à vérifier pour un seul document.
create unique index if not exists documents_dossier_type_unique
  on public.documents_dossier_voyage (dossier_id, type_document);

-- ─── 3. Les pièces du billet deviennent des documents ────────────────────────
-- Une case cochée n'est pas une pièce : pour une autorisation parentale de
-- mineur, c'est le document qui fait foi.

alter table public.demandes_billet
  add column if not exists certificat_fievre_jaune_url text,
  add column if not exists mineur_autorisation_url text;

comment on column public.demandes_billet.certificat_fievre_jaune_url is
  'Chemin du certificat dans `dossiers-documents`. La colonne booléenne voisine reste la déclaration du client ; celle-ci porte la preuve.';
comment on column public.demandes_billet.certificat_fievre_jaune_valide is
  'Vérification par le staff du document déposé. NULL = pas encore vérifié.';
comment on column public.demandes_billet.mineur_autorisation_verifie is
  'Vérification par le staff de l''autorisation parentale déposée. NULL = pas encore vérifié.';
