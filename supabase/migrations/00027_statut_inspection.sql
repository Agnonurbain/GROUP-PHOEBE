-- Add returned_pending_inspection status to demandes_transport
ALTER TABLE demandes_transport DROP CONSTRAINT IF EXISTS demandes_transport_statut_check;

ALTER TABLE demandes_transport ADD CONSTRAINT demandes_transport_statut_check
  CHECK (statut IN (
    'en_attente_paiement', 'en_attente_validation', 'acceptee',
    'en_cours', 'refusee', 'annulee', 'terminee', 'en_negociation',
    'retour_en_inspection'
  ));
