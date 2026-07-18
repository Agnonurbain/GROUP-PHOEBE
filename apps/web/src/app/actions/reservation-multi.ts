"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { creerSessionStripe } from "@/lib/payments/stripe";
import { creerSessionCinetPay } from "@/lib/payments/cinetpay";
import { expirerReservationsAbandonnees } from "@/lib/payments/expiration";
import { expirerDemandesSansReponse, expirerNonPresentations } from "@/lib/payments/expiration-demandes";

const TAUX_CAUTION_DEFAUT = 0.3;

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
  vehiculeId: string;
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
  if (profile.statut_verification !== "verifie") {
    return {
      error:
        "Votre identité doit être vérifiée avant de réserver. Rendez-vous sur votre profil pour soumettre vos documents.",
    };
  }

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

  const vehiculeIds = lignes.map((l) => l.vehiculeId);
  const admin = getAdmin();

  const { data: vehicules } = await admin
    .from("vehicules")
    .select("*")
    .in("id", vehiculeIds);

  if (!vehicules || vehicules.length !== lignes.length) {
    return { error: "Un ou plusieurs véhicules sont introuvables." };
  }

  const vehiculesMap = new Map(vehicules.map((v) => [v.id, v]));

  for (const v of vehicules) {
    if (v.statut !== "disponible") {
      return { error: `${v.marque} ${v.modele} n'est plus disponible.` };
    }
    if (!v.prix_journalier) {
      return { error: `${v.marque} ${v.modele} n'a pas de tarif journalier défini.` };
    }
  }

  const nbJours = Math.ceil(
    (new Date(fin).getTime() - new Date(debut).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (nbJours < 1) return { error: "La durée minimale est d'un jour." };

  const periode = `[${new Date(debut).toISOString()},${new Date(fin).toISOString()})`;

  await Promise.all([
    expirerReservationsAbandonnees(),
    expirerDemandesSansReponse(),
    expirerNonPresentations(),
  ]);

  // Track what we've reserved so we can rollback on error
  const reservedVehicules: { vehiculeId: string; periode: string }[] = [];
  const reservedChauffeurs: { chauffeurId: string; periode: string }[] = [];

  async function rollback() {
    for (const rv of reservedVehicules) {
      await admin
        .from("disponibilites_vehicule")
        .delete()
        .eq("vehicule_id", rv.vehiculeId)
        .eq("type", "reservation")
        .eq("periode", rv.periode);
    }
    for (const rc of reservedChauffeurs) {
      await admin
        .from("disponibilites_chauffeur")
        .delete()
        .eq("chauffeur_id", rc.chauffeurId)
        .eq("periode", rc.periode);
    }
  }

  type LigneResult = {
    vehiculeId: string;
    avecChauffeur: boolean;
    chauffeurId: string | null;
    montant: number;
    caution: number;
  };

  const ligneResults: LigneResult[] = [];

  for (const ligne of lignes) {
    const v = vehiculesMap.get(ligne.vehiculeId)!;

    // Reserve vehicle availability
    const { error: dispoErr } = await admin
      .from("disponibilites_vehicule")
      .insert({
        vehicule_id: ligne.vehiculeId,
        periode,
        type: "reservation",
      });

    if (dispoErr) {
      await rollback();
      if (dispoErr.code === "23P01") {
        return {
          error: `${v.marque} ${v.modele} n'est plus disponible sur cette période.`,
        };
      }
      return { error: dispoErr.message };
    }

    reservedVehicules.push({ vehiculeId: ligne.vehiculeId, periode });

    let chauffeurId: string | null = null;

    if (ligne.avecChauffeur) {
      if (!v.chauffeur_disponible) {
        await rollback();
        return { error: `${v.marque} ${v.modele} ne propose pas l'option chauffeur.` };
      }

      const { data: vcLinks } = await admin
        .from("vehicule_chauffeurs")
        .select("chauffeur_id")
        .eq("vehicule_id", ligne.vehiculeId);

      const candidats = vcLinks?.map((l) => l.chauffeur_id) ?? [];
      if (candidats.length === 0) {
        await rollback();
        return { error: `Aucun chauffeur n'est affecté à ${v.marque} ${v.modele}.` };
      }

      for (const cid of candidats) {
        const { error: chauffeurErr } = await admin
          .from("disponibilites_chauffeur")
          .insert({ chauffeur_id: cid, periode });

        if (!chauffeurErr) {
          chauffeurId = cid;
          break;
        }
        if (chauffeurErr.code !== "23P01") {
          console.error("Erreur insertion dispo chauffeur:", chauffeurErr.message);
        }
      }

      if (!chauffeurId) {
        await rollback();
        return {
          error: `Aucun chauffeur disponible pour ${v.marque} ${v.modele} sur cette période.`,
        };
      }

      reservedChauffeurs.push({ chauffeurId, periode });
    }

    const montant = Number(v.prix_journalier) * nbJours;
    const tauxCaution = v.taux_caution ? Number(v.taux_caution) : TAUX_CAUTION_DEFAUT;
    const caution = Math.round(montant * tauxCaution);

    ligneResults.push({
      vehiculeId: ligne.vehiculeId,
      avecChauffeur: ligne.avecChauffeur,
      chauffeurId,
      montant,
      caution,
    });
  }

  const totalMontant = ligneResults.reduce((s, l) => s + l.montant, 0);
  const totalCaution = ligneResults.reduce((s, l) => s + l.caution, 0);
  const grandTotal = totalMontant + totalCaution;

  // Create the demande (header)
  const { data: demande, error: demandeErr } = await admin
    .from("demandes_transport")
    .insert({
      client_id: user.sub,
      vehicule_id: ligneResults[0].vehiculeId,
      type: "reservation_directe",
      categorie: "classique",
      periode,
      ville_depart: villeDepart,
      destination,
      avec_chauffeur: ligneResults.some((l) => l.avecChauffeur),
      chauffeur_id: ligneResults[0].chauffeurId,
      montant: totalMontant,
      caution: totalCaution,
      methode_paiement: methode as "cinetpay" | "stripe",
      statut: "en_attente_paiement",
    })
    .select("id")
    .single();

  if (demandeErr) {
    await rollback();
    return { error: demandeErr.message };
  }

  // Create lignes_demande
  const lignesInsert = ligneResults.map((l) => ({
    demande_id: demande.id,
    vehicule_id: l.vehiculeId,
    avec_chauffeur: l.avecChauffeur,
    chauffeur_id: l.chauffeurId,
    montant_ligne: l.montant,
    caution_ligne: l.caution,
  }));

  const { error: lignesErr } = await admin
    .from("lignes_demande")
    .insert(lignesInsert);

  if (lignesErr) {
    await rollback();
    return { error: lignesErr.message };
  }

  // Create payment
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

  const nbVehicules = lignes.length;
  const description = nbVehicules === 1
    ? `Location ${vehicules[0].marque} ${vehicules[0].modele} — ${nbJours}j`
    : `Location ${nbVehicules} véhicules — ${nbJours}j`;

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
