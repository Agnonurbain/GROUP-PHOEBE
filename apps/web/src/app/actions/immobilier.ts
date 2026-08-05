"use server";

import { redirect } from "next/navigation";
import { err } from "@/lib/i18n/erreurs";
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import {
  isTypeDemande,
  isStatutDemande,
  transitionDemandeAutorisee,
  transitionVisiteAutorisee,
  isStatutVisite,
  STATUT_VISITE_LABELS,
  TYPE_DEMANDE_LABELS,
  STATUT_DEMANDE_LABELS,
  typeBienLabel,
  formaterCreneau,
  estLocation,
  calculerCommission,
  STATUTS_DEMANDE_OFFRE_ACTIFS,
  STATUTS_DEMANDE_VISITE_ACTIFS,
  STATUTS_CONTRE_OFFRE_POSSIBLE,
  validerContreOffre,
} from "@/lib/immobilier";
import { notifierClient } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import {
  notifierAdminNouvelleDemandeImmobilier,
  notifierAdminReponseContreOffre,
  notifierAdminReponseCreneauVisite,
} from "./notifications-admin";
import { getParametresImmobilier } from "@/lib/public-cache";
import { creerSessionStripe } from "@/lib/payments/stripe";
import { creerSessionCinetPay } from "@/lib/payments/cinetpay";

export type ImmobilierState = {
  error?: string;
};

export type DemandeImmoActionState = {
  error?: string;
  success?: boolean;
};

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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
  if (!profile || !["operateur", "proprietaire", "agent_immobilier"].includes(profile.role)) {
    throw new Error("Accès refusé");
  }
  return { user, role: profile.role as string };
}

// Écrire un montant facturé est réservé au propriétaire : un opérateur ne
// négocie pas les prix. Cf. __tests__/prix-proprietaire.test.ts.
async function requireProprietaireAvecId() {
  const { user, role } = await requireStaff();
  if (role !== "proprietaire") throw new Error("Accès refusé : propriétaire requis");
  return user.sub as string;
}

async function requireClient() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) throw new Error("Non authentifié");
  return user.sub as string;
}

