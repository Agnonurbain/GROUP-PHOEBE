"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { logAudit } from "@/lib/audit";
import { SLUGS_LEGAUX, type SectionLegale } from "@/lib/legal";

export type PageLegaleState = {
  error?: string;
  success?: boolean;
};

export type IndemnisationState = {
  error?: string;
  success?: boolean;
};

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Ces textes engagent l'entreprise et ce barème est un montant : propriétaire
 * seul, comme tout ce qui porte un prix dans ce projet.
 */
async function requireProprietaire() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();
  if (profile?.role !== "proprietaire") {
    throw new Error("Accès refusé : propriétaire requis");
  }
  return user.sub as string;
}

export async function modifierPageLegale(
  _prev: PageLegaleState,
  formData: FormData
): Promise<PageLegaleState> {
  const userId = await requireProprietaire();

  const slug = (formData.get("slug") as string) || "";
  if (!(SLUGS_LEGAUX as readonly string[]).includes(slug)) {
    return { error: "Page inconnue." };
  }

  const titre = ((formData.get("titre") as string) || "").trim();
  const chapeau = ((formData.get("chapeau") as string) || "").trim();
  const publie = formData.get("publie") === "on";

  if (!titre) return { error: "Le titre est obligatoire." };

  // Les sections arrivent en champs parallèles : un titre et un bloc de
  // paragraphes séparés par des lignes vides. Plus simple à éditer qu'un JSON
  // brut, et le rendu n'interprète aucun HTML — le texte reste du texte.
  const titresSections = formData.getAll("section_titre").map((v) => String(v).trim());
  const corpsSections = formData.getAll("section_corps").map((v) => String(v));

  const sections: SectionLegale[] = [];
  for (let i = 0; i < titresSections.length; i++) {
    const t = titresSections[i];
    const paragraphes = (corpsSections[i] ?? "")
      .split(/\n\s*\n/)
      .map((p) => p.trim().replace(/\s*\n\s*/g, " "))
      .filter(Boolean);
    if (!t && paragraphes.length === 0) continue;
    if (!t) return { error: `La section ${i + 1} n'a pas de titre.` };
    sections.push({ titre: t, paragraphes });
  }

  if (sections.length === 0) return { error: "Ajoutez au moins une section." };

  // Une page publiée ne doit plus contenir de trou : la publier avec un
  // [À COMPLÉTER] visible la présenterait comme un engagement ferme alors
  // qu'il y manque une mention obligatoire.
  if (publie) {
    const reste = sections.some((s) =>
      s.paragraphes.some((p) => p.includes("[À COMPLÉTER"))
    );
    if (reste) {
      return {
        error:
          "Cette page contient encore des [À COMPLÉTER]. Complétez-les avant de publier, " +
          "ou enregistrez-la en brouillon.",
      };
    }
  }

  const admin = getAdmin();

  const { data: ancien } = await admin
    .from("pages_legales")
    .select("titre, publie")
    .eq("slug", slug)
    .maybeSingle();

  const { error } = await admin.from("pages_legales").upsert(
    {
      slug,
      titre,
      chapeau,
      sections: sections as never,
      publie,
      updated_at: new Date().toISOString(),
      updated_par: userId,
    } as never,
    { onConflict: "slug" }
  );

  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: "modifier_page_legale",
    tableName: "pages_legales",
    recordId: slug,
    oldValues: ancien ?? undefined,
    newValues: { titre, publie, nb_sections: sections.length },
  });

  revalidatePath(`/legal/${slug}`);
  revalidatePath("/admin/pages-legales");
  return { success: true };
}

export async function modifierIndemnisation(
  _prev: IndemnisationState,
  formData: FormData
): Promise<IndemnisationState> {
  const userId = await requireProprietaire();

  const active = formData.get("indemnisation_active") === "on";
  const taux = Number(formData.get("indemnisation_taux"));
  const plafond = Number(formData.get("indemnisation_plafond"));
  const conditions = ((formData.get("indemnisation_conditions") as string) || "").trim();

  if (!Number.isFinite(taux) || taux < 0 || taux > 100) {
    return { error: "Le taux doit être compris entre 0 et 100 %." };
  }
  if (!Number.isFinite(plafond) || plafond < 0) {
    return { error: "Le plafond ne peut pas être négatif." };
  }

  // Activer un régime à 0 % promettrait une indemnisation qui ne verserait
  // jamais rien : le client lirait un engagement là où il n'y en a pas.
  if (active && taux <= 0) {
    return { error: "Un régime actif suppose un taux supérieur à 0 %." };
  }

  const admin = getAdmin();

  const { data: ancien } = await admin
    .from("parametres_livraison")
    .select("indemnisation_active, indemnisation_taux, indemnisation_plafond")
    .eq("id", true)
    .maybeSingle();

  const { error } = await admin
    .from("parametres_livraison")
    .update({
      indemnisation_active: active,
      indemnisation_taux: taux,
      indemnisation_plafond: plafond,
      indemnisation_conditions: conditions,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", true);

  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: "modifier_indemnisation_livraison",
    tableName: "parametres_livraison",
    oldValues: ancien ?? undefined,
    newValues: { active, taux, plafond },
  });

  revalidatePath("/admin/pages-legales");
  revalidatePath("/livraison/commander");
  revalidatePath("/legal/cgv");
  return { success: true };
}
