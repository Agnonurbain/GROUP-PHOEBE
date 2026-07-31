-- ─────────────────────────────────────────────────────────────────────────────
-- 00062 — `factures.devis` → `devise`
--
-- Coquille de 00059. La colonne porte la monnaie de la facture (XOF), pas un
-- devis : dans un projet où « devis » désigne le chiffrage d'un billet d'avion
-- (`demandes_billet.montant_propose`, statut `devis_envoye`), le faux ami est
-- coûteux — un lecteur du schéma pouvait raisonnablement croire que la facture
-- référençait un devis.
--
-- Aucune écriture applicative ne visait la colonne, et la table est vide.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.factures rename column devis to devise;

comment on column public.factures.devise is
  'Monnaie de la facture (XOF par défaut). Ne pas confondre avec le devis d''un billet d''avion.';
