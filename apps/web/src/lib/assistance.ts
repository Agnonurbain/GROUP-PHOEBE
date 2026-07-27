// Assistance voyages & études — source UNIQUE des pays, prestations et contenu.
// Partagée par la page d'accueil assistance, la fiche pays et le serveur, pour
// que le prix affiché corresponde à ce que l'équipe facturera. Module pur.
//
// Contenu fourni par GROUP PHOEBE (notes vocales du 26/07/2026). Les prix Europe
// ne sont pas encore communiqués → prix `null` = « Sur devis ».

// Type porté par la table dossiers_voyage (CHECK : 'etudes' | 'tourisme_visa').
export type TypeDossier = "etudes" | "tourisme_visa";

// Une prestation facturable pour un pays (ex. visa étude, tourisme, affaires).
export type Prestation = {
  key: string;
  name: string;
  type: TypeDossier;
  prix: number | null; // null => « Sur devis »
  description?: string;
  recommended?: boolean;
};

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
      "Trois types de visa — étude (avec bourse), tourisme et affaires. Nous accompagnons tout le parcours, du choix des universités à l'obtention du visa.",
    prestations: [
      {
        key: "etude",
        name: "Visa étude — accompagnement bourse",
        type: "etudes",
        prix: 1_800_000,
        recommended: true,
        description:
          "Parcours complet : choix des universités, négociation de la bourse (type A ou B), admission, formulaire JW202 et visa étudiant.",
      },
      {
        key: "tourisme",
        name: "Visa tourisme / visite",
        type: "tourisme_visa",
        prix: 500_000,
        description: "Assistance complète pour un visa de visite en Chine.",
      },
      {
        key: "affaires",
        name: "Visa affaires",
        type: "tourisme_visa",
        prix: 750_000,
        description: "Assistance pour un visa d'affaires en Chine.",
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
    prestations: [{ key: "visa", name: "Visa Schengen (tourisme)", type: "tourisme_visa", prix: null }],
  },
  france: {
    slug: "france",
    name: "France",
    flag: "🇫🇷",
    categorie: "voyage",
    resume: "Assistance pour votre visa Schengen à destination de la France.",
    prestations: [{ key: "visa", name: "Visa Schengen (tourisme)", type: "tourisme_visa", prix: null }],
  },
  italie: {
    slug: "italie",
    name: "Italie",
    flag: "🇮🇹",
    categorie: "voyage",
    resume: "Assistance pour votre visa Schengen à destination de l'Italie.",
    prestations: [{ key: "visa", name: "Visa Schengen (tourisme)", type: "tourisme_visa", prix: null }],
  },
  portugal: {
    slug: "portugal",
    name: "Portugal",
    flag: "🇵🇹",
    categorie: "voyage",
    resume: "Assistance pour votre visa Schengen à destination du Portugal.",
    prestations: [{ key: "visa", name: "Visa Schengen (tourisme)", type: "tourisme_visa", prix: null }],
  },
  grece: {
    slug: "grece",
    name: "Grèce",
    flag: "🇬🇷",
    categorie: "voyage",
    resume: "Assistance pour votre visa Schengen à destination de la Grèce.",
    prestations: [{ key: "visa", name: "Visa Schengen (tourisme)", type: "tourisme_visa", prix: null }],
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

export function isStatutDossier(v: string): v is StatutDossier {
  return (STATUTS_DOSSIER as readonly string[]).includes(v);
}
