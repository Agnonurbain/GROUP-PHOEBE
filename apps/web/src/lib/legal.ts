// Pages légales : types et lecture en cache.
//
// Le contenu vivait dans un fichier TypeScript, donc modifiable seulement par un
// déploiement — les [À COMPLÉTER] y seraient restés jusqu'à ce qu'un
// développeur s'en occupe. Il vit désormais en base, édité par le propriétaire.

import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { INDEMNISATION_INACTIVE, type ParametresIndemnisation } from "@/lib/indemnisation";

export const SLUGS_LEGAUX = ["mentions-legales", "cgv", "confidentialite"] as const;
export type SlugLegal = (typeof SLUGS_LEGAUX)[number];

export const LIBELLES_LEGAUX: Record<SlugLegal, string> = {
  "mentions-legales": "Mentions légales",
  cgv: "Conditions générales de vente",
  confidentialite: "Politique de confidentialité",
};

export type SectionLegale = { titre: string; paragraphes: string[] };

export type PageLegale = {
  slug: string;
  titre: string;
  chapeau: string;
  sections: SectionLegale[];
  publie: boolean;
  updated_at: string;
};

/** Un trou signalé dans le texte : la page reste un brouillon tant qu'il en reste. */
export const MARQUEUR_INCOMPLET = "[À COMPLÉTER";

export function pageIncomplete(page: Pick<PageLegale, "sections">): boolean {
  return page.sections.some((s) =>
    s.paragraphes.some((p) => p.includes(MARQUEUR_INCOMPLET))
  );
}

function client() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const getPageLegale = unstable_cache(
  async (slug: string): Promise<PageLegale | null> => {
    const { data } = await client()
      .from("pages_legales")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return (data as PageLegale | null) ?? null;
  },
  ["page-legale"],
  { tags: ["pages-legales"], revalidate: 3600 }
);

export const getParametresIndemnisation = unstable_cache(
  async (): Promise<ParametresIndemnisation> => {
    const { data } = await client()
      .from("parametres_livraison")
      .select("indemnisation_active, indemnisation_taux, indemnisation_plafond, indemnisation_conditions")
      .eq("id", true)
      .maybeSingle();

    // Repli sur « aucune indemnisation » si la ligne est injoignable : c'est
    // l'état le moins engageant, et le seul honnête en l'absence de barème.
    return (data as ParametresIndemnisation | null) ?? INDEMNISATION_INACTIVE;
  },
  ["parametres-indemnisation"],
  { tags: ["parametres-livraison"], revalidate: 3600 }
);
