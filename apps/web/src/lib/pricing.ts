// Tarification d'un véhicule à la location — source UNIQUE partagée par
// l'affichage client (page paiement) et le calcul serveur (checkoutCart), pour
// garantir que le montant affiché == montant facturé.
//
// Reprend la formule canonique de assignerVehiculesGroupe (vehicle-assignment.ts)
// pour la partie location + chauffeur, avec le modèle de caution en POURCENTAGE
// du prix zoné (taux_caution du véhicule) — et non le montant fixe du flux
// opérateur.

export type ZonePricing = {
  coefficient_majoration: number;
  tarif_chauffeur_journalier: number;
  /** "obligatoire" => chauffeur imposé (zones intérieures). */
  chauffeur_statut: string;
  /** Chargé pour cohérence de schéma, non utilisé dans le modèle % de caution. */
  caution_multiplicateur: number;
} | null;

export type ItemPricing = {
  montantLocation: number;
  montantChauffeur: number;
  montant: number;
  caution: number;
  chauffeurObligatoire: boolean;
};

export function computeItemPricing(p: {
  prixJournalier: number;
  /** Taux de caution du véhicule, ex. 0.3 pour 30 %. */
  tauxCaution: number;
  nbJours: number;
  avecChauffeur: boolean;
  zone: ZonePricing;
}): ItemPricing {
  const coeff = p.zone?.coefficient_majoration ?? 1;
  const prixZone = Math.round(p.prixJournalier * coeff);
  const montantLocation = prixZone * p.nbJours;

  const chauffeurObligatoire = p.zone?.chauffeur_statut === "obligatoire";
  const montantChauffeur =
    p.avecChauffeur || chauffeurObligatoire
      ? (p.zone?.tarif_chauffeur_journalier ?? 0) * p.nbJours
      : 0;

  const montant = montantLocation + montantChauffeur;
  const caution = Math.round(montantLocation * p.tauxCaution);

  return { montantLocation, montantChauffeur, montant, caution, chauffeurObligatoire };
}
