"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { compressImage } from "@/lib/compress-image";
import { validateImageUpload } from "@/lib/upload-validation";
import type { Database } from "@group-phoebe/database/types";

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
  if (!profile || !["operateur", "proprietaire", "agent_immobilier"].includes(profile.role)) {
    throw new Error("Accès refusé");
  }
  return { supabase, role: profile.role as string };
}

// `prix` est un montant facturé : seul le propriétaire le fixe, comme les champs
// tarifaires des véhicules (cf. CHAMPS_PRIX dans vehicules.ts). Verrouillé par
// __tests__/prix-proprietaire.test.ts et, pour l'accès REST direct, par le
// trigger garde_prix_biens (migration 00049).
const CHAMPS_PRIX = ["prix"] as const;

function retirerChampsPrix<T extends Record<string, unknown>>(row: T): T {
  const copie = { ...row };
  for (const champ of CHAMPS_PRIX) delete copie[champ];
  return copie;
}

async function requireProprietaireAvecId() {
  const { supabase, role } = await requireStaff();
  if (role !== "proprietaire") throw new Error("Accès refusé : propriétaire requis");
  return supabase;
}

/**
 * Gérer le catalogue (biens et photos) est réservé à l'opérateur et au
 * propriétaire : c'est ce que disent les policies `biens_staff_manage` et
 * `bien_medias_staff_manage`, toutes deux fondées sur `is_staff()`, qui ne
 * couvre pas `agent_immobilier`.
 *
 * Sans cette garde, un agent passait `requireStaff()` puis écrivait avec sa
 * propre session : la RLS filtrait la ligne, l'UPDATE touchait zéro ligne, et
 * l'action répondait « Bien enregistré » sans avoir rien enregistré. Un refus
 * explicite vaut mieux qu'un succès mensonger — et mieux qu'une erreur Postgres
 * brute sur les chemins où la policy lève au lieu de filtrer.
 */
async function requireGestionBiens() {
  const { supabase, role } = await requireStaff();
  if (!["operateur", "proprietaire"].includes(role)) {
    throw new Error(
      "La gestion du catalogue est réservée aux opérateurs et au propriétaire. Un agent immobilier suit les demandes et les visites."
    );
  }
  return { supabase, role };
}

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Trouve un agent immobilier dont la zone_couverture correspond à la localisation. */
async function autoAssignAgent(localisation: string): Promise<string | null> {
  const admin = getAdmin();
  const { data: agents } = await admin
    .from("agents_immobiliers")
    .select("id, zone_couverture")
    .not("zone_couverture", "is", null);
  if (!agents || agents.length === 0) return null;

  const loc = localisation.toLowerCase();
  const match = agents.find((a) => a.zone_couverture && loc.includes(a.zone_couverture.toLowerCase()));
  return match?.id ?? null;
}

