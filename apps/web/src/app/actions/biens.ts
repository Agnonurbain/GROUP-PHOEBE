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
  return supabase;
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

function parseBien(formData: FormData): { row: Record<string, unknown> } | { error: string } {
  const type = formData.get("type") as string;
  const transaction = formData.get("transaction") as string;
  const localisation = str(formData.get("localisation"));
  const prix = num(formData.get("prix"));

  if (!TYPES.includes(type as BienType)) return { error: "Type de bien invalide." };
  if (!TRANSACTIONS.includes(transaction as BienTransaction)) return { error: "Type de transaction invalide." };
  if (!localisation) return { error: "La localisation est obligatoire." };
  if (prix === null || prix <= 0) return { error: "Le prix doit être un montant positif." };

  return {
    row: {
      type: type as BienType,
      transaction: transaction as BienTransaction,
      prix,
      localisation,
      nb_chambres: num(formData.get("nb_chambres")),
      surface_m2: num(formData.get("surface_m2")),
      description: str(formData.get("description")),
      agent_id: str(formData.get("agent_id")),
    },
  };
}

export async function creerBien(
  _prev: BienState,
  formData: FormData
): Promise<BienState> {
  const supabase = await requireStaff();

  const parsed = parseBien(formData);
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
  const supabase = await requireStaff();

  const id = formData.get("id") as string;
  if (!id) return { error: "Bien introuvable." };

  const parsed = parseBien(formData);
  if ("error" in parsed) return { error: parsed.error };

  const statut = formData.get("statut") as string;
  const statutValide = STATUTS.includes(statut as BienStatut)
    ? (statut as BienStatut)
    : "disponible";

  const { error } = await supabase
    .from("biens")
    .update({
      ...parsed.row,
      statut: statutValide,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateImmobilier(id);
  return { success: true };
}

export async function supprimerBien(id: string): Promise<BienState> {
  const supabase = await requireStaff();

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
  const supabase = await requireStaff();

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
  const supabase = await requireStaff();

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
  const supabase = await requireStaff();

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
