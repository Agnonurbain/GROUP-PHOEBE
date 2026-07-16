"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { expirerReservationsAbandonnees } from "@/lib/payments/expiration";
import { expirerDemandesSansReponse, expirerNonPresentations } from "@/lib/payments/expiration-demandes";

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

export type DispoState = {
  error?: string;
  success?: boolean;
};

export async function ajouterBlocageVehicule(
  _prev: DispoState,
  formData: FormData
): Promise<DispoState> {
  const supabase = await requireStaff();

  const vehiculeId = formData.get("vehicule_id") as string;
  const debut = formData.get("debut") as string;
  const fin = formData.get("fin") as string;
  const type = formData.get("type") as string;

  if (!vehiculeId || !debut || !fin) {
    return { error: "Véhicule, date de début et date de fin sont obligatoires." };
  }

  if (new Date(fin) <= new Date(debut)) {
    return { error: "La date de fin doit être postérieure à la date de début." };
  }

  if (!["maintenance", "bloque"].includes(type)) {
    return { error: "Type invalide." };
  }

  const periode = `[${new Date(debut).toISOString()},${new Date(fin).toISOString()})`;

  const { error } = await supabase.from("disponibilites_vehicule").insert({
    vehicule_id: vehiculeId,
    periode,
    type: type as "maintenance" | "bloque",
  });

  if (error) {
    if (error.code === "23P01") {
      return { error: "Cette période chevauche un blocage ou une réservation existante." };
    }
    return { error: error.message };
  }

  revalidatePath(`/admin/vehicules/${vehiculeId}/disponibilites`);
  return { success: true };
}

export async function supprimerBlocageVehicule(
  blocageId: string,
  vehiculeId: string
): Promise<DispoState> {
  const supabase = await requireStaff();

  const { error } = await supabase
    .from("disponibilites_vehicule")
    .delete()
    .eq("id", blocageId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/vehicules/${vehiculeId}/disponibilites`);
  return { success: true };
}

export async function ajouterBlocageChauffeur(
  _prev: DispoState,
  formData: FormData
): Promise<DispoState> {
  const supabase = await requireStaff();

  const chauffeurId = formData.get("chauffeur_id") as string;
  const debut = formData.get("debut") as string;
  const fin = formData.get("fin") as string;

  if (!chauffeurId || !debut || !fin) {
    return { error: "Chauffeur, date de début et date de fin sont obligatoires." };
  }

  if (new Date(fin) <= new Date(debut)) {
    return { error: "La date de fin doit être postérieure à la date de début." };
  }

  const periode = `[${new Date(debut).toISOString()},${new Date(fin).toISOString()})`;

  const { error } = await supabase.from("disponibilites_chauffeur").insert({
    chauffeur_id: chauffeurId,
    periode,
  });

  if (error) {
    if (error.code === "23P01") {
      return { error: "Cette période chevauche un blocage existant pour ce chauffeur." };
    }
    return { error: error.message };
  }

  revalidatePath(`/admin/vehicules/${formData.get("vehicule_id")}/disponibilites`);
  return { success: true };
}

export async function supprimerBlocageChauffeur(
  blocageId: string,
  vehiculeId: string
): Promise<DispoState> {
  const supabase = await requireStaff();

  const { error } = await supabase
    .from("disponibilites_chauffeur")
    .delete()
    .eq("id", blocageId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/vehicules/${vehiculeId}/disponibilites`);
  return { success: true };
}

export async function verifierDisponibilite(
  vehiculeId: string,
  debut: string,
  fin: string,
  avecChauffeur: boolean
): Promise<{ disponible: boolean; raison?: string }> {
  await Promise.all([
    expirerReservationsAbandonnees(),
    expirerDemandesSansReponse(),
    expirerNonPresentations(),
  ]);

  const supabase = await createClient();

  const periode = `[${new Date(debut).toISOString()},${new Date(fin).toISOString()})`;

  const { data: conflitsVehicule } = await supabase
    .from("disponibilites_vehicule")
    .select("id, type, periode")
    .eq("vehicule_id", vehiculeId)
    .overlaps("periode", periode);

  if (conflitsVehicule && conflitsVehicule.length > 0) {
    const types = conflitsVehicule.map((c) => c.type);
    if (types.includes("reservation")) {
      return { disponible: false, raison: "Ce véhicule est déjà réservé sur cette période." };
    }
    return { disponible: false, raison: "Ce véhicule est indisponible sur cette période (maintenance ou blocage)." };
  }

  if (avecChauffeur) {
    const { data: vehicule } = await supabase
      .from("vehicules")
      .select("chauffeur_disponible")
      .eq("id", vehiculeId)
      .single();

    if (!vehicule?.chauffeur_disponible) {
      return { disponible: false, raison: "Ce véhicule ne propose pas l'option chauffeur." };
    }

    const { data: vcLinks } = await supabase
      .from("vehicule_chauffeurs")
      .select("chauffeur_id")
      .eq("vehicule_id", vehiculeId);

    const chauffeurIds = vcLinks?.map((l) => l.chauffeur_id) ?? [];
    if (chauffeurIds.length === 0) {
      return { disponible: false, raison: "Aucun chauffeur n'est affecté à ce véhicule pour le moment." };
    }

    let auMoinsUnDisponible = false;
    for (const cid of chauffeurIds) {
      const { data: conflits } = await supabase
        .from("disponibilites_chauffeur")
        .select("id")
        .eq("chauffeur_id", cid)
        .overlaps("periode", periode);

      if (!conflits || conflits.length === 0) {
        auMoinsUnDisponible = true;
        break;
      }
    }

    if (!auMoinsUnDisponible) {
      return { disponible: false, raison: "Aucun chauffeur n'est disponible sur cette période." };
    }
  }

  return { disponible: true };
}
