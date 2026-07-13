import { createClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { getStripe } from "./stripe";

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function traiterPaiementConfirme(
  paiementId: string,
  stripePaymentIntent?: string
): Promise<{ ok: boolean; raison?: string }> {
  const admin = getAdminClient();

  const { data: paiement } = await admin
    .from("paiements")
    .select("*")
    .eq("id", paiementId)
    .single();

  if (!paiement) return { ok: false, raison: "Paiement introuvable" };

  if (paiement.statut === "capture") {
    return { ok: true, raison: "Déjà traité" };
  }

  if (paiement.statut === "echoue") {
    return await traiterPaiementTardif(admin, paiement, stripePaymentIntent);
  }

  if (paiement.statut !== "en_attente") {
    return { ok: false, raison: `Statut inattendu: ${paiement.statut}` };
  }

  const { error: updateErr, count } = await admin
    .from("paiements")
    .update({
      statut: "capture",
      ...(stripePaymentIntent ? { webhook_reference: stripePaymentIntent } : {}),
    })
    .eq("id", paiementId)
    .eq("statut", "en_attente");

  if (updateErr) return { ok: false, raison: updateErr.message };
  if (count === 0) {
    return { ok: true, raison: "Concurrent: statut déjà changé" };
  }

  if (paiement.reference_table === "demandes_transport") {
    const { error } = await admin
      .from("demandes_transport")
      .update({
        statut: "en_attente_validation",
        updated_at: new Date().toISOString(),
      })
      .eq("id", paiement.reference_id)
      .eq("statut", "en_attente_paiement");

    if (error) {
      console.error("Erreur mise à jour demande_transport:", error.message);
      return { ok: false, raison: error.message };
    }
  }

  return { ok: true };
}

async function traiterPaiementTardif(
  admin: ReturnType<typeof getAdminClient>,
  paiement: Database["public"]["Tables"]["paiements"]["Row"],
  stripePaymentIntent?: string
): Promise<{ ok: boolean; raison?: string }> {
  console.error(
    `Paiement tardif détecté: ${paiement.id} (méthode: ${paiement.methode}, montant: ${paiement.montant}). ` +
    `Demande ${paiement.reference_id} déjà expirée — remboursement nécessaire.`
  );

  if (paiement.methode === "stripe" && stripePaymentIntent) {
    try {
      const stripe = getStripe();
      await stripe.refunds.create({ payment_intent: stripePaymentIntent });

      await admin
        .from("paiements")
        .update({ statut: "rembourse", webhook_reference: stripePaymentIntent })
        .eq("id", paiement.id);

      console.error(`Remboursement Stripe automatique effectué pour ${paiement.id}`);
      return { ok: true, raison: "Paiement tardif — remboursement Stripe automatique effectué" };
    } catch (err) {
      console.error(`Échec remboursement Stripe pour ${paiement.id}:`, err);
      await admin
        .from("paiements")
        .update({ statut: "remboursement_requis", webhook_reference: stripePaymentIntent })
        .eq("id", paiement.id);
      return { ok: false, raison: "Paiement tardif — remboursement Stripe échoué, intervention manuelle requise" };
    }
  }

  await admin
    .from("paiements")
    .update({
      statut: "remboursement_requis",
      ...(stripePaymentIntent ? { webhook_reference: stripePaymentIntent } : {}),
    })
    .eq("id", paiement.id);

  return { ok: true, raison: "Paiement tardif — remboursement manuel requis" };
}

export async function traiterPaiementEchoue(
  paiementId: string
): Promise<{ ok: boolean }> {
  const admin = getAdminClient();

  const { data: paiement } = await admin
    .from("paiements")
    .select("*")
    .eq("id", paiementId)
    .single();

  if (!paiement || paiement.statut !== "en_attente") return { ok: true };

  await admin
    .from("paiements")
    .update({ statut: "echoue" })
    .eq("id", paiementId);

  if (paiement.reference_table === "demandes_transport") {
    const { data: demande } = await admin
      .from("demandes_transport")
      .select("vehicule_id, chauffeur_id, periode")
      .eq("id", paiement.reference_id)
      .single();

    if (demande) {
      if (demande.periode) {
        await admin
          .from("disponibilites_vehicule")
          .delete()
          .eq("vehicule_id", demande.vehicule_id!)
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
    }

    await admin
      .from("demandes_transport")
      .update({ statut: "annulee", updated_at: new Date().toISOString() })
      .eq("id", paiement.reference_id)
      .eq("statut", "en_attente_paiement");
  }

  return { ok: true };
}
