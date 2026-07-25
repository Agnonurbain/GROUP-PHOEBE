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

// Grille de prix (FCFA) par zone × mode. Valeurs de départ cohérentes —
// À CONFIRMER avec les tarifs réels de GROUP PHOEBE.
export const TARIFS_LIVRAISON: Record<ZoneLivraison, Record<ModeLivraison, number>> = {
  intracommunale: { standard: 1500, express: 2500, meme_jour: 3500, programmee: 2000 },
  intercommunale: { standard: 2500, express: 4000, meme_jour: 5500, programmee: 3000 },
  nationale: { standard: 5000, express: 8000, meme_jour: 11000, programmee: 6000 },
};

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

/** Prix d'une livraison pour une zone et un mode, ou null si combinaison invalide. */
export function computeLivraisonPrix(zone: string, mode: string): number | null {
  if (!isZoneLivraison(zone) || !isModeLivraison(mode)) return null;
  return TARIFS_LIVRAISON[zone][mode];
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

// ─── Numéro de suivi ─────────────────────────────────────────────────────────
// Format GP-XXXXXXXX (8 caractères sans ambiguïté 0/O, 1/I).
const SUIVI_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function genererNumeroSuivi(): string {
  let code = "";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  for (const b of bytes) code += SUIVI_ALPHABET[b % SUIVI_ALPHABET.length];
  return `GP-${code}`;
}
