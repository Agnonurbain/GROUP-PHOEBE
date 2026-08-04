// Assistance voyages & études — source UNIQUE des pays, prestations et contenu.
// Partagée par la page d'accueil assistance, la fiche pays et le serveur, pour
// que le prix affiché corresponde à ce que l'équipe facturera. Module pur.
//
// Contenu fourni par GROUP PHOEBE (notes vocales du 26/07/2026). Les prix Europe
// ne sont pas encore communiqués → prix `null` = « Sur devis ».

// Type porté par la table dossiers_voyage (CHECK : 'etudes' | 'tourisme_visa').
export type TypeDossier = "etudes" | "tourisme_visa";

// ─── Pièces d'un dossier ──────────────────────────────────────────────────────
// Déclarées ici parce que chaque prestation dit elle-même ce qu'elle exige : la
// liste était auparavant la même pour tout le monde, alors qu'un Schengen
// demande deux pièces et une bourse d'études six.
export const TYPES_DOCUMENT = [
  "passeport",
  "photo_identite",
  "bac",
  "diplome_licence",
  "releve_notes",
  "casier_judiciaire",
  "lettre_motivation",
  "acte_naissance",
  "diplome",
  "releve_bancaire",
  "attestation_travail",
  "autre",
] as const;

export type TypeDocument = (typeof TYPES_DOCUMENT)[number];

export const TYPE_DOCUMENT_LABELS: Record<TypeDocument, string> = {
  passeport: "Passeport",
  photo_identite: "Photos d'identité",
  bac: "Baccalauréat",
  diplome_licence: "Diplôme de licence",
  releve_notes: "Relevés de notes",
  casier_judiciaire: "Casier judiciaire",
  lettre_motivation: "Lettre de motivation",
  acte_naissance: "Acte de naissance",
  diplome: "Diplôme",
  releve_bancaire: "Relevé bancaire",
  attestation_travail: "Attestation de travail",
  autre: "Autre pièce",
};

// Une prestation facturable pour un pays (ex. bourse licence, visa foire).
export type Prestation = {
  key: string;
  name: string;
  type: TypeDossier;
  prix: number | null; // null => « Sur devis »
  description?: string;
  recommended?: boolean;
  /** Pièces à fournir, annoncées au client avant qu'il postule. */
  pieces: TypeDocument[];
};

/**
 * Ce que GROUP PHOEBE s'engage — et ne s'engage pas — à faire.
 *
 * Demandé explicitement par l'exploitant : « c'est l'ambassade qui donne le
 * visa. On t'assiste, on t'aide à monter le dossier, mais on ne garantit pas le
 * visa à 100 %. » Un client qui paie une assistance sans avoir lu cela peut
 * croire qu'il achète le visa lui-même.
 */
export const MENTION_VISA_NON_GARANTI =
  "L'obtention du visa ne dépend pas de nous : elle relève de l'ambassade ou du consulat, seuls habilités à l'accorder. Notre assistance porte sur le montage et le suivi de votre dossier, pour mettre toutes les chances de votre côté. Elle ne garantit pas la délivrance du visa.";

/** Pièces d'un visa court : ce que GROUP PHOEBE demande, ni plus ni moins. */
const PIECES_VISA_COURT: TypeDocument[] = ["passeport", "photo_identite"];

/** Pièces communes aux deux niveaux de bourse d'études. */
const PIECES_BOURSE_COMMUNES: TypeDocument[] = [
  "releve_notes",
  "photo_identite",
  "casier_judiciaire",
  "lettre_motivation",
  "passeport",
];

export type Etape = { titre: string; detail?: string };

export type Bourse = {
  code: string;
  nom: string;
  inclus: string;
  note?: string;
};

export type Pays = {
  slug: string;
  name: string;
  flag: string;
  categorie: "etudes" | "voyage";
  resume: string;
  prestations: Prestation[];
  procedure?: Etape[];
  bourses?: Bourse[];
  rentrees?: string;
  depots?: string;
};

