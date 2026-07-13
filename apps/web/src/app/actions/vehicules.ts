"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
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

export type VehiculeState = {
  error?: string;
  success?: boolean;
};

function checkSaleDocuments(
  statut: string,
  prixVente: number | null,
  carteGrise: string | null | undefined,
  certificat: string | null | undefined
): VehiculeState | null {
  if (
    statut === "disponible" &&
    prixVente &&
    prixVente > 0 &&
    (!carteGrise || !certificat)
  ) {
    return {
      error:
        "Une annonce de vente nécessite la carte grise et le certificat de non-gage avant publication.",
    };
  }
  return null;
}

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
  const statut = "indisponible";

  const saleCheck = checkSaleDocuments(statut, prixVente, null, null);
  if (saleCheck) return saleCheck;

  const { data, error } = await supabase
    .from("vehicules")
    .insert({
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
      description: str(formData.get("description")),
      statut: statut as "indisponible",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  redirect(`/admin/vehicules/${data.id}`);
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

  let carteGrisePath: string | undefined;
  const carteGrise = formData.get("carte_grise") as File;
  if (carteGrise && carteGrise.size > 0) {
    const ext = carteGrise.name.split(".").pop() ?? "pdf";
    const path = `${id}/carte_grise.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("vehicle-documents")
      .upload(path, await carteGrise.arrayBuffer(), {
        contentType: carteGrise.type,
        upsert: true,
      });
    if (upErr) return { error: `Upload carte grise : ${upErr.message}` };
    carteGrisePath = path;
  }

  let certificatPath: string | undefined;
  const certificat = formData.get("certificat_non_gage") as File;
  if (certificat && certificat.size > 0) {
    const ext = certificat.name.split(".").pop() ?? "pdf";
    const path = `${id}/certificat_non_gage.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("vehicle-documents")
      .upload(path, await certificat.arrayBuffer(), {
        contentType: certificat.type,
        upsert: true,
      });
    if (upErr) return { error: `Upload certificat : ${upErr.message}` };
    certificatPath = path;
  }

  const { data: current } = await supabase
    .from("vehicules")
    .select("carte_grise_url, certificat_non_gage_url")
    .eq("id", id)
    .single();

  const finalCarteGrise = carteGrisePath ?? current?.carte_grise_url;
  const finalCertificat = certificatPath ?? current?.certificat_non_gage_url;
  const prixVente = num(formData.get("prix_vente"));

  const saleCheck = checkSaleDocuments(statut, prixVente, finalCarteGrise, finalCertificat);
  if (saleCheck) return saleCheck;

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
      description: str(formData.get("description")),
      statut: statut as
        | "disponible"
        | "reserve"
        | "loue"
        | "vendu"
        | "indisponible",
      ...(carteGrisePath ? { carte_grise_url: carteGrisePath } : {}),
      ...(certificatPath ? { certificat_non_gage_url: certificatPath } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

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

  const { data: vehicle } = await supabase
    .from("vehicules")
    .select("carte_grise_url, certificat_non_gage_url")
    .eq("id", id)
    .single();

  const docPaths = [
    vehicle?.carte_grise_url,
    vehicle?.certificat_non_gage_url,
  ].filter(Boolean) as string[];
  if (docPaths.length > 0) {
    await supabase.storage.from("vehicle-documents").remove(docPaths);
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
