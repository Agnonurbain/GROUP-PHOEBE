"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { notifierClient } from "@/lib/notifications";
import { rembourserPaiement } from "@/lib/payments/expiration-demandes";

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
  return user;
}

export type DemandeActionState = { error?: string; success?: boolean };

export async function accepterDemande(
  _prev: DemandeActionState,
  formData: FormData
): Promise<DemandeActionState> {
  await requireStaff();
  const admin = getAdmin();
  const demandeId = formData.get("demande_id") as string;

  const { data: demande } = await admin
    .from("demandes_transport")
    .select("*")
    .eq("id", demandeId)
    .single();

  if (!demande) return { error: "Demande introuvable." };
  if (demande.statut !== "en_attente_validation") {
    return { error: "Cette demande n'est plus en attente de validation." };
  }

  const { error } = await admin
    .from("demandes_transport")
    .update({ statut: "acceptee", updated_at: new Date().toISOString() })
    .eq("id", demandeId)
    .eq("statut", "en_attente_validation");

  if (error) return { error: error.message };

  if (demande.vehicule_id) {
    await admin
      .from("vehicules")
      .update({ statut: "reserve", updated_at: new Date().toISOString() })
      .eq("id", demande.vehicule_id);
  }

  await notifierClient(
    demande.client_id,
    "Réservation acceptée",
    `Votre réservation a été acceptée. Présentez-vous à la date prévue avec une pièce d'identité.`
  );

  revalidatePath("/admin/demandes");
  return { success: true };
}

export async function refuserDemande(
  _prev: DemandeActionState,
  formData: FormData
): Promise<DemandeActionState> {
  await requireStaff();
  const admin = getAdmin();
  const demandeId = formData.get("demande_id") as string;

  const { data: demande } = await admin
    .from("demandes_transport")
    .select("*")
    .eq("id", demandeId)
    .single();

  if (!demande) return { error: "Demande introuvable." };
  if (demande.statut !== "en_attente_validation") {
    return { error: "Cette demande n'est plus en attente de validation." };
  }

  const { error } = await admin
    .from("demandes_transport")
    .update({ statut: "refusee", updated_at: new Date().toISOString() })
    .eq("id", demandeId)
    .eq("statut", "en_attente_validation");

  if (error) return { error: error.message };

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

  await rembourserPaiement(admin, demandeId, 0);

  await notifierClient(
    demande.client_id,
    "Réservation refusée",
    `Votre réservation a été refusée. Le remboursement intégral sera effectué sous 48h.`
  );

  revalidatePath("/admin/demandes");
  return { success: true };
}

export async function annulerParClient(
  demandeId: string
): Promise<DemandeActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const admin = getAdmin();
  const { data: demande } = await admin
    .from("demandes_transport")
    .select("*")
    .eq("id", demandeId)
    .eq("client_id", user.id)
    .single();

  if (!demande) return { error: "Demande introuvable." };
  if (!["en_attente_validation", "acceptee"].includes(demande.statut)) {
    return { error: "Cette demande ne peut plus être annulée." };
  }

  let montantCautionRetenu = 0;

  if (demande.periode) {
    const debut = new Date(demande.periode.replace("[", "").split(",")[0]);
    const heuresAvantDepart = (debut.getTime() - Date.now()) / (1000 * 60 * 60);
    if (heuresAvantDepart < 48) {
      montantCautionRetenu = demande.caution ? Number(demande.caution) : 0;
    }
  }

  await admin
    .from("demandes_transport")
    .update({
      statut: "annulee",
      caution_retenue: montantCautionRetenu,
      updated_at: new Date().toISOString(),
    })
    .eq("id", demandeId);

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

  if (demande.vehicule_id && demande.statut === "acceptee") {
    await admin
      .from("vehicules")
      .update({ statut: "disponible", updated_at: new Date().toISOString() })
      .eq("id", demande.vehicule_id)
      .eq("statut", "reserve");
  }

  await rembourserPaiement(admin, demandeId, montantCautionRetenu);

  const msgCaution = montantCautionRetenu > 0
    ? `La caution de ${montantCautionRetenu.toLocaleString("fr-FR")} FCFA est retenue (annulation à moins de 48h du départ).`
    : "Le remboursement intégral sera effectué sous 48h.";

  await notifierClient(
    demande.client_id,
    "Réservation annulée",
    `Votre réservation a été annulée. ${msgCaution}`
  );

  revalidatePath("/profil");
  return { success: true };
}
