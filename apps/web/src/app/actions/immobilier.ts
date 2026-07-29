"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import {
  isTypeDemande,
  isStatutDemande,
  isStatutVisite,
  TYPE_DEMANDE_LABELS,
  STATUT_DEMANDE_LABELS,
  typeBienLabel,
  STATUTS_DEMANDE_OFFRE_ACTIFS,
  STATUTS_CONTRE_OFFRE_POSSIBLE,
  validerContreOffre,
} from "@/lib/immobilier";
import { notifierClient } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import {
  notifierAdminNouvelleDemandeImmobilier,
  notifierAdminReponseContreOffre,
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

async function requireAgent() {
  const staff = await requireStaff();
  if (staff.role !== "agent_immobilier") throw new Error("Action réservée aux agents immobiliers");
  return staff.user;
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
  if (!user) return { error: "Vous devez être connecté pour envoyer une demande." };

  const { data: profile } = await supabase
    .from("users")
    .select("id, nom, telephone, email")
    .eq("id", user.sub)
    .single();
  if (!profile) return { error: "Profil introuvable." };

  const bienId = formData.get("bien_id") as string;
  const type = formData.get("type") as string;
  const message = ((formData.get("message") as string) || "").trim();
  const dateSouhaitee = ((formData.get("date_souhaitee") as string) || "").trim();
  const montantRaw = formData.get("montant") as string;

  if (!bienId) return { error: "Bien invalide." };
  if (!isTypeDemande(type)) return { error: "Type de demande invalide." };

  const admin = getAdmin();

  const { data: bien } = await admin
    .from("biens")
    .select("type, localisation, statut")
    .eq("id", bienId)
    .single();
  if (!bien) return { error: "Bien introuvable." };
  if (bien.statut !== "disponible") return { error: "Ce bien n'est plus disponible." };

  let montantOffre: number | null = null;
  if (type === "offre") {
    montantOffre = Number(montantRaw);
    if (!montantOffre || montantOffre <= 0) {
      return { error: "Le montant de l'offre doit être un montant positif." };
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
      return { error: `Vous avez atteint la limite de ${params.max_offres_client} offre(s) en cours.` };
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
      statut: "en_attente",
    })
    .select("id")
    .single();
  if (demandeErr) return { error: "Impossible d'enregistrer la demande. Veuillez réessayer." };

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
        methode: "stripe",
        statut: "en_attente",
      })
      .select("id")
      .single();
    if (paiementErr) return { error: "Impossible de créer le paiement." };

    try {
      const url = await creerSessionStripe({
        montantCFA: montantFrais,
        description: `Frais de visite — ${typeBienLabel(bien.type)} à ${bien.localisation}`,
        paiementId: paiement.id,
        successUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/immobilier/confirmation?type=visite`,
        cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/immobilier/${bienId}`,
      });
      redirect(url);
    } catch {
      return { error: "Impossible de contacter la plateforme de paiement. Veuillez réessayer." };
    }
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
    return { error: "Session expirée ou accès refusé." };
  }
  const admin = getAdmin();
  const demandeId = formData.get("demande_id") as string;
  const statut = formData.get("statut") as string;

  if (!demandeId || !isStatutDemande(statut)) {
    return { error: "Statut invalide." };
  }
  // « contre_offre » implique un montant : il ne s'obtient que via
  // proposerContreOffre, sinon le client verrait une contre-offre sans prix.
  if (statut === "contre_offre") {
    return { error: "Passez par le formulaire de contre-offre pour ce statut." };
  }

  const { data: demande } = await admin
    .from("demandes_immobilier")
    .select("client_id, bien_id")
    .eq("id", demandeId)
    .single();

  const { error } = await admin
    .from("demandes_immobilier")
    .update({ statut, updated_at: new Date().toISOString() })
    .eq("id", demandeId);
  if (error) return { error: error.message };

  if (statut === "acceptee" && demande?.bien_id) {
    await admin.from("biens").update({ statut: "reserve", updated_at: new Date().toISOString() }).eq("id", demande.bien_id);
  } else if (statut === "finalisee" && demande?.bien_id) {
    const { data: bien } = await admin.from("biens").select("transaction").eq("id", demande.bien_id).single();
    const statutBien = bien?.transaction === "location" ? "loue" : "vendu";
    await admin.from("biens").update({ statut: statutBien, updated_at: new Date().toISOString() }).eq("id", demande.bien_id);
  } else if (["refusee", "annulee"].includes(statut) && demande?.bien_id) {
    const { data: bien } = await admin.from("biens").select("statut").eq("id", demande.bien_id).single();
    if (bien?.statut === "reserve") {
      await admin.from("biens").update({ statut: "disponible", updated_at: new Date().toISOString() }).eq("id", demande.bien_id);
    }
  }

  if (demande) {
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
    return { error: "Session expirée ou accès refusé." };
  }
  const admin = getAdmin();
  const demandeId = formData.get("demande_id") as string;
  const agentId = (formData.get("agent_id") as string) || null;

  if (!demandeId) return { error: "Demande invalide." };

  const { error } = await admin
    .from("demandes_immobilier")
    .update({ agent_id: agentId, updated_at: new Date().toISOString() })
    .eq("id", demandeId);
  if (error) return { error: error.message };

  revalidatePath("/admin/demandes-immobilier");
  return { success: true };
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
    return { error: "Seul le propriétaire peut proposer une contre-offre." };
  }

  const demandeId = formData.get("demande_id") as string;
  const montant = Number(formData.get("montant"));
  if (!demandeId) return { error: "Demande invalide." };

  const admin = getAdmin();

  const { data: demande } = await admin
    .from("demandes_immobilier")
    .select("id, type, statut, montant_offre, montant_contre_offre, client_id, bien_id")
    .eq("id", demandeId)
    .single();
  if (!demande) return { error: "Demande introuvable." };

  if (demande.type !== "offre") {
    return { error: "Une contre-offre ne s'applique qu'à une demande de type offre." };
  }
  if (!(STATUTS_CONTRE_OFFRE_POSSIBLE as readonly string[]).includes(demande.statut)) {
    return { error: `Demande ${STATUT_DEMANDE_LABELS[demande.statut] ?? demande.statut} : la négociation est close.` };
  }
  if (demande.montant_offre == null) {
    return { error: "Cette demande ne porte aucune offre chiffrée." };
  }

  const { data: bien } = await admin
    .from("biens")
    .select("prix, statut, type, localisation")
    .eq("id", demande.bien_id)
    .single();
  if (!bien) return { error: "Bien introuvable." };
  if (!["disponible", "reserve"].includes(bien.statut)) {
    return { error: "Ce bien n'est plus négociable." };
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
    return { error: "Vous devez être connecté." };
  }
  if (!demandeId) return { error: "Demande invalide." };

  const admin = getAdmin();

  const { data: demande } = await admin
    .from("demandes_immobilier")
    .select("id, statut, client_id, bien_id, montant_contre_offre")
    .eq("id", demandeId)
    .single();
  if (!demande) return { error: "Demande introuvable." };
  // La demande est lue avec la clé de service : l'appartenance se vérifie ici.
  if (demande.client_id !== clientId) return { error: "Cette demande n'est pas la vôtre." };
  if (demande.statut !== "contre_offre") {
    return { error: "Aucune contre-offre en attente sur cette demande." };
  }

  const accepte = reponse === "accepter";

  const { error } = await admin
    .from("demandes_immobilier")
    .update({
      statut: accepte ? "acceptee" : "refusee",
      updated_at: new Date().toISOString(),
    })
    .eq("id", demandeId);
  if (error) return { error: error.message };

  if (accepte) {
    // Le montant retenu reste `montant_contre_offre` : c'est le prix convenu.
    await admin
      .from("biens")
      .update({ statut: "reserve", updated_at: new Date().toISOString() })
      .eq("id", demande.bien_id)
      .eq("statut", "disponible");
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
    return { error: "Session expirée ou accès refusé." };
  }
  const admin = getAdmin();
  const demandeId = formData.get("demande_id") as string;
  const bienId = formData.get("bien_id") as string;
  const clientId = formData.get("client_id") as string;
  const agentId = formData.get("agent_id") as string;
  const creneau = formData.get("creneau") as string;

  if (!bienId || !clientId || !agentId || !creneau) {
    return { error: "Champs obligatoires manquants (agent requis)." };
  }

  const { error } = await admin.from("visites").insert({
    bien_id: bienId,
    client_id: clientId,
    agent_id: agentId,
    creneau: new Date(creneau).toISOString(),
    statut: "proposee",
  });
  if (error) return { error: error.message };

  if (demandeId) {
    await admin.from("demandes_immobilier").update({ statut: "visite_programmee", updated_at: new Date().toISOString() }).eq("id", demandeId);
  }

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
    return { error: "Session expirée ou accès refusé." };
  }
  const admin = getAdmin();
  const visiteId = formData.get("visite_id") as string;
  const statut = formData.get("statut") as string;

  if (!visiteId || !isStatutVisite(statut)) return { error: "Visite ou statut invalide." };

  const { data: visite } = await admin
    .from("visites")
    .select("bien_id, client_id, creneau")
    .eq("id", visiteId)
    .single();

  const { error } = await admin
    .from("visites")
    .update({ statut })
    .eq("id", visiteId);
  if (error) return { error: error.message };

  // Une visite terminée doit refermer la demande qui la portait. Sans cela la
  // demande restait à « visite_programmee » — statut que le cron d'expiration ne
  // traite pas — et le bien restait masqué du catalogue indéfiniment.
  if (visite && (statut === "realisee" || statut === "annulee")) {
    const statutDemande = statut === "realisee" ? "finalisee" : "annulee";

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
    return { error: "Seul le propriétaire peut modifier ces paramètres." };
  }
  const admin = getAdmin();

  const frais_visite = Number(formData.get("frais_visite"));
  const taux_max_reduction = Number(formData.get("taux_max_reduction"));
  const max_offres_client = Number(formData.get("max_offres_client"));

  if (!frais_visite || frais_visite <= 0) return { error: "Les frais de visite doivent être un montant positif." };
  // 0 est une valeur légitime : aucune remise autorisée. Ne pas tester la
  // vérité de la valeur, sinon 0 est rejeté comme absent.
  if (!Number.isFinite(taux_max_reduction) || taux_max_reduction < 0 || taux_max_reduction > 100) {
    return { error: "Le taux de réduction doit être entre 0 et 100." };
  }
  if (!max_offres_client || max_offres_client < 1) return { error: "Le nombre max d'offres doit être au moins 1." };

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
