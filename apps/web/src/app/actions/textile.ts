"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import {
  validerDemandeTextile,
  isStatutTextile,
  transitionTextileAutorisee,
  STATUT_TEXTILE_LABELS,
  libelleTypePagne,
  type TypePagne,
} from "@/lib/textile";
import { notifierClient } from "@/lib/notifications";
import { notifierAdminNouvelleDemandeTextile } from "./notifications-admin";
import { logAudit } from "@/lib/audit";

export type TextileState = { error?: string; success?: boolean };

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

// Chiffrer une demande, c'est écrire un montant facturé : propriétaire seul.
// Cf. __tests__/prix-proprietaire.test.ts et le trigger garde_montant_textile.
async function requireProprietaireAvecId() {
  const { userId, role } = await requireStaff();
  if (role !== "proprietaire") throw new Error("Accès refusé : propriétaire requis");
  return userId;
}

/** Les types de pagne encore au catalogue. */
export async function typesPagneActifs(): Promise<TypePagne[]> {
  const admin = getAdmin();
  const { data } = await admin
    .from("types_pagne")
    .select("cle, marque, gamme, description, ordre")
    .eq("actif", true)
    .order("ordre");

  return (data ?? []).map((t) => ({
    cle: t.cle,
    marque: t.marque,
    gamme: t.gamme,
    description: t.description,
    ordre: t.ordre,
  }));
}

/**
 * Demande de devis pour du pagne.
 *
 * Aucun montant n'est calculé ici, et il n'y en a nulle part à calculer : le
 * marché du pagne n'a pas de prix de référence tenable, chaque revendeur fixe
 * le sien. L'équipe consulte ses fournisseurs, puis chiffre.
 */
export async function creerDemandeTextile(
  _prev: TextileState,
  formData: FormData
): Promise<TextileState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Vous devez être connecté pour demander un devis." };

  const { data: profile } = await supabase
    .from("users")
    .select("nom")
    .eq("id", user.sub)
    .single();
  if (!profile) return { error: "Profil introuvable." };

  const saisie = {
    typePagne: ((formData.get("type_pagne") as string) || "").trim(),
    motif: ((formData.get("motif") as string) || "").trim(),
    couleurs: ((formData.get("couleurs") as string) || "").trim(),
    quantite: Math.trunc(Number(formData.get("quantite"))),
    unite: ((formData.get("unite") as string) || "pagne").trim(),
  };

  // Les types viennent de la base : un type retiré du catalogue ne doit plus
  // être demandable, même par un formulaire resté ouvert dans un onglet.
  const types = await typesPagneActifs();
  const validation = validerDemandeTextile(saisie, types.map((t) => t.cle));
  if ("error" in validation) return { error: validation.error };

  const admin = getAdmin();
  const { data: demande, error } = await admin
    .from("demandes_textile")
    .insert({
      client_id: user.sub as string,
      type_pagne: saisie.typePagne,
      motif: saisie.motif || null,
      couleurs: saisie.couleurs || null,
      quantite: saisie.quantite,
      unite: saisie.unite,
      message: ((formData.get("message") as string) || "").trim() || null,
      statut: "soumise",
    })
    .select("id")
    .single();

  if (error || !demande) {
    return { error: "Impossible d'enregistrer la demande. Veuillez réessayer." };
  }

  const type = types.find((t) => t.cle === saisie.typePagne);
  await notifierAdminNouvelleDemandeTextile(
    demande.id,
    profile.nom,
    type ? libelleTypePagne(type) : saisie.typePagne,
    `${saisie.quantite} ${saisie.unite}`
  );

  redirect("/textile/confirmation");
}

// ─── Administration ──────────────────────────────────────────────────────────