export const PAYS: Record<string, Pays> = {
  // ─── Études ────────────────────────────────────────────────────────────────
  chine: {
    slug: "chine",
    name: "Chine",
    flag: "🇨🇳",
    categorie: "etudes",
    resume:
      "Deux niveaux de bourse — licence et master — ainsi que les visas tourisme, affaires et foire. Nous accompagnons tout le parcours, du choix des universités au dépôt du dossier de visa.",
    prestations: [
      // Deux bourses distinctes, et non une seule prestation « étude » : le
      // niveau change les pièces exigées, et c'est ce que le candidat vient
      // vérifier avant de postuler.
      {
        key: "bourse_licence",
        name: "Bourse d'études — Licence",
        type: "etudes",
        prix: 1_800_000,
        recommended: true,
        description:
          "Parcours complet : choix des universités, négociation de la bourse (type A ou B), admission, formulaire JW202 et visa étudiant.",
        pieces: ["bac", ...PIECES_BOURSE_COMMUNES],
      },
      {
        key: "bourse_master",
        name: "Bourse d'études — Master",
        type: "etudes",
        // Montant communiqué par GROUP PHOEBE le 04/08/2026. Il valait celui de
        // la licence tant qu'il n'avait pas été donné — une hypothèse, pas un
        // tarif.
        prix: 2_000_000,
        description:
          "Même accompagnement que la licence, pour une candidature en master : universités, bourse, admission, JW202 et visa étudiant.",
        pieces: ["diplome_licence", ...PIECES_BOURSE_COMMUNES],
      },
      {
        key: "tourisme",
        name: "Visa tourisme / visite",
        type: "tourisme_visa",
        prix: 500_000,
        description: "Assistance complète pour un visa de visite en Chine.",
        pieces: PIECES_VISA_COURT,
      },
      {
        key: "affaires",
        name: "Visa affaires",
        type: "tourisme_visa",
        prix: 750_000,
        description: "Assistance pour un visa d'affaires en Chine.",
        pieces: PIECES_VISA_COURT,
      },
      {
        // La foire de Canton : un déplacement commercial court, distinct d'un
        // visa d'affaires classique. Tarif non communiqué à ce jour.
        key: "foire",
        name: "Visa foire de Chine",
        type: "tourisme_visa",
        prix: null,
        description:
          "Assistance pour un visa dédié à la foire de Chine (salon de Canton).",
        pieces: PIECES_VISA_COURT,
      },
    ],
    procedure: [
      { titre: "Choix de plusieurs universités", detail: "Sélection d'universités adaptées à votre profil et à votre projet." },
      { titre: "Négociation de la bourse", detail: "Négociation d'une bourse de type A ou de type B auprès des universités." },
      { titre: "Pré-admission", detail: "Obtention de la pré-admission liée à la bourse." },
      { titre: "Admission", detail: "Confirmation de l'admission par l'université retenue." },
      { titre: "Formulaire JW202", detail: "Délivrance du JW202, pièce officielle requise pour le visa étudiant." },
      { titre: "Visa étude", detail: "Constitution et dépôt du dossier de visa étudiant." },
    ],
    bourses: [
      { code: "A", nom: "Bourse type A", inclus: "Hébergement et scolarité pris en charge." },
      {
        code: "B",
        nom: "Bourse type B",
        inclus: "Scolarité uniquement.",
        note: "Hébergement à la charge de l'étudiant — environ 150 000 à 350 000 FCFA selon le standing.",
      },
    ],
    rentrees: "Deux rentrées par an : mars et septembre.",
    depots: "Périodes de dépôt des dossiers : novembre et avril.",
  },

  // ─── Voyage / Schengen ──────────────────────────────────────────────────────
  norvege: {
    slug: "norvege",
    name: "Norvège",
    flag: "🇳🇴",
    categorie: "voyage",
    resume: "Assistance pour votre visa Schengen à destination de la Norvège.",
    prestations: [
      {
        key: "visa",
        name: "Visa Schengen (tourisme)",
        type: "tourisme_visa",
        prix: null,
        pieces: PIECES_VISA_COURT,
      },
    ],
  },
  france: {
    slug: "france",
    name: "France",
    flag: "🇫🇷",
    categorie: "voyage",
    resume: "Assistance pour votre visa Schengen à destination de la France.",
    prestations: [
      {
        key: "visa",
        name: "Visa Schengen (tourisme)",
        type: "tourisme_visa",
        prix: null,
        pieces: PIECES_VISA_COURT,
      },
    ],
  },
  italie: {
    slug: "italie",
    name: "Italie",
    flag: "🇮🇹",
    categorie: "voyage",
    resume: "Assistance pour votre visa Schengen à destination de l'Italie.",
    prestations: [
      {
        key: "visa",
        name: "Visa Schengen (tourisme)",
        type: "tourisme_visa",
        prix: null,
        pieces: PIECES_VISA_COURT,
      },
    ],
  },
  portugal: {
    slug: "portugal",
    name: "Portugal",
    flag: "🇵🇹",
    categorie: "voyage",
    resume: "Assistance pour votre visa Schengen à destination du Portugal.",
    prestations: [
      {
        key: "visa",
        name: "Visa Schengen (tourisme)",
        type: "tourisme_visa",
        prix: null,
        pieces: PIECES_VISA_COURT,
      },
    ],
  },
  grece: {
    slug: "grece",
    name: "Grèce",
    flag: "🇬🇷",
    categorie: "voyage",
    resume: "Assistance pour votre visa Schengen à destination de la Grèce.",
    prestations: [
      {
        key: "visa",
        name: "Visa Schengen (tourisme)",
        type: "tourisme_visa",
        prix: null,
        pieces: PIECES_VISA_COURT,
      },
    ],
  },
};

