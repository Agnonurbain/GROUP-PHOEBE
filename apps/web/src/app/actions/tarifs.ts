"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { logAudit } from "@/lib/audit";
import { revalidateTarifsCache } from "@/lib/tarifs-cache";

// Local types for new table not yet in generated types
interface PropositionsTarifsRow {
  id: string;
  zone_id: string;
  operateur_id: string;
  type: "coefficients" | "geojson" | "intervalles" | "prix_base";
  champ: string | null;
  valeur_actuelle: Record<string, unknown> | null;
  valeur_proposee: Record<string, unknown>;
  statut: "en_attente" | "acceptee" | "refusee";
  commentaire: string | null;
  created_at: string;
  updated_at: string;
}

interface PropositionsTarifsInsert {
  zone_id: string;
  operateur_id: string;
  type: "coefficients" | "geojson" | "intervalles" | "prix_base";
  champ?: string | null;
  valeur_actuelle?: Record<string, unknown> | null;
  valeur_proposee: Record<string, unknown>;
  statut?: "en_attente" | "acceptee" | "refusee";
  commentaire?: string | null;
}

interface PropositionsTarifsUpdate {
  zone_id?: string;
  operateur_id?: string;
  type?: "coefficients" | "geojson" | "intervalles" | "prix_base";
  champ?: string | null;
  valeur_actuelle?: Record<string, unknown> | null;
  valeur_proposee?: Record<string, unknown>;
  statut?: "en_attente" | "acceptee" | "refusee";
  commentaire?: string | null;
  updated_at?: string;
}

async function requireStaff() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();
  if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
    throw new Error("Accès refusé");
  }
  return { supabase, userId: user.sub as string, role: profile.role };
}

async function requireProprietaire() {
  const { supabase, role } = await requireStaff();
  if (role !== "proprietaire") throw new Error("Accès refusé : propriétaire requis");
  return supabase;
}

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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
  await revalidateTarifsCache();
  return { success: true };
}

export async function supprimerCommune(id: string): Promise<TarifState> {
  const supabase = await requireProprietaire();
  const { error } = await supabase.from("communes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/tarifs");
  await revalidateTarifsCache();
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
  await revalidateTarifsCache();
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
  await revalidateTarifsCache();
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
  const commentaire = (formData.get("commentaire") as string)?.trim();

  if (!commentaire) {
    return { error: "Un commentaire est obligatoire pour modifier les coefficients." };
  }

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: oldZone } = await (admin.from as any)("zones_tarifaires")
    .select("coefficient_majoration, caution_multiplicateur, km_inclus_par_jour, supplement_km_fcfa, chauffeur_statut, tarif_chauffeur_journalier")
    .eq("id", zoneId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from as any)("zones_tarifaires")
    .update(newValues)
    .eq("id", zoneId);

  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: "modifier_coefficients",
    tableName: "zones_tarifaires",
    recordId: zoneId,
    oldValues: oldZone ?? undefined,
    newValues: { ...newValues, commentaire },
  });

  revalidatePath("/admin/tarifs");
  await revalidateTarifsCache();
  return { success: true };
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from as any)("zones_tarifaires")
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
  await revalidateTarifsCache();
  return { success: true };
}

export async function proposerModificationTarifs(
  _prev: TarifState,
  formData: FormData
): Promise<TarifState> {
  const { userId, role } = await requireStaff();
  if (role === "proprietaire") {
    return { error: "Le propriétaire modifie directement, pas de proposition nécessaire." };
  }

  const zoneId = formData.get("zone_id") as string;
  const type = formData.get("type") as "coefficients" | "geojson" | "intervalles" | "prix_base";
  const commentaire = (formData.get("commentaire") as string)?.trim();
  const valeurProposeeRaw = formData.get("valeur_proposee") as string;

  if (!zoneId || !type || !valeurProposeeRaw) {
    return { error: "Zone, type et valeur proposée sont obligatoires." };
  }

  let valeurProposee: Record<string, unknown>;
  try {
    valeurProposee = JSON.parse(valeurProposeeRaw);
  } catch {
    return { error: "Valeur proposée invalide (JSON)." };
  }

  const admin = getAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: oldZone } = await (admin.from as any)("zones_tarifaires")
    .select("coefficient_majoration, caution_multiplicateur, km_inclus_par_jour, supplement_km_fcfa, chauffeur_statut, tarif_chauffeur_journalier, geojson")
    .eq("id", zoneId)
    .single();

  let valeurActuelle: Record<string, unknown> | null = null;
  if (type === "coefficients" && oldZone) {
    valeurActuelle = {
      coefficient_majoration: oldZone.coefficient_majoration,
      caution_multiplicateur: oldZone.caution_multiplicateur,
      km_inclus_par_jour: oldZone.km_inclus_par_jour,
      supplement_km_fcfa: oldZone.supplement_km_fcfa,
      chauffeur_statut: oldZone.chauffeur_statut,
      tarif_chauffeur_journalier: oldZone.tarif_chauffeur_journalier,
    };
  } else if (type === "geojson") {
    valeurActuelle = oldZone?.geojson as Record<string, unknown> | null;
  }

  const insertPayload: PropositionsTarifsInsert = {
    zone_id: zoneId,
    operateur_id: userId,
    type,
    champ: type === "coefficients" ? "multiple" : type,
    valeur_actuelle: valeurActuelle,
    valeur_proposee: valeurProposee,
    commentaire,
  };
  const { error } = await admin
    .from("propositions_tarifs" as never)
    .insert(insertPayload as never);

  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: "proposer_tarifs",
    tableName: "propositions_tarifs",
    recordId: zoneId,
    newValues: { type, valeur_proposee: valeurProposee, commentaire },
  });

  revalidatePath("/admin/tarifs");
  await revalidateTarifsCache();
  return { success: true };
}

