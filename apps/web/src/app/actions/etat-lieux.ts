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

  const { data: clientProfile } = await admin
    .from("users")
    .select("statut_verification")
    .eq("id", demande.client_id)
    .single();

  if (!clientProfile || clientProfile.statut_verification !== "verifie") {
    return { error: "L'identité du client n'est pas encore vérifiée. L'état des lieux ne peut pas être enregistré." };
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

  let supplementKm = 0;
  const kmDepart = demande.kilometrage_depart ? Number(demande.kilometrage_depart) : null;
  if (kmDepart !== null && kilometrage > kmDepart && demande.destination) {
    const { data: commune } = await admin
      .from("communes")
      .select("zone_id")
      .eq("nom", demande.destination)
      .single();

    if (commune?.zone_id) {
      const { data: zoneData } = await (admin.from as Function)("zones_tarifaires")
        .select("km_inclus_par_jour, supplement_km_fcfa")
        .eq("id", commune.zone_id)
        .single();

      if (zoneData) {
        const kmParcourus = kilometrage - kmDepart;
        let nbJours = 1;
        if (demande.periode) {
          const parts = demande.periode.replace(/[\[\]()]/g, "").split(",");
          if (parts.length === 2) {
            const d0 = new Date(parts[0].trim());
            const d1 = new Date(parts[1].trim());
            nbJours = Math.max(1, Math.ceil((d1.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24)));
          }
        }
        const kmAutorise = (zoneData as { km_inclus_par_jour: number; supplement_km_fcfa: number }).km_inclus_par_jour * nbJours;
        const kmExcedent = kmParcourus - kmAutorise;
        if (kmExcedent > 0) {
          supplementKm = kmExcedent * (zoneData as { km_inclus_par_jour: number; supplement_km_fcfa: number }).supplement_km_fcfa;
        }
      }
    }
  }

  const totalRetenu = montantCautionRetenu + supplementKm;
  if (totalRetenu < 0 || totalRetenu > cautionMax) {
    return { error: `Le montant total retenu (${totalRetenu.toLocaleString("fr-FR")} FCFA dont ${supplementKm.toLocaleString("fr-FR")} FCFA de supplément km) dépasse la caution de ${cautionMax.toLocaleString("fr-FR")} FCFA.` };
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
      statut: "retour_en_inspection" as never,
      kilometrage_retour: kilometrage,
      carburant_retour: carburant as Carburant,
      etat_lieux_retour_photos: photoUrls.length > 0 ? photoUrls : null,
      caution_retenue: totalRetenu,
      updated_at: new Date().toISOString(),
    })
    .eq("id", demandeId)
    .eq("statut", "en_cours");

  if (error) return { error: error.message };

  await notifierClient(
    demande.client_id,
    "Véhicule retourné — inspection en cours",
    `L'état des lieux de retour a été enregistré. L'inspection du véhicule est en cours.`
  );

  revalidatePath(`/admin/demandes/${demandeId}/etat-lieux`);
  revalidatePath("/admin/demandes");
  return { success: true };
}

export async function finaliserInspection(
  _prev: EtatLieuxState,
  formData: FormData
): Promise<EtatLieuxState> {
  await requireStaff();
  const admin = getAdmin();

  const demandeId = formData.get("demande_id") as string;
  const cautionRetenue = Number(formData.get("caution_retenue") || 0);

  if (!demandeId) return { error: "Demande obligatoire." };

  const { data: demande } = await admin
    .from("demandes_transport")
    .select("*")
    .eq("id", demandeId)
    .single();

  if (!demande) return { error: "Demande introuvable." };
  if ((demande.statut as string) !== "retour_en_inspection") {
    return { error: "Cette demande n'est pas en inspection." };
  }

  const cautionMax = demande.caution ? Number(demande.caution) : 0;
  const totalRetenu = Math.min(Math.max(0, cautionRetenue), cautionMax);

  const { error } = await admin
    .from("demandes_transport")
    .update({
      statut: "terminee",
      caution_retenue: totalRetenu,
      updated_at: new Date().toISOString(),
    })
    .eq("id", demandeId);

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
  await rembourserPaiement(admin, demandeId, montantLocation + totalRetenu);

  const montantCautionLibere = cautionMax - totalRetenu;
  const msgCaution = totalRetenu >= cautionMax
    ? `La caution de ${cautionMax.toLocaleString("fr-FR")} FCFA a été retenue suite à l'inspection.`
    : totalRetenu > 0
      ? `${totalRetenu.toLocaleString("fr-FR")} FCFA retenus sur la caution. Le reste (${montantCautionLibere.toLocaleString("fr-FR")} FCFA) sera remboursé sous 48h.`
      : "Votre caution sera intégralement remboursée sous 48h.";

  await notifierClient(
    demande.client_id,
    "Inspection terminée — location clôturée",
    `L'inspection du véhicule est terminée. ${msgCaution}`
  );

  revalidatePath(`/admin/demandes/${demandeId}/etat-lieux`);
  revalidatePath("/admin/demandes");
  return { success: true };
}