/** Faire avancer une demande dans son cycle. */
export async function changerStatutTextile(
  _prev: TextileState,
  formData: FormData
): Promise<TextileState> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch {
    return { error: "Session expirée ou accès refusé." };
  }

  const demandeId = ((formData.get("demande_id") as string) || "").trim();
  const statut = ((formData.get("statut") as string) || "").trim();
  if (!demandeId || !isStatutTextile(statut)) return { error: "Statut invalide." };

  // « devis_envoye » suppose un montant : il ne s'obtient que par le devis,
  // sinon le client verrait un devis sans prix.
  if (statut === "devis_envoye") {
    return { error: "Passez par le formulaire de devis pour ce statut." };
  }

  const admin = getAdmin();
  const { data: demande } = await admin
    .from("demandes_textile")
    .select("id, client_id, statut")
    .eq("id", demandeId)
    .single();

  if (!demande) return { error: "Demande introuvable." };
  if (!transitionTextileAutorisee(demande.statut, statut)) {
    return {
      error: `Passage impossible de « ${STATUT_TEXTILE_LABELS[demande.statut as keyof typeof STATUT_TEXTILE_LABELS] ?? demande.statut} » à « ${STATUT_TEXTILE_LABELS[statut]} ».`,
    };
  }

  // Le filtre porte sur le statut ATTENDU, pas sur celui qu'on vient de lire :
  // entre la lecture et l'écriture, quelqu'un d'autre a pu trancher.
  const { count } = await admin
    .from("demandes_textile")
    .update({ statut, updated_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", demandeId)
    .eq("statut", demande.statut);

  if (!count) return { error: "La demande a changé d'état entre-temps. Rechargez la page." };

  await notifierClient(
    demande.client_id,
    "Mise à jour de votre demande de pagne",
    `Votre demande : ${STATUT_TEXTILE_LABELS[statut]}.`
  );

  await logAudit({
    userId,
    action: "changer_statut_textile",
    tableName: "demandes_textile",
    recordId: demandeId,
    oldValues: { statut: demande.statut },
    newValues: { statut },
  });

  revalidatePath("/admin/textile");
  revalidatePath("/compte/reservations");
  return { success: true };
}

/**
 * Chiffrer une demande. Propriétaire seul.
 *
 * C'est ici que naît le seul montant du service : il n'existe aucun prix
 * catalogue à reprendre, l'équipe consulte ses fournisseurs et arrête un
 * chiffre pour cette demande-là.
 */
export async function proposerDevisTextile(
  _prev: TextileState,
  formData: FormData
): Promise<TextileState> {
  let userId: string;
  try {
    userId = await requireProprietaireAvecId();
  } catch {
    return { error: "Accès refusé : seul le propriétaire peut chiffrer une demande." };
  }

  const demandeId = ((formData.get("demande_id") as string) || "").trim();
  const montant = Number(formData.get("montant"));
  const validiteJours = Math.trunc(Number(formData.get("validite_jours") || 7));

  if (!demandeId) return { error: "Demande invalide." };
  if (!Number.isFinite(montant) || montant <= 0) {
    return { error: "Le montant doit être un chiffre positif." };
  }
  if (!Number.isInteger(validiteJours) || validiteJours < 1 || validiteJours > 90) {
    return { error: "La validité du devis va de 1 à 90 jours." };
  }

  const admin = getAdmin();
  const { data: demande } = await admin
    .from("demandes_textile")
    .select("id, client_id, statut")
    .eq("id", demandeId)
    .single();

  if (!demande) return { error: "Demande introuvable." };
  if (!transitionTextileAutorisee(demande.statut, "devis_envoye")) {
    return { error: "Cette demande n'est pas à un stade où un devis se propose." };
  }

  const valable = new Date(Date.now() + validiteJours * 86_400_000);

  const { count } = await admin
    .from("demandes_textile")
    .update(
      {
        montant_propose: montant,
        devis_valable_jusqu_a: valable.toISOString(),
        statut: "devis_envoye",
        updated_at: new Date().toISOString(),
      },
      { count: "exact" }
    )
    .eq("id", demandeId)
    .eq("statut", demande.statut);

  if (!count) return { error: "La demande a changé d'état entre-temps. Rechargez la page." };

  await notifierClient(
    demande.client_id,
    "Votre devis pagne est prêt",
    `Montant proposé : ${montant.toLocaleString("fr-FR")} FCFA, valable jusqu'au ${valable.toLocaleDateString("fr-FR")}.`
  );

  await logAudit({
    userId,
    action: "proposer_devis_textile",
    tableName: "demandes_textile",
    recordId: demandeId,
    newValues: { montant, validiteJours },
  });

  revalidatePath("/admin/textile");
  revalidatePath("/compte/reservations");
  return { success: true };
}
