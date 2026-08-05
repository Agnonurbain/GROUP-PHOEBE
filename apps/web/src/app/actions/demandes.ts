"use server";

import { revalidatePath } from "next/cache";
import { err } from "@/lib/i18n/erreurs";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { notifierClient } from "@/lib/notifications";
import { rembourserPaiement } from "@/lib/payments/expiration-demandes";
import { parsePeriodeDebut } from "@/lib/periode";
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

  if (!demande) return { error: await err("demandeIntrouvable") };
  if (demande.statut !== "en_attente_validation") {
    return { error: await err("cetteDemandeNEstPlusEn") };
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
    return { error: await err("leMotifDeRefusEstObligatoire") };
  }

  const { data: demande } = await admin
    .from("demandes_transport")
    .select("*")
    .eq("id", demandeId)
    .single();

  if (!demande) return { error: await err("demandeIntrouvable") };
  if (demande.statut !== "en_attente_validation") {
    return { error: await err("cetteDemandeNEstPlusEn") };
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
  if (!user) return { error: await err("nonConnecte") };

  const admin = getAdmin();
  const { data: demande } = await admin
    .from("demandes_transport")
    .select("*")
    .eq("id", demandeId)
    .eq("client_id", user.sub)
    .single();

  if (!demande) return { error: await err("demandeIntrouvable") };
  if (!["en_attente_validation", "acceptee", "en_negociation"].includes(demande.statut)) {
    return { error: await err("cetteDemandeNePeutPlusEtre") };
  }

  let montantCautionRetenu = 0;

  const debut = parsePeriodeDebut(demande.periode);
  if (debut) {
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

/**
 * Vérification d'un conducteur secondaire.
 *
 * Ils étaient collectés à la réservation — nom et permis déposés dans le bucket
 * privé — puis **jamais relus**. `statut_verification` restait à
 * `documents_soumis` pour toujours : le circuit que la colonne suppose n'existait
 * pas, et le jour du retrait personne ne savait qui d'autre avait le droit de
 * conduire.
 */
export async function verifierConducteurSecondaire(
  _prev: DemandeActionState,
  formData: FormData
): Promise<DemandeActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: await err("nonAuthentifie") };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();
  if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
    return { error: await err("accesRefuse") };
  }

  const conducteurId = formData.get("conducteur_id") as string;
  const decision = formData.get("decision") as string;
  if (!conducteurId || !["verifie", "rejete"].includes(decision)) {
    return { error: await err("demandeInvalide") };
  }

  const admin = getAdmin();

  // Le filtre porte sur l'état attendu : une décision déjà prise n'est pas
  // rejouée, et deux opérateurs simultanés n'en produisent qu'une.
  const { error, count } = await admin
    .from("conducteurs_secondaires")
    .update({ statut_verification: decision }, { count: "exact" })
    .eq("id", conducteurId)
    .eq("statut_verification", "documents_soumis");

  if (error) return { error: error.message };
  if (!count) return { error: await err("ceConducteurADejaEteTraite") };

  await logAudit({
    userId: user.sub as string,
    action: decision === "verifie" ? "verifier_conducteur" : "rejeter_conducteur",
    tableName: "conducteurs_secondaires",
    recordId: conducteurId,
    newValues: { statut_verification: decision },
  });

  revalidatePath("/admin/demandes");
  return { success: true };
}

/**
 * Lien signé vers le permis d'un conducteur secondaire.
 *
 * Le bucket `identity-documents` est privé et c'est le chemin qui est stocké :
 * l'URL se signe à la demande, jamais au rendu — elle expirerait avant le clic.
 */
export async function permisConducteurSecondaire(
  conducteurId: string
): Promise<{ error?: string; url?: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: await err("nonAuthentifie") };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();
  if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
    return { error: await err("accesRefuse") };
  }

  const admin = getAdmin();
  const { data: conducteur } = await admin
    .from("conducteurs_secondaires")
    .select("permis_conduire_url")
    .eq("id", conducteurId)
    .single();

  if (!conducteur?.permis_conduire_url) return { error: await err("aucunPermisDepose") };

  const { data: signee, error } = await admin.storage
    .from("identity-documents")
    .createSignedUrl(conducteur.permis_conduire_url, 60);

  if (error || !signee?.signedUrl) return { error: await err("lienIndisponible") };
  return { url: signee.signedUrl };
}
