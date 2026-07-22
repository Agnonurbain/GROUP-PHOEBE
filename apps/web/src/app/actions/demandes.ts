"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { notifierClient } from "@/lib/notifications";
import { rembourserPaiement } from "@/lib/payments/expiration-demandes";
import { logAudit } from "@/lib/audit";

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
  return user;
}

export type DemandeActionState = { error?: string; success?: boolean };

export async function accepterDemande(
  _prev: DemandeActionState,
  formData: FormData
): Promise<DemandeActionState> {
  const staff = await requireStaff();
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

  await logAudit({
    userId: staff.sub,
    action: "accepter",
    tableName: "demandes_transport",
    recordId: demandeId,
    oldValues: { statut: "en_attente_validation" },
    newValues: { statut: "acceptee" },
  });

  if (demande.vehicule_id) {
    await admin
      .from("vehicules")
      .update({ statut: "reserve", updated_at: new Date().toISOString() })
      .eq("id", demande.vehicule_id);
  }

  const isAchat = demande.type === "achat";
  await notifierClient(
    demande.client_id,
    isAchat ? "Demande d'achat acceptée" : "Réservation acceptée",
    isAchat
      ? "Votre demande d'achat a été acceptée. Un opérateur vous contactera pour finaliser la transaction."
      : "Votre réservation a été acceptée. Présentez-vous à la date prévue avec une pièce d'identité."
  );

  revalidatePath("/admin/demandes");
  return { success: true };
}

export async function refuserDemande(
  _prev: DemandeActionState,
  formData: FormData
): Promise<DemandeActionState> {
  const staff = await requireStaff();
  const admin = getAdmin();
  const demandeId = formData.get("demande_id") as string;
  const motifRefus = (formData.get("motif_refus") as string)?.trim();

  if (!motifRefus) {
    return { error: "Le motif de refus est obligatoire." };
  }

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

  await logAudit({
    userId: staff.sub,
    action: "refuser",
    tableName: "demandes_transport",
    recordId: demandeId,
    oldValues: { statut: "en_attente_validation" },
    newValues: { statut: "refusee", motif_refus: motifRefus },
  });

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

  const isAchatRefus = demande.type === "achat";
  await notifierClient(
    demande.client_id,
    isAchatRefus ? "Demande d'achat refusée" : "Réservation refusée",
    isAchatRefus
      ? `Votre demande d'achat a été refusée. Motif : ${motifRefus}`
      : `Votre réservation a été refusée. Motif : ${motifRefus}. Le remboursement intégral sera effectué sous 48h.`
  );

  revalidatePath("/admin/demandes");
  return { success: true };
}

export async function annulerParClient(
  demandeId: string
): Promise<DemandeActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Non connecté." };

  const admin = getAdmin();
  const { data: demande } = await admin
    .from("demandes_transport")
    .select("*")
    .eq("id", demandeId)
    .eq("client_id", user.sub)
    .single();

  if (!demande) return { error: "Demande introuvable." };
  if (!["en_attente_validation", "acceptee", "en_negociation"].includes(demande.statut)) {
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

  const isAchatAnnul = demande.type === "achat";
  if (isAchatAnnul) {
    await notifierClient(
      demande.client_id,
      "Demande d'achat annulée",
      "Votre demande d'achat a été annulée."
    );
  } else {
    const msgCaution = montantCautionRetenu > 0
      ? `La caution de ${montantCautionRetenu.toLocaleString("fr-FR")} FCFA est retenue (annulation à moins de 48h du départ).`
      : "Le remboursement intégral sera effectué sous 48h.";
    await notifierClient(
      demande.client_id,
      "Réservation annulée",
      `Votre réservation a été annulée. ${msgCaution}`
    );
  }

  revalidatePath("/compte/profil");
  return { success: true };
}
