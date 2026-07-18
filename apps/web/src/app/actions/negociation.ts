"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { notifierClient } from "@/lib/notifications";
import { creerSessionStripe } from "@/lib/payments/stripe";
import { creerSessionCinetPay } from "@/lib/payments/cinetpay";
import { expirerReservationsAbandonnees } from "@/lib/payments/expiration";
import { expirerDemandesSansReponse, expirerNonPresentations } from "@/lib/payments/expiration-demandes";
import { assignerVehiculesGroupe, type AssignedVehicle } from "@/app/actions/vehicle-assignment";

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type NegociationState = {
  error?: string;
  success?: boolean;
  demandeId?: string;
};

type LigneInput = {
  groupKey: string;
  marque: string;
  modele: string;
  quantite: number;
  avecChauffeur: boolean;
};

// ─── Client: créer une demande en négociation ───────────────────────

export async function creerDemandeNegociation(
  _prev: NegociationState,
  formData: FormData
): Promise<NegociationState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Vous devez être connecté." };

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.sub)
    .single();

  if (!profile) return { error: "Profil introuvable." };
  if (profile.statut_verification !== "verifie") {
    return { error: "Votre identité doit être vérifiée avant de réserver." };
  }

  const debut = formData.get("debut") as string;
  const fin = formData.get("fin") as string;
  const villeDepart = (formData.get("ville_depart") as string) || null;
  const destination = (formData.get("destination") as string) || null;
  const note = (formData.get("negociation_note") as string) || null;
  const lignesRaw = formData.get("lignes") as string;

  if (!debut || !fin) {
    return { error: "Les dates de début et de fin sont obligatoires." };
  }

  if (new Date(fin) <= new Date(debut)) {
    return { error: "La date de fin doit être postérieure à la date de début." };
  }

  let lignes: LigneInput[];
  try {
    lignes = JSON.parse(lignesRaw);
  } catch {
    return { error: "Données du panier invalides." };
  }

  if (!lignes || lignes.length === 0) {
    return { error: "Le panier est vide." };
  }

  const nbJours = Math.ceil(
    (new Date(fin).getTime() - new Date(debut).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (nbJours < 1) return { error: "La durée minimale est d'un jour." };

  const periode = `[${new Date(debut).toISOString()},${new Date(fin).toISOString()})`;
  const admin = getAdmin();

  await Promise.all([
    expirerReservationsAbandonnees(),
    expirerDemandesSansReponse(),
    expirerNonPresentations(),
  ]);

  const allAssigned: (AssignedVehicle & { avecChauffeur: boolean })[] = [];

  for (const ligne of lignes) {
    const result = await assignerVehiculesGroupe(
      admin,
      ligne.marque,
      ligne.modele,
      ligne.quantite,
      periode,
      ligne.avecChauffeur,
      nbJours
    );

    if (!result.ok) {
      for (const prev of allAssigned) {
        await admin
          .from("disponibilites_vehicule")
          .delete()
          .eq("vehicule_id", prev.vehiculeId)
          .eq("type", "reservation")
          .eq("periode", periode);
        if (prev.chauffeurId) {
          await admin
            .from("disponibilites_chauffeur")
            .delete()
            .eq("chauffeur_id", prev.chauffeurId)
            .eq("periode", periode);
        }
      }
      return { error: result.error };
    }

    for (const v of result.vehicles) {
      allAssigned.push({ ...v, avecChauffeur: ligne.avecChauffeur });
    }
  }

  const totalMontant = allAssigned.reduce((s, v) => s + v.montant, 0);
  const totalCaution = allAssigned.reduce((s, v) => s + v.caution, 0);

  const villeDepartFinal = villeDepart === "autre"
    ? (formData.get("ville_depart_autre") as string) || null
    : villeDepart;
  const destinationFinal = destination === "autre"
    ? (formData.get("destination_autre") as string) || null
    : destination;

  const { data: demande, error: demandeErr } = await admin
    .from("demandes_transport")
    .insert({
      client_id: user.sub,
      vehicule_id: allAssigned[0].vehiculeId,
      type: "reservation_directe",
      categorie: "classique",
      periode,
      ville_depart: villeDepartFinal,
      destination: destinationFinal,
      avec_chauffeur: allAssigned.some((v) => v.avecChauffeur),
      chauffeur_id: allAssigned[0].chauffeurId,
      montant: totalMontant,
      caution: totalCaution,
      statut: "en_negociation",
      negociation_note: note,
    })
    .select("id")
    .single();

  if (demandeErr) {
    for (const v of allAssigned) {
      await admin
        .from("disponibilites_vehicule")
        .delete()
        .eq("vehicule_id", v.vehiculeId)
        .eq("type", "reservation")
        .eq("periode", periode);
      if (v.chauffeurId) {
        await admin
          .from("disponibilites_chauffeur")
          .delete()
          .eq("chauffeur_id", v.chauffeurId)
          .eq("periode", periode);
      }
    }
    return { error: demandeErr.message };
  }

  const lignesInsert = allAssigned.map((v) => ({
    demande_id: demande.id,
    vehicule_id: v.vehiculeId,
    avec_chauffeur: v.avecChauffeur,
    chauffeur_id: v.chauffeurId,
    montant_ligne: v.montant,
    caution_ligne: v.caution,
  }));

  await admin.from("lignes_demande").insert(lignesInsert);

  revalidatePath("/profil/reservations");
  return { success: true, demandeId: demande.id };
}

// ─── Admin: envoyer le prix négocié au client ───────────────────────

export async function envoyerPrixNegocie(
  _prev: NegociationState,
  formData: FormData
): Promise<NegociationState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Non authentifié" };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();

  if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
    return { error: "Accès refusé" };
  }

  const demandeId = formData.get("demande_id") as string;
  const prixNegocieStr = formData.get("prix_negocie") as string;
  const prixNegocie = Number(prixNegocieStr);

  if (!demandeId || !prixNegocie || prixNegocie <= 0) {
    return { error: "Le prix négocié doit être un montant positif." };
  }

  const admin = getAdmin();
  const { data: demande } = await admin
    .from("demandes_transport")
    .select("*")
    .eq("id", demandeId)
    .single();

  if (!demande) return { error: "Demande introuvable." };
  if (demande.statut !== "en_negociation") {
    return { error: "Cette demande n'est pas en négociation." };
  }

  const { error } = await admin
    .from("demandes_transport")
    .update({
      prix_negocie: prixNegocie,
      statut: "en_attente_paiement",
      updated_at: new Date().toISOString(),
    })
    .eq("id", demandeId);

  if (error) return { error: error.message };

  await notifierClient(
    demande.client_id,
    "Prix négocié disponible",
    `Un prix de ${prixNegocie.toLocaleString("fr-FR")} FCFA vous a été proposé. Connectez-vous pour procéder au paiement.`
  );

  revalidatePath("/admin/demandes");
  return { success: true };
}

