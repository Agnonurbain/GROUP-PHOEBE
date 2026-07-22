-- Phase 6 : Négociation & prix négocié

-- Ajouter les colonnes de négociation
alter table demandes_transport
  add column if not exists prix_negocie numeric(12,2),
  add column if not exists negociation_note text;

-- Élargir le check constraint statut pour inclure 'en_negociation'
alter table demandes_transport drop constraint if exists demandes_transport_statut_check;
alter table demandes_transport add constraint demandes_transport_statut_check
  check (statut in (
    'en_attente_paiement', 'en_attente_validation', 'acceptee',
    'refusee', 'annulee', 'terminee', 'en_negociation'
  ));
