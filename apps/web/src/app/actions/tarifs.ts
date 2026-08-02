"use server";

import { revalidatePath, revalidateTag } from "next/cache";
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

// ─── Coordonnées & réseaux sociaux (propriétaire uniquement) ─────────────────
// Table singleton parametres_contact. Un champ vidé repasse à null : le site
// n'affiche alors plus la coordonnée du tout, plutôt qu'une valeur fictive.

const CHAMPS_PARAMETRES_CONTACT = [
  "telephone", "email", "adresse", "horaires",
  "whatsapp", "facebook", "instagram", "linkedin", "tiktok", "youtube",
] as const;

export async function modifierParametresContact(
  _prev: TarifState,
  formData: FormData
): Promise<TarifState> {
  const userId = await requireProprietaireAvecId();
  const admin = getAdmin();

  const valeurs: Record<string, string | null> = {};
  for (const champ of CHAMPS_PARAMETRES_CONTACT) {
    const brut = ((formData.get(champ) as string) || "").trim();
    valeurs[champ] = brut === "" ? null : brut;
  }

  if (valeurs.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valeurs.email)) {
    return { error: "Adresse e-mail invalide." };
  }
  for (const reseau of ["facebook", "instagram", "linkedin", "tiktok", "youtube"] as const) {
    const url = valeurs[reseau];
    if (url && !/^https?:\/\//i.test(url)) {
      return { error: `Le lien ${reseau} doit commencer par https://` };
    }
  }
  if (valeurs.whatsapp && !/^\d{8,15}$/.test(valeurs.whatsapp.replace(/\D/g, ""))) {
    return { error: "Le WhatsApp doit être un numéro (indicatif compris, sans +)." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ancien } = await (admin.from as any)("parametres_contact")
    .select("*")
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from as any)("parametres_contact").upsert(
    { id: true, ...valeurs, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );
  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: "modifier_parametres_contact",
    tableName: "parametres_contact",
    oldValues: ancien ?? undefined,
    newValues: valeurs,
  });

  revalidatePath("/admin/tarifs");
  const { revalidateTag } = await import("next/cache");
  (revalidateTag as (tag: string) => void)("parametres_contact");
  return { success: true };
}

/**
 * Délais du cycle transport.
 *
 * L'un d'eux décide d'une **rétention de caution** : c'est un montant, donc
 * propriétaire seul, comme tout ce qui touche à l'argent dans ce projet.
 */
export async function modifierDelaisTransport(
  _prev: TarifState,
  formData: FormData
): Promise<TarifState> {
  const userId = await requireProprietaireAvecId();
  const admin = getAdmin();

  const champs = {
    delai_negociation_heures: Number(formData.get("delai_negociation_heures")),
    delai_sans_reponse_heures: Number(formData.get("delai_sans_reponse_heures")),
    delai_non_presentation_heures: Number(formData.get("delai_non_presentation_heures")),
  };

  for (const [nom, valeur] of Object.entries(champs)) {
    // Un délai nul ferait expirer instantanément tout ce qui entre dans le
    // circuit : les demandes seraient annulées avant d'être vues. Une semaine
    // est la borne haute au-delà de laquelle l'expiration ne protège plus rien.
    if (!Number.isFinite(valeur) || valeur <= 0 || valeur > 168) {
      return { error: `Le délai « ${nom} » doit être compris entre 0 et 168 heures.` };
    }
  }

  const jours = formData
    .getAll("jours_ouvres")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 7);
  const ouverture = (formData.get("heure_ouverture") as string) || "08:00";
  const fermeture = (formData.get("heure_fermeture") as string) || "18:00";

  // Sans jour ouvré, ou avec une fermeture avant l'ouverture, aucun délai ne
  // s'épuiserait jamais : le code retomberait sur un décompte calendaire sans
  // que personne l'ait voulu. Mieux vaut refuser la saisie.
  if (jours.length === 0) {
    return { error: "Sélectionnez au moins un jour d'ouverture." };
  }
  if (ouverture >= fermeture) {
    return { error: "L'heure de fermeture doit suivre l'heure d'ouverture." };
  }

  const modes = {
    delai_negociation_ouvre: formData.get("delai_negociation_ouvre") === "on",
    delai_sans_reponse_ouvre: formData.get("delai_sans_reponse_ouvre") === "on",
    delai_non_presentation_ouvre: formData.get("delai_non_presentation_ouvre") === "on",
  };

  const { data: ancien } = await admin
    .from("parametres_transport")
    .select("*")
    .eq("id", true)
    .maybeSingle();

  const { error } = await admin
    .from("parametres_transport")
    .update({
      ...champs,
      ...modes,
      jours_ouvres: jours,
      heure_ouverture: ouverture,
      heure_fermeture: fermeture,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: "modifier_delais_transport",
    tableName: "parametres_transport",
    oldValues: ancien ?? undefined,
    newValues: { ...champs, ...modes, jours, ouverture, fermeture },
  });

  // Next 16 type revalidateTag(tag, profile) mais 1 arg suffit à l'exécution
  // (même contournement que public-cache.ts et biens.ts).
  (revalidateTag as (tag: string) => void)("parametres-transport");
  revalidatePath("/admin/tarifs");
  revalidatePath("/admin/demandes");
  return { success: true };
}