function num(val: FormDataEntryValue | null): number | null {
  if (!val || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function str(val: FormDataEntryValue | null): string | null {
  return val && val !== "" ? (val as string) : null;
}

const TYPES = ["terrain", "maison", "appartement", "bureau"] as const;
const TRANSACTIONS = ["vente", "location"] as const;
const STATUTS = ["disponible", "reserve", "loue", "vendu", "indisponible"] as const;

type BienType = (typeof TYPES)[number];
type BienTransaction = (typeof TRANSACTIONS)[number];
type BienStatut = (typeof STATUTS)[number];

export type BienState = {
  error?: string;
  success?: boolean;
};

function revalidateImmobilier(id?: string) {
  // Next 16 type revalidateTag(tag, profile) mais 1 arg suffit à l'exécution
  // (même contournement que public-cache.ts / tarifs-cache.ts).
  (revalidateTag as (tag: string) => void)("biens");
  revalidatePath("/admin/biens");
  if (id) revalidatePath(`/admin/biens/${id}`);
  revalidatePath("/immobilier");
}

// `avecPrix` distingue les deux cas : le propriétaire soumet un prix qu'il faut
// valider ; l'opérateur n'en soumet pas (champ désactivé côté formulaire) et il
// ne faut alors ni l'exiger ni l'écrire.
function parseBien(
  formData: FormData,
  { avecPrix }: { avecPrix: boolean }
): { row: Record<string, unknown> } | { error: string } {
  const type = formData.get("type") as string;
  const transaction = formData.get("transaction") as string;
  const localisation = str(formData.get("localisation"));

  if (!TYPES.includes(type as BienType)) return { error: "Type de bien invalide." };
  if (!TRANSACTIONS.includes(transaction as BienTransaction)) return { error: "Type de transaction invalide." };
  if (!localisation) return { error: "La localisation est obligatoire." };

  const row: Record<string, unknown> = {
    type: type as BienType,
    transaction: transaction as BienTransaction,
    localisation,
    nb_chambres: num(formData.get("nb_chambres")),
    surface_m2: num(formData.get("surface_m2")),
    description: str(formData.get("description")),
    agent_id: str(formData.get("agent_id")),
    // Colonnes présentes depuis 00001 mais jamais écrites : le formulaire les
    // ignorait, donc la géolocalisation des biens restait morte.
    latitude: num(formData.get("latitude")),
    longitude: num(formData.get("longitude")),
  };

  if (avecPrix) {
    const prix = num(formData.get("prix"));
    if (prix === null || prix <= 0) return { error: "Le prix doit être un montant positif." };
    row.prix = prix;
  }

  return { row };
}

// Créer un bien, c'est en fixer le prix : `biens.prix` est NOT NULL, il n'y a
// pas de création « sans montant » comme pour un véhicule. La création revient
// donc au propriétaire ; l'opérateur édite ensuite tout sauf le prix.
export async function creerBien(
  _prev: BienState,
  formData: FormData
): Promise<BienState> {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await requireProprietaireAvecId();
  } catch {
    return { error: "Seul le propriétaire peut créer un bien (il en fixe le prix)." };
  }

  const parsed = parseBien(formData, { avecPrix: true });
  if ("error" in parsed) return { error: parsed.error };

  const row = { ...parsed.row };

  // Auto-assignation par zone si aucun agent explicite
  if (!row.agent_id && typeof row.localisation === "string") {
    const agentId = await autoAssignAgent(row.localisation);
    if (agentId) row.agent_id = agentId;
  }

  const { data, error } = await supabase
    .from("biens")
    .insert({ ...row, statut: "disponible" } as never)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidateImmobilier();
  redirect(`/admin/biens/${(data as { id: string }).id}`);
}

export async function modifierBien(
  _prev: BienState,
  formData: FormData
): Promise<BienState> {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  let role: string;
  try {
    ({ supabase, role } = await requireGestionBiens());
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Accès refusé." };
  }
  const estProprietaire = role === "proprietaire";

  const id = formData.get("id") as string;
  if (!id) return { error: "Bien introuvable." };

  const parsed = parseBien(formData, { avecPrix: estProprietaire });
  if ("error" in parsed) return { error: parsed.error };

  // Ceinture et bretelles : le champ est désactivé côté formulaire, mais un
  // `prix` forgé dans la requête ne doit pas passer pour autant.
  const row = estProprietaire ? parsed.row : retirerChampsPrix(parsed.row);

  // Un statut hors liste était silencieusement remplacé par « disponible », ce
  // qui pouvait remettre en vente un bien déjà vendu. On refuse désormais.
  const statut = formData.get("statut") as string;
  if (statut && !STATUTS.includes(statut as BienStatut)) {
    return { error: "Statut de bien invalide." };
  }

  const { error } = await supabase
    .from("biens")
    .update({
      ...row,
      ...(statut ? { statut: statut as BienStatut } : {}),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateImmobilier(id);
  return { success: true };
}

export async function supprimerBien(id: string): Promise<BienState> {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    ({ supabase } = await requireGestionBiens());
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Accès refusé." };
  }

  // Retire d'abord les fichiers du bucket (les lignes bien_medias partent en
  // cascade avec le bien).
  const { data: medias } = await supabase
    .from("bien_medias")
    .select("url")
    .eq("bien_id", id);

  if (medias && medias.length > 0) {
    const paths = medias
      .map((m) => extractStoragePath(m.url))
      .filter(Boolean) as string[];
    if (paths.length > 0) {
      await supabase.storage.from("bien-photos").remove(paths);
    }
  }

  const { error } = await supabase.from("biens").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidateImmobilier();
  redirect("/admin/biens");
}

function extractStoragePath(url: string): string | null {
  try {
    const u = new URL(url);
    return decodeURIComponent(
      u.pathname.split("/storage/v1/object/public/bien-photos/")[1]
    );
  } catch {
    return null;
  }
}

export async function ajouterPhotosBien(
  _prev: BienState,
  formData: FormData
): Promise<BienState> {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    ({ supabase } = await requireGestionBiens());
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Accès refusé." };
  }

  const bienId = formData.get("bien_id") as string;
  const files = formData.getAll("photos") as File[];

  if (!bienId || files.length === 0 || !files[0].size) {
    return { error: "Sélectionnez au moins une photo." };
  }

  const { data: existing } = await supabase
    .from("bien_medias")
    .select("ordre")
    .eq("bien_id", bienId)
    .order("ordre", { ascending: false })
    .limit(1);

  let nextOrder = (existing?.[0]?.ordre ?? -1) + 1;

  for (const file of files) {
    if (!file.size) continue;

    let ext: string;
    try {
      ({ ext } = validateImageUpload(file));
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : "Photo invalide." };
    }

    const compressed = await compressImage(file);
    const path = `${bienId}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("bien-photos")
      .upload(path, await compressed.arrayBuffer(), { contentType: compressed.type });

    if (upErr) return { error: `Upload erreur : ${upErr.message}` };

    const {
      data: { publicUrl },
    } = supabase.storage.from("bien-photos").getPublicUrl(path);

    await supabase.from("bien_medias").insert({
      bien_id: bienId,
      type: "photo",
      url: publicUrl,
      ordre: nextOrder++,
    } as never);
  }

  revalidateImmobilier(bienId);
  return { success: true };
}

export async function supprimerPhotoBien(mediaId: string): Promise<BienState> {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    ({ supabase } = await requireGestionBiens());
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Accès refusé." };
  }

  const { data: media } = await supabase
    .from("bien_medias")
    .select("*")
    .eq("id", mediaId)
    .single();
  if (!media) return { error: "Photo introuvable." };

  const path = extractStoragePath(media.url);
  if (path) {
    await supabase.storage.from("bien-photos").remove([path]);
  }

  await supabase.from("bien_medias").delete().eq("id", mediaId);

  revalidateImmobilier(media.bien_id);
  return { success: true };
}

export async function reordonnerPhotoBien(
  mediaId: string,
  direction: "up" | "down"
): Promise<BienState> {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    ({ supabase } = await requireGestionBiens());
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Accès refusé." };
  }

  const { data: media } = await supabase
    .from("bien_medias")
    .select("*")
    .eq("id", mediaId)
    .single();
  if (!media) return { error: "Photo introuvable." };

  let query = supabase
    .from("bien_medias")
    .select("*")
    .eq("bien_id", media.bien_id);

  if (direction === "up") {
    query = query.lt("ordre", media.ordre).order("ordre", { ascending: false });
  } else {
    query = query.gt("ordre", media.ordre).order("ordre", { ascending: true });
  }

  const { data: adjacent } = await query.limit(1).single();
  if (!adjacent) return { success: true };

  await supabase.from("bien_medias").update({ ordre: adjacent.ordre } as never).eq("id", media.id);
  await supabase.from("bien_medias").update({ ordre: media.ordre } as never).eq("id", adjacent.id);

  revalidateImmobilier(media.bien_id);
  return { success: true };
}
