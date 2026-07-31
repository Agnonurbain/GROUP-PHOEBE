// Tarification et constantes de la livraison de colis (table `expeditions`).
// Source UNIQUE partagée par l'affichage client et le calcul serveur, pour
// garantir montant affiché == montant facturé. Module pur (aucun import serveur).
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

export type GrilleTarifs = Record<ZoneLivraison, Record<ModeLivraison, number>>;

// Grille de prix (FCFA) par zone × mode.
// ⚠️ Ces valeurs sont désormais un REPLI : la source de vérité est la table
// `tarifs_livraison`, éditable par le propriétaire (/admin/tarifs). Elles
// servent de seed (migration 00042) et de secours si la base est injoignable.
export const TARIFS_LIVRAISON: GrilleTarifs = {
  intracommunale: { standard: 1500, express: 2500, meme_jour: 3500, programmee: 2000 },
  intercommunale: { standard: 2500, express: 4000, meme_jour: 5500, programmee: 3000 },
  nationale: { standard: 5000, express: 8000, meme_jour: 11000, programmee: 6000 },
};

// ─── Paliers de poids ────────────────────────────────────────────────────────
// Le prix de base (zone × mode) couvre le premier palier. Au-delà, un
// multiplicateur s'applique : porter 40 kg à Bouaké coûte plus cher que porter
// une enveloppe, et le prix doit le refléter.
// MULTIPLICATEURS À CONFIRMER avec GROUP PHOEBE, comme la grille ci-dessus.

/** Au-delà, l'envoi sort de la grille et passe sur devis. */
export const POIDS_MAX_KG = 50;

export type PalierPoids = {
  /** Borne haute incluse, en kg. */
  maxKg: number;
  multiplicateur: number;
  label: string;
};

// Repli, même logique que TARIFS_LIVRAISON : la source de vérité est la table
// `paliers_poids`.
export const PALIERS_POIDS: PalierPoids[] = [
  { maxKg: 5, multiplicateur: 1, label: "Jusqu'à 5 kg" },
  { maxKg: 15, multiplicateur: 1.5, label: "5 à 15 kg" },
  { maxKg: POIDS_MAX_KG, multiplicateur: 2.5, label: "15 à 50 kg" },
];

/** Poids maximum accepté en ligne : borne haute du dernier palier. */
export function poidsMax(paliers: PalierPoids[] = PALIERS_POIDS): number {
  return paliers.length > 0 ? paliers[paliers.length - 1].maxKg : POIDS_MAX_KG;
}

/** Palier correspondant au poids, ou null au-delà du maximum accepté. */
export function palierPoids(
  poidsKg: number | null | undefined,
  paliers: PalierPoids[] = PALIERS_POIDS
): PalierPoids | null {
  if (paliers.length === 0) return null;
  if (poidsKg === null || poidsKg === undefined) return paliers[0];
  if (!Number.isFinite(poidsKg) || poidsKg <= 0) return null;
  return paliers.find((p) => poidsKg <= p.maxKg) ?? null;
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
export function computeLivraisonPrix(
  zone: string,
  mode: string,
  poidsKg: number | null = null,
  grille: GrilleTarifs = TARIFS_LIVRAISON,
  paliers: PalierPoids[] = PALIERS_POIDS
): number | null {
  if (!isZoneLivraison(zone) || !isModeLivraison(mode)) return null;
  const palier = palierPoids(poidsKg, paliers);
  if (!palier) return null;
  const base = grille[zone]?.[mode];
  if (typeof base !== "number") return null;
  const brut = base * palier.multiplicateur;
  // Arrondi à la centaine : des prix affichables, sans décimales parasites.
  return Math.round(brut / 100) * 100;
}

// ─── Statuts d'une expédition (CHECK de la table expeditions) ─────────────────
export const STATUT_LIVRAISON = {
  creee: "creee",
  priseEnCharge: "prise_en_charge",
  enTransit: "en_transit",
  livree: "livree",
  echecLivraison: "echec_livraison",
} as const;

export const STATUT_LIVRAISON_LABELS: Record<string, string> = {
  creee: "Commande enregistrée",
  prise_en_charge: "Colis pris en charge",
  en_transit: "En transit",
  livree: "Livrée",
  echec_livraison: "Échec de livraison",
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
 * `livree` est terminal. `echec_livraison` ne l'est pas : une seconde
 * présentation est le déroulé normal, pas l'exception.
 */
export const TRANSITIONS_LIVRAISON: Record<StatutLivraison, readonly StatutLivraison[]> = {
  creee: ["prise_en_charge", "echec_livraison"],
  prise_en_charge: ["en_transit", "echec_livraison"],
  en_transit: ["livree", "echec_livraison"],
  livree: [],
  echec_livraison: ["prise_en_charge", "en_transit"],
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
