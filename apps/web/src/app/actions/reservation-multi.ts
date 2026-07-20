"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { creerSessionStripe } from "@/lib/payments/stripe";
import { creerSessionCinetPay } from "@/lib/payments/cinetpay";
import { expirerReservationsAbandonnees } from "@/lib/payments/expiration";
import { expirerDemandesSansReponse, expirerNonPresentations, expirerNegociationsAbandonnees } from "@/lib/payments/expiration-demandes";
import { assignerVehiculesGroupe, type AssignedVehicle, type ZoneTarif } from "@/app/actions/vehicle-assignment";

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type ReservationMultiState = {
  error?: string;
  success?: boolean;
};

type LigneInput = {
  groupKey: string;
  marque: string;
  modele: string;
  quantite: number;
  avecChauffeur: boolean;
};

export async function creerReservationMultiple(
  _prev: ReservationMultiState,
  formData: FormData
): Promise<ReservationMultiState> {
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

  const debut = formData.get("debut") as string;
  const fin = formData.get("fin") as string;
  const villeDepartRaw = (formData.get("ville_depart") as string) || null;
  const villeDepart = villeDepartRaw === "autre"
    ? (formData.get("ville_depart_autre") as string) || null
    : villeDepartRaw;
  const destinationRaw = (formData.get("destination") as string) || null;
  const destination = destinationRaw === "autre"
    ? (formData.get("destination_autre") as string) || null
    : destinationRaw;
  const methode = formData.get("methode_paiement") as string;
  const lignesRaw = formData.get("lignes") as string;

  if (!debut || !fin) {
    return { error: "Les dates de début et de fin sont obligatoires." };
  }

  if (new Date(fin) <= new Date(debut)) {
    return { error: "La date de fin doit être postérieure à la date de début." };
  }

  if (!["cinetpay", "stripe"].includes(methode)) {
    return { error: "Méthode de paiement invalide." };
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
    expirerNegociationsAbandonnees(),
  ]);

  let zone: ZoneTarif | undefined;
  let zoneId: string | null = null;
  if (destination) {
    const { data: commune } = await admin
      .from("communes")
      .select("zone_id")
      .eq("nom", destination)
      .maybeSingle();
    if (commune?.zone_id) {
      zoneId = commune.zone_id;
      const { data: zoneData } = await admin
        .from("zones_tarifaires")
        .select("coefficient_majoration, caution_multiplicateur, tarif_chauffeur_journalier, chauffeur_statut")
        .eq("id", commune.zone_id)
        .single();
      if (zoneData) zone = zoneData;
    }
  }

  const allAssigned: (AssignedVehicle & { avecChauffeur: boolean })[] = [];

  for (const ligne of lignes) {
    const avecChauffeurEffectif = ligne.avecChauffeur || zone?.chauffeur_statut === "obligatoire";
    const result = await assignerVehiculesGroupe(
      admin,
      ligne.marque,
      ligne.modele,
      ligne.quantite,
      periode,
      avecChauffeurEffectif,
      nbJours,
      zone
    );

    if (!result.ok) {
      // Rollback previously assigned vehicles
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
  const grandTotal = totalMontant + totalCaution;

  const { data: demande, error: demandeErr } = await admin
    .from("demandes_transport")
    .insert({
      client_id: user.sub,
      vehicule_id: allAssigned[0].vehiculeId,
      type: "reservation_directe",
      categorie: "classique",
      periode,
      ville_depart: villeDepart,
      destination,
      avec_chauffeur: allAssigned.some((v) => v.avecChauffeur),
      chauffeur_id: allAssigned[0].chauffeurId,
      montant: totalMontant,
      caution: totalCaution,
      methode_paiement: methode as "cinetpay" | "stripe",
      statut: "en_attente_paiement",
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

  const { error: lignesErr } = await admin
    .from("lignes_demande")
    .insert(lignesInsert);

  if (lignesErr) {
    return { error: lignesErr.message };
  }

  const { data: paiement, error: paiementErr } = await admin
    .from("paiements")
    .insert({
      module: "transport",
      reference_table: "demandes_transport",
      reference_id: demande.id,
      type: "montant",
      montant: grandTotal,
      methode: methode as "cinetpay" | "stripe",
      statut: "en_attente",
    })
    .select("id")
    .single();

  if (paiementErr) return { error: paiementErr.message };

  const totalVehicules = allAssigned.length;
  const firstVehicle = allAssigned[0];
  const description = totalVehicules === 1
    ? `Location ${firstVehicle.marque} ${firstVehicle.modele} — ${nbJours}j`
    : `Location ${totalVehicules} véhicules — ${nbJours}j`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let paymentUrl: string;

  try {
    if (methode === "stripe") {
      paymentUrl = await creerSessionStripe({
        montantCFA: grandTotal,
        description,
        paiementId: paiement.id,
        successUrl: `${baseUrl}/reservation/confirmation?demande=${demande.id}`,
        cancelUrl: `${baseUrl}/reservation/echec?demande=${demande.id}`,
      });
    } else {
      paymentUrl = await creerSessionCinetPay({
        montantCFA: grandTotal,
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
