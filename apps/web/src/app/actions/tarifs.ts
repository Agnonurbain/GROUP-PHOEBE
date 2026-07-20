"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { logAudit } from "@/lib/audit";

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
  if (profile?.role !== "proprietaire") throw new Error("Accès refusé");
  return supabase;
}

export type TarifState = { error?: string; success?: boolean };

export async function ajouterCommune(
  _prev: TarifState,
  formData: FormData
): Promise<TarifState> {
  const supabase = await requireProprietaire();
  const nom = (formData.get("nom") as string)?.trim();
  const zoneId = formData.get("zone_id") as string;

  if (!nom || !zoneId) return { error: "Nom et zone sont obligatoires." };

  const { error } = await supabase
    .from("communes")
    .insert({ nom, zone_id: zoneId, ajoutee_par_client: false });

  if (error) {
    if (error.code === "23505") return { error: "Cette commune existe déjà dans cette zone." };
    return { error: error.message };
  }

  revalidatePath("/admin/tarifs");
  return { success: true };
}

export async function supprimerCommune(id: string): Promise<TarifState> {
  const supabase = await requireProprietaire();
  const { error } = await supabase.from("communes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/tarifs");
  return { success: true };
}

export async function modifierIntervalle(
  _prev: TarifState,
  formData: FormData
): Promise<TarifState> {
  const supabase = await requireProprietaire();
  const id = formData.get("id") as string;
  const prixMin = Number(formData.get("prix_min"));
  const prixMax = Number(formData.get("prix_max"));

  if (!id || isNaN(prixMin) || isNaN(prixMax)) {
    return { error: "Valeurs invalides." };
  }
  if (prixMin > prixMax) {
    return { error: "Le prix minimum doit être inférieur au maximum." };
  }

  const { error } = await supabase
    .from("intervalles_prix")
    .update({ prix_min: prixMin, prix_max: prixMax, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/tarifs");
  return { success: true };
}

export async function ajouterIntervalle(
  _prev: TarifState,
  formData: FormData
): Promise<TarifState> {
  const supabase = await requireProprietaire();
  const zoneId = formData.get("zone_id") as string;
  const categorie = formData.get("categorie_vehicule") as string;
  const type = formData.get("type") as string;
  const prixMin = Number(formData.get("prix_min"));
  const prixMax = Number(formData.get("prix_max"));

  if (!zoneId || !categorie || !type || isNaN(prixMin) || isNaN(prixMax)) {
    return { error: "Tous les champs sont obligatoires." };
  }
  if (prixMin > prixMax) {
    return { error: "Le prix minimum doit être inférieur au maximum." };
  }

  const { error } = await supabase.from("intervalles_prix").insert({
    zone_id: zoneId,
    categorie_vehicule: categorie as "leger" | "car" | "minibus",
    type: type as "location" | "vente",
    prix_min: prixMin,
    prix_max: prixMax,
  });

  if (error) {
    if (error.code === "23505") return { error: "Cet intervalle existe déjà." };
    return { error: error.message };
  }

  revalidatePath("/admin/tarifs");
  return { success: true };
}

export async function modifierCoefficients(
  _prev: TarifState,
  formData: FormData
): Promise<TarifState> {
  const supabase = await requireProprietaire();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string;

  const zoneId = formData.get("zone_id") as string;
  const newValues = {
    coefficient_majoration: Number(formData.get("coefficient_majoration")),
    caution_multiplicateur: Number(formData.get("caution_multiplicateur")),
    km_inclus_par_jour: Number(formData.get("km_inclus_par_jour")),
    supplement_km_fcfa: Number(formData.get("supplement_km_fcfa")),
    chauffeur_statut: formData.get("chauffeur_statut") as string,
    tarif_chauffeur_journalier: Number(formData.get("tarif_chauffeur_journalier")),
  };

  if (!zoneId || isNaN(newValues.coefficient_majoration) || isNaN(newValues.caution_multiplicateur) || isNaN(newValues.km_inclus_par_jour) || isNaN(newValues.supplement_km_fcfa) || isNaN(newValues.tarif_chauffeur_journalier)) {
    return { error: "Valeurs invalides." };
  }
  if (!["optionnel", "recommande", "obligatoire"].includes(newValues.chauffeur_statut)) {
    return { error: "Statut chauffeur invalide." };
  }

  const admin = getAdmin();

  const { data: oldZone } = await (admin.from as Function)("zones_tarifaires")
    .select("coefficient_majoration, caution_multiplicateur, km_inclus_par_jour, supplement_km_fcfa, chauffeur_statut, tarif_chauffeur_journalier")
    .eq("id", zoneId)
    .single();

  const { error } = await (admin.from as Function)("zones_tarifaires")
    .update(newValues)
    .eq("id", zoneId);

  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: "modifier_coefficients",
    tableName: "zones_tarifaires",
    recordId: zoneId,
    oldValues: oldZone ?? undefined,
    newValues,
  });

  revalidatePath("/admin/tarifs");
  return { success: true };
}

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function sauvegarderGeojson(
  zoneId: string,
  geojson: Record<string, unknown> | null
): Promise<TarifState> {
  const supabase = await requireProprietaire();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string;

  if (geojson && geojson.type !== "Polygon" && geojson.type !== "MultiPolygon") {
    return { error: "Le GeoJSON doit être de type Polygon ou MultiPolygon." };
  }

  const admin = getAdmin();
  const { error } = await (admin.from as Function)("zones_tarifaires")
    .update({ geojson })
    .eq("id", zoneId);

  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: geojson ? "modifier_geojson" : "supprimer_geojson",
    tableName: "zones_tarifaires",
    recordId: zoneId,
    newValues: geojson ? { type: geojson.type } : undefined,
  });

  revalidatePath("/admin/tarifs");
  return { success: true };
}
