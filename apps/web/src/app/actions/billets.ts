"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import {
  validerDemandeBillet,
  isStatutBillet,
  STATUT_BILLET_LABELS,
  STATUTS_BILLET_OUVERTS,
  libelleVoyageurs,
  TYPE_TRAJET_LABELS,
} from "@/lib/billets";
import { notifierClient } from "@/lib/notifications";
import { notifierAdminNouvelleDemandeBillet } from "./notifications-admin";
import { logAudit } from "@/lib/audit";

export type BilletState = {
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
  if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
    throw new Error("Accès refusé");
  }
  return { userId: user.sub as string, role: profile.role as string };
}

// Chiffrer un billet, c'est écrire un montant facturé : propriétaire seul.
// Cf. __tests__/prix-proprietaire.test.ts et le trigger garde_montant (00055).
async function requireProprietaireAvecId() {
  const { userId, role } = await requireStaff();
  if (role !== "proprietaire") throw new Error("Accès refusé : propriétaire requis");
  return userId;
}

const nombre = (v: FormDataEntryValue | null, defaut = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : defaut;
};

/**
 * Demande de réservation de billet. Aucun paiement à cette étape : il n'y a pas
 * de recherche de vol en direct, l'équipe cherche puis répond avec un prix.
 */
export async function creerDemandeBillet(
  _prev: BilletState,
  formData: FormData
): Promise<BilletState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Vous devez être connecté pour demander un billet." };

  const { data: profile } = await supabase
    .from("users")
    .select("nom")
    .eq("id", user.sub)
    .single();
  if (!profile) return { error: "Profil introuvable." };

  const typeTrajet = ((formData.get("type_trajet") as string) || "").trim();
  const saisie = {
    typeTrajet,
    depart: ((formData.get("depart") as string) || "").trim(),
    destination: ((formData.get("destination") as string) || "").trim(),
    dateDepart: ((formData.get("date_depart") as string) || "").trim(),
    // Le champ retour reste dans le DOM quand on repasse en aller simple :
    // on l'ignore explicitement plutôt que de laisser passer une incohérence.
    dateRetour: typeTrajet === "aller_retour"
      ? ((formData.get("date_retour") as string) || "").trim()
      : "",
    classe: ((formData.get("classe") as string) || "economique").trim(),
    voyageurs: {
      adultes: nombre(formData.get("nb_adultes"), 1),
      enfants: nombre(formData.get("nb_enfants")),
      bebes: nombre(formData.get("nb_bebes")),
    },
    passeportNom: ((formData.get("passeport_nom") as string) || "").trim(),
    passeportNumero: ((formData.get("passeport_numero") as string) || "").trim(),
    passeportExpiration: ((formData.get("passeport_expiration") as string) || "").trim(),
  };

  const validation = validerDemandeBillet(saisie);
  if ("error" in validation) return { error: validation.error };

  const admin = getAdmin();
  const { data: demande, error } = await admin
    .from("demandes_billet")
    .insert({
      client_id: user.sub as string,
      type_trajet: saisie.typeTrajet,
      depart: saisie.depart,
      destination: saisie.destination,
      date_depart: saisie.dateDepart,
      date_retour: saisie.typeTrajet === "aller_retour" ? saisie.dateRetour : null,
      nb_adultes: saisie.voyageurs.adultes,
      nb_enfants: saisie.voyageurs.enfants,
      nb_bebes: saisie.voyageurs.bebes,
      classe: saisie.classe,
      passeport_nom: saisie.passeportNom,
      passeport_numero: saisie.passeportNumero,
      passeport_expiration: saisie.passeportExpiration,
      message: ((formData.get("message") as string) || "").trim() || null,
      statut: "soumise",
    })
    .select("id")
    .single();

  if (error || !demande) {
    return { error: "Impossible d'enregistrer la demande. Veuillez réessayer." };
  }

  await notifierAdminNouvelleDemandeBillet(
    profile.nom,
    `${saisie.depart} → ${saisie.destination}`,
    TYPE_TRAJET_LABELS[saisie.typeTrajet] ?? saisie.typeTrajet,
    libelleVoyageurs(saisie.voyageurs)
  );

  redirect("/assistance/confirmation?type=billet");
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function changerStatutBillet(
  _prev: BilletState,
  formData: FormData
): Promise<BilletState> {
  try {
    await requireStaff();
  } catch {
    return { error: "Session expirée ou accès refusé." };
  }

  const demandeId = formData.get("demande_id") as string;
  const statut = formData.get("statut") as string;
  if (!demandeId || !isStatutBillet(statut)) return { error: "Statut invalide." };

  // « devis_envoye » suppose un montant : il ne s'obtient que par le devis,
  // sinon le client verrait un devis sans prix.
  if (statut === "devis_envoye") {
    return { error: "Passez par le formulaire de devis pour ce statut." };
  }

  const admin = getAdmin();
  const { data: demande } = await admin
    .from("demandes_billet")
    .select("client_id, depart, destination")
    .eq("id", demandeId)
    .single();

  const { error } = await admin
    .from("demandes_billet")
    .update({ statut, updated_at: new Date().toISOString() })
    .eq("id", demandeId);
  if (error) return { error: error.message };

  if (demande) {
    await notifierClient(
      demande.client_id,
      "Mise à jour de votre demande de billet",
      `${demande.depart} → ${demande.destination} : ${STATUT_BILLET_LABELS[statut] ?? statut}.`
    );
  }

  revalidatePath("/admin/billets");
  revalidatePath("/compte/reservations");
  return { success: true };
}

