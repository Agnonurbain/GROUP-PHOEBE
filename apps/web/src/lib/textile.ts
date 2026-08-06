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
 * Un article du catalogue.
 *
 * Aucun prix, pour la même raison que le type qui le porte : montrer une photo
 * avec un montant serait exactement ce que l'exploitant a refusé. Le catalogue
 * montre, il ne chiffre pas.
 */
export type ArticlePagne = {
  id: string;
  typePagne: string;
  reference: string | null;
  nom: string;
  description: string | null;
  couleurs: string | null;
  /** URLs publiques, prêtes à afficher. */
  photos: string[];
  vedette: boolean;
};

/**
 * Filtre le catalogue sur une recherche libre.
 *
 * Le client tape ce qui lui vient — un nom, une couleur, une référence — et
 * n'a pas à savoir dans quel champ ça se trouve. Fonction pure : la recherche
 * se fait dans le navigateur, sans aller-retour serveur à chaque lettre.
 */
export function filtrerArticles(
  articles: ArticlePagne[],
  recherche: string,
  typePagne?: string | null
): ArticlePagne[] {
  const q = recherche.trim().toLowerCase();
  return articles.filter((a) => {
    if (typePagne && a.typePagne !== typePagne) return false;
    if (!q) return true;
    return [a.nom, a.reference, a.couleurs, a.description]
      .filter(Boolean)
      .some((champ) => (champ as string).toLowerCase().includes(q));
  });
}

/**
 * Unités de vente.
 *
 * Le pagne se compte au « pagne » — six yards, l'usage courant à Abidjan — mais
 * un client peut vouloir un métrage précis ou des pièces entières.
 */
/**
 * Les unités dans lesquelles une demande se compte.
 *
 * `balle` est celle du grossiste : « on va vendre en gros et puis vendre en
 * balles » (retour du 05/08/2026). Une demande exprimée en balles ne se chiffre
 * pas comme une demande au détail — d'où l'unité à part, plutôt qu'un nombre de
 * pagnes très élevé qu'il aurait fallu deviner.
 */
export const UNITES_PAGNE = ["pagne", "yard", "piece", "balle"] as const;
export type UnitePagne = (typeof UNITES_PAGNE)[number];

/**
 * Libellés de REPLI, en français.
 *
 * L'affichage passe par `t.textile.unites` : une table de constantes dans un
 * module ne peut pas suivre la langue, et celle-ci s'affichait en français
 * dans un formulaire anglais. Elle reste pour les usages hors interface —
 * notification interne, journal — où la langue du visiteur n'a pas de sens.
 */
export const UNITE_LABELS: Record<UnitePagne, string> = {
  pagne: "Pagne (6 yards)",
  yard: "Yard",
  piece: "Pièce entière",
  balle: "Balle (gros)",
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
  /** Article du catalogue désigné, ou null quand le client décrit. */
  articleId?: string | null;
  motif: string;
  couleurs: string;
  quantite: number;
  unite: string;
  /** Le client déclare acheter pour revendre : le devis se fait au tarif de gros. */
  pourRevente?: boolean;
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
  /**
   * Un plafond de bon sens, pas un refus du gros.
   *
   * Il disait « au-delà de 10 000, c'est une commande de gros » et renvoyait le
   * client vers le téléphone. Depuis le 05/08/2026, le gros EST un métier de la
   * maison : le repousser hors du formulaire reviendrait à fermer la porte à ce
   * qu'on cherche à vendre. Ce qui reste, c'est une garde contre la faute de
   * frappe — et elle se règle sur l'unité, parce que 500 balles et 500 pagnes ne
   * sont pas la même chose.
   */
  const plafond = saisie.unite === "balle" ? 500 : 10000;
  if (saisie.quantite > plafond) {
    return {
      error: `Vérifiez la quantité : au-delà de ${plafond.toLocaleString("fr-FR")}, appelez-nous, nous organiserons l'envoi avec vous.`,
    };
  }

  /**
   * Le motif reste facultatif, catalogue ou pas.
   *
   * Un client qui a choisi un article n'a rien à décrire ; un autre qui n'a
   * rien trouvé décrit. Exiger l'un ou l'autre fermerait un des deux chemins,
   * et c'est précisément ce qu'on veut éviter : le catalogue ajoute une porte,
   * il n'en condamne aucune.
   */
  if (saisie.motif.length > 500) {
    return { error: "Description du motif trop longue (500 caractères maximum)." };
  }
  if (saisie.couleurs.length > 200) {
    return { error: "Description des couleurs trop longue (200 caractères maximum)." };
  }

  return { ok: true };
}
