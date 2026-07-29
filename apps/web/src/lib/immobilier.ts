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
  "contre_offre",
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
  contre_offre: "Contre-offre envoyée",
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

/**
 * Créneau de visite en français, date et heure. Source unique : le même libellé
 * part dans la notification au client et s'affiche dans « Mes réservations ».
 */
export function formaterCreneau(creneau: string | Date): string {
  const d = typeof creneau === "string" ? new Date(creneau) : creneau
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ─── Paramètres immobilier (table parametres_immobilier) ─────────────────────

export type ParametresImmobilier = {
  frais_visite: number
  taux_max_reduction: number
  max_offres_client: number
}

export const PARAMETRES_IMMO_DEFAUT: ParametresImmobilier = {
  frais_visite: 50000,
  taux_max_reduction: 10,
  max_offres_client: 3,
}

export const STATUTS_DEMANDE_VISITE_ACTIFS = ["en_attente", "en_cours_traitement", "visite_programmee", "acceptee"] as const

// Une offre en attente de réponse du client compte toujours dans son quota.
export const STATUTS_DEMANDE_OFFRE_ACTIFS = ["en_attente", "offre_soumise", "en_cours_traitement", "contre_offre", "acceptee"] as const

// ─── Contre-offre (propriétaire → acheteur) ──────────────────────────────────

// Statuts depuis lesquels le propriétaire peut encore contre-offrir : une
// demande déjà acceptée, refusée ou finalisée est close.
export const STATUTS_CONTRE_OFFRE_POSSIBLE = ["en_attente", "en_cours_traitement", "offre_soumise", "contre_offre"] as const

/**
 * Plancher d'une contre-offre : le propriétaire fixe librement son prix, mais
 * `taux_max_reduction` borne la remise qu'il s'autorise sur le prix affiché.
 * Le paramètre n'avait aucun effet avant la contre-offre — c'est ici qu'il agit.
 */
export function plancherContreOffre(prixBien: number, tauxMaxReduction: number): number {
  return Math.ceil(prixBien * (1 - tauxMaxReduction / 100))
}

/**
 * Valide un montant de contre-offre. Fonction pure : la server action s'en sert
 * pour refuser, l'admin pour afficher la fourchette autorisée.
 */
export function validerContreOffre(params: {
  montant: number
  montantOffre: number
  prixBien: number
  tauxMaxReduction: number
}): { error: string } | { plancher: number } {
  const { montant, montantOffre, prixBien, tauxMaxReduction } = params
  const plancher = plancherContreOffre(prixBien, tauxMaxReduction)

  if (!Number.isFinite(montant) || montant <= 0) {
    return { error: "Le montant de la contre-offre doit être un montant positif." }
  }
  if (montantOffre >= prixBien) {
    return { error: "L'offre du client atteint déjà le prix affiché : acceptez-la plutôt que de contre-offrir." }
  }
  if (montant <= montantOffre) {
    return {
      error: `La contre-offre doit dépasser l'offre du client (${montantOffre.toLocaleString("fr-FR")} FCFA). En dessous, acceptez l'offre.`,
    }
  }
  if (montant > prixBien) {
    return {
      error: `La contre-offre ne peut pas dépasser le prix affiché (${prixBien.toLocaleString("fr-FR")} FCFA).`,
    }
  }
  if (montant < plancher) {
    return {
      error: `Remise trop forte : avec un maximum de ${tauxMaxReduction} %, la contre-offre ne peut pas descendre sous ${plancher.toLocaleString("fr-FR")} FCFA.`,
    }
  }
  return { plancher }
}
