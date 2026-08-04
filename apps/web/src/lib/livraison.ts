// Tarification et constantes de la livraison de colis (table `expeditions`).
// Source UNIQUE partagée par l'affichage client et le calcul serveur, pour
// garantir montant affiché == montant facturé. Module pur (aucun import serveur).
//
// Le prix se lit `tarif(zone × moyen) × coefficient(mode)` depuis 00084. La
// grille zone × mode et les paliers de poids qui la pondéraient ont disparu :
// le moyen — le véhicule — dit ce que le poids disait, et les garder tous deux
// facturait deux fois la même réalité.
//
// Les valeurs de `zone`, `mode` et `statut` respectent STRICTEMENT les
// contraintes CHECK de la migration 00001 (table expeditions).

export const ZONES_LIVRAISON = ["intracommunale", "intercommunale", "nationale"] as const;
export const MODES_LIVRAISON = ["standard", "express", "meme_jour", "programmee"] as const;

export type ZoneLivraison = (typeof ZONES_LIVRAISON)[number];
export type ModeLivraison = (typeof MODES_LIVRAISON)[number];

export const ZONE_LABELS: Record<ZoneLivraison, string> = {
  intracommunale: "Même commune",
  intercommunale: "Entre communes (Grand Abidjan)",
  nationale: "National (autres villes)",
};

export const ZONE_DESCRIPTIONS: Record<ZoneLivraison, string> = {
  intracommunale: "Livraison à l'intérieur d'une même commune.",
  intercommunale: "D'une commune à une autre au sein du Grand Abidjan.",
  nationale: "Vers les autres villes de Côte d'Ivoire.",
};

export const MODE_LABELS: Record<ModeLivraison, string> = {
  standard: "Standard",
  express: "Express",
  meme_jour: "Même jour",
  programmee: "Programmée",
};

export const MODE_DESCRIPTIONS: Record<ModeLivraison, string> = {
  standard: "Livraison économique sous 48 à 72h.",
  express: "Livraison prioritaire sous 24h.",
  meme_jour: "Collecte et livraison dans la journée.",
  programmee: "Vous choisissez la date de livraison.",
};

/**
 * Un moyen de livraison : le VÉHICULE, distinct du mode qui est le DÉLAI.
 *
 * Demandé par GROUP PHOEBE : « il y a moto et puis il y a le cargo […] si elle
 * a cliqué sur un cargo, elle aurait 3 types de cargo : petit, moyen, grand ».
 */
export type MoyenLivraison = {
  cle: string;
  label: string;
  /**
   * Regroupement affiché au client. Volontairement LIBRE : l'exploitant ajoute
   * d'autres types de moyens — un fourgon, un camion — sans déploiement. Une
   * union fermée aurait obligé à livrer du code pour vendre un service.
   */
  famille: string;
  /** Charge utile. N'entre pas dans le prix : écarte les moyens trop justes. */
  chargeMaxKg: number;
  ordre: number;
};

/** Coefficient par mode, piloté depuis /admin/tarifs. */
export type CoefficientsMode = Partial<Record<ModeLivraison, number>>;

/** Prix de base par zone et par moyen : { [zone]: { [moyenCle]: prix } }. */
export type GrilleMoyens = Record<string, Record<string, number>>;

/**
 * Le poids maximum accepté en ligne : celui du plus gros moyen actif.
 *
 * Il venait du dernier palier de poids, qui ne décrivait rien de physique. Un
 * plafond doit dire ce que la flotte porte, pas où s'arrêtait une grille.
 */
export function chargeMaxFlotte(moyens: MoyenLivraison[]): number {
  if (moyens.length === 0) return 0;
  return Math.max(...moyens.map((m) => m.chargeMaxKg));
}

/**
 * Le moyen le plus léger capable de porter ce colis.
 *
 * Sert à guider le client, pas à décider pour lui : il peut prendre plus gros
 * s'il veut, jamais plus petit.
 */
export function moyensPossibles(
  poidsKg: number | null,
  moyens: MoyenLivraison[]
): MoyenLivraison[] {
  const tries = [...moyens].sort((a, b) => a.ordre - b.ordre);
  if (poidsKg === null || !Number.isFinite(poidsKg) || poidsKg <= 0) return tries;
  return tries.filter((m) => poidsKg <= m.chargeMaxKg);
}

/**
 * Prix d'une livraison : `tarif(zone × moyen) × coefficient(mode)`.
 *
 * Le poids ne figure plus dans le calcul — décision de l'exploitant, le moyen
 * l'a remplacé. Les garder tous deux aurait facturé deux fois la même réalité :
 * on prend un cargo PARCE QUE le colis est lourd.
 */
export function computeLivraisonPrixMoyen(
  zone: string,
  moyenCle: string,
  mode: string,
  grille: GrilleMoyens,
  coefficients: CoefficientsMode
): number | null {
  if (!isZoneLivraison(zone) || !isModeLivraison(mode)) return null;
  const base = grille[zone]?.[moyenCle];
  if (typeof base !== "number" || !Number.isFinite(base)) return null;

  // Coefficient absent : on facture le tarif de base plutôt que rien. Un prix
  // nul afficherait « gratuit » là où il manque seulement un réglage.
  const coef = coefficients[mode] ?? 1;
  if (!Number.isFinite(coef) || coef <= 0) return null;

  // Deux arrondis, et l'ordre compte. `1500 × 2.3` vaut 3449,999… en virgule
  // flottante : diviser d'abord donnerait 34,499… puis 3 400, soit 100 F de
  // moins que l'arrondi honnête. On referme le produit avant de l'arrondir à
  // la centaine.
  const brut = Math.round(base * coef);
  return Math.round(brut / 100) * 100;
}

