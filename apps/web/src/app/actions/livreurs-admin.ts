"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { parseZoneCouverture } from "@/lib/livraison";

export type LivreurAdminState = {
  error?: string;
  success?: boolean;
};

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

/**
 * Zone de couverture et capacité d'un livreur.
 *
 * Les deux pilotent `choisirLivreurAuto` et n'étaient éditables nulle part :
 * la capacité restait au défaut de la base, et la zone n'était même pas
 * affichée à la création. L'équilibrage de charge tournait donc sur des valeurs
 * que personne ne pouvait régler.
 */
export async function modifierLivreur(
  _prev: LivreurAdminState,
  formData: FormData
): Promise<LivreurAdminState> {
  const userId = await requireProprietaire();

  const livreurId = formData.get("livreur_id") as string;
  const zoneBrute = ((formData.get("zone_couverture") as string) || "").trim();
  const capaciteRaw = ((formData.get("charge_max_simultanee") as string) || "").trim();
  const actif = formData.get("actif") === "on";

  if (!livreurId) return { error: "Livreur invalide." };

  // 0 course par jour n'a pas de sens : ce serait un livreur que l'affectation
  // automatique écarte systématiquement, sans que rien ne le dise. Pour
  // suspendre quelqu'un, il y a la case « actif ».
  const capacite = Number(capaciteRaw);
  if (!Number.isInteger(capacite) || capacite < 1) {
    return { error: "La capacité doit être un nombre entier d'au moins 1." };
  }

  // Normalisation : la zone est une liste de communes séparées par des virgules.
  // Vide = dessert tout, et c'est un choix légitime, pas une valeur manquante.
  const communes = parseZoneCouverture(zoneBrute);
  const zone = communes.length > 0 ? communes.join(", ") : null;

  const admin = createAdminClient();

  const { data: ancien } = await admin
    .from("livreurs")
    .select("zone_couverture, charge_max_simultanee, actif")
    .eq("id", livreurId)
    .single();

  if (!ancien) return { error: "Livreur introuvable." };

  const { error } = await admin
    .from("livreurs")
    .update({ zone_couverture: zone, charge_max_simultanee: capacite, actif })
    .eq("id", livreurId);

  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: "modifier_livreur",
    tableName: "livreurs",
    recordId: livreurId,
    oldValues: ancien,
    newValues: { zone_couverture: zone, charge_max_simultanee: capacite, actif },
  });

  revalidatePath("/admin/livreurs");
  revalidatePath("/admin/expeditions");
  return { success: true };
}