export async function traiterPropositionTarifs(
  propositionId: string,
  action: "accepter" | "refuser",
  commentaire?: string
): Promise<TarifState> {
  const { supabase, userId, role } = await requireStaff();
  if (role !== "proprietaire") {
    return { error: "Seul le propriétaire peut traiter les propositions." };
  }

  const { data, error: propErr } = await supabase
    .from("propositions_tarifs" as never)
    .select("*")
    .eq("id", propositionId)
    .single();
  const prop = data as PropositionsTarifsRow | null;

  if (propErr || !prop) return { error: "Proposition introuvable." };
  if (prop.statut !== "en_attente") return { error: "Cette proposition a déjà été traitée." };

  const admin = getAdmin();

  if (action === "accepter") {
    const updates: Record<string, unknown> = {};
    if (prop.type === "coefficients") {
      Object.assign(updates, prop.valeur_proposee);
    } else if (prop.type === "geojson") {
      updates.geojson = prop.valeur_proposee;
    }

    if (Object.keys(updates).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (admin.from as any)("zones_tarifaires")
        .update(updates)
        .eq("id", prop.zone_id);
      if (error) return { error: error.message };
    }

    const patch: PropositionsTarifsUpdate = { statut: "acceptee", updated_at: new Date().toISOString() };
    await supabase
      .from("propositions_tarifs" as never)
      .update(patch as never)
      .eq("id", propositionId);

    await logAudit({
      userId,
      action: "accepter_proposition_tarifs",
      tableName: "propositions_tarifs",
      recordId: propositionId,
      newValues: { statut: "acceptee", commentaire },
    });
  } else {
    const patch: PropositionsTarifsUpdate = { statut: "refusee", updated_at: new Date().toISOString() };
    await supabase
      .from("propositions_tarifs" as never)
      .update(patch as never)
      .eq("id", propositionId);

    await logAudit({
      userId,
      action: "refuser_proposition_tarifs",
      tableName: "propositions_tarifs",
      recordId: propositionId,
      newValues: { statut: "refusee", commentaire },
    });
  }

  revalidatePath("/admin/tarifs");
  await revalidateTarifsCache();
  return { success: true };
}

export type PropositionTarifsAvecRelations = PropositionsTarifsRow & {
  users: { nom: string } | null;
  zones_tarifaires: { nom: string } | null;
};

export async function getPropositionsTarifs(): Promise<{
  data: PropositionTarifsAvecRelations[] | null;
  error?: string;
}> {
  const { supabase } = await requireStaff();
  const { data, error } = await supabase
    .from("propositions_tarifs" as never)
    .select("*, users:operateur_id(nom), zones_tarifaires:zone_id(nom)")
    .order("created_at", { ascending: false })
    .limit(20);
  return { data: data as PropositionTarifsAvecRelations[] | null, error: error?.message };
}
// ─── Tarifs de livraison (propriétaire uniquement) ───────────────────────────
// La grille zone × mode et les paliers de poids étaient figés dans le code :
// seul un déploiement pouvait les changer. Ils vivent désormais en base, au
// même titre que les tarifs transport.

async function requireProprietaireAvecId() {
  const { userId, role } = await requireStaff();
  if (role !== "proprietaire") throw new Error("Accès refusé : propriétaire requis");
  return userId;
}

export async function modifierTarifLivraison(
  _prev: TarifState,
  formData: FormData
): Promise<TarifState> {
  const userId = await requireProprietaireAvecId();
  const admin = getAdmin();

  const zone = formData.get("zone") as string;
  const mode = formData.get("mode") as string;
  const prix = Number(formData.get("prix"));

  if (!zone || !mode) return { error: "Zone ou mode manquant." };
  if (!Number.isFinite(prix) || prix <= 0) {
    return { error: "Le prix doit être un montant positif." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ancien } = await (admin.from as any)("tarifs_livraison")
    .select("prix")
    .eq("zone", zone)
    .eq("mode", mode)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from as any)("tarifs_livraison")
    .update({ prix, updated_at: new Date().toISOString() })
    .eq("zone", zone)
    .eq("mode", mode);
  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: "modifier_tarif_livraison",
    tableName: "tarifs_livraison",
    oldValues: { zone, mode, prix: ancien?.prix ?? null },
    newValues: { zone, mode, prix },
  });

  revalidatePath("/admin/tarifs");
  await revalidateLivraisonCache();
  return { success: true };
}

