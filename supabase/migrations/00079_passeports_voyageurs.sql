-- ─────────────────────────────────────────────────────────────────────────────
-- 00079 — Le passeport de CHAQUE voyageur, dès la demande
--
-- Le formulaire ne capturait que le passeport du voyageur principal. Les autres
-- étaient censés être saisis à l'étape du paiement : `payerDevisBillet` lit
-- `passager_nom_0`, `passager_date_naissance_0`… et refuse tant qu'ils manquent.
--
-- Or l'écran de paiement (`PayerBillet`) n'envoie que l'identifiant de la
-- demande et la méthode. Conséquence : **toute demande à plus d'un voyageur
-- était impayable**. Le client recevait un devis, cliquait, et se voyait
-- répondre « Le nom du passager 1 est obligatoire » sans qu'aucun champ ne le
-- lui ait jamais demandé. Une seule personne au dossier passait — d'où
-- l'absence de signalement.
--
-- On collecte donc les passagers à la DEMANDE, là où le client saisit déjà son
-- propre passeport. Le paiement n'a plus rien à demander.
--
-- ─── Le fichier ──────────────────────────────────────────────────────────────
-- Facultatif : une photo de la page passeport épargne les fautes de saisie sur
-- un nom translittéré, mais l'exiger bloquerait une demande que l'équipe peut
-- traiter sans. Les quatre champs texte, eux, restent obligatoires.
--
-- Le fichier est déposé DEPUIS LE NAVIGATEUR vers le bucket, et seul son chemin
-- transite par l'action serveur. Le faire passer par l'action était impossible :
-- une pièce va jusqu'à 10 Mo et un dossier jusqu'à 9 voyageurs, quand une Server
-- Action Next plafonne à 1 Mo par défaut.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.demandes_billet
  add column if not exists passeport_fichier text;

comment on column public.demandes_billet.passeport_fichier is
  'Chemin dans le bucket dossiers-documents de la page passeport du voyageur principal. Facultatif : les champs texte suffisent à traiter la demande.';

-- ─── Passagers supplémentaires ───────────────────────────────────────────────

alter table public.passagers_billet
  add column if not exists passeport_fichier text,
  add column if not exists type text
    check (type is null or type in ('adulte', 'enfant'));

-- La date de naissance était NOT NULL parce que la table n'était remplie qu'au
-- paiement, où elle était demandée. Elle est maintenant créée à la demande, où
-- le client ne saisit que ce qu'il saisit pour lui-même : nom, numéro,
-- expiration. La compagnie l'exigera pour émettre — elle se complète d'ici là.
alter table public.passagers_billet
  alter column date_naissance drop not null;

comment on column public.passagers_billet.date_naissance is
  'Exigee par la compagnie pour l emission. Nulle a la demande : le client ne la saisit pas plus pour ses accompagnants que pour lui-meme, elle se complete avant emission.';

comment on column public.passagers_billet.passeport_fichier is
  'Chemin dans le bucket dossiers-documents. Facultatif, comme pour le voyageur principal.';

comment on column public.passagers_billet.type is
  'adulte | enfant. Les bebes de moins de 2 ans ne sont pas saisis ici : ils voyagent sur les genoux d un adulte et leur document se regularise avant emission.';

-- Un même dossier ne doit pas accumuler deux fois les mêmes passagers si la
-- demande est rejouée. Rien ne l'empêchait : `payerDevisBillet` insérait en
-- boucle sans contrainte, un double clic suffisait à doubler la liste.
create unique index if not exists passagers_billet_unicite
  on public.passagers_billet (demande_id, passeport_numero);

-- ─── Dépôt direct depuis le navigateur, borné ────────────────────────────────
-- L'ancienne policy laissait tout compte connecté écrire N'IMPORTE OÙ dans le
-- bucket. Tolérable tant que rien n'y écrivait depuis le navigateur — les
-- server actions passent en clé de service et ignorent la RLS. À partir du
-- moment où le client y dépose lui-même, il faut le borner à son propre
-- dossier, sinon il peut écraser le chemin d'un autre.
drop policy if exists "dossiers_documents_insert" on storage.objects;

create policy "dossiers_documents_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'dossiers-documents'
    and auth.uid() is not null
    -- Dépôt navigateur : `billets/<son propre uid>/…` et rien d'autre.
    and (
      (storage.foldername(name))[1] <> 'billets'
      or (storage.foldername(name))[2] = auth.uid()::text
    )
  );
