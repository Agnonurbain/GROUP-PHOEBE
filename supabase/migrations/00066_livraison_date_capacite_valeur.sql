-- ─────────────────────────────────────────────────────────────────────────────
-- 00066 — Date de livraison programmée, capacité renommée, valeur déclarée
--
-- Trois corrections où le mot ne correspondait pas à la chose.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Le mode « Programmée » demandait une date qu'on ne collectait pas ────
-- Le libellé promet « vous choisissez la date de livraison » ; le formulaire
-- n'avait pas de champ et la table pas de colonne. Le client payait un créneau
-- qu'il ne pouvait pas indiquer, et l'équipe livrait au jugé.
alter table public.expeditions
  add column if not exists date_souhaitee date;

comment on column public.expeditions.date_souhaitee is
  'Date de livraison demandée. Obligatoire pour le mode « programmee », vide sinon.';

-- Une date est exigée pour ce mode, et interdite ailleurs — sans quoi une date
-- saisie sur un envoi express laisserait croire à un engagement.
alter table public.expeditions drop constraint if exists expeditions_date_programmee_check;

alter table public.expeditions add constraint expeditions_date_programmee_check
  check (
    (mode = 'programmee' and date_souhaitee is not null)
    or (mode <> 'programmee' and date_souhaitee is null)
  ) not valid;

-- `not valid` : les expéditions déjà en base ont été créées sans ce champ, les
-- invalider rétroactivement bloquerait leur mise à jour. La contrainte
-- s'applique aux nouvelles lignes et aux modifications des anciennes.

-- ── 2. La capacité n'est pas journalière ────────────────────────────────────
-- `choisirLivreurAuto` compte les colis aux statuts en cours, sans filtre de
-- date : c'est une charge simultanée. Un livreur qui fait huit courses le matin
-- et les clôture peut en reprendre dix l'après-midi — comportement souhaitable,
-- mais que le nom démentait. L'écran d'admin affichait « capacité par jour »
-- pour quelque chose qui n'en était pas une.
alter table public.livreurs
  rename column capacite_max_par_jour to charge_max_simultanee;

comment on column public.livreurs.charge_max_simultanee is
  'Nombre de colis simultanément en cours au-delà duquel l''affectation automatique passe ce livreur. Ce n''est pas un quota journalier : un colis clôturé libère aussitôt sa place.';

-- ── 3. La valeur déclarée ne promet rien ────────────────────────────────────
-- Elle est demandée, stockée, affichée — et n'entraîne ni assurance, ni plafond
-- d'indemnisation, ni recours en cas de perte. Le commentaire dit ce qu'elle est
-- réellement pour éviter qu'un futur lecteur ne lui prête une portée qu'elle n'a
-- pas. Toute politique d'indemnisation est une décision commerciale, pas une
-- déduction à faire depuis ce champ.
comment on column public.expeditions.valeur_declaree is
  'Valeur déclarée par l''expéditeur, à titre indicatif : sert la priorité de manutention. Ne vaut PAS assurance — aucun plafond d''indemnisation ni recours ne s''y rattache aujourd''hui.';
