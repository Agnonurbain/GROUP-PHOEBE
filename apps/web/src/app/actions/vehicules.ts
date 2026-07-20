"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireStaff() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.sub)
    .single();
  if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
    throw new Error("Accès refusé");
  }
  return supabase;
}

function num(val: FormDataEntryValue | null): number | null {
  if (!val || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function str(val: FormDataEntryValue | null): string | null {
  return val && val !== "" ? (val as string) : null;
}

function numCaution(val: FormDataEntryValue | null): number | null {
  const n = num(val);
  if (n === null) return null;
  if (n < 1 || n > 99) return null;
  return n / 100;
}

export type VehiculeState = {
  error?: string;
  success?: boolean;
};


export async function creerVehicule(
  _prev: VehiculeState,
  formData: FormData
): Promise<VehiculeState> {
  const supabase = await requireStaff();

  const categorie = formData.get("categorie") as string;
  const marque = formData.get("marque") as string;
  const modele = formData.get("modele") as string;

  if (!categorie || !marque || !modele) {
    return { error: "Catégorie, marque et modèle sont obligatoires." };
  }

  const prixVente = num(formData.get("prix_vente"));
  const quantite = Math.max(1, Math.min(20, num(formData.get("quantite")) ?? 1));
  const etat = (formData.get("etat") as string) || "occasion";

  const baseRow = {
    categorie: categorie as "leger" | "car" | "minibus",
    marque,
    modele,
    annee: num(formData.get("annee")),
    nb_places: num(formData.get("nb_places")),
    climatisation: formData.get("climatisation") === "on",
    boite: (str(formData.get("boite")) as "automatique" | "manuelle") ?? null,
    carburant: str(formData.get("carburant")),
    kilometrage: num(formData.get("kilometrage")),
    localisation: str(formData.get("localisation")),
    prix_journalier: num(formData.get("prix_journalier")),
    prix_mensuel: num(formData.get("prix_mensuel")),
    prix_vente: prixVente,
    chauffeur_disponible: formData.get("chauffeur_disponible") === "on",
    camera_interieure: formData.get("camera_interieure") === "on",
    gps: formData.get("gps") === "on",
    etat: etat as "neuf" | "occasion",
    niveau_carburant: (str(formData.get("niveau_carburant")) as "vide" | "quart" | "demi" | "trois_quarts" | "plein") ?? null,
    taux_caution: numCaution(formData.get("taux_caution")),
    caution_base_fcfa: num(formData.get("caution_base_fcfa")),
    description: str(formData.get("description")),
    statut: "disponible" as const,
  };

  const rows = Array.from({ length: quantite }, () => ({ ...baseRow }));

  const { data, error } = await supabase
    .from("vehicules")
    .insert(rows)
    .select("id");

  if (error) return { error: error.message };

  const chauffeurIds = formData.getAll("chauffeur_ids") as string[];
  if (chauffeurIds.length > 0 && data.length > 0) {
    const links = data.flatMap((v) =>
      chauffeurIds.map((cid) => ({ vehicule_id: v.id, chauffeur_id: cid }))
    );
    await supabase.from("vehicule_chauffeurs").insert(links);
  }

  redirect(`/admin/vehicules/${data[0].id}`);
}

export async function modifierVehicule(
  _prev: VehiculeState,
  formData: FormData
): Promise<VehiculeState> {
  const supabase = await requireStaff();

  const id = formData.get("id") as string;
  const categorie = formData.get("categorie") as string;
  const marque = formData.get("marque") as string;
  const modele = formData.get("modele") as string;
  const statut = formData.get("statut") as string;

  if (!id || !categorie || !marque || !modele) {
    return { error: "Catégorie, marque et modèle sont obligatoires." };
  }

  let assurancePath: string | undefined;
  const assuranceFile = formData.get("assurance") as File;
  if (assuranceFile && assuranceFile.size > 0) {
    const ext = assuranceFile.name.split(".").pop() ?? "pdf";
    const path = `${id}/assurance.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("vehicle-documents")
      .upload(path, await assuranceFile.arrayBuffer(), {
        contentType: assuranceFile.type,
        upsert: true,
      });
    if (upErr) return { error: `Upload assurance : ${upErr.message}` };
    assurancePath = path;
  }

  const prixVente = num(formData.get("prix_vente"));

  const etat = (formData.get("etat") as string) || "occasion";

  const { error } = await supabase
    .from("vehicules")
    .update({
      categorie: categorie as "leger" | "car" | "minibus",
      marque,
      modele,
      annee: num(formData.get("annee")),
      nb_places: num(formData.get("nb_places")),
      climatisation: formData.get("climatisation") === "on",
      boite:
        (str(formData.get("boite")) as "automatique" | "manuelle") ?? null,
      carburant: str(formData.get("carburant")),
      kilometrage: num(formData.get("kilometrage")),
      localisation: str(formData.get("localisation")),
      prix_journalier: num(formData.get("prix_journalier")),
      prix_mensuel: num(formData.get("prix_mensuel")),
      prix_vente: prixVente,
      chauffeur_disponible: formData.get("chauffeur_disponible") === "on",
      camera_interieure: formData.get("camera_interieure") === "on",
      gps: formData.get("gps") === "on",
      etat: etat as "neuf" | "occasion",
      niveau_carburant: (str(formData.get("niveau_carburant")) as "vide" | "quart" | "demi" | "trois_quarts" | "plein") ?? null,
      taux_caution: numCaution(formData.get("taux_caution")),
      caution_base_fcfa: num(formData.get("caution_base_fcfa")),
      description: str(formData.get("description")),
      statut: statut as
        | "disponible"
        | "reserve"
        | "loue"
        | "vendu"
        | "indisponible",
      ...(assurancePath ? { assurance_url: assurancePath } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  const chauffeurIds = formData.getAll("chauffeur_ids") as string[];
  await supabase.rpc("sync_vehicule_chauffeurs", {
    p_vehicule_id: id,
    p_chauffeur_ids: chauffeurIds,
  });

  const quantiteSupp = Math.max(0, Math.min(20, num(formData.get("quantite")) ?? 0));
  if (quantiteSupp > 0) {
    const copies = Array.from({ length: quantiteSupp }, () => ({
      categorie: categorie as "leger" | "car" | "minibus",
      marque,
      modele,
      annee: num(formData.get("annee")),
      nb_places: num(formData.get("nb_places")),
      climatisation: formData.get("climatisation") === "on",
      boite: (str(formData.get("boite")) as "automatique" | "manuelle") ?? null,
      carburant: str(formData.get("carburant")),
      kilometrage: num(formData.get("kilometrage")),
      localisation: str(formData.get("localisation")),
      prix_journalier: num(formData.get("prix_journalier")),
      prix_mensuel: num(formData.get("prix_mensuel")),
      prix_vente: prixVente,
      chauffeur_disponible: formData.get("chauffeur_disponible") === "on",
      camera_interieure: formData.get("camera_interieure") === "on",
      gps: formData.get("gps") === "on",
      etat: etat as "neuf" | "occasion",
      niveau_carburant: (str(formData.get("niveau_carburant")) as "vide" | "quart" | "demi" | "trois_quarts" | "plein") ?? null,
      taux_caution: numCaution(formData.get("taux_caution")),
      caution_base_fcfa: num(formData.get("caution_base_fcfa")),
      description: str(formData.get("description")),
      statut: "disponible" as const,
    }));
    await supabase.from("vehicules").insert(copies);
  }

  revalidatePath(`/admin/vehicules/${id}`);
  revalidatePath("/admin/vehicules");
  revalidatePath("/catalogue");
  return { success: true };
}

export async function supprimerVehicule(id: string): Promise<VehiculeState> {
  const supabase = await requireStaff();

  const { data: photos } = await supabase
    .from("vehicule_photos")
    .select("url")
    .eq("vehicule_id", id);

  if (photos && photos.length > 0) {
    const paths = photos
      .map((p) => {
        try {
          const url = new URL(p.url);
          return decodeURIComponent(
            url.pathname.split("/storage/v1/object/public/vehicle-photos/")[1]
          );
        } catch {
          return null;
        }
      })
      .filter(Boolean) as string[];
    if (paths.length > 0) {
      await supabase.storage.from("vehicle-photos").remove(paths);
    }
  }

  const { error } = await supabase.from("vehicules").delete().eq("id", id);
  if (error) return { error: error.message };

  redirect("/admin/vehicules");
}

export async function ajouterPhotos(
  _prev: VehiculeState,
  formData: FormData
): Promise<VehiculeState> {
  const supabase = await requireStaff();

  const vehiculeId = formData.get("vehicule_id") as string;
  const files = formData.getAll("photos") as File[];

  if (!vehiculeId || files.length === 0 || !files[0].size) {
    return { error: "Sélectionnez au moins une photo." };
  }

  const { data: existing } = await supabase
    .from("vehicule_photos")
    .select("ordre")
    .eq("vehicule_id", vehiculeId)
    .order("ordre", { ascending: false })
    .limit(1);

  let nextOrder = (existing?.[0]?.ordre ?? -1) + 1;

  for (const file of files) {
    if (!file.size) continue;

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${vehiculeId}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("vehicle-photos")
      .upload(path, await file.arrayBuffer(), { contentType: file.type });

    if (upErr) return { error: `Upload erreur : ${upErr.message}` };

    const {
      data: { publicUrl },
    } = supabase.storage.from("vehicle-photos").getPublicUrl(path);

    await supabase.from("vehicule_photos").insert({
      vehicule_id: vehiculeId,
      url: publicUrl,
      ordre: nextOrder++,
    });
  }

  revalidatePath(`/admin/vehicules/${vehiculeId}`);
  return { success: true };
}

export async function supprimerPhoto(photoId: string): Promise<VehiculeState> {
  const supabase = await requireStaff();

  const { data: photo } = await supabase
    .from("vehicule_photos")
    .select("*")
    .eq("id", photoId)
    .single();
  if (!photo) return { error: "Photo introuvable." };

  try {
    const url = new URL(photo.url);
    const storagePath = decodeURIComponent(
      url.pathname.split("/storage/v1/object/public/vehicle-photos/")[1]
    );
    if (storagePath) {
      await supabase.storage.from("vehicle-photos").remove([storagePath]);
    }
  } catch {
    /* URL malformée — on supprime quand même la row */
  }

  await supabase.from("vehicule_photos").delete().eq("id", photoId);

  revalidatePath(`/admin/vehicules/${photo.vehicule_id}`);
  return { success: true };
}

export async function reordonnerPhoto(
  photoId: string,
  direction: "up" | "down"
): Promise<VehiculeState> {
  const supabase = await requireStaff();

  const { data: photo } = await supabase
    .from("vehicule_photos")
    .select("*")
    .eq("id", photoId)
    .single();
  if (!photo) return { error: "Photo introuvable." };

  let query = supabase
    .from("vehicule_photos")
    .select("*")
    .eq("vehicule_id", photo.vehicule_id);

  if (direction === "up") {
    query = query.lt("ordre", photo.ordre).order("ordre", { ascending: false });
  } else {
    query = query.gt("ordre", photo.ordre).order("ordre", { ascending: true });
  }

  const { data: adjacent } = await query.limit(1).single();
  if (!adjacent) return { success: true };

  await supabase
    .from("vehicule_photos")
    .update({ ordre: adjacent.ordre })
    .eq("id", photo.id);
  await supabase
    .from("vehicule_photos")
    .update({ ordre: photo.ordre })
    .eq("id", adjacent.id);

  revalidatePath(`/admin/vehicules/${photo.vehicule_id}`);
  return { success: true };
}
