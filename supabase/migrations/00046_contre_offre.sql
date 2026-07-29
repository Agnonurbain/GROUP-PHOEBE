-- Colonne pour le montant de la contre-offre (proprietaire → acheteur)
alter table demandes_immobilier
  add column montant_contre_offre numeric(14,2);
