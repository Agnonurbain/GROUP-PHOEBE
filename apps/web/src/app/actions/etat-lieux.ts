"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { notifierClient } from "@/lib/notifications";
import { rembourserPaiement } from "@/lib/payments/expiration-demandes";

type Carburant = "vide" | "quart" | "demi" | "trois_quarts" | "plein";
const CARBURANTS: Carburant[] = ["vide", "quart", "demi", "trois_quarts", "plein"];

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
    throw new Error("Accès refusé");
  }
  return supabase;
}

export type EtatLieuxState = { error?: string; success?: boolean };

export async function enregistrerEtatLieuxDepart(
  _prev: EtatLieuxState,
  formData: FormData
): Promise<EtatLieuxState> {
  const supabase = await requireStaff();
  const admin = getAdmin();

  const demandeId = formData.get("demande_id") as string;
  const kilometrage = Number(formData.get("kilometrage"));
  const carburant = formData.get("carburant") as string;
  const photos = formData.getAll("photos") as File[];

  if (!demandeId || isNaN(kilometrage)) {
    return { error: "Demande et kilométrage sont obligatoires." };
  }
  if (!CARBURANTS.includes(carburant as Carburant)) {
    return { error: "Niveau de carburant invalide." };
  }

  const { data: demande } = await admin
    .from("demandes_transport")
    .select("*")
    .eq("id", demandeId)
    .single();

  if (!demande) return { error: "Demande introuvable." };
  if (demande.statut !== "acceptee") {
    return { error: "Cette demande doit être acceptée pour enregistrer l'état des lieux de départ." };
  }

  const photoUrls: string[] = [];
  for (const file of photos) {
    if (!file.size) continue;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `etat-lieux/${demandeId}/depart/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("vehicle-photos")
      .upload(path, await file.arrayBuffer(), { contentType: file.type });
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from("vehicle-photos").getPublicUrl(path);
      photoUrls.push(publicUrl);
    }
  }

  const { error } = await admin
    .from("demandes_transport")
    .update({
      statut: "en_cours",
      kilometrage_depart: kilometrage,
      carburant_depart: carburant as Carburant,
      etat_lieux_depart_photos: photoUrls.length > 0 ? photoUrls : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", demandeId)
    .eq("statut", "acceptee");

  if (error) return { error: error.message };

  if (demande.vehicule_id) {
    await admin
      .from("vehicules")
      .update({ statut: "loue", updated_at: new Date().toISOString() })
      .eq("id", demande.vehicule_id);
  }

  await notifierClient(
    demande.client_id,
    "Véhicule pris en charge",
    `L'état des lieux de départ a été enregistré. Bonne route !`
  );

  revalidatePath(`/admin/demandes/${demandeId}/etat-lieux`);
  revalidatePath("/admin/demandes");
  return { success: true };
}

export async function enregistrerEtatLieuxRetour(
  _prev: EtatLieuxState,
  formData: FormData
): Promise<EtatLieuxState> {
  const supabase = await requireStaff();
  const admin = getAdmin();

  const demandeId = formData.get("demande_id") as string;
  const kilometrage = Number(formData.get("kilometrage"));
  const carburant = formData.get("carburant") as string;
  const montantCautionRetenu = Number(formData.get("caution_retenue") || 0);
  const photos = formData.getAll("photos") as File[];

  if (!demandeId || isNaN(kilometrage)) {
    return { error: "Demande et kilométrage sont obligatoires." };
  }
  if (!CARBURANTS.includes(carburant as Carburant)) {
    return { error: "Niveau de carburant invalide." };
  }

  const { data: demande } = await admin
    .from("demandes_transport")
    .select("*")
    .eq("id", demandeId)
    .single();

  if (!demande) return { error: "Demande introuvable." };
  if (demande.statut !== "en_cours") {
    return { error: "L'état des lieux de départ doit être fait avant le retour." };
  }

  const cautionMax = demande.caution ? Number(demande.caution) : 0;
  if (montantCautionRetenu < 0 || montantCautionRetenu > cautionMax) {
    return { error: `Le montant retenu doit être entre 0 et ${cautionMax.toLocaleString("fr-FR")} FCFA.` };
  }

  const photoUrls: string[] = [];
  for (const file of photos) {
    if (!file.size) continue;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `etat-lieux/${demandeId}/retour/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("vehicle-photos")
      .upload(path, await file.arrayBuffer(), { contentType: file.type });
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from("vehicle-photos").getPublicUrl(path);
      photoUrls.push(publicUrl);
    }
  }

  const { error } = await admin
    .from("demandes_transport")
    .update({
      statut: "terminee",
      kilometrage_retour: kilometrage,
      carburant_retour: carburant as Carburant,
      etat_lieux_retour_photos: photoUrls.length > 0 ? photoUrls : null,
      caution_retenue: montantCautionRetenu,
      updated_at: new Date().toISOString(),
    })
    .eq("id", demandeId)
    .eq("statut", "en_cours");

  if (error) return { error: error.message };

  if (demande.vehicule_id) {
    await admin
      .from("vehicules")
      .update({ statut: "disponible", updated_at: new Date().toISOString() })
      .eq("id", demande.vehicule_id);
  }

  if (demande.vehicule_id && demande.periode) {
    await admin
      .from("disponibilites_vehicule")
      .delete()
      .eq("vehicule_id", demande.vehicule_id)
      .eq("type", "reservation")
      .eq("periode", demande.periode);
  }
  if (demande.chauffeur_id && demande.periode) {
    await admin
      .from("disponibilites_chauffeur")
      .delete()
      .eq("chauffeur_id", demande.chauffeur_id)
      .eq("periode", demande.periode);
  }

  const montantLocation = demande.montant ? Number(demande.montant) : 0;
  await rembourserPaiement(admin, demandeId, montantLocation + montantCautionRetenu);

  const montantCautionLibere = cautionMax - montantCautionRetenu;
  const msgCaution = montantCautionRetenu >= cautionMax
    ? `La caution de ${cautionMax.toLocaleString("fr-FR")} FCFA a été retenue suite à l'état du véhicule constaté.`
    : montantCautionRetenu > 0
      ? `${montantCautionRetenu.toLocaleString("fr-FR")} FCFA retenus sur la caution. Le reste (${montantCautionLibere.toLocaleString("fr-FR")} FCFA) sera remboursé sous 48h.`
      : "Votre caution sera intégralement remboursée sous 48h.";

  await notifierClient(
    demande.client_id,
    "Location terminée",
    `L'état des lieux de retour a été enregistré. ${msgCaution} Vous pouvez maintenant noter votre expérience.`
  );

  revalidatePath(`/admin/demandes/${demandeId}/etat-lieux`);
  revalidatePath("/admin/demandes");
  return { success: true };
}
