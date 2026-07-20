import { createClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { notifierClient } from "@/lib/notifications";
import { getStripe } from "@/lib/payments/stripe";
import { DELAI_SANS_REPONSE_HEURES, DELAI_NON_PRESENTATION_HEURES, DELAI_NEGOCIATION_MS } from "@/lib/constants";

type AdminClient = ReturnType<typeof getAdminClient>;

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function rembourserPaiement(
  admin: AdminClient,
  demandeId: string,
  montantARetenir: number
) {
  const { data: paiement } = await admin
    .from("paiements")
    .select("*")
    .eq("reference_table", "demandes_transport")
    .eq("reference_id", demandeId)
    .eq("statut", "capture")
    .single();

  if (!paiement) return;

  const totalCapture = Number(paiement.montant);
  const montantARefund = totalCapture - montantARetenir;
  if (montantARefund <= 0) return;

  const estPartiel = montantARefund < totalCapture;

  if (paiement.methode === "stripe" && paiement.webhook_reference) {
    try {
      const stripe = getStripe();
      await stripe.refunds.create({
        payment_intent: paiement.webhook_reference,
        amount: Math.round(montantARefund),
      });
      await admin
        .from("paiements")
        .update({ statut: estPartiel ? "remboursement_partiel" : "rembourse" })
        .eq("id", paiement.id);
    } catch {
      await admin
        .from("paiements")
        .update({ statut: "remboursement_requis" })
        .eq("id", paiement.id);
    }
  } else {
    await admin
      .from("paiements")
      .update({ statut: "remboursement_requis" })
      .eq("id", paiement.id);
  }
}

export async function expirerDemandesSansReponse(): Promise<number> {
  const admin = getAdminClient();
  const seuil = new Date(Date.now() - DELAI_SANS_REPONSE_HEURES * 60 * 60 * 1000).toISOString();

  const { data: expirees } = await admin
    .from("demandes_transport")
    .select("id, client_id, vehicule_id, chauffeur_id, periode")
    .eq("statut", "en_attente_validation")
    .lt("updated_at", seuil);

  if (!expirees || expirees.length === 0) return 0;

  let nb = 0;
  for (const d of expirees) {
    if (d.vehicule_id) {
      await admin
        .from("vehicules")
        .update({ statut: "reserve", updated_at: new Date().toISOString() })
        .eq("id", d.vehicule_id);
    }

    await admin
      .from("demandes_transport")
      .update({ statut: "acceptee", updated_at: new Date().toISOString() })
      .eq("id", d.id)
      .eq("statut", "en_attente_validation");

    await notifierClient(
      d.client_id,
      "Réservation confirmée automatiquement",
      `Votre réservation a été automatiquement acceptée. Présentez-vous au lieu de retrait à la date convenue.`
    );

    nb++;
  }
  return nb;
}

export async function expirerNonPresentations(): Promise<number> {
  const admin = getAdminClient();
  const seuil = new Date(Date.now() - DELAI_NON_PRESENTATION_HEURES * 60 * 60 * 1000).toISOString();

  const { data: expirees } = await admin
    .from("demandes_transport")
    .select("id, client_id, vehicule_id, chauffeur_id, periode, caution")
    .eq("statut", "acceptee");

  if (!expirees || expirees.length === 0) return 0;

  let nb = 0;
  for (const d of expirees) {
    if (!d.periode) continue;
    const debut = new Date(d.periode.replace("[", "").split(",")[0]);
    if (new Date(seuil) <= debut) continue;

    if (d.vehicule_id) {
      await admin
        .from("disponibilites_vehicule")
        .delete()
        .eq("vehicule_id", d.vehicule_id)
        .eq("type", "reservation")
        .eq("periode", d.periode);

      await admin
        .from("vehicules")
        .update({ statut: "disponible", updated_at: new Date().toISOString() })
        .eq("id", d.vehicule_id)
        .eq("statut", "reserve");
    }
    if (d.chauffeur_id) {
      await admin
        .from("disponibilites_chauffeur")
        .delete()
        .eq("chauffeur_id", d.chauffeur_id)
        .eq("periode", d.periode);
    }

    const montantCaution = d.caution ? Number(d.caution) : 0;
    await rembourserPaiement(admin, d.id, montantCaution);

    await admin
      .from("demandes_transport")
      .update({
        statut: "annulee",
        caution_retenue: montantCaution,
        updated_at: new Date().toISOString(),
      })
      .eq("id", d.id)
      .eq("statut", "acceptee");

    await notifierClient(
      d.client_id,
      "Non-présentation — réservation annulée",
      `Vous ne vous êtes pas présenté(e) au retrait du véhicule. La réservation est annulée et la caution est retenue.`
    );

    nb++;
  }
  return nb;
}

export async function expirerNegociationsAbandonnees(): Promise<number> {
  const admin = getAdminClient();
  const seuil = new Date(Date.now() - DELAI_NEGOCIATION_MS).toISOString();

  const { data: expirees } = await admin
    .from("demandes_transport")
    .select("id, client_id, vehicule_id, chauffeur_id, periode")
    .eq("statut", "en_negociation")
    .lt("created_at", seuil);

  if (!expirees || expirees.length === 0) return 0;

  let nb = 0;
  for (const d of expirees) {
    if (d.vehicule_id && d.periode) {
      await admin
        .from("disponibilites_vehicule")
        .delete()
        .eq("vehicule_id", d.vehicule_id)
        .eq("type", "reservation")
        .eq("periode", d.periode);
    }
    if (d.chauffeur_id && d.periode) {
      await admin
        .from("disponibilites_chauffeur")
        .delete()
        .eq("chauffeur_id", d.chauffeur_id)
        .eq("periode", d.periode);
    }

    await admin
      .from("demandes_transport")
      .update({ statut: "annulee", updated_at: new Date().toISOString() })
      .eq("id", d.id)
      .eq("statut", "en_negociation");

    await notifierClient(
      d.client_id,
      "Négociation expirée",
      `Votre demande de négociation a expiré après 30 minutes sans réponse. Vous pouvez soumettre une nouvelle demande.`
    );

    nb++;
  }
  return nb;
}
