-- ─────────────────────────────────────────────────────────────────────────────
-- 00080 — Assistance : deux niveaux de bourse, et le visa foire de Chine
--
-- Retour de GROUP PHOEBE (notes vocales du 04/08/2026).
--
-- « En Chine, il y a deux niveaux de bourse : master et licence. Quand tu
--   appuies sur soumettre, ça doit t'amener sur les deux parties, licence,
--   master. Dans la licence, on a les différents documents à fournir ; dans le
--   master, les différents documents à fournir. »
--
-- La prestation unique « etude » devient donc deux prestations distinctes. Le
-- niveau n'est pas un détail d'affichage : il change les pièces exigées, et
-- c'est précisément ce que le candidat vient vérifier avant de postuler.
--
--   Licence : baccalauréat  + relevés, photos, casier, lettre, passeport
--   Master  : diplôme licence + relevés, photos, casier, lettre, passeport
--
-- S'y ajoute le visa « foire de Chine » — le salon de Canton, distinct d'un
-- visa d'affaires classique. Tarif non communiqué : « sur devis », comme les
-- destinations Schengen.
-- ─────────────────────────────────────────────────────────────────────────────

-- `dossiers_voyage.prestation` stocke le LIBELLÉ, pas la clé : les dossiers
-- déjà soumis gardent le leur et rien n'est réécrit derrière le client.
-- Seule la table des tarifs porte les clés.

-- La licence reprend le tarif de l'ancienne prestation « etude » : c'est la
-- même prestation renommée, pas une nouvelle.
update public.tarifs_assistance
   set prestation_key = 'bourse_licence', updated_at = now()
 where pays_slug = 'chine' and prestation_key = 'etude';

-- Le master est créé au même tarif, faute d'un montant distinct communiqué.
-- Le propriétaire l'ajustera depuis /admin/tarifs si les deux diffèrent.
insert into public.tarifs_assistance (pays_slug, prestation_key, prix)
select 'chine', 'bourse_master', prix
  from public.tarifs_assistance
 where pays_slug = 'chine' and prestation_key = 'bourse_licence'
on conflict (pays_slug, prestation_key) do nothing;

-- Foire de Chine : prix inconnu, donc null — « Sur devis ». La colonne accepte
-- null par construction (00043), c'est le mécanisme prévu pour cela.
insert into public.tarifs_assistance (pays_slug, prestation_key, prix)
values ('chine', 'foire', null)
on conflict (pays_slug, prestation_key) do nothing;

comment on table public.tarifs_assistance is
  'Tarifs d''assistance par pays et prestation, pilotables depuis /admin/tarifs. Prix null = « Sur devis ». Depuis le 04/08/2026 les montants sont annoncés au client À TITRE INDICATIF : le dossier ne se règle plus en ligne, le montant définitif est arrêté au rendez-vous.';