export async function modifierPalierPoids(
  _prev: TarifState,
  formData: FormData
): Promise<TarifState> {
  const userId = await requireProprietaireAvecId();
  const admin = getAdmin();

  const id = formData.get("id") as string;
  const label = ((formData.get("label") as string) || "").trim();
  const maxKg = Number(formData.get("max_kg"));
  const multiplicateur = Number(formData.get("multiplicateur"));

  if (!id) return { error: "Palier invalide." };
  if (!label) return { error: "Le libellé est obligatoire." };
  if (!Number.isFinite(maxKg) || maxKg <= 0) {
    return { error: "Le poids maximum doit être positif." };
  }
  if (!Number.isFinite(multiplicateur) || multiplicateur <= 0) {
    return { error: "Le coefficient doit être positif." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: paliers } = await (admin.from as any)("paliers_poids")
    .select("id, ordre, max_kg, multiplicateur, label")
    .order("ordre", { ascending: true });

  const rows = (paliers ?? []) as {
    id: string; ordre: number; max_kg: number; multiplicateur: number; label: string;
  }[];
  const courant = rows.find((p) => p.id === id);
  if (!courant) return { error: "Palier introuvable." };

  // Les bornes doivent rester strictement croissantes, sinon un palier devient
  // inatteignable et le prix cesse d'être monotone.
  const precedent = rows.filter((p) => p.ordre < courant.ordre).at(-1);
  const suivant = rows.find((p) => p.ordre > courant.ordre);
  if (precedent && maxKg <= Number(precedent.max_kg)) {
    return { error: `Le poids doit dépasser celui du palier précédent (${precedent.max_kg} kg).` };
  }
  if (suivant && maxKg >= Number(suivant.max_kg)) {
    return { error: `Le poids doit rester sous celui du palier suivant (${suivant.max_kg} kg).` };
  }
  if (precedent && multiplicateur < Number(precedent.multiplicateur)) {
    return { error: "Le coefficient ne peut pas être inférieur à celui du palier précédent." };
  }
  if (suivant && multiplicateur > Number(suivant.multiplicateur)) {
    return { error: "Le coefficient ne peut pas dépasser celui du palier suivant." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from as any)("paliers_poids")
    .update({ label, max_kg: maxKg, multiplicateur, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: "modifier_palier_poids",
    tableName: "paliers_poids",
    recordId: id,
    oldValues: { label: courant.label, max_kg: courant.max_kg, multiplicateur: courant.multiplicateur },
    newValues: { label, max_kg: maxKg, multiplicateur },
  });

  revalidatePath("/admin/tarifs");
  await revalidateLivraisonCache();
  return { success: true };
}

async function revalidateLivraisonCache() {
  const { revalidateTag } = await import("next/cache");
  (revalidateTag as (tag: string) => void)("tarifs_livraison");
}

// ─── Tarifs d'assistance (propriétaire uniquement) ───────────────────────────
// Un champ vide vaut « Sur devis » (prix null) : c'est l'état des destinations
// Europe tant que GROUP PHOEBE n'a pas communiqué ses tarifs.

export async function modifierTarifAssistance(
  _prev: TarifState,
  formData: FormData
): Promise<TarifState> {
  const userId = await requireProprietaireAvecId();
  const admin = getAdmin();

  const paysSlug = (formData.get("pays_slug") as string)?.trim();
  const prestationKey = (formData.get("prestation_key") as string)?.trim();
  const prixRaw = ((formData.get("prix") as string) || "").trim();

  if (!paysSlug || !prestationKey) return { error: "Prestation invalide." };

  let prix: number | null = null;
  if (prixRaw !== "") {
    prix = Number(prixRaw);
    if (!Number.isFinite(prix) || prix <= 0) {
      return { error: "Le prix doit être un montant positif, ou vide pour « Sur devis »." };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ancien } = await (admin.from as any)("tarifs_assistance")
    .select("prix")
    .eq("pays_slug", paysSlug)
    .eq("prestation_key", prestationKey)
    .maybeSingle();

  // upsert : une prestation ajoutée au code après la migration n'a pas de ligne.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from as any)("tarifs_assistance").upsert(
    {
      pays_slug: paysSlug,
      prestation_key: prestationKey,
      prix,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "pays_slug,prestation_key" }
  );
  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: "modifier_tarif_assistance",
    tableName: "tarifs_assistance",
    oldValues: { pays_slug: paysSlug, prestation_key: prestationKey, prix: ancien?.prix ?? null },
    newValues: { pays_slug: paysSlug, prestation_key: prestationKey, prix },
  });

  revalidatePath("/admin/tarifs");
  const { revalidateTag } = await import("next/cache");
  (revalidateTag as (tag: string) => void)("tarifs_assistance");
  return { success: true };
}
