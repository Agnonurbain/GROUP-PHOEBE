"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
} from "@/lib/immobilier";
import { notifierClient } from "@/lib/notifications";
import { notifierAdminNouvelleDemandeImmobilier } from "./notifications-admin";

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
    .select("id, nom")
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

  let montantOffre: number | null = null;
  if (type === "offre") {
    montantOffre = Number(montantRaw);
    if (!montantOffre || montantOffre <= 0) {
      return { error: "Le montant de l'offre doit être un montant positif." };
    }
  }

  const admin = getAdmin();

  const { data: bien } = await admin
    .from("biens")
    .select("type, localisation")
    .eq("id", bienId)
    .single();
  if (!bien) return { error: "Bien introuvable." };

  const { error: demandeErr } = await admin.from("demandes_immobilier").insert({
    bien_id: bienId,
    client_id: user.sub,
    type,
    montant_offre: montantOffre,
    statut: "en_attente",
  });
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

  const { error } = await admin
    .from("visites")
    .update({ statut })
    .eq("id", visiteId);
  if (error) return { error: error.message };

  revalidatePath("/admin/demandes-immobilier");
  return { success: true };
}
