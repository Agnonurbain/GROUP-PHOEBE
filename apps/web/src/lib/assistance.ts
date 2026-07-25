// Assistance voyages — source UNIQUE des pays, tarifs et offres.
// Partagée par la page d'accueil, la page pays et le serveur, pour que le prix
// affiché corresponde à ce que l'équipe facturera. Module pur.

export type OffreKey = "base" | "premium" | "express";
export type TypeDossier = "etudes" | "tourisme_visa";

export type Pays = {
  slug: string;
  name: string;
  flag: string;
  type: TypeDossier;
  visa: string;
  delay: string;
  success: string;
  prix: Record<OffreKey, number>;
};

export const PAYS: Record<string, Pays> = {
  chine: {
    slug: "chine", name: "Chine", flag: "🇨🇳", type: "etudes",
    visa: "Visa étudiant", delay: "45 jours", success: "88%",
    prix: { base: 150000, premium: 175000, express: 200000 },
  },
  italie: {
    slug: "italie", name: "Italie", flag: "🇮🇹", type: "etudes",
    visa: "Visa étudiant", delay: "30 jours", success: "92%",
    prix: { base: 150000, premium: 175000, express: 200000 },
  },
  grece: {
    slug: "grece", name: "Grèce", flag: "🇬🇷", type: "tourisme_visa",
    visa: "Visa tourisme", delay: "20 jours", success: "90%",
    prix: { base: 85000, premium: 110000, express: 130000 },
  },
  pologne: {
    slug: "pologne", name: "Pologne", flag: "🇵🇱", type: "tourisme_visa",
    visa: "Visa tourisme", delay: "25 jours", success: "87%",
    prix: { base: 75000, premium: 100000, express: 120000 },
  },
  portugal: {
    slug: "portugal", name: "Portugal", flag: "🇵🇹", type: "tourisme_visa",
    visa: "Visa tourisme", delay: "25 jours", success: "89%",
    prix: { base: 95000, premium: 120000, express: 140000 },
  },
  schengen: {
    slug: "schengen", name: "Schengen", flag: "🇪🇺", type: "tourisme_visa",
    visa: "Visa tourisme", delay: "30 jours", success: "85%",
    prix: { base: 120000, premium: 145000, express: 165000 },
  },
};

export const PAYS_LIST: Pays[] = Object.values(PAYS);

export type Offre = {
  key: OffreKey;
  name: string;
  features: string[];
  recommended: boolean;
};

export const OFFRES: Offre[] = [
  {
    key: "base",
    name: "Service seul",
    features: ["Dossier complet", "Suivi standard", "Checklist PDF"],
    recommended: false,
  },
  {
    key: "premium",
    name: "Service + Accompagnement",
    features: ["Dossier complet", "Suivi prioritaire", "Accompagnement personnel", "Préparation entretien"],
    recommended: true,
  },
  {
    key: "express",
    name: "Service + Rendez-vous Express",
    features: ["Dossier complet", "Rendez-vous express", "Accompagnement VIP", "Traduction documents"],
    recommended: false,
  },
];

export function getPays(slug: string): Pays | null {
  return PAYS[slug] ?? null;
}

export function isOffreKey(v: string): v is OffreKey {
  return v === "base" || v === "premium" || v === "express";
}

export function offreLabel(key: OffreKey): string {
  return OFFRES.find((o) => o.key === key)?.name ?? key;
}
