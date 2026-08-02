// Ces trois délais sont désormais pilotés depuis /admin/tarifs
// (`parametres_transport`, 00074). Ils ne subsistent ici que comme REPLI :
// sans eux, une lecture ratée les rendrait nuls et l'expiration s'appliquerait
// à tout, y compris à une réservation d'hier.
export const DELAI_NON_PRESENTATION_HEURES = 4;
export const DELAI_SANS_REPONSE_HEURES = 2;
export const DELAI_NEGOCIATION_HEURES_DEFAUT = 4;

export const CAT_LABELS: Record<string, string> = {
  leger: "Véhicule léger",
  car: "Car",
  minibus: "Minibus",
};