// Demande d'interaction sur un bien (information / visite / offre), SANS paiement
// en ligne : crée la demande au statut "en_attente" et notifie l'équipe, qui
// recontacte le client. Les détails sans colonne dédiée (message, date de visite)
// sont portés par la notification admin.
export async function creerDemandeImmobilier(
  _prev: ImmobilierState,
  formData: FormData
): Promise<ImmobilierState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: await err("vousDevezEtreConnectePourEnvoyer") };

  const { data: profile } = await supabase
    .from("users")
    .select("id, nom, telephone, email")
    .eq("id", user.sub)
    .single();
  if (!profile) return { error: await err("profilIntrouvable") };

  const bienId = formData.get("bien_id") as string;
  const type = formData.get("type") as string;
  const message = ((formData.get("message") as string) || "").trim();
  const dateSouhaitee = ((formData.get("date_souhaitee") as string) || "").trim();
  const montantRaw = formData.get("montant") as string;
  const methode = ((formData.get("methode_paiement") as string) || "stripe").trim();
  const locationDebut = ((formData.get("location_debut") as string) || "").trim();
  const locationDureeRaw = ((formData.get("location_duree_mois") as string) || "").trim();

  if (!bienId) return { error: await err("bienInvalide") };
  if (!isTypeDemande(type)) return { error: await err("typeDeDemandeInvalide") };

  const admin = getAdmin();

  const { data: bien } = await admin
    .from("biens")
    .select("type, localisation, statut, agent_id, transaction")
    .eq("id", bienId)
    .single();
  if (!bien) return { error: await err("bienIntrouvable") };
  if (bien.statut !== "disponible") return { error: await err("ceBienNEstPlusDisponible") };

  if (!["stripe", "cinetpay"].includes(methode)) {
    return { error: await err("moyenDePaiementInvalide") };
  }

  // Une seule demande de visite active par client et par bien : sans cette
  // garde, le client pouvait relancer une visite et payer les frais deux fois.
  if (type === "visite") {
    const { count: visitesEnCours } = await admin
      .from("demandes_immobilier")
      .select("id", { count: "exact", head: true })
      .eq("client_id", user.sub)
      .eq("bien_id", bienId)
      .eq("type", "visite")
      .in("statut", STATUTS_DEMANDE_VISITE_ACTIFS as unknown as string[]);

    if ((visitesEnCours ?? 0) > 0) {
      return {
        error: await err("vousAvezDejaUneDemandeDe"),
      };
    }
  }

  // Location : la période fait partie de l'offre. Sans elle, le montant convenu
  // ne dirait pas s'il s'agit d'un loyer ou d'un total.
  let locationDureeMois: number | null = null;
  if (type === "offre" && estLocation(bien.transaction)) {
    locationDureeMois = Number(locationDureeRaw);
    if (!Number.isFinite(locationDureeMois) || locationDureeMois < 1) {
      return { error: await err("indiquezLaDureeDeLocationSouhaitee") };
    }
    if (!locationDebut) {
      return { error: await err("indiquezLaDateDeDebutDe") };
    }
  }

  let montantOffre: number | null = null;
  if (type === "offre") {
    montantOffre = Number(montantRaw);
    if (!montantOffre || montantOffre <= 0) {
      return { error: await err("leMontantDeLOffreDoit") };
    }

    // Limite d'offres par client
    const params = await getParametresImmobilier();
    const { count: offresExistantes } = await admin
      .from("demandes_immobilier")
      .select("id", { count: "exact", head: true })
      .eq("client_id", user.sub)
      .eq("type", "offre")
      .in("statut", STATUTS_DEMANDE_OFFRE_ACTIFS as unknown as string[]);

    if ((offresExistantes ?? 0) >= params.max_offres_client) {
      return { error: await err("limiteOffresAtteinte", { max: params.max_offres_client }) };
    }
  }

  const { data: demande, error: demandeErr } = await admin
    .from("demandes_immobilier")
    .insert({
      bien_id: bienId,
      client_id: user.sub,
      type,
      montant_offre: montantOffre,
      // Message et date souhaitée sont désormais persistés (00050) : ils ne
      // vivaient que dans le texte de la notification admin.
      message: message || null,
      date_souhaitee: type === "visite" && dateSouhaitee ? dateSouhaitee : null,
      location_debut: locationDureeMois != null && locationDebut ? locationDebut : null,
      location_duree_mois: locationDureeMois,
      // L'agent référent du bien suit la demande. Sans cet héritage, il fallait
      // l'affecter à la main sur chaque demande avant de pouvoir programmer une
      // visite — `visites.agent_id` est NOT NULL — alors que le bien avait déjà
      // le sien, posé à sa création par autoAssignAgent().
      agent_id: bien.agent_id,
      // Une offre s'annonce comme telle. « en_attente » ne distinguait pas une
      // offre chiffrée d'une simple demande d'information dans la liste admin.
      statut: type === "offre" ? "offre_soumise" : "en_attente",
    })
    .select("id")
    .single();
  if (demandeErr) return { error: await err("impossibleDEnregistrerLaDemandeVeuillez") };

  const detail =
    type === "offre"
      ? `Offre ${montantOffre!.toLocaleString("fr-FR")} FCFA${message ? ` — ${message}` : ""}`
      : type === "visite"
        ? `${dateSouhaitee ? `Souhait: ${dateSouhaitee}` : ""}${message ? `${dateSouhaitee ? " — " : ""}${message}` : ""}`
        : message;

  await notifierAdminNouvelleDemandeImmobilier(
    bienId,
    profile.nom,
    `${typeBienLabel(bien.type)} à ${bien.localisation}`,
    TYPE_DEMANDE_LABELS[type],
    detail
  );

  // Pour une visite : paiement des frais de visite, dus et non remboursables.
  // Ce n'est pas une caution : rien n'est restitué au client. Le montant lui est
  // annoncé sur le formulaire du bien avant qu'il ne s'engage.
  if (type === "visite") {
    const params = await getParametresImmobilier();
    const montantFrais = params.frais_visite;

    const { data: paiement, error: paiementErr } = await admin
      .from("paiements")
      .insert({
        module: "immobilier",
        reference_table: "demandes_immobilier",
        reference_id: demande.id,
        type: "frais",
        montant: montantFrais,
        methode: methode as "cinetpay" | "stripe",
        statut: "en_attente",
      })
      .select("id")
      .single();
    if (paiementErr) return { error: await err("impossibleDeCreerLePaiement") };

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const description = `Frais de visite — ${typeBienLabel(bien.type)} à ${bien.localisation}`;

    // Mobile Money (Wave, Orange Money, MTN) via CinetPay, ou carte via Stripe.
    // L'immobilier n'offrait que la carte, alors que CinetPay était déjà branché
    // sur les trois autres modules — les clients sans carte étaient exclus du
    // seul parcours payant du module.
    let paymentUrl: string;
    try {
      if (methode === "cinetpay") {
        paymentUrl = await creerSessionCinetPay({
          montantCFA: montantFrais,
          description,
          paiementId: paiement.id,
          returnUrl: `${baseUrl}/immobilier/confirmation?type=visite`,
          notifyUrl: `${baseUrl}/api/webhooks/cinetpay`,
        });
      } else {
        paymentUrl = await creerSessionStripe({
          montantCFA: montantFrais,
          description,
          paiementId: paiement.id,
          successUrl: `${baseUrl}/immobilier/confirmation?type=visite`,
          cancelUrl: `${baseUrl}/immobilier/${bienId}`,
        });
      }
    } catch (erreurAttrapee) {
      return {
        error: await err("erreurInitialisationPaiement", {
          detail: erreurAttrapee instanceof Error ? erreurAttrapee.message : "",
        }),
      };
    }

    redirect(paymentUrl);
  }

  redirect(`/immobilier/confirmation?type=${type}`);
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function changerStatutDemandeImmobilier(
  _prev: DemandeImmoActionState,
  formData: FormData
): Promise<DemandeImmoActionState> {
  try {
    await requireStaff();
  } catch {
    return { error: await err("sessionExpireeOuAccesRefuse") };
  }
  const admin = getAdmin();
  const demandeId = formData.get("demande_id") as string;
  const statut = formData.get("statut") as string;

  if (!demandeId || !isStatutDemande(statut)) {
    return { error: await err("statutInvalide") };
  }
  // « contre_offre » implique un montant : il ne s'obtient que via
  // proposerContreOffre, sinon le client verrait une contre-offre sans prix.
  if (statut === "contre_offre") {
    return { error: await err("passezParLeFormulaireDeContre") };
  }

  const { data: demande } = await admin
    .from("demandes_immobilier")
    .select("client_id, bien_id, statut, montant_offre, montant_contre_offre, montant_convenu")
    .eq("id", demandeId)
    .single();
  if (!demande) return { error: await err("demandeIntrouvable") };

  if (demande.statut === statut) return { success: true };

  // Sans cette garde, une demande `refusee` — y compris close automatiquement
  // parce qu'un concurrent avait emporté le bien — pouvait repasser à
  // `acceptee` : deux acquéreurs engagés sur le même bien, deux prix figés,
  // deux commissions dues.
  if (!transitionDemandeAutorisee(demande.statut, statut)) {
    return {
      error: await err("passageImpossible", {
        de: STATUT_DEMANDE_LABELS[demande.statut] ?? demande.statut,
        vers: STATUT_DEMANDE_LABELS[statut] ?? statut,
      }),
    };
  }

  // Accepter arrête le prix. Après une contre-offre c'est elle qui fait foi ;
  // sinon c'est l'offre du client. Écrit dans le même UPDATE que le statut, car
  // le trigger `garde_montants` (00053) gèle les montants dès l'acceptation.
  const figerMontant =
    statut === "acceptee" && demande.montant_convenu == null;
  const montantConvenu = figerMontant
    ? (demande.montant_contre_offre ?? demande.montant_offre)
    : null;
  const commission =
    montantConvenu != null ? await commissionDue(Number(montantConvenu)) : null;

  // Un bien déjà réservé ou vendu ne peut plus faire l'objet d'un second accord.
  if (statut === "acceptee" && demande.bien_id) {
    const { data: bienActuel } = await admin
      .from("biens")
      .select("statut")
      .eq("id", demande.bien_id)
      .single();

    if (bienActuel && !["disponible", "reserve"].includes(bienActuel.statut)) {
      return { error: await err("bienNonAcceptable", { statut: bienActuel.statut }) };
    }
  }

  const { error } = await admin
    .from("demandes_immobilier")
    .update({
      statut,
      ...(figerMontant && montantConvenu != null
        ? {
            montant_convenu: montantConvenu,
            ...(commission
              ? { taux_commission: commission.taux, montant_commission: commission.montant }
              : {}),
          }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", demandeId)
    .eq("statut", demande.statut);
  if (error) return { error: error.message };

  if (statut === "acceptee" && demande.bien_id) {
    await admin
      .from("biens")
      .update({ statut: "reserve", updated_at: new Date().toISOString() })
      .eq("id", demande.bien_id)
      .eq("statut", "disponible");

    await cloturerConcurrentes(admin, demandeId, demande.bien_id);
  } else if (statut === "finalisee" && demande.bien_id) {
    const { data: bien } = await admin.from("biens").select("transaction").eq("id", demande.bien_id).single();
    const statutBien = bien?.transaction === "location" ? "loue" : "vendu";
    await admin.from("biens").update({ statut: statutBien, updated_at: new Date().toISOString() }).eq("id", demande.bien_id);
  } else if (["refusee", "annulee"].includes(statut) && demande.bien_id) {
    const { data: bien } = await admin.from("biens").select("statut").eq("id", demande.bien_id).single();
    if (bien?.statut === "reserve") {
      await admin.from("biens").update({ statut: "disponible", updated_at: new Date().toISOString() }).eq("id", demande.bien_id);
    }
  }

  {
    await notifierClient(
      demande.client_id,
      "Mise à jour de votre demande immobilière",
      `Votre demande : ${STATUT_DEMANDE_LABELS[statut] ?? statut}.`
    );
  }
  revalidatePath("/admin/demandes-immobilier");
  return { success: true };
}

export async function affecterAgentImmobilier(
  _prev: DemandeImmoActionState,
  formData: FormData
): Promise<DemandeImmoActionState> {
  try {
    await requireStaff();
  } catch {
    return { error: await err("sessionExpireeOuAccesRefuse") };
  }
  const admin = getAdmin();
  const demandeId = formData.get("demande_id") as string;
  const agentId = (formData.get("agent_id") as string) || null;

  if (!demandeId) return { error: await err("demandeInvalide") };

  const { error } = await admin
    .from("demandes_immobilier")
    .update({ agent_id: agentId, updated_at: new Date().toISOString() })
    .eq("id", demandeId);
  if (error) return { error: error.message };

  revalidatePath("/admin/demandes-immobilier");
  return { success: true };
}


/**
 * Effets de bord d'une acceptation d'offre, communs au client qui accepte une
 * contre-offre et au staff qui accepte depuis la liste :
 *   · les offres concurrentes du même bien sont refusées et leurs auteurs
 *     prévenus — sans quoi elles restaient ouvertes jusqu'au cron à 7 jours, et
 *     ces clients n'apprenaient jamais que le bien leur échappait ;
 *   · le bien passe en réservé, seulement s'il était encore disponible.
 */
async function cloturerConcurrentes(
  admin: ReturnType<typeof getAdmin>,
  demandeId: string,
  bienId: string
) {
  const { data: concurrentes } = await admin
    .from("demandes_immobilier")
    .select("id, client_id")
    .eq("bien_id", bienId)
    .eq("type", "offre")
    .neq("id", demandeId)
    .in("statut", STATUTS_CONTRE_OFFRE_POSSIBLE as unknown as string[]);

  for (const c of concurrentes ?? []) {
    await admin
      .from("demandes_immobilier")
      .update({ statut: "refusee", updated_at: new Date().toISOString() })
      .eq("id", c.id);

    await notifierClient(
      c.client_id,
      "Votre offre n'a pas été retenue",
      "Le bien qui vous intéressait a fait l'objet d'un accord avec un autre acquéreur. Votre offre est close — d'autres biens sont disponibles au catalogue."
    );
  }

  return (concurrentes ?? []).length;
}

/** Calcule la commission due sur un montant convenu, au taux courant. */
async function commissionDue(montantConvenu: number) {
  const params = await getParametresImmobilier();
  return {
    taux: params.taux_commission,
    montant: calculerCommission(montantConvenu, params.taux_commission),
  };
}

// ─── Contre-offre ─────────────────────────────────────────────────────────────
// Cycle : le client fait une offre sous le prix affiché → le propriétaire
// contre-offre (statut « contre_offre ») → le client accepte (bien réservé) ou
// refuse (bien libéré). Un opérateur ne peut pas contre-offrir : il écrirait un
// montant. Le trigger `garde_montants` (00047) verrouille aussi l'accès direct
// à l'API REST, que la garde applicative ne couvre pas.

export type ContreOffreState = {
  error?: string;
  success?: boolean;
};

export async function proposerContreOffre(
  _prev: ContreOffreState,
  formData: FormData
): Promise<ContreOffreState> {
  let proprietaireId: string;
  try {
    proprietaireId = await requireProprietaireAvecId();
  } catch {
    return { error: await err("seulLeProprietairePeutProposerUne") };
  }

  const demandeId = formData.get("demande_id") as string;
  const montant = Number(formData.get("montant"));
  if (!demandeId) return { error: await err("demandeInvalide") };

  const admin = getAdmin();

  const { data: demande } = await admin
    .from("demandes_immobilier")
    .select("id, type, statut, montant_offre, montant_contre_offre, client_id, bien_id")
    .eq("id", demandeId)
    .single();
  if (!demande) return { error: await err("demandeIntrouvable") };

  if (demande.type !== "offre") {
    return { error: await err("uneContreOffreNeSApplique") };
  }
  if (!(STATUTS_CONTRE_OFFRE_POSSIBLE as readonly string[]).includes(demande.statut)) {
    return {
      error: await err("negociationClose", {
        statut: STATUT_DEMANDE_LABELS[demande.statut] ?? demande.statut,
      }),
    };
  }
  if (demande.montant_offre == null) {
    return { error: await err("cetteDemandeNePorteAucuneOffre") };
  }

  const { data: bien } = await admin
    .from("biens")
    .select("prix, statut, type, localisation")
    .eq("id", demande.bien_id)
    .single();
  if (!bien) return { error: await err("bienIntrouvable") };
  if (!["disponible", "reserve"].includes(bien.statut)) {
    return { error: await err("ceBienNEstPlusNegociable") };
  }

  const params = await getParametresImmobilier();
  const validation = validerContreOffre({
    montant,
    montantOffre: Number(demande.montant_offre),
    prixBien: Number(bien.prix),
    tauxMaxReduction: params.taux_max_reduction,
  });
  if ("error" in validation) return { error: validation.error };

  const { error } = await admin
    .from("demandes_immobilier")
    .update({
      montant_contre_offre: montant,
      statut: "contre_offre",
      updated_at: new Date().toISOString(),
    })
    .eq("id", demandeId);
  if (error) return { error: error.message };

  await logAudit({
    userId: proprietaireId,
    action: "contre_offre_immobilier",
    tableName: "demandes_immobilier",
    recordId: demandeId,
    oldValues: { montant_contre_offre: demande.montant_contre_offre, statut: demande.statut },
    newValues: { montant_contre_offre: montant, statut: "contre_offre" },
  });

  await notifierClient(
    demande.client_id,
    "Contre-offre sur votre offre immobilière",
    `${typeBienLabel(bien.type)} à ${bien.localisation} : le propriétaire vous propose ${montant.toLocaleString("fr-FR")} FCFA. Retrouvez la contre-offre dans « Mes réservations » pour l'accepter ou la refuser.`
  );

  revalidatePath("/admin/demandes-immobilier");
  return { success: true };
}

export async function repondreContreOffre(
  demandeId: string,
  reponse: "accepter" | "refuser"
): Promise<ContreOffreState> {
  let clientId: string;
  try {
    clientId = await requireClient();
  } catch {
    return { error: await err("vousDevezEtreConnecte") };
  }
  if (!demandeId) return { error: await err("demandeInvalide") };

  const admin = getAdmin();

  const { data: demande } = await admin
    .from("demandes_immobilier")
    .select("id, statut, client_id, bien_id, montant_contre_offre")
    .eq("id", demandeId)
    .single();
  if (!demande) return { error: await err("demandeIntrouvable") };
  // La demande est lue avec la clé de service : l'appartenance se vérifie ici.
  if (demande.client_id !== clientId) return { error: await err("cetteDemandeNEstPasLa") };
  if (demande.statut !== "contre_offre") {
    return { error: await err("aucuneContreOffreEnAttenteSur") };
  }

  const accepte = reponse === "accepter";

  // Le bien a pu être réservé ou vendu entre la contre-offre et cette réponse :
  // sans cette garde, deux accords pouvaient coexister sur le même bien.
  if (accepte) {
    const { data: bienActuel } = await admin
      .from("biens")
      .select("statut")
      .eq("id", demande.bien_id)
      .single();

    if (bienActuel?.statut !== "disponible") {
      return {
        error: await err("ceBienNEstPlusDisponible2"),
      };
    }
  }

  const commission = accepte && demande.montant_contre_offre != null
    ? await commissionDue(Number(demande.montant_contre_offre))
    : null;

  const { error } = await admin
    .from("demandes_immobilier")
    .update({
      statut: accepte ? "acceptee" : "refusee",
      // Prix convenu ET commission sont arrêtés ici, dans le même UPDATE que le
      // statut : le trigger `garde_montants` refuse toute écriture de montant sur
      // une demande déjà acceptée, service_role compris (00053, 00054).
      ...(accepte
        ? {
            montant_convenu: demande.montant_contre_offre,
            ...(commission
              ? { taux_commission: commission.taux, montant_commission: commission.montant }
              : {}),
          }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", demandeId);
  if (error) return { error: error.message };

  if (accepte) {
    await admin
      .from("biens")
      .update({ statut: "reserve", updated_at: new Date().toISOString() })
      .eq("id", demande.bien_id)
      .eq("statut", "disponible");

    await cloturerConcurrentes(admin, demandeId, demande.bien_id);
  } else {
    await admin
      .from("biens")
      .update({ statut: "disponible", updated_at: new Date().toISOString() })
      .eq("id", demande.bien_id)
      .eq("statut", "reserve");
  }

  const { data: profile } = await admin.from("users").select("nom").eq("id", clientId).single();
  const { data: bien } = await admin
    .from("biens")
    .select("type, localisation")
    .eq("id", demande.bien_id)
    .single();

  await notifierAdminReponseContreOffre(
    profile?.nom ?? "Client",
    bien ? `${typeBienLabel(bien.type)} à ${bien.localisation}` : "Bien",
    accepte,
    Number(demande.montant_contre_offre ?? 0)
  );

  revalidatePath("/compte/reservations");
  revalidatePath("/admin/demandes-immobilier");
  return { success: true };
}

// ─── Visites ──────────────────────────────────────────────────────────────────

export type VisiteState = {
  error?: string;
  success?: boolean;
};

export async function creerVisite(
  _prev: VisiteState,
  formData: FormData
): Promise<VisiteState> {
  try {
    await requireStaff();
  } catch {
    return { error: await err("sessionExpireeOuAccesRefuse") };
  }
  const admin = getAdmin();
  const demandeId = formData.get("demande_id") as string;
  const bienId = formData.get("bien_id") as string;
  const clientId = formData.get("client_id") as string;
  const agentId = formData.get("agent_id") as string;
  const creneau = formData.get("creneau") as string;

  if (!bienId || !clientId || !agentId || !creneau) {
    return { error: await err("champsObligatoiresManquantsAgentRequis") };
  }

  const dateCreneau = new Date(creneau);
  if (Number.isNaN(dateCreneau.getTime())) return { error: await err("creneauInvalide") };
  // Un créneau passé ne veut rien dire pour le client qu'on va prévenir.
  if (dateCreneau.getTime() < Date.now()) {
    return { error: await err("leCreneauDoitEtreDansLe") };
  }

  const { error } = await admin.from("visites").insert({
    bien_id: bienId,
    client_id: clientId,
    agent_id: agentId,
    creneau: dateCreneau.toISOString(),
    statut: "proposee",
  });
  if (error) return { error: error.message };

  if (demandeId) {
    await admin.from("demandes_immobilier").update({ statut: "visite_programmee", updated_at: new Date().toISOString() }).eq("id", demandeId);
  }

  // Le client a payé des frais de visite : il doit apprendre le créneau. Rien ne
  // partait jusqu'ici, et aucun écran ne le lui montrait non plus.
  const { data: bienVisite } = await admin
    .from("biens")
    .select("type, localisation")
    .eq("id", bienId)
    .single();

  await notifierClient(
    clientId,
    "Votre visite est programmée",
    `${bienVisite ? `${typeBienLabel(bienVisite.type)} à ${bienVisite.localisation}` : "Votre visite"} — ${formaterCreneau(dateCreneau)}. Retrouvez le détail dans « Mes réservations ».`
  );

  (revalidateTag as (tag: string) => void)("biens");
  revalidatePath("/compte/reservations");
  revalidatePath("/admin/demandes-immobilier");
  return { success: true };
}

export async function changerStatutVisite(
  _prev: VisiteState,
  formData: FormData
): Promise<VisiteState> {
  try {
    await requireStaff();
  } catch {
    return { error: await err("sessionExpireeOuAccesRefuse") };
  }
  const admin = getAdmin();
  const visiteId = formData.get("visite_id") as string;
  const statut = formData.get("statut") as string;

  if (!visiteId || !isStatutVisite(statut)) return { error: await err("visiteOuStatutInvalide") };

  const { data: visite } = await admin
    .from("visites")
    .select("bien_id, client_id, creneau, statut")
    .eq("id", visiteId)
    .single();
  if (!visite) return { error: await err("visiteIntrouvable") };

  if (visite.statut === statut) return { success: true };

  // Sans garde, une visite réalisée pouvait repasser à « proposée » — et la
  // demande qu'elle avait refermée serait rouverte à la visite suivante.
  if (!transitionVisiteAutorisee(visite.statut, statut)) {
    return {
      error: await err("passageImpossible", {
        de: STATUT_VISITE_LABELS[visite.statut] ?? visite.statut,
        vers: STATUT_VISITE_LABELS[statut] ?? statut,
      }),
    };
  }

  const { error, count } = await admin
    .from("visites")
    .update({ statut }, { count: "exact" })
    .eq("id", visiteId)
    .eq("statut", visite.statut);
  if (error) return { error: error.message };
  if (!count) return { error: await err("laVisiteAChangeDEtat") };

  // Le créneau devient ferme : le client doit le savoir.
  if (statut === "confirmee") {
    await notifierClient(
      visite.client_id,
      "Votre visite est confirmée",
      `Votre visite est confirmée pour le ${formaterCreneau(visite.creneau as string)}.`
    );
    revalidatePath("/compte/reservations");
  }

  // Une visite terminée doit refermer la demande qui la portait. Sans cela la
  // demande restait à « visite_programmee » — statut que le cron d'expiration ne
  // traite pas — et le bien restait masqué du catalogue indéfiniment.
  if (statut === "realisee" || statut === "annulee") {
    // `visite_realisee`, pas `finalisee` : une visite effectuée n'est pas une
    // vente conclue, et `finalisee` sort le bien du catalogue.
    const statutDemande = statut === "realisee" ? "visite_realisee" : "annulee";

    const { data: demandes } = await admin
      .from("demandes_immobilier")
      .select("id")
      .eq("bien_id", visite.bien_id)
      .eq("client_id", visite.client_id)
      .eq("type", "visite")
      .in("statut", ["en_cours_traitement", "visite_programmee"]);

    for (const d of demandes ?? []) {
      await admin
        .from("demandes_immobilier")
        .update({ statut: statutDemande, updated_at: new Date().toISOString() })
        .eq("id", d.id);
    }

    if (statut === "annulee") {
      await admin
        .from("biens")
        .update({ statut: "disponible", updated_at: new Date().toISOString() })
        .eq("id", visite.bien_id)
        .eq("statut", "reserve");
    }

    await notifierClient(
      visite.client_id,
      statut === "realisee" ? "Visite réalisée" : "Visite annulée",
      statut === "realisee"
        ? "Votre visite a bien été enregistrée comme réalisée. Vous pouvez désormais faire une offre sur ce bien."
        : "Votre visite a été annulée. Vous pouvez reprogrammer une visite à tout moment."
    );

    (revalidateTag as (tag: string) => void)("biens");
  }

  revalidatePath("/admin/demandes-immobilier");
  return { success: true };
}

// ─── Paramètres immobilier (proprietaire only) ───────────────────────────────

export type ParametresImmoState = {
  error?: string;
  success?: boolean;
};

export async function modifierParametresImmobilier(
  _prev: ParametresImmoState,
  formData: FormData
): Promise<ParametresImmoState> {
  // frais_visite est un montant facturé au client : propriétaire uniquement.
  try {
    await requireProprietaireAvecId();
  } catch {
    return { error: await err("seulLeProprietairePeutModifierCes") };
  }
  const admin = getAdmin();

  const frais_visite = Number(formData.get("frais_visite"));
  const taux_max_reduction = Number(formData.get("taux_max_reduction"));
  const max_offres_client = Number(formData.get("max_offres_client"));

  if (!frais_visite || frais_visite <= 0) return { error: await err("lesFraisDeVisiteDoiventEtre") };
  // 0 est une valeur légitime : aucune remise autorisée. Ne pas tester la
  // vérité de la valeur, sinon 0 est rejeté comme absent.
  if (!Number.isFinite(taux_max_reduction) || taux_max_reduction < 0 || taux_max_reduction > 100) {
    return { error: await err("leTauxDeReductionDoitEtre") };
  }
  if (!max_offres_client || max_offres_client < 1) return { error: await err("leNombreMaxDOffresDoit") };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from as any)("parametres_immobilier")
    .upsert({
      id: 1,
      frais_visite,
      taux_max_reduction,
      max_offres_client,
      updated_at: new Date().toISOString(),
    });

  if (error) return { error: error.message };

  (revalidateTag as (tag: string) => void)("parametres_immobilier");
  return { success: true };
}

/**
 * Réponse du client au créneau de visite qu'on lui propose.
 *
 * `proposee` attendait une réponse que personne ne pouvait donner : seul un
 * opérateur passait à `confirmee`, si bien qu'il « confirmait » un rendez-vous
 * que le client n'avait jamais accepté. Le client, lui, voyait le créneau en
 * lecture seule — alors qu'il a payé des frais de visite non remboursables pour
 * ce déplacement.
 *
 * Décliner remet la visite à l'équipe, qui reproposera : ce n'est pas une
 * annulation de la demande, seulement du créneau.
 */
export async function repondreCreneauVisite(
  _prev: VisiteState,
  formData: FormData
): Promise<VisiteState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: await err("nonAuthentifie") };

  const visiteId = formData.get("visite_id") as string;
  const reponse = formData.get("reponse") as string;
  if (!visiteId || !["accepte", "decline"].includes(reponse)) {
    return { error: await err("reponseInvalide") };
  }

  const admin = getAdmin();
  const { data: visite } = await admin
    .from("visites")
    .select("client_id, statut, creneau, bien_id")
    .eq("id", visiteId)
    .single();

  if (!visite) return { error: await err("visiteIntrouvable") };
  if (visite.client_id !== user.sub) return { error: await err("cetteVisiteNEstPasLa") };
  if (visite.statut !== "proposee") {
    return { error: await err("ceCreneauNAttendPlusDe") };
  }

  const cible = reponse === "accepte" ? "confirmee" : "annulee";

  const { error, count } = await admin
    .from("visites")
    .update({ statut: cible }, { count: "exact" })
    .eq("id", visiteId)
    .eq("statut", "proposee");

  if (error) return { error: error.message };
  if (!count) return { error: await err("ceCreneauAChangeEntreTemps") };

  // Décliner ne relibère pas le bien : la demande reste vivante, l'équipe doit
  // reproposer. Le relâcher ici remettrait le bien au catalogue alors que le
  // client attend toujours sa visite, déjà payée.
  await logAudit({
    userId: user.sub as string,
    action: reponse === "accepte" ? "accepter_creneau_visite" : "decliner_creneau_visite",
    tableName: "visites",
    recordId: visiteId,
    oldValues: { statut: "proposee" },
    newValues: { statut: cible },
  });

  await notifierAdminReponseCreneauVisite(
    formaterCreneau(visite.creneau as string),
    reponse === "accepte"
  );

  revalidatePath("/compte/reservations");
  revalidatePath("/admin/demandes-immobilier");
  return { success: true };
}
