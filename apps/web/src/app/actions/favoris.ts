"use server";

import { revalidatePath } from "next/cache";
import { err } from "@/lib/i18n/erreurs";
import { createClient } from "@/lib/supabase/server";

/**
 * Bascule un favori. Une ligne cible soit un véhicule, soit un bien (contrainte
 * `favoris_une_seule_cible`, migration 00052) — d'où la colonne choisie selon la
 * cible plutôt que deux fonctions qui dupliqueraient la logique.
 */
async function toggle(cible: "vehicule" | "bien", id: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: await err("nonAuthentifie2") };

  const colonne = cible === "vehicule" ? "vehicule_id" : "bien_id";

  const { data: existing } = await supabase
    .from("favoris")
    .select("id")
    .eq("user_id", user.sub)
    .eq(colonne, id)
    .maybeSingle();

  if (existing) {
    await supabase.from("favoris").delete().eq("id", existing.id);
  } else {
    // Ligne construite explicitement : une clé calculée casse le typage strict
    // des inserts Supabase (il n'accepte pas de signature d'index).
    await supabase.from("favoris").insert(
      cible === "vehicule"
        ? { user_id: user.sub as string, vehicule_id: id }
        : { user_id: user.sub as string, bien_id: id }
    );
  }

  revalidatePath("/compte/favoris");
  return {};
}

export async function toggleFavori(vehiculeId: string) {
  const res = await toggle("vehicule", vehiculeId);
  revalidatePath("/transport/catalogue");
  revalidatePath(`/transport/vehicule/${vehiculeId}`);
  return res;
}

export async function toggleFavoriBien(bienId: string) {
  const res = await toggle("bien", bienId);
  revalidatePath("/immobilier");
  revalidatePath(`/immobilier/${bienId}`);
  return res;
}

/** Ids des biens mis en favori par l'utilisateur courant (vide si anonyme). */
export async function getFavorisBienIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return [];

  const { data } = await supabase
    .from("favoris")
    .select("bien_id")
    .eq("user_id", user.sub)
    .not("bien_id", "is", null);

  return (data ?? []).map((f) => f.bien_id as string);
}