export const PAYS_LIST: Pays[] = Object.values(PAYS);

// ─── Tarifs pilotés depuis /admin/tarifs (table tarifs_assistance) ───────────
// Les prix ci-dessus deviennent un REPLI : la source de vérité est la base.
// Forme : { [paysSlug]: { [prestationKey]: prix | null } }, null = « Sur devis ».

export type TarifsAssistance = Record<string, Record<string, number | null>>;

/** Applique les tarifs de la base à un pays. Fonction pure. */
export function appliquerTarifs(pays: Pays, tarifs: TarifsAssistance): Pays {
  const parPrestation = tarifs[pays.slug];
  if (!parPrestation) return pays;
  return {
    ...pays,
    prestations: pays.prestations.map((p) =>
      p.key in parPrestation ? { ...p, prix: parPrestation[p.key] } : p
    ),
  };
}

/** Idem sur une liste de pays. */
export function appliquerTarifsListe(liste: Pays[], tarifs: TarifsAssistance): Pays[] {
  return liste.map((p) => appliquerTarifs(p, tarifs));
}

export function getPays(slug: string, tarifs?: TarifsAssistance): Pays | null {
  const pays = PAYS[slug] ?? null;
  if (!pays) return null;
  return tarifs ? appliquerTarifs(pays, tarifs) : pays;
}

export function getPrestation(pays: Pays, key: string): Prestation | null {
  return pays.prestations.find((p) => p.key === key) ?? null;
}

/** Prix formaté FCFA, ou « Sur devis » quand le prix n'est pas communiqué. */
export function prixLabel(prix: number | null): string {
  return prix === null ? "Sur devis" : `${prix.toLocaleString("fr-FR")} FCFA`;
}

/** Libellé « À partir de … » à partir de la prestation la moins chère. */
export function prixApartir(pays: Pays): string {
  const prix = pays.prestations
    .map((p) => p.prix)
    .filter((p): p is number => p !== null);
  if (prix.length === 0) return "Sur devis";
  return `À partir de ${Math.min(...prix).toLocaleString("fr-FR")} FCFA`;
}

// ─── Statuts d'un dossier de voyage (CHECK de la table dossiers_voyage) ───────
export const STATUTS_DOSSIER = [
  "soumis",
  "en_cours_traitement",
  "pieces_complementaires_requises",
  "finalise",
] as const;

export type StatutDossier = (typeof STATUTS_DOSSIER)[number];

export const STATUT_DOSSIER_LABELS: Record<string, string> = {
  soumis: "Soumis",
  en_cours_traitement: "En cours de traitement",
  pieces_complementaires_requises: "Pièces complémentaires requises",
  finalise: "Finalisé",
};

/**
 * Transitions autorisées d'un dossier.
 *
 * Le cycle était libre : un dossier `finalise` pouvait repasser à `soumis`.
 * `pieces_complementaires_requises` n'est pas un cul-de-sac — c'est un
 * aller-retour normal, le client complète et le traitement reprend.
 */
export const TRANSITIONS_DOSSIER: Record<StatutDossier, readonly StatutDossier[]> = {
  soumis: ["en_cours_traitement", "pieces_complementaires_requises"],
  en_cours_traitement: ["pieces_complementaires_requises", "finalise"],
  pieces_complementaires_requises: ["en_cours_traitement", "finalise"],
  finalise: [],
} as const;

export function transitionDossierAutorisee(depuis: string, vers: string): boolean {
  if (!isStatutDossier(depuis) || !isStatutDossier(vers)) return false;
  return TRANSITIONS_DOSSIER[depuis].includes(vers);
}

/** Types de pièces attendues sur un dossier. */

export function isTypeDocument(v: unknown): v is TypeDocument {
  return typeof v === "string" && (TYPES_DOCUMENT as readonly string[]).includes(v);
}

export const STATUTS_DOCUMENT = ["soumis", "valide", "rejete"] as const;
export type StatutDocument = (typeof STATUTS_DOCUMENT)[number];

export const STATUT_DOCUMENT_LABELS: Record<StatutDocument, string> = {
  soumis: "À vérifier",
  valide: "Validée",
  rejete: "Rejetée",
};

export function isStatutDossier(v: string): v is StatutDossier {
  return (STATUTS_DOSSIER as readonly string[]).includes(v);
}
