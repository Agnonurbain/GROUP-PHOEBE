"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { creerSessionStripe } from "@/lib/payments/stripe";
import { creerSessionCinetPay } from "@/lib/payments/cinetpay";
import {
  computeLivraisonPrix,
  genererNumeroSuivi,
  ZONE_LABELS,
  MODE_LABELS,
  STATUT_LIVRAISON,
  STATUT_LIVRAISON_LABELS,
  isZoneLivraison,
  isModeLivraison,
} from "@/lib/livraison";
import { notifierClient } from "@/lib/notifications";
import { notifierAdminNouvelleReservation } from "./notifications-admin";

export type LivraisonState = {
  error?: string;
};

export type ExpeditionActionState = {
  error?: string;
  success?: boolean;
};

// Statuts d'expédition sur lesquels un livreur est considéré « occupé ».
const STATUTS_EN_COURS = [
  STATUT_LIVRAISON.creee,
  STATUT_LIVRAISON.priseEnCharge,
  STATUT_LIVRAISON.enTransit,
] as const;

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

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function creerExpedition(
  _prev: LivraisonState,
  formData: FormData
): Promise<LivraisonState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Vous devez être connecté pour commander une livraison." };

  const expediteurNom = (formData.get("expediteur_nom") as string)?.trim();
  const expediteurContact = (formData.get("expediteur_contact") as string)?.trim();
  const destinataireNom = (formData.get("destinataire_nom") as string)?.trim();
  const destinataireContact = (formData.get("destinataire_contact") as string)?.trim();
  const adresseCollecte = (formData.get("adresse_collecte") as string)?.trim();
  const adresseLivraison = (formData.get("adresse_livraison") as string)?.trim();
  const zone = formData.get("zone") as string;
  const mode = formData.get("mode") as string;
  const natureColis = ((formData.get("nature_colis") as string) || "").trim() || null;
  const dimensions = ((formData.get("dimensions") as string) || "").trim() || null;
  const poidsRaw = formData.get("poids_kg") as string;
  const valeurRaw = formData.get("valeur_declaree") as string;
  const methode = formData.get("methode_paiement") as string;

  if (
    !expediteurNom || !expediteurContact ||
    !destinataireNom || !destinataireContact ||
    !adresseCollecte || !adresseLivraison
  ) {
    return { error: "Tous les champs expéditeur, destinataire et adresses sont obligatoires." };
  }
  if (!isZoneLivraison(zone) || !isModeLivraison(mode)) {
    return { error: "Zone ou mode de livraison invalide." };
  }
  if (!["cinetpay", "stripe"].includes(methode)) {
    return { error: "Méthode de paiement invalide." };
  }

  const poidsKg = poidsRaw ? Number(poidsRaw) : null;
  if (poidsKg !== null && (Number.isNaN(poidsKg) || poidsKg <= 0)) {
    return { error: "Le poids doit être un nombre positif." };
  }
  const valeurDeclaree = valeurRaw ? Number(valeurRaw) : null;
  if (valeurDeclaree !== null && (Number.isNaN(valeurDeclaree) || valeurDeclaree < 0)) {
    return { error: "La valeur déclarée est invalide." };
  }

  // Prix recalculé côté serveur (autoritaire) à partir de la grille.
  const prix = computeLivraisonPrix(zone, mode);
  if (prix === null) return { error: "Tarif indisponible pour cette combinaison." };

  const admin = getAdmin();
  const numeroSuivi = genererNumeroSuivi();

  const { data: expedition, error: expErr } = await admin
    .from("expeditions")
    .insert({
      client_id: user.sub,
      expediteur_nom: expediteurNom,
      expediteur_contact: expediteurContact,
      destinataire_nom: destinataireNom,
      destinataire_contact: destinataireContact,
      adresse_collecte: adresseCollecte,
      adresse_livraison: adresseLivraison,
      zone,
      mode,
      nature_colis: natureColis,
      dimensions,
      poids_kg: poidsKg,
      valeur_declaree: valeurDeclaree,
      prix,
      numero_suivi: numeroSuivi,
      // statut par défaut "creee" ; l'état de paiement est porté par la table
      // paiements (en_attente → capture).
    })
    .select("id")
    .single();

  if (expErr || !expedition) {
    return { error: "Impossible de créer l'expédition. Veuillez réessayer." };
  }

  const { data: paiement, error: paiementErr } = await admin
    .from("paiements")
    .insert({
      module: "livraison",
      reference_table: "expeditions",
      reference_id: expedition.id,
      type: "montant",
      montant: prix,
      methode: methode as "cinetpay" | "stripe",
      statut: "en_attente",
    })
    .select("id")
    .single();

  if (paiementErr || !paiement) {
    await admin.from("expeditions").delete().eq("id", expedition.id);
    return { error: "Erreur lors de la création du paiement." };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const description = `Livraison ${MODE_LABELS[mode]} · ${ZONE_LABELS[zone]}`;

  let paymentUrl: string;
  try {
    if (methode === "stripe") {
      paymentUrl = await creerSessionStripe({
        montantCFA: prix,
        description,
        paiementId: paiement.id,
        successUrl: `${baseUrl}/livraison/confirmation?exp=${expedition.id}`,
        cancelUrl: `${baseUrl}/livraison?echec=1`,
      });
    } else {
      paymentUrl = await creerSessionCinetPay({
        montantCFA: prix,
        description,
        paiementId: paiement.id,
        returnUrl: `${baseUrl}/livraison/confirmation?exp=${expedition.id}`,
        notifyUrl: `${baseUrl}/api/webhooks/cinetpay`,
      });
    }
  } catch (err) {
    return {
      error: `Erreur d'initialisation du paiement : ${err instanceof Error ? err.message : "erreur inconnue"}`,
    };
  }

  await notifierAdminNouvelleReservation(expedition.id, expediteurNom, 1, prix);

  redirect(paymentUrl);
}

