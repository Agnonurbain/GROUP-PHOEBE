"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { creerSessionStripe } from "@/lib/payments/stripe";
import { creerSessionCinetPay } from "@/lib/payments/cinetpay";
import { notifierAdminNouvelleReservation } from "./notifications-admin";

type CartInput = {
  groupKey: string;
  marque: string;
  modele: string;
  prixJournalier: number;
  cautionBaseFcfa: number;
  quantite: number;
  avecChauffeur: boolean;
};

export type CheckoutState = {
  error?: string;
  success?: boolean;
};

const TAUX_CAUTION_DEFAUT = 0.3;

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function checkoutCart(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Vous devez être connecté." };

  const { data: profile } = await supabase
    .from("users")
    .select("id, nom, statut_verification")
    .eq("id", user.sub)
    .single();

  if (!profile) return { error: "Profil introuvable." };
  if (profile.statut_verification !== "verifie") {
    return { error: "Votre identité doit être vérifiée avant de réserver. Rendez-vous sur votre profil pour soumettre vos documents." };
  }

  const rawItems = formData.get("items") as string;
  const debut = formData.get("debut") as string;
  const fin = formData.get("fin") as string;
  const villeDepart = (formData.get("ville_depart") as string) || null;
  const destination = (formData.get("destination") as string) || null;
  const methode = formData.get("methode_paiement") as string;

  if (!rawItems || !debut || !fin) {
    return { error: "Articles, date de début et date de fin sont obligatoires." };
  }

  if (new Date(fin) <= new Date(debut)) {
    return { error: "La date de fin doit être postérieure à la date de début." };
  }

  if (!["cinetpay", "stripe"].includes(methode)) {
    return { error: "Méthode de paiement invalide." };
  }

  let items: CartInput[];
  try {
    items = JSON.parse(rawItems);
  } catch {
    return { error: "Format des articles invalide." };
  }

  if (items.length === 0) {
    return { error: "Votre panier est vide." };
  }

  const nbJours = Math.ceil(
    (new Date(fin).getTime() - new Date(debut).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (nbJours < 1) return { error: "La durée minimale est d'un jour." };

  const admin = getAdmin();
  const adminSupabase = await createClient();

  const createdDemandes: Array<{ id: string; vehiculeId: string; chauffeurId: string | null; montant: number; caution: number }> = [];

  const peri = `[${new Date(debut).toISOString()},${new Date(fin).toISOString()})`;

  for (const item of items) {
    const { data: vehicules } = await adminSupabase
      .from("vehicules")
      .select("*")
      .eq("marque", item.marque)
      .eq("modele", item.modele)
      .eq("statut", "disponible")
      .limit(1);

    if (!vehicules || vehicules.length === 0) {
      continue;
    }

    const vehicule = vehicules[0];

    if (!vehicule.prix_journalier) continue;

    const montantPerVehicule = Number(vehicule.prix_journalier) * nbJours * item.quantite;
    const tauxCaution = vehicule.taux_caution ? Number(vehicule.taux_caution) : TAUX_CAUTION_DEFAUT;
    const cautionPerVehicule = Math.round(montantPerVehicule * tauxCaution);

    const { error: dispoErr } = await admin
      .from("disponibilites_vehicule")
      .insert({
        vehicule_id: vehicule.id,
        periode: peri,
        type: "reservation",
      });

    if (dispoErr) continue;

    let chauffeurId: string | null = null;

    if (item.avecChauffeur && vehicule.chauffeur_disponible) {
      const { data: vcLinks } = await admin
        .from("vehicule_chauffeurs")
        .select("chauffeur_id")
        .eq("vehicule_id", vehicule.id);

      const candidats = vcLinks?.map((l) => l.chauffeur_id) ?? [];
      for (const cid of candidats) {
        const { error: chauffeurErr } = await admin
          .from("disponibilites_chauffeur")
          .insert({ chauffeur_id: cid, periode: peri });
        if (!chauffeurErr) {
          chauffeurId = cid;
          break;
        }
      }
    }

    const { data: demande, error: demandeErr } = await admin
      .from("demandes_transport")
      .insert({
        client_id: user.sub,
        vehicule_id: vehicule.id,
        type: "reservation_directe",
        categorie: "classique",
        periode: peri,
        ville_depart: villeDepart,
        destination,
        avec_chauffeur: item.avecChauffeur,
        chauffeur_id: chauffeurId,
        montant: montantPerVehicule,
        caution: cautionPerVehicule,
        methode_paiement: methode as "cinetpay" | "stripe",
        statut: "en_attente_paiement",
      })
      .select("id")
      .single();

    if (demandeErr) {
      await admin.from("disponibilites_vehicule").delete().eq("vehicule_id", vehicule.id).eq("periode", peri).eq("type", "reservation");
      if (chauffeurId) {
        await admin.from("disponibilites_chauffeur").delete().eq("chauffeur_id", chauffeurId).eq("periode", peri);
      }
      continue;
    }

    createdDemandes.push({
      id: demande.id,
      vehiculeId: vehicule.id,
      chauffeurId,
      montant: montantPerVehicule,
      caution: cautionPerVehicule,
    });
  }

  if (createdDemandes.length === 0) {
    return { error: "Aucun véhicule disponible parmi les articles sélectionnés." };
  }

  const totalMontant = createdDemandes.reduce((s, d) => s + d.montant, 0);
  const totalCaution = createdDemandes.reduce((s, d) => s + d.caution, 0);
  const totalGlobal = totalMontant + totalCaution;

  const paiements: Array<{ id: string; demande_id: string }> = [];

  for (const demande of createdDemandes) {
    const itemMontant = demande.montant + demande.caution;

    const { data: paiement, error: paiementErr } = await admin
      .from("paiements")
      .insert({
        module: "transport",
        reference_table: "demandes_transport",
        reference_id: demande.id,
        type: "montant",
        montant: itemMontant,
        methode: methode as "cinetpay" | "stripe",
        statut: "en_attente",
      })
      .select("id")
      .single();

    if (!paiementErr && paiement) {
      paiements.push({ id: paiement.id, demande_id: demande.id });
    } else {
      await admin.from("demandes_transport").delete().eq("id", demande.id);
      await admin.from("disponibilites_vehicule").delete().eq("vehicule_id", demande.vehiculeId).eq("periode", peri).eq("type", "reservation");
      if (demande.chauffeurId) {
        await admin.from("disponibilites_chauffeur").delete().eq("chauffeur_id", demande.chauffeurId).eq("periode", peri);
      }
    }
  }

  if (paiements.length === 0) {
    return { error: "Erreur lors de la création du paiement." };
  }

  const firstDemandeId = createdDemandes[0].id;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const description = `Location ${items.length} véhicule${items.length > 1 ? "s" : ""} · ${nbJours}j`;

  let paymentUrl: string;

  try {
    if (methode === "stripe") {
      paymentUrl = await creerSessionStripe({
        montantCFA: totalGlobal,
        description,
        paiementId: paiements[0].id,
        successUrl: `${baseUrl}/reservation/confirmation?demande=${firstDemandeId}`,
        cancelUrl: `${baseUrl}/reservation/echec?demande=${firstDemandeId}`,
      });
    } else {
      paymentUrl = await creerSessionCinetPay({
        montantCFA: totalGlobal,
        description,
        paiementId: paiements[0].id,
        returnUrl: `${baseUrl}/reservation/confirmation?demande=${firstDemandeId}`,
        notifyUrl: `${baseUrl}/api/webhooks/cinetpay`,
      });
    }
  } catch (err) {
    return {
      error: `Erreur d'initialisation du paiement : ${err instanceof Error ? err.message : "erreur inconnue"}`,
    };
  }

  await notifierAdminNouvelleReservation(
    firstDemandeId,
    profile.nom,
    items.length,
    totalGlobal
  );

  redirect(paymentUrl);
}
