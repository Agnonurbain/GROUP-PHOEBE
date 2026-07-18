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

const TAUX_CAUTION_DEFAUT = 0.3;

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
  vehiculeId: string;
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

  const admin = getAdmin();
  const vehiculeIds = lignes.map((l) => l.vehiculeId);

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

    const { error: dispoErr } = await admin
      .from("disponibilites_vehicule")
      .insert({ vehicule_id: ligne.vehiculeId, periode, type: "reservation" });

    if (dispoErr) {
      await rollback();
      if (dispoErr.code === "23P01") {
        return { error: `${v.marque} ${v.modele} n'est plus disponible sur cette période.` };
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
        return { error: `Aucun chauffeur disponible pour ${v.marque} ${v.modele} sur cette période.` };
      }

      reservedChauffeurs.push({ chauffeurId, periode });
    }

    const montant = Number(v.prix_journalier) * nbJours;
    const tauxCaution = v.taux_caution ? Number(v.taux_caution) : TAUX_CAUTION_DEFAUT;
    const caution = Math.round(montant * tauxCaution);

    ligneResults.push({ vehiculeId: ligne.vehiculeId, avecChauffeur: ligne.avecChauffeur, chauffeurId, montant, caution });
  }

  const totalMontant = ligneResults.reduce((s, l) => s + l.montant, 0);
  const totalCaution = ligneResults.reduce((s, l) => s + l.caution, 0);

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
      vehicule_id: ligneResults[0].vehiculeId,
      type: "reservation_directe",
      categorie: "classique",
      periode,
      ville_depart: villeDepartFinal,
      destination: destinationFinal,
      avec_chauffeur: ligneResults.some((l) => l.avecChauffeur),
      chauffeur_id: ligneResults[0].chauffeurId,
      montant: totalMontant,
      caution: totalCaution,
      statut: "en_negociation",
      negociation_note: note,
    })
    .select("id")
    .single();

  if (demandeErr) {
    await rollback();
    return { error: demandeErr.message };
  }

  const lignesInsert = ligneResults.map((l) => ({
    demande_id: demande.id,
    vehicule_id: l.vehiculeId,
    avec_chauffeur: l.avecChauffeur,
    chauffeur_id: l.chauffeurId,
    montant_ligne: l.montant,
    caution_ligne: l.caution,
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
  const description = nbVehicules > 1
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