// ─── Client: payer le prix négocié ──────────────────────────────────

export async function payerPrixNegocie(
  _prev: NegociationState,
  formData: FormData
): Promise<NegociationState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Vous devez être connecté." };

  const demandeId = formData.get("demande_id") as string;
  const methode = formData.get("methode_paiement") as string;

  if (!["cinetpay", "stripe"].includes(methode)) {
    return { error: "Méthode de paiement invalide." };
  }

  const admin = getAdmin();
  const { data: demande } = await admin
    .from("demandes_transport")
    .select("*, vehicules(marque, modele), lignes_demande(vehicules(marque, modele))")
    .eq("id", demandeId)
    .eq("client_id", user.sub)
    .single();

  if (!demande) return { error: "Demande introuvable." };
  if (demande.statut !== "en_attente_paiement" || !demande.prix_negocie) {
    return { error: "Cette demande n'a pas de prix négocié en attente." };
  }

  const total = Number(demande.prix_negocie);

  const { data: paiement, error: paiementErr } = await admin
    .from("paiements")
    .insert({
      module: "transport",
      reference_table: "demandes_transport",
      reference_id: demande.id,
      type: "montant",
      montant: total,
      methode: methode as "cinetpay" | "stripe",
      statut: "en_attente",
    })
    .select("id")
    .single();

  if (paiementErr) return { error: paiementErr.message };

  const lignes = (demande as Record<string, unknown>).lignes_demande as { vehicules: { marque: string; modele: string } | null }[] | undefined;
  const nbVehicules = lignes?.length ?? 1;
  const v = demande.vehicules;
  const isAchat = demande.type === "achat";
  const description = isAchat
    ? `Acompte achat ${v?.marque ?? ""} ${v?.modele ?? ""}`
    : nbVehicules > 1
      ? `Location ${nbVehicules} véhicules (prix négocié)`
      : `Location ${v?.marque ?? ""} ${v?.modele ?? ""} (prix négocié)`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let paymentUrl: string;

  try {
    if (methode === "stripe") {
      paymentUrl = await creerSessionStripe({
        montantCFA: total,
        description,
        paiementId: paiement.id,
        successUrl: `${baseUrl}/reservation/confirmation?demande=${demande.id}`,
        cancelUrl: `${baseUrl}/reservation/echec?demande=${demande.id}`,
      });
    } else {
      paymentUrl = await creerSessionCinetPay({
        montantCFA: total,
        description,
        paiementId: paiement.id,
        returnUrl: `${baseUrl}/reservation/confirmation?demande=${demande.id}`,
        notifyUrl: `${baseUrl}/api/webhooks/cinetpay`,
      });
    }
  } catch (err) {
    return {
      error: `Erreur d'initialisation du paiement : ${err instanceof Error ? err.message : "erreur inconnue"}`,
    };
  }

  redirect(paymentUrl);
}
