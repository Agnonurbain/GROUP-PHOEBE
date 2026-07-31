-- ─────────────────────────────────────────────────────────────────────────────
-- 00064 — Preuve de livraison en bucket privé, et zone de livreur qui veut dire
--         quelque chose
--
-- Deux sujets distincts mais qui touchent la même table.
--
-- 1. La preuve de remise partait dans `colis-photos`, bucket public. Le chemin
--    contient un UUID, donc rien n'est énumérable, mais une photo de la porte
--    de quelqu'un avec le nom de la personne qui a réceptionné n'a pas à être
--    lisible par quiconque récupère l'URL. Même traitement que les factures :
--    bucket privé, chemin stocké, URL signée à la demande.
--
-- 2. `livreurs.zone_couverture` était comparée par égalité stricte à
--    `expeditions.zone`, qui vaut `intracommunale` | `intercommunale` |
--    `nationale`. Or ce n'est pas un territoire, c'est une classe de trajet :
--    aucun livreur ne couvre « l'intercommunal ». Le champ n'était renseigné
--    nulle part et le filtre laissait donc tout le monde passer — il marchait
--    par accident. Le jour où quelqu'un y écrivait « Cocody », comme le nom de
--    la colonne et l'usage voisin (agents immobiliers) le suggèrent, ce livreur
--    devenait inéligible à toutes les expéditions, en silence.
--
--    La zone d'un livreur devient ce qu'elle prétend être : les communes qu'il
--    dessert, comparées à la commune de collecte du colis.
--
-- Ordre important : les colonnes d'abord, les policies ensuite. Une policy qui
-- référence une colonne pas encore renommée fait échouer toute la migration.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Colonnes ─────────────────────────────────────────────────────────────

alter table public.expeditions rename column preuve_photo to preuve_chemin;

comment on column public.expeditions.preuve_chemin is
  'Chemin de l''objet dans le bucket privé `livraison-preuves`. Jamais une URL : elle est signée à la demande.';

-- La commune était saisie à la commande puis fondue dans l'adresse
-- (« détail — Commune ») : plus rien ne permettait de rattacher un colis à une
-- commune sans reparser du texte libre.
alter table public.expeditions
  add column if not exists commune_collecte text,
  add column if not exists commune_livraison text;

comment on column public.expeditions.commune_collecte is
  'Commune de retrait, telle que choisie par le client. Sert l''affectation automatique du livreur.';

-- Reprise de l'existant : le format posé à la création est « détail — Commune ».
update public.expeditions
   set commune_collecte = nullif(trim(split_part(adresse_collecte, ' — ', 2)), ''),
       commune_livraison = nullif(trim(split_part(adresse_livraison, ' — ', 2)), '')
 where commune_collecte is null;

-- ─── 2. Bucket privé pour les preuves de remise ──────────────────────────────

insert into storage.buckets (id, name, public)
values ('livraison-preuves', 'livraison-preuves', false)
on conflict (id) do nothing;

-- Dépôt réservé au serveur : les server actions écrivent en clé de service,
-- qui ignore ces policies. Elles bornent le chemin REST direct.
create policy "preuves_insert_staff"
  on storage.objects for insert
  with check (
    bucket_id = 'livraison-preuves'
    and (public.is_staff() or public.own_livreur_id() is not null)
  );

create policy "preuves_select_staff"
  on storage.objects for select
  using (bucket_id = 'livraison-preuves' and public.is_staff());

-- Le client lit la preuve de ses propres colis : c'est d'abord pour lui
-- qu'elle existe.
create policy "preuves_select_client"
  on storage.objects for select
  using (
    bucket_id = 'livraison-preuves'
    and exists (
      select 1 from public.expeditions e
      where e.preuve_chemin = storage.objects.name
        and e.client_id = auth.uid()
    )
  );

-- ─── 3. La zone d'un livreur : des communes, pas une classe de trajet ────────

comment on column public.livreurs.zone_couverture is
  'Communes desservies, séparées par des virgules (ex. « Cocody, Marcory »). Vide = tout Abidjan. Comparée à expeditions.commune_collecte. À ne pas confondre avec agents_immobiliers.zone_couverture, qui est une sous-chaîne de localisation, ni avec expeditions.zone, qui est une classe de trajet.';

-- Le champ n'a jamais été renseigné pour un livreur (aucun formulaire ne
-- l'exposait) : rien à reprendre, mais on repart d'une base propre au cas où
-- une valeur aurait été posée à la main avec l'ancienne sémantique.
update public.livreurs
   set zone_couverture = null
 where zone_couverture in ('intracommunale', 'intercommunale', 'nationale');