/** Chiffrer la demande et envoyer le devis au client. Propriétaire seul. */
export async function proposerDevisBillet(
  _prev: BilletState,
  formData: FormData
): Promise<BilletState> {
  let proprietaireId: string;
  try {
    proprietaireId = await requireProprietaireAvecId();
  } catch {
    return { error: "Seul le propriétaire peut chiffrer un billet." };
  }

  const demandeId = formData.get("demande_id") as string;
  const montant = Number(formData.get("montant"));
  if (!demandeId) return { error: "Demande invalide." };
  if (!Number.isFinite(montant) || montant <= 0) {
    return { error: "Le montant doit être un montant positif." };
  }

  const admin = getAdmin();
  const { data: demande } = await admin
    .from("demandes_billet")
    .select("client_id, statut, depart, destination, montant_propose")
    .eq("id", demandeId)
    .single();
  if (!demande) return { error: "Demande introuvable." };

  if (!(STATUTS_BILLET_OUVERTS as readonly string[]).includes(demande.statut)) {
    return { error: `Demande ${STATUT_BILLET_LABELS[demande.statut] ?? demande.statut} : elle est close.` };
  }

  const { error } = await admin
    .from("demandes_billet")
    .update({
      montant_propose: montant,
      statut: "devis_envoye",
      updated_at: new Date().toISOString(),
    })
    .eq("id", demandeId);
  if (error) return { error: error.message };

  await logAudit({
    userId: proprietaireId,
    action: "devis_billet",
    tableName: "demandes_billet",
    recordId: demandeId,
    oldValues: { montant_propose: demande.montant_propose, statut: demande.statut },
    newValues: { montant_propose: montant, statut: "devis_envoye" },
  });

  await notifierClient(
    demande.client_id,
    "Votre devis de billet est prêt",
    `${demande.depart} → ${demande.destination} : ${montant.toLocaleString("fr-FR")} FCFA. Retrouvez le détail dans « Mes réservations ».`
  );

  revalidatePath("/admin/billets");
  revalidatePath("/compte/reservations");
  return { success: true };
}

export async function affecterConseillerBillet(
  _prev: BilletState,
  formData: FormData
): Promise<BilletState> {
  try {
    await requireStaff();
  } catch {
    return { error: "Session expirée ou accès refusé." };
  }

  const demandeId = formData.get("demande_id") as string;
  const conseillerId = (formData.get("conseiller_id") as string) || null;
  if (!demandeId) return { error: "Demande invalide." };

  const admin = getAdmin();
  const { error } = await admin
    .from("demandes_billet")
    .update({ conseiller_id: conseillerId, updated_at: new Date().toISOString() })
    .eq("id", demandeId);
  if (error) return { error: error.message };

  revalidatePath("/admin/billets");
  return { success: true };
}
