-- ─────────────────────────────────────────────────────────────────────────────
-- 00067 — Une annulation n'est pas un échec de livraison
--
-- L'annulation par le client réutilisait `echec_livraison` avec le motif
-- « Annulée par le client », pour ne pas ajouter un sixième statut. Économie de
-- façade : les deux situations n'ont ni les mêmes suites ni la même lecture.
--
-- 1. Le colis restait sur l'écran du livreur — `echec_livraison` fait partie des
--    statuts actifs, et l'annulation ne le désaffectait pas. Un livreur pouvait
--    reprendre et livrer un colis annulé, dont le paiement était déjà marqué
--    remboursable.
-- 2. `echec_livraison → prise_en_charge` est une transition autorisée : reprendre
--    un échec est le déroulé normal. Sur une annulation, c'est un contresens.
-- 3. Le taux d'échec du tableau de bord comptait les annulations : la mesure
--    censée juger la performance de livraison était polluée par des décisions
--    de clients.
-- 4. La clôture d'échec pouvait rejouer sur une annulation. Le pire cas : un
--    paiement passé en `remboursement_requis` par l'annulation était relu par
--    `cloturerEchecLivraison`, qui ne le voyant pas en `capture` le basculait en
--    `echoue` — le remboursement disparaissait de la file, sans bruit, et le
--    client n'était jamais remboursé.
-- 5. `echec_motif` portait « Annulée par le client » là où il doit dire pourquoi
--    une remise a échoué.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.expeditions drop constraint if exists expeditions_statut_check;

alter table public.expeditions add constraint expeditions_statut_check
  check (statut in (
    'creee', 'prise_en_charge', 'en_transit', 'livree', 'echec_livraison', 'annulee'
  ));

comment on column public.expeditions.statut is
  'Cycle du colis. `annulee` est terminal et distinct de `echec_livraison` : une annulation n''est pas une tentative de remise ratée, elle ne se reprend pas et ne compte pas dans le taux d''échec.';

-- Reprise : les annulations déjà enregistrées sous `echec_livraison` portent le
-- motif posé par l'action. Aucune autre ne peut correspondre, le libellé étant
-- écrit par le code et non saisi.
update public.expeditions
   set statut = 'annulee',
       echec_motif = null,
       livreur_id = null
 where statut = 'echec_livraison'
   and echec_motif = 'Annulée par le client';
