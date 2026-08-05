import "server-only";

import type { Metadata } from "next";
import { getT } from "./server";
import type { Dictionnaire } from "./index";

/**
 * Les métadonnées d'une page, dans la langue du visiteur.
 *
 * Chaque page répétait son titre et sa description TROIS fois — une pour
 * l'onglet, une pour Open Graph, une pour Twitter — dans un `export const
 * metadata` figé à la compilation. Trois copies d'une même phrase divergent :
 * `transport/catalogue` annonçait déjà « Location de véhicules — Catalogue »
 * à l'onglet et « … | GROUP PHOEBE » au partage.
 *
 * Ici, on donne le titre et la description une fois, et la fonction en tire
 * les trois. `partage` permet une description plus courte pour les réseaux,
 * quand celle de la page est trop longue pour une carte.
 *
 * `export const metadata` ne pouvait de toute façon pas suivre la langue : il
 * est évalué au chargement du module, sans requête. `generateMetadata` l'est à
 * chaque requête — c'est le seul chemin possible.
 */
export async function metadonnees(
  choisir: (t: Dictionnaire) => {
    titre: string;
    description: string;
    /** Description des cartes de partage, si elle diffère de celle de la page. */
    partage?: string;
    /** Une page qui n'a rien à faire dans un index de recherche. */
    noindex?: boolean;
  }
): Promise<Metadata> {
  const t = await getT();
  const { titre, description, partage, noindex } = choisir(t);
  const descriptionPartage = partage ?? description;

  return {
    title: titre,
    description,
    /**
     * `locale` est répétée ici, et ce n'est pas un oubli du gabarit racine :
     * Next REMPLACE l'`openGraph` de la racine par celui de la page, il ne le
     * fusionne pas. Sans cette ligne, `og:locale` disparaissait de toutes les
     * pages ayant leurs propres métadonnées — c'est-à-dire toutes.
     */
    openGraph: {
      title: titre,
      description: descriptionPartage,
      locale: t.meta.ogLocale,
      siteName: "GROUP PHOEBE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titre,
      description: descriptionPartage,
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
