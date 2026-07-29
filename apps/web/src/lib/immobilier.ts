// Libellés immobilier — source unique (listing + page détail).
// Aligné sur les contraintes CHECK de la table biens.

export const STATUT_BIEN_LABELS: Record<string, string> = {
  disponible: "Disponible",
  reserve: "Réservé",
  loue: "Loué",
  vendu: "Vendu",
  indisponible: "Indisponible",
};

export const TYPE_BIEN_LABELS: Record<string, string> = {
  terrain: "Terrain",
  maison: "Maison",
  appartement: "Appartement",
  bureau: "Bureau",
};

export const TRANSACTION_LABELS: Record<string, string> = {
  vente: "À vendre",
  location: "À louer",
};

export function statutBienBadgeVariant(statut: string): "green" | "gold" | "blue" {
  if (statut === "disponible") return "green";
  if (statut === "vendu" || statut === "loue") return "gold";
  return "blue";
}

export function statutBienLabel(statut: string): string {
  return STATUT_BIEN_LABELS[statut] ?? statut;
}

export function typeBienLabel(type: string): string {
  return TYPE_BIEN_LABELS[type] ?? type;
}

// ─── Demandes immobilières (table demandes_immobilier) ───────────────────────

export const TYPES_DEMANDE = ["information", "visite", "offre"] as const;
export type TypeDemande = (typeof TYPES_DEMANDE)[number];

export const TYPE_DEMANDE_LABELS: Record<string, string> = {
  information: "Demande d'information",
  visite: "Réserver une visite",
  offre: "Faire une offre",
};

export function isTypeDemande(v: string): v is TypeDemande {
  return (TYPES_DEMANDE as readonly string[]).includes(v);
}

export const STATUTS_DEMANDE = [
  "en_attente",
  "en_cours_traitement",
  "visite_programmee",
  "offre_soumise",
  "acceptee",
  "refusee",
  "annulee",
  "finalisee",
] as const;

export type StatutDemande = (typeof STATUTS_DEMANDE)[number];

export const STATUT_DEMANDE_LABELS: Record<string, string> = {
  en_attente: "En attente",
  en_cours_traitement: "En cours de traitement",
  visite_programmee: "Visite programmée",
  offre_soumise: "Offre soumise",
  acceptee: "Acceptée",
  refusee: "Refusée",
  annulee: "Annulée",
  finalisee: "Finalisée",
};

export function isStatutDemande(v: string): v is StatutDemande {
  return (STATUTS_DEMANDE as readonly string[]).includes(v);
}

// ─── Visites (table visites) ─────────────────────────────────────────────────

export const STATUTS_VISITE = [
  "proposee",
  "confirmee",
  "realisee",
  "annulee",
] as const;

export type StatutVisite = (typeof STATUTS_VISITE)[number];

export const STATUT_VISITE_LABELS: Record<string, string> = {
  proposee: "Proposée",
  confirmee: "Confirmée",
  realisee: "Réalisée",
  annulee: "Annulée",
};

export const STATUT_VISITE_COLORS: Record<string, string> = {
  proposee: "bg-blue-50 text-blue-700",
  confirmee: "bg-phoebe-green/10 text-phoebe-green-deep",
  realisee: "bg-phoebe-anthracite/10 text-phoebe-anthracite",
  annulee: "bg-error/10 text-error",
};

export function isStatutVisite(v: string): v is StatutVisite {
  return (STATUTS_VISITE as readonly string[]).includes(v);
}
