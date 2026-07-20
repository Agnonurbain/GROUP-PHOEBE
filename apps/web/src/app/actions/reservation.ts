"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { creerSessionStripe } from "@/lib/payments/stripe";
import { creerSessionCinetPay } from "@/lib/payments/cinetpay";
import { expirerReservationsAbandonnees } from "@/lib/payments/expiration";
import { expirerDemandesSansReponse, expirerNonPresentations } from "@/lib/payments/expiration-demandes";
import { notifierAdminNouvelleReservation } from "./notifications-admin";

const TAUX_CAUTION_DEFAUT = 0.3;

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type ReservationState = {
  error?: string;
  success?: boolean;
};

export async function creerReservation(
  _prev: ReservationState,
  formData: FormData
): Promise<ReservationState> {
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

  const vehiculeId = formData.get("vehicule_id") as string;
  const debut = formData.get("debut") as string;
  const fin = formData.get("fin") as string;
  const avecChauffeur = formData.get("avec_chauffeur") === "on";
  const villeDepart = (formData.get("ville_depart") as string) || null;
  const destination = (formData.get("destination") as string) || null;
  const methode = formData.get("methode_paiement") as string;

  if (!vehiculeId || !debut || !fin) {
    return { error: "Véhicule, date de début et date de fin sont obligatoires." };
  }

  if (new Date(fin) <= new Date(debut)) {
    return { error: "La date de fin doit être postérieure à la date de début." };
  }

  if (!["cinetpay", "stripe"].includes(methode)) {
    return { error: "Méthode de paiement invalide." };
  }

  const { data: vehicule } = await supabase
    .from("vehicules")
    .select("*")
    .eq("id", vehiculeId)
    .single();

  if (!vehicule || vehicule.statut !== "disponible") {
    return { error: "Ce véhicule n'est pas disponible." };
  }

  if (!vehicule.prix_journalier) {
    return { error: "Ce véhicule n'a pas de tarif journalier défini." };
  }

  const nbJours = Math.ceil(
    (new Date(fin).getTime() - new Date(debut).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (nbJours < 1) return { error: "La durée minimale est d'un jour." };

  const montant = Number(vehicule.prix_journalier) * nbJours;
  const tauxCaution = vehicule.taux_caution ? Number(vehicule.taux_caution) : TAUX_CAUTION_DEFAUT;
  const caution = Math.round(montant * tauxCaution);
  const total = montant + caution;

  const periode = `[${new Date(debut).toISOString()},${new Date(fin).toISOString()})`;

  await Promise.all([
    expirerReservationsAbandonnees(),
    expirerDemandesSansReponse(),
    expirerNonPresentations(),
  ]);

  const admin = getAdmin();

  const { error: dispoErr } = await admin
    .from("disponibilites_vehicule")
    .insert({
      vehicule_id: vehiculeId,
      periode,
      type: "reservation",
    });

  if (dispoErr) {
    if (dispoErr.code === "23P01") {
      return {
        error:
          "Ce véhicule n'est plus disponible sur cette période. Un autre client a peut-être réservé entre-temps.",
      };
    }
    return { error: dispoErr.message };
  }

  let chauffeurId: string | null = null;

  if (avecChauffeur) {
    if (!vehicule.chauffeur_disponible) {
      await admin
        .from("disponibilites_vehicule")
        .delete()
        .eq("vehicule_id", vehiculeId)
        .eq("type", "reservation")
        .eq("periode", periode);
      return { error: "Ce véhicule ne propose pas l'option chauffeur." };
    }

    const { data: vcLinks } = await admin
      .from("vehicule_chauffeurs")
      .select("chauffeur_id")
      .eq("vehicule_id", vehiculeId);

    const candidats = vcLinks?.map((l) => l.chauffeur_id) ?? [];
    if (candidats.length === 0) {
      await admin
        .from("disponibilites_vehicule")
        .delete()
        .eq("vehicule_id", vehiculeId)
        .eq("type", "reservation")
        .eq("periode", periode);
      return { error: "Aucun chauffeur n'est affecté à ce véhicule." };
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
      await admin
        .from("disponibilites_vehicule")
        .delete()
        .eq("vehicule_id", vehiculeId)
        .eq("type", "reservation")
        .eq("periode", periode);
      return {
        error:
          "Aucun chauffeur n'est disponible sur cette période. Essayez sans l'option chauffeur ou avec d'autres dates.",
      };
    }
  }

  const { data: demande, error: demandeErr } = await admin
    .from("demandes_transport")
    .insert({
      client_id: user.sub,
      vehicule_id: vehiculeId,
      type: "reservation_directe",
      categorie: "classique",
      periode,
      ville_depart: villeDepart,
      destination,
      avec_chauffeur: avecChauffeur,
      chauffeur_id: chauffeurId,
      montant,
      caution,
      methode_paiement: methode as "cinetpay" | "stripe",
      statut: "en_attente_paiement",
    })
    .select("id")
    .single();

  if (demandeErr) {
    await admin
      .from("disponibilites_vehicule")
      .delete()
      .eq("vehicule_id", vehiculeId)
      .eq("type", "reservation")
      .eq("periode", periode);
    if (chauffeurId) {
      await admin
        .from("disponibilites_chauffeur")
        .delete()
        .eq("chauffeur_id", chauffeurId)
        .eq("periode", periode);
    }
    return { error: demandeErr.message };
  }

  const conducteurNom = (formData.get("conducteur_secondaire_nom") as string) || "";
  const conducteurPermis = formData.get("conducteur_secondaire_permis") as File | null;

  if (conducteurNom && conducteurPermis && conducteurPermis.size > 0) {
    const ext = conducteurPermis.name.split(".").pop() ?? "jpg";
    const path = `conducteurs/${demande.id}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await admin.storage
      .from("identity-documents")
      .upload(path, await conducteurPermis.arrayBuffer(), {
        contentType: conducteurPermis.type,
      });

    if (!upErr) {
      await admin.from("conducteurs_secondaires").insert({
        demande_transport_id: demande.id,
        nom: conducteurNom,
        permis_conduire_url: path,
      });
    }
  }

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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const description = `Location ${vehicule.marque} ${vehicule.modele} — ${nbJours}j`;

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

  await notifierAdminNouvelleReservation(
    demande.id,
    profile.nom,
    1,
    total
  );

  redirect(paymentUrl);
}
