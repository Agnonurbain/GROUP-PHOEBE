// Vente de pagnes — source UNIQUE des types, statuts et règles du service.
// Module pur : aucun import serveur, pour que la validation soit la même à
// l'écran et au serveur.
//
// AUCUN PRIX ne figure ici, et c'est le cœur du service. Retour de l'exploitant :
// « il y a tellement de fournisseurs qui les vendent à leur prix […] on ne peut
// pas afficher un prix comme ça. Tu mets plutôt des devis. » Ce n'est pas un
// tarif manquant qu'on finira par renseigner — le marché du pagne n'a pas de
// prix de référence tenable, chaque revendeur fixe le sien.

/** Un type de pagne au catalogue, tel qu'il vient de la base. */
export type TypePagne = {
  cle: string;
  marque: string;
  gamme: string;
  description: string | null;
  ordre: number;
};

/** « Uniwax — Print » */
export function libelleTypePagne(t: TypePagne): string {
  return t.marque === t.gamme ? t.marque : `${t.marque} — ${t.gamme}`;
}

/**
 * Unités de vente.
 *
 * Le pagne se compte au « pagne » — six yards, l'usage courant à Abidjan — mais
 * un client peut vouloir un métrage précis ou des pièces entières.
 */
export const UNITES_PAGNE = ["pagne", "yard", "piece"] as const;
export type UnitePagne = (typeof UNITES_PAGNE)[number];

export const UNITE_LABELS: Record<UnitePagne, string> = {
  pagne: "Pagne (6 yards)",
  yard: "Yard",
  piece: "Pièce entière",
};

export function isUnitePagne(v: unknown): v is UnitePagne {
  return typeof v === "string" && (UNITES_PAGNE as readonly string[]).includes(v);
}

// ─── Cycle d'une demande ─────────────────────────────────────────────────────

export const STATUTS_TEXTILE = [
  "soumise",
  "en_cours_traitement",
  "devis_envoye",
  "confirmee",
  "livree",
  "annulee",
] as const;

export type StatutTextile = (typeof STATUTS_TEXTILE)[number];

export const STATUT_TEXTILE_LABELS: Record<StatutTextile, string> = {
  soumise: "Soumise",
  en_cours_traitement: "En cours de traitement",
  devis_envoye: "Devis envoyé",
  confirmee: "Confirmée",
  livree: "Livrée",
  annulee: "Annulée",
};

/**
 * Transitions autorisées.
 *
 * Un devis refusé ne se rejoue pas en boucle : `devis_envoye` peut revenir en
 * traitement — le client négocie, l'équipe reconsulte — mais une demande
 * `livree` ou `annulee` est terminée. Sans cette borne, une demande livrée
 * pourrait repasser en devis et le montant serait réécrit après coup.
 */
export const TRANSITIONS_TEXTILE: Record<StatutTextile, readonly StatutTextile[]> = {
  soumise: ["en_cours_traitement", "annulee"],
  en_cours_traitement: ["devis_envoye", "annulee"],
  devis_envoye: ["confirmee", "en_cours_traitement", "annulee"],
  confirmee: ["livree", "annulee"],
  livree: [],
  annulee: [],
} as const;

export function isStatutTextile(v: unknown): v is StatutTextile {
  return typeof v === "string" && v in TRANSITIONS_TEXTILE;
}

export function transitionTextileAutorisee(depuis: string, vers: string): boolean {
  if (!isStatutTextile(depuis) || !isStatutTextile(vers)) return false;
  return TRANSITIONS_TEXTILE[depuis].includes(vers);
}

/** Statuts encore ouverts, pour le tri du back-office. */
export const STATUTS_TEXTILE_OUVERTS: StatutTextile[] = [
  "soumise",
  "en_cours_traitement",
  "devis_envoye",
  "confirmee",
];

// ─── Validation d'une demande ────────────────────────────────────────────────

export type DemandeTextileSaisie = {
  typePagne: string;
  motif: string;
  couleurs: string;
  quantite: number;
  unite: string;
};

/**
 * Valide une demande. Fonction pure, appelée par la server action : le
 * formulaire guide, mais rien ne garantit ce qui arrive au serveur.
 *
 * `typesDisponibles` vient de la base : un type retiré du catalogue ne doit
 * plus être demandable, même par un formulaire gardé ouvert dans un onglet.
 */
export function validerDemandeTextile(
  saisie: DemandeTextileSaisie,
  typesDisponibles: string[]
): { error: string } | { ok: true } {
  if (!saisie.typePagne.trim()) {
    return { error: "Choisissez un type de pagne." };
  }
  if (!typesDisponibles.includes(saisie.typePagne)) {
    return { error: "Ce type de pagne n'est plus proposé." };
  }
  if (!isUnitePagne(saisie.unite)) {
    return { error: "Unité de vente invalide." };
  }

  if (!Number.isInteger(saisie.quantite) || saisie.quantite < 1) {
    return { error: "Indiquez une quantité d'au moins 1." };
  }
  // Au-delà, c'est une commande de gros : elle se traite de vive voix, et un
  // formulaire ne rendrait pas service.
  if (saisie.quantite > 10000) {
    return { error: "Au-delà de 10 000, contactez-nous directement : c'est une commande de gros." };
  }

  // Le motif n'est pas obligatoire — un client peut vouloir « ce qui est
  // disponible » — mais s'il en donne un, qu'il tienne dans un champ lisible.
  if (saisie.motif.length > 500) {
    return { error: "Description du motif trop longue (500 caractères maximum)." };
  }
  if (saisie.couleurs.length > 200) {
    return { error: "Description des couleurs trop longue (200 caractères maximum)." };
  }

  return { ok: true };
}
