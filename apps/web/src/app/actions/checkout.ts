"use server";

import { redirect } from "next/navigation";
import { err } from "@/lib/i18n/erreurs";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { validateDocumentUpload } from "@/lib/upload-validation";
import { creerSessionStripe } from "@/lib/payments/stripe";
import { creerSessionCinetPay } from "@/lib/payments/cinetpay";
import { computeItemPricing, type ZonePricing } from "@/lib/pricing";
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
  if (!user) return { error: await err("vousDevezEtreConnecte") };

  const { data: profile } = await supabase
    .from("users")
    .select("id, nom, statut_verification")
    .eq("id", user.sub)
    .single();

  if (!profile) return { error: await err("profilIntrouvable") };

  // Une case cochée dans le DOM n'est pas une preuve : le consentement est exigé
  // côté serveur, et c'est lui qui est enregistré sur chaque demande.
  if (formData.get("accepte_cgv") !== "on") {
    return { error: await err("vousDevezAccepterLesConditionsGenerales") };
  }
  if (profile.statut_verification !== "verifie") {
    return { error: await err("votreIdentiteDoitEtreVerifieeAvant") };
  }

  const rawItems = formData.get("items") as string;
  const debut = formData.get("debut") as string;
  const fin = formData.get("fin") as string;
  const villeDepart = (formData.get("ville_depart") as string) || null;
  const destination = (formData.get("destination") as string) || null;
  const zoneNom = (formData.get("zone") as string) || null;
  const methode = formData.get("methode_paiement") as string;

  if (!rawItems || !debut || !fin) {
    return { error: await err("articlesDateDeDebutEtDate") };
  }

  if (new Date(fin) <= new Date(debut)) {
    return { error: await err("laDateDeFinDoitEtre") };
  }

  if (!["cinetpay", "stripe"].includes(methode)) {
    return { error: await err("methodeDePaiementInvalide") };
  }

  let items: CartInput[];
  try {
    items = JSON.parse(rawItems);
  } catch {
    return { error: await err("formatDesArticlesInvalide") };
  }

  if (items.length === 0) {
    return { error: await err("votrePanierEstVide") };
  }

  const nbJours = Math.ceil(
    (new Date(fin).getTime() - new Date(debut).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (nbJours < 1) return { error: await err("laDureeMinimaleEstDUn") };

  const admin = getAdmin();
  const adminSupabase = await createClient();

  // Tarification par zone : le client envoie le NOM de zone qu'il a vu affiché
  // (detectedZone). On recharge ses paramètres tarifaires côté serveur pour que
  // le montant facturé corresponde exactement à celui présenté.
  let zone: ZonePricing = null;
  if (zoneNom) {
    const { data: zoneData } = await admin
      .from("zones_tarifaires")
      .select("coefficient_majoration, tarif_chauffeur_journalier, chauffeur_statut, caution_multiplicateur")
      .eq("nom", zoneNom)
      .maybeSingle();
    if (zoneData) zone = zoneData as unknown as ZonePricing;
  }

  const createdDemandes: Array<{ id: string; vehiculeId: string; chauffeurId: string | null; montant: number; caution: number }> = [];

  const peri = `[${new Date(debut).toISOString()},${new Date(fin).toISOString()})`;

  for (const item of items) {
    // quantite = nombre de vehicules de ce modele. On reserve autant de
    // vehicules DISTINCTS et disponibles sur la periode (essai-insertion :
    // la contrainte d'exclusion rejette ceux deja pris, on passe au suivant).
    const { data: candidats } = await adminSupabase
      .from("vehicules")
      .select("*")
      .eq("marque", item.marque)
      .eq("modele", item.modele)
      .eq("statut", "disponible");

    if (!candidats || candidats.length === 0) continue;

    let bookedForItem = 0;

    for (const vehicule of candidats) {
      if (bookedForItem >= item.quantite) break;
      if (!vehicule.prix_journalier) continue;

      // Prix pour UN vehicule, tarification zone incluse (coefficient, chauffeur
      // obligatoire a l'interieur, caution = % du montant zone). Source unique
      // partagee avec l'affichage client -> montant affiche == montant facture.
      const { montant: montantPerVehicule, caution: cautionPerVehicule, chauffeurObligatoire } =
        computeItemPricing({
          prixJournalier: Number(vehicule.prix_journalier),
          tauxCaution: vehicule.taux_caution ? Number(vehicule.taux_caution) : TAUX_CAUTION_DEFAUT,
          nbJours,
          avecChauffeur: item.avecChauffeur,
          zone,
        });
      const avecChauffeurEffectif = item.avecChauffeur || chauffeurObligatoire;

      const { error: dispoErr } = await admin
        .from("disponibilites_vehicule")
        .insert({
          vehicule_id: vehicule.id,
          periode: peri,
          type: "reservation",
        });

      if (dispoErr) continue;

      let chauffeurId: string | null = null;

      if (avecChauffeurEffectif && vehicule.chauffeur_disponible) {
        const { data: vcLinks } = await admin
          .from("vehicule_chauffeurs")
          .select("chauffeur_id")
          .eq("vehicule_id", vehicule.id);

        const candidatsChauffeur = vcLinks?.map((l) => l.chauffeur_id) ?? [];
        for (const cid of candidatsChauffeur) {
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
          accepte_cgv: true,
          periode: peri,
          ville_depart: villeDepart,
          destination,
          avec_chauffeur: avecChauffeurEffectif,
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
      bookedForItem++;
    }
  }

  if (createdDemandes.length === 0) {
    return { error: await err("aucunVehiculeDisponibleParmiLesArticles") };
  }

  // Second conducteur, s'il est déclaré. Il était collecté par `creerReservation`
  // — fonction morte, appelée de nulle part : la donnée n'arrivait jamais, et
  // l'écran de vérification côté admin n'avait rien à montrer. Rattaché à la
  // première demande du panier : c'est le véhicule que le client vient chercher.
  const conducteurNom = ((formData.get("conducteur_secondaire_nom") as string) || "").trim();
  const conducteurPermis = formData.get("conducteur_secondaire_permis") as File | null;

  if (
    conducteurNom &&
    conducteurPermis &&
    typeof conducteurPermis !== "string" &&
    conducteurPermis.size > 0 &&
    createdDemandes.length > 0
  ) {
    let ext: string;
    try {
      ({ ext } = validateDocumentUpload(conducteurPermis));
    } catch {
      ext = "";
    }

    if (ext) {
      const premiere = createdDemandes[0];
      // Bucket privé : c'est le chemin qui est stocké, l'URL se signe à la
      // demande côté admin.
      const chemin = `conducteurs/${premiere.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await admin.storage
        .from("identity-documents")
        .upload(chemin, await conducteurPermis.arrayBuffer(), {
          contentType: conducteurPermis.type,
        });

      if (!upErr) {
        await admin.from("conducteurs_secondaires").insert({
          demande_transport_id: premiere.id,
          nom: conducteurNom,
          permis_conduire_url: chemin,
        });
      }
    }
  }

  const totalMontant = createdDemandes.reduce((s, d) => s + d.montant, 0);
  const totalCaution = createdDemandes.reduce((s, d) => s + d.caution, 0);
  const totalGlobal = totalMontant + totalCaution;

  const paiements: Array<{ id: string; demande_id: string }> = [];

  // Un identifiant de commande partage par tous les paiements du panier : le
  // webhook confirmera (ou annulera) l'ensemble du groupe, pas seulement le
  // paiement renvoye par le prestataire.
  const commandeId = crypto.randomUUID();

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
        commande_id: commandeId,
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
    return { error: await err("erreurLorsDeLaCreationDu") };
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
  } catch (erreurAttrapee) {
    return {
      error: await err("erreurInitialisationPaiement", {
          detail: erreurAttrapee instanceof Error ? erreurAttrapee.message : "",
        }),
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