// ─── Admin : affectation livreur & cycle de statut ───────────────────────────

type AdminClient = ReturnType<typeof createAdminClient<Database>>;

// Choisit automatiquement un livreur actif : préfère ceux dont la zone de
// couverture correspond (ou est vide), et prend le moins chargé sous sa capacité.
async function choisirLivreurAuto(admin: AdminClient, zone: string): Promise<string | null> {
  const { data: livreurs } = await admin
    .from("livreurs")
    .select("id, capacite_max_par_jour, zone_couverture")
    .eq("actif", true);
  if (!livreurs || livreurs.length === 0) return null;

  const { data: enCours } = await admin
    .from("expeditions")
    .select("livreur_id")
    .in("statut", [...STATUTS_EN_COURS])
    .not("livreur_id", "is", null);

  const charge = new Map<string, number>();
  for (const e of enCours ?? []) {
    if (e.livreur_id) charge.set(e.livreur_id, (charge.get(e.livreur_id) ?? 0) + 1);
  }

  const preferes = livreurs.filter((l) => !l.zone_couverture || l.zone_couverture === zone);
  const pool = preferes.length > 0 ? preferes : livreurs;
  const disponibles = pool.filter(
    (l) => (charge.get(l.id) ?? 0) < (l.capacite_max_par_jour ?? Number.POSITIVE_INFINITY)
  );
  if (disponibles.length === 0) return null;

  disponibles.sort((a, b) => (charge.get(a.id) ?? 0) - (charge.get(b.id) ?? 0));
  return disponibles[0].id;
}

async function assignerEtNotifier(
  admin: AdminClient,
  expeditionId: string,
  livreurId: string
): Promise<ExpeditionActionState> {
  const { data: exp } = await admin
    .from("expeditions")
    .select("client_id, numero_suivi")
    .eq("id", expeditionId)
    .single();

  const { error } = await admin
    .from("expeditions")
    .update({ livreur_id: livreurId, updated_at: new Date().toISOString() })
    .eq("id", expeditionId);
  if (error) return { error: error.message };

  if (exp) {
    await notifierClient(
      exp.client_id,
      "Livreur affecté",
      `Un livreur a été affecté à votre colis ${exp.numero_suivi}.`
    );
  }
  revalidatePath("/admin/expeditions");
  return { success: true };
}

export async function affecterLivreurAuto(
  _prev: ExpeditionActionState,
  formData: FormData
): Promise<ExpeditionActionState> {
  await requireStaff();
  const admin = getAdmin();
  const expeditionId = formData.get("expedition_id") as string;
  if (!expeditionId) return { error: "Expédition invalide." };

  const { data: exp } = await admin
    .from("expeditions")
    .select("zone")
    .eq("id", expeditionId)
    .single();
  if (!exp) return { error: "Expédition introuvable." };

  const livreurId = await choisirLivreurAuto(admin, exp.zone);
  if (!livreurId) return { error: "Aucun livreur disponible pour cette zone." };

  return assignerEtNotifier(admin, expeditionId, livreurId);
}

export async function affecterLivreurManuel(
  _prev: ExpeditionActionState,
  formData: FormData
): Promise<ExpeditionActionState> {
  await requireStaff();
  const admin = getAdmin();
  const expeditionId = formData.get("expedition_id") as string;
  const livreurId = formData.get("livreur_id") as string;
  if (!expeditionId || !livreurId) return { error: "Expédition ou livreur manquant." };

  return assignerEtNotifier(admin, expeditionId, livreurId);
}

export async function changerStatutExpedition(
  _prev: ExpeditionActionState,
  formData: FormData
): Promise<ExpeditionActionState> {
  await requireStaff();
  const admin = getAdmin();
  const expeditionId = formData.get("expedition_id") as string;
  const statut = formData.get("statut") as string;

  const valides = Object.values(STATUT_LIVRAISON) as string[];
  if (!expeditionId || !valides.includes(statut)) {
    return { error: "Statut invalide." };
  }

  const { data: exp } = await admin
    .from("expeditions")
    .select("client_id, numero_suivi")
    .eq("id", expeditionId)
    .single();

  const { error } = await admin
    .from("expeditions")
    .update({ statut, updated_at: new Date().toISOString() })
    .eq("id", expeditionId);
  if (error) return { error: error.message };

  if (exp) {
    await notifierClient(
      exp.client_id,
      "Mise à jour de votre livraison",
      `Votre colis ${exp.numero_suivi} : ${STATUT_LIVRAISON_LABELS[statut] ?? statut}.`
    );
  }
  revalidatePath("/admin/expeditions");
  return { success: true };
}
