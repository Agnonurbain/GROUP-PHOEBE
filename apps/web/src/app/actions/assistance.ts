"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { getPays, getPrestation, isStatutDossier, STATUT_DOSSIER_LABELS } from "@/lib/assistance";
import { getTarifsAssistance } from "@/lib/public-cache";
import { notifierClient } from "@/lib/notifications";
import { notifierAdminNouveauDossierVoyage } from "./notifications-admin";

export type AssistanceState = {
  error?: string;
};

export type DossierActionState = {
  error?: string;
  success?: boolean;
};

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
  return user;
}

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Soumission d'un dossier visa SANS paiement en ligne : le dossier est créé au
// statut "soumis", l'équipe est notifiée et recontacte le client (revue de
// dossier puis facturation hors ligne). L'offre choisie et le prix estimé sont
// portés par la notification admin (dossiers_voyage n'a pas de colonne dédiée).
export async function creerDossierVoyage(
  _prev: AssistanceState,
  formData: FormData
): Promise<AssistanceState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Vous devez être connecté pour soumettre un dossier." };

  const { data: profile } = await supabase
    .from("users")
    .select("id, nom")
    .eq("id", user.sub)
    .single();
  if (!profile) return { error: "Profil introuvable." };

  const slug = formData.get("pays_slug") as string;
  const prestationKey = formData.get("prestation") as string;

  // Tarifs pilotés depuis /admin/tarifs : même source que l'affichage client,
  // donc le montant notifié à l'équipe correspond au prix annoncé.
  const tarifs = await getTarifsAssistance();
  const pays = getPays(slug, tarifs);
  if (!pays) return { error: "Destination invalide." };
  const prestation = prestationKey ? getPrestation(pays, prestationKey) : null;
  if (!prestation) return { error: "Prestation invalide." };

  const admin = getAdmin();

  const { data: dossier, error: dossierErr } = await admin
    .from("dossiers_voyage")
    .insert({
      client_id: user.sub,
      type: prestation.type,
      pays_cible: pays.name,
      statut: "soumis",
      // Colonnes ajoutées en 00041 (pas encore dans les types générés).
      prestation: prestation.name,
      montant_estime: prestation.prix,
    } as never)
    .select("id")
    .single();

  if (dossierErr || !dossier) {
    return { error: "Impossible de créer le dossier. Veuillez réessayer." };
  }

  await notifierAdminNouveauDossierVoyage(
    dossier.id,
    profile.nom,
    pays.name,
    prestation.name,
    prestation.prix
  );

  redirect(`/assistance/confirmation?pays=${encodeURIComponent(pays.name)}`);
}

// ─── Admin : gestion des dossiers de voyage ──────────────────────────────────

export async function changerStatutDossier(
  _prev: DossierActionState,
  formData: FormData
): Promise<DossierActionState> {
  await requireStaff();
  const admin = getAdmin();
  const dossierId = formData.get("dossier_id") as string;
  const statut = formData.get("statut") as string;

  if (!dossierId || !isStatutDossier(statut)) {
    return { error: "Statut invalide." };
  }

  const { data: dossier } = await admin
    .from("dossiers_voyage")
    .select("client_id, pays_cible")
    .eq("id", dossierId)
    .single();

  const { error } = await admin
    .from("dossiers_voyage")
    .update({ statut, updated_at: new Date().toISOString() })
    .eq("id", dossierId);
  if (error) return { error: error.message };

  if (dossier) {
    await notifierClient(
      dossier.client_id,
      "Mise à jour de votre dossier visa",
      `Votre dossier ${dossier.pays_cible} : ${STATUT_DOSSIER_LABELS[statut] ?? statut}.`
    );
  }
  revalidatePath("/admin/dossiers-voyage");
  return { success: true };
}

export async function affecterConseiller(
  _prev: DossierActionState,
  formData: FormData
): Promise<DossierActionState> {
  await requireStaff();
  const admin = getAdmin();
  const dossierId = formData.get("dossier_id") as string;
  const conseillerId = (formData.get("conseiller_id") as string) || null;

  if (!dossierId) return { error: "Dossier invalide." };

  const { error } = await admin
    .from("dossiers_voyage")
    .update({ conseiller_id: conseillerId, updated_at: new Date().toISOString() })
    .eq("id", dossierId);
  if (error) return { error: error.message };

  revalidatePath("/admin/dossiers-voyage");
  return { success: true };
}
