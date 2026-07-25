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
