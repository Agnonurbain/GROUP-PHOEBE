-- La visite se paie en FRAIS, pas en caution.
-- Créée le 2026-07-29.
--
-- Décision métier : demander une visite donne lieu à des frais de visite, dus et
-- non remboursables. Ce n'est pas une caution — rien n'était d'ailleurs jamais
-- restitué : aucun chemin de code ne mettait ce paiement en
-- « remboursement_requis », donc le mot promettait au client une restitution qui
-- n'existait pas.
--
-- Une caution pourra apparaître plus tard, à sa place logique : après accord sur
-- une offre, adossée au paiement qui s'ensuit. Rien n'est prévu ici pour cela.

-- ── Le paramètre change de nom ───────────────────────────────────────────────
alter table public.parametres_immobilier
  rename column caution_visite to frais_visite;

comment on column public.parametres_immobilier.frais_visite is
  'Frais de visite dus par le client, non remboursables. Fixés par le proprietaire.';

-- ── Un type de paiement dédié ───────────────────────────────────────────────
-- « caution » suggère une restitution et fausse la lecture des remboursements.
alter table public.paiements drop constraint if exists paiements_type_check;

alter table public.paiements add constraint paiements_type_check
  check (type in ('montant', 'caution', 'acompte', 'commission', 'frais'));

-- ── Reclassement de l'historique ────────────────────────────────────────────
-- Les paiements de visite déjà encaissés étaient enregistrés en « caution »
-- faute de type adéquat. Portée volontairement étroite : uniquement ceux
-- rattachés à une demande immobilière, pour ne pas toucher aux vraies cautions
-- des autres modules.
update public.paiements
   set type = 'frais'
 where module = 'immobilier'
   and type = 'caution'
   and reference_table = 'demandes_immobilier';