export function isZoneLivraison(v: string): v is ZoneLivraison {
  return (ZONES_LIVRAISON as readonly string[]).includes(v);
}

export function isModeLivraison(v: string): v is ModeLivraison {
  return (MODES_LIVRAISON as readonly string[]).includes(v);
}

// Commune résolue (depuis la table communes) ou null si l'adresse ne correspond
// à aucune commune connue (ville de l'intérieur non répertoriée).
export type CommuneMatch = { id: string; zoneId: string | null } | null;

// Déduit la zone livraison du couple (collecte, livraison) :
//   même commune          → intracommunale
//   même zone tarifaire    → intercommunale (ex. deux communes du Grand Abidjan)
//   sinon / non répertoriée → nationale
export function deriverZoneLivraison(
  collecte: CommuneMatch,
  livraison: CommuneMatch
): ZoneLivraison {
  if (collecte && livraison) {
    if (collecte.id === livraison.id) return "intracommunale";
    if (collecte.zoneId && livraison.zoneId && collecte.zoneId === livraison.zoneId) {
      return "intercommunale";
    }
  }
  return "nationale";
}

/**
 * Prix d'une livraison : base (zone × mode) × multiplicateur du palier de poids.
 * `null` si la combinaison est invalide ou si le poids dépasse POIDS_MAX_KG
 * (l'envoi passe alors sur devis).
 * Poids omis => premier palier, ce qui donne le tarif « à partir de ».
 */
export const STATUT_LIVRAISON = {
  creee: "creee",
  priseEnCharge: "prise_en_charge",
  enTransit: "en_transit",
  livree: "livree",
  echecLivraison: "echec_livraison",
  annulee: "annulee",
} as const;

export const STATUT_LIVRAISON_LABELS: Record<string, string> = {
  creee: "Commande enregistrée",
  prise_en_charge: "Colis pris en charge",
  en_transit: "En transit",
  livree: "Livrée",
  echec_livraison: "Échec de livraison",
  annulee: "Annulée",
};

export type StatutLivraison = (typeof STATUT_LIVRAISON)[keyof typeof STATUT_LIVRAISON];

/**
 * Transitions autorisées.
 *
 * Le cycle était libre : n'importe quel statut valide vers n'importe quel autre.
 * On pouvait faire repasser un colis livré en « enregistrée », ou sauter de
 * « enregistrée » à « livrée » sans transit. Chaque changement écrivant une
 * ligne d'historique (trigger `expedition_statut_log`), la timeline publique
 * pouvait afficher une chronologie impossible — et c'est la seule chose qu'un
 * client voit.
 *
 * `livree` et `annulee` sont terminaux. `echec_livraison` ne l'est pas : une
 * seconde présentation est le déroulé normal, pas l'exception.
 */
export const TRANSITIONS_LIVRAISON: Record<StatutLivraison, readonly StatutLivraison[]> = {
  creee: ["prise_en_charge", "echec_livraison", "annulee"],
  prise_en_charge: ["en_transit", "echec_livraison"],
  en_transit: ["livree", "echec_livraison"],
  livree: [],
  echec_livraison: ["prise_en_charge", "en_transit"],
  // Terminal, et volontairement distinct de `echec_livraison` : reprendre un
  // échec est le déroulé normal, reprendre une annulation est un contresens.
  annulee: [],
} as const;

export function isStatutLivraison(v: unknown): v is StatutLivraison {
  return typeof v === "string" && v in TRANSITIONS_LIVRAISON;
}

export function transitionAutorisee(depuis: string, vers: string): boolean {
  if (!isStatutLivraison(depuis) || !isStatutLivraison(vers)) return false;
  return TRANSITIONS_LIVRAISON[depuis].includes(vers);
}

// ─── Zone de couverture d'un livreur ─────────────────────────────────────────
// `livreurs.zone_couverture` était comparée par égalité stricte à
// `expeditions.zone`, qui vaut `intracommunale` | `intercommunale` |
// `nationale` : une classe de trajet, pas un territoire. Personne ne « couvre
// l'intercommunal ». Le champ n'étant renseigné nulle part, le filtre laissait
// tout le monde passer — il marchait par accident, et y écrire « Cocody »
// aurait rendu le livreur inéligible à tout, en silence.
//
// La zone est désormais la liste des communes desservies, comparée à la
// commune de collecte du colis.

/** Normalise pour comparer : casse, accents et espaces parasites ignorés. */
function normaliserCommune(v: string): string {
  return v
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function parseZoneCouverture(zone: string | null | undefined): string[] {
  if (!zone) return [];
  return zone
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

/**
 * Un livreur sans zone dessert tout : c'est le cas par défaut, et le seul qui
 * garantisse qu'un colis trouve preneur tant que personne n'a paramétré les
 * couvertures.
 */
export function couvreLaCommune(
  zoneCouverture: string | null | undefined,
  commune: string | null | undefined
): boolean {
  const communes = parseZoneCouverture(zoneCouverture);
  if (communes.length === 0) return true;
  if (!commune) return false;
  const cible = normaliserCommune(commune);
  return communes.some((c) => normaliserCommune(c) === cible);
}

/** Statuts sur lesquels le livreur a encore quelque chose à faire. */
export const STATUTS_ACTIFS_LIVREUR: readonly StatutLivraison[] = [
  "creee",
  "prise_en_charge",
  "en_transit",
  "echec_livraison",
] as const;

// ─── Numéro de suivi ─────────────────────────────────────────────────────────
// Format GP-XXXXXXXX (8 caractères sans ambiguïté 0/O, 1/I).
const SUIVI_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function genererNumeroSuivi(): string {
  let code = "";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  for (const b of bytes) code += SUIVI_ALPHABET[b % SUIVI_ALPHABET.length];
  return `GP-${code}`;
}
