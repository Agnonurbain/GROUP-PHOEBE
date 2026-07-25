import { createClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { getStripe } from "./stripe";

type AdminClient = ReturnType<typeof createClient<Database>>;
type Paiement = Database["public"]["Tables"]["paiements"]["Row"];

function getAdminClient(): AdminClient {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Entrees webhook (creent le client, deleguent au coeur testable) ─────────

export async function traiterPaiementConfirme(
  paiementId: string,
  stripePaymentIntent?: string
): Promise<{ ok: boolean; raison?: string }> {
  return confirmerCommande(getAdminClient(), paiementId, stripePaymentIntent);
}

export async function traiterPaiementEchoue(
  paiementId: string
): Promise<{ ok: boolean }> {
  return annulerCommande(getAdminClient(), paiementId);
}

// ─── Groupe : tous les paiements partageant le commande_id ───────────────────
// Le prestataire ne renvoie qu'un identifiant de transaction (le 1er paiement).
// On confirme/annule TOUTE la commande, sinon les autres vehicules d'un panier
// multi restent impayes et sont annules a tort par le cron d'expiration.

async function chargerGroupe(
  admin: AdminClient,
  primary: Paiement
): Promise<Paiement[]> {
  if (!primary.commande_id) return [primary];
  const { data } = await admin
    .from("paiements")
    .select("*")
    .eq("commande_id", primary.commande_id);
  return data && data.length > 0 ? data : [primary];
}

// ─── Confirmation ────────────────────────────────────────────────────────────

export async function confirmerCommande(
  admin: AdminClient,
  paiementId: string,
  stripePaymentIntent?: string
): Promise<{ ok: boolean; raison?: string }> {
  const { data: primary } = await admin
    .from("paiements")
    .select("*")
    .eq("id", paiementId)
    .single();

  if (!primary) return { ok: false, raison: "Paiement introuvable" };

  if (primary.statut === "capture") {
    return { ok: true, raison: "Déjà traité" };
  }

  const group = await chargerGroupe(admin, primary);

  if (primary.statut === "echoue") {
    return traiterPaiementTardifGroupe(admin, group, stripePaymentIntent);
  }

  if (primary.statut !== "en_attente") {
    return { ok: false, raison: `Statut inattendu: ${primary.statut}` };
  }

  // La reference du prestataire (payment_intent Stripe) est portee par TOUS les
  // paiements du groupe : ils partagent une seule transaction. Sans cela, annuler
  // un vehicule secondaire ne pourrait pas etre rembourse automatiquement
  // (rembourserPaiement a besoin du payment_intent).
  for (const p of group) {
    if (p.statut !== "en_attente") continue;
    const r = await confirmerUnPaiement(admin, p, stripePaymentIntent);
    if (!r.ok) return r;
  }

  return { ok: true };
}

async function confirmerUnPaiement(
  admin: AdminClient,
  paiement: Paiement,
  stripePaymentIntent?: string
): Promise<{ ok: boolean; raison?: string }> {
  const { error: updateErr, count } = await admin
    .from("paiements")
    .update({
      statut: "capture",
      ...(stripePaymentIntent ? { webhook_reference: stripePaymentIntent } : {}),
    })
    .eq("id", paiement.id)
    .eq("statut", "en_attente");

  if (updateErr) return { ok: false, raison: updateErr.message };
  if (count === 0) {
    return { ok: true, raison: "Concurrent: statut déjà changé" };
  }

  if (paiement.reference_table === "demandes_transport") {
    const { data: demande } = await admin
      .from("demandes_transport")
      .select("id, type, vehicule_id")
      .eq("id", paiement.reference_id)
      .single();

    if (demande?.type === "achat") {
      await admin
        .from("demandes_transport")
        .update({ statut: "acceptee", updated_at: new Date().toISOString() })
        .eq("id", paiement.reference_id)
        .eq("statut", "en_attente_paiement");

      if (demande.vehicule_id) {
        await admin
          .from("vehicules")
          .update({ statut: "reserve", updated_at: new Date().toISOString() })
          .eq("id", demande.vehicule_id);
      }
    } else {
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
  }

  // Livraison (expeditions) : aucun changement de statut à la capture — l'état
  // de paiement est porté par la table paiements ; la gestion du cycle de vie
  // (prise_en_charge → en_transit → livree) se fait côté admin.

  return { ok: true };
}

// Paiement tardif : la commande avait ete marquee echoue (expiree) puis un
// paiement arrive. Le prestataire n'a debite qu'une transaction pour tout le
// panier -> un seul remboursement, applique a tout le groupe.
async function traiterPaiementTardifGroupe(
  admin: AdminClient,
  group: Paiement[],
  stripePaymentIntent?: string
): Promise<{ ok: boolean; raison?: string }> {
  console.error(
    `Paiement tardif détecté (commande de ${group.length} paiement(s), ` +
    `méthode: ${group[0].methode}). Demande(s) déjà expirée(s) — remboursement nécessaire.`
  );

  if (group[0].methode === "stripe" && stripePaymentIntent) {
    try {
      const stripe = getStripe();
      await stripe.refunds.create({ payment_intent: stripePaymentIntent });
      for (const p of group) {
        await admin
          .from("paiements")
          .update({ statut: "rembourse", webhook_reference: stripePaymentIntent })
          .eq("id", p.id);
      }
      console.error(`Remboursement Stripe automatique effectué pour la commande.`);
      return { ok: true, raison: "Paiement tardif — remboursement Stripe automatique effectué" };
    } catch (err) {
      console.error(`Échec remboursement Stripe:`, err);
      for (const p of group) {
        await admin
          .from("paiements")
          .update({ statut: "remboursement_requis", webhook_reference: stripePaymentIntent })
          .eq("id", p.id);
      }
      return { ok: false, raison: "Paiement tardif — remboursement Stripe échoué, intervention manuelle requise" };
    }
  }

  for (const p of group) {
    await admin
      .from("paiements")
      .update({
        statut: "remboursement_requis",
        ...(stripePaymentIntent ? { webhook_reference: stripePaymentIntent } : {}),
      })
      .eq("id", p.id);
  }
  return { ok: true, raison: "Paiement tardif — remboursement manuel requis" };
}

// ─── Echec / annulation ──────────────────────────────────────────────────────

export async function annulerCommande(
  admin: AdminClient,
  paiementId: string
): Promise<{ ok: boolean }> {
  const { data: primary } = await admin
    .from("paiements")
    .select("*")
    .eq("id", paiementId)
    .single();

  if (!primary) return { ok: true };

  const group = await chargerGroupe(admin, primary);

  for (const paiement of group) {
    if (paiement.statut !== "en_attente") continue;

    await admin
      .from("paiements")
      .update({ statut: "echoue" })
      .eq("id", paiement.id);

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
    // Livraison : le paiement échoué reste tracé dans paiements ; l'expédition
    // non payée demeure au statut "creee" (ignorée côté admin).
  }

  return { ok: true };
}
