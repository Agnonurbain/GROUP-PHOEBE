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
  "visite_realisee",
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
  visite_realisee: "Visite réalisée",
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
  /** Commission GROUP PHOEBE en %, appliquée au montant convenu. */
  taux_commission: number
}

export const PARAMETRES_IMMO_DEFAUT: ParametresImmobilier = {
  frais_visite: 50000,
  taux_max_reduction: 10,
  max_offres_client: 3,
  taux_commission: 10,
}

// ─── Commission d'intermédiation ─────────────────────────────────────────────

/**
 * Part GROUP PHOEBE sur une transaction. Les biens appartiennent à des
 * propriétaires tiers : la plateforme prélève un pourcentage du montant convenu,
 * dû dès l'acceptation de l'offre.
 *
 * Arrondi à l'unité : le FCFA n'a pas de subdivision en circulation.
 */
export function calculerCommission(montantConvenu: number, tauxCommission: number): number {
  if (!Number.isFinite(montantConvenu) || montantConvenu <= 0) return 0
  if (!Number.isFinite(tauxCommission) || tauxCommission <= 0) return 0
  return Math.round(montantConvenu * (tauxCommission / 100))
}

// ─── Location ────────────────────────────────────────────────────────────────

/**
 * Pour un bien en location, `montant_convenu` s'entend comme le loyer mensuel.
 * Cette distinction n'existait pas : le registre affichait un montant sans dire
 * s'il s'agissait d'un loyer ou d'un prix de vente.
 */
export function estLocation(transaction: string): boolean {
  return transaction === "location"
}

/** Libellé de la période de location, ou null si elle n'est pas renseignée. */
export function formaterPeriodeLocation(
  debut: string | null,
  dureeMois: number | null
): string | null {
  if (!debut && !dureeMois) return null
  const parts: string[] = []
  if (debut) {
    const d = new Date(debut)
    if (!Number.isNaN(d.getTime())) {
      parts.push(`à partir du ${d.toLocaleDateString("fr-FR")}`)
    }
  }
  if (dureeMois) parts.push(`${dureeMois} mois`)
  return parts.length > 0 ? parts.join(" · ") : null
}

export const STATUTS_DEMANDE_VISITE_ACTIFS = ["en_attente", "en_cours_traitement", "visite_programmee", "acceptee"] as const

// Une offre en attente de réponse du client compte toujours dans son quota.
export const STATUTS_DEMANDE_OFFRE_ACTIFS = ["en_attente", "offre_soumise", "en_cours_traitement", "contre_offre", "acceptee"] as const


/**
 * Transitions autorisées d'une demande immobilière.
 *
 * Le cycle était libre : n'importe lequel des neuf statuts menait à n'importe
 * quel autre. Ce n'était pas théorique — une demande `refusee`, y compris close
 * automatiquement parce qu'un concurrent avait emporté le bien, pouvait repasser
 * à `acceptee`. Le contrôle du bien laissait passer (`reserve` est accepté, et
 * c'est justement l'état où le gagnant l'a mis), le prix du perdant se figeait,
 * une commission se calculait, et `cloturerConcurrentes` ne refermait pas le
 * vrai gagnant puisque `acceptee` ne figure pas dans les statuts qu'elle balaie.
 * Deux acquéreurs engagés sur un même bien, deux prix arrêtés, deux commissions.
 *
 * `finalisee`, `refusee` et `annulee` sont terminaux : rouvrir une affaire close
 * suppose une nouvelle demande, pas la réanimation de l'ancienne.
 */
export const TRANSITIONS_DEMANDE_IMMO: Record<StatutDemande, readonly StatutDemande[]> = {
  en_attente: ["en_cours_traitement", "visite_programmee", "offre_soumise", "refusee", "annulee"],
  en_cours_traitement: ["visite_programmee", "offre_soumise", "contre_offre", "acceptee", "refusee", "annulee"],
  visite_programmee: ["visite_realisee", "en_cours_traitement", "offre_soumise", "refusee", "annulee"],
  // Après une visite, le client peut faire une offre : c'est le parcours nominal.
  visite_realisee: ["offre_soumise", "en_cours_traitement", "annulee"],
  offre_soumise: ["contre_offre", "acceptee", "refusee", "annulee"],
  contre_offre: ["acceptee", "offre_soumise", "refusee", "annulee"],
  // Une affaire conclue ne se dénoue que par un abandon explicite, jamais par
  // un retour en négociation : le prix est figé et la commission calculée.
  acceptee: ["finalisee", "annulee"],
  refusee: [],
  annulee: [],
  finalisee: [],
} as const;

export function transitionDemandeAutorisee(depuis: string, vers: string): boolean {
  if (!isStatutDemande(depuis) || !isStatutDemande(vers)) return false;
  return TRANSITIONS_DEMANDE_IMMO[depuis].includes(vers);
}

/**
 * Transitions d'une visite.
 *
 * `proposee` attendait une réponse que personne ne pouvait donner : seul un
 * opérateur passait à `confirmee`, si bien qu'il « confirmait » un rendez-vous
 * que le client n'avait jamais accepté — alors qu'il a payé des frais de visite
 * non remboursables. Le client peut désormais accepter ou décliner, et un
 * créneau décliné revient au staff pour reprogrammation.
 */
export const TRANSITIONS_VISITE: Record<StatutVisite, readonly StatutVisite[]> = {
  proposee: ["confirmee", "annulee"],
  confirmee: ["realisee", "annulee"],
  // Une visite annulée se reprogramme : c'est le déroulé normal quand un
  // créneau ne convient pas.
  annulee: ["proposee"],
  realisee: [],
} as const;

export function transitionVisiteAutorisee(depuis: string, vers: string): boolean {
  if (!isStatutVisite(depuis) || !isStatutVisite(vers)) return false;
  return TRANSITIONS_VISITE[depuis].includes(vers);
}

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
