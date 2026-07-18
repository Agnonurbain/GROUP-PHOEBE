"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { notifierClient } from "@/lib/notifications";

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
  return user;
}

export type AchatState = {
  error?: string;
  success?: boolean;
  redirectUrl?: string;
};

export async function creerDemandeAchat(
  _prev: AchatState,
  formData: FormData
): Promise<AchatState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Vous devez être connecté." };

  const vehiculeId = formData.get("vehicule_id") as string;
  const marque = formData.get("marque") as string;
  const modele = formData.get("modele") as string;
  const categorie = formData.get("categorie") as string;
  const message = (formData.get("message") as string) ?? "";

  if (!vehiculeId || !marque || !modele) {
    return { error: "Véhicule invalide." };
  }

  const admin = getAdmin();

  const { data: vehicule } = await admin
    .from("vehicules")
    .select("id, statut, prix_vente, marque, modele")
    .eq("id", vehiculeId)
    .single();

  if (!vehicule) return { error: "Véhicule introuvable." };
  if (vehicule.statut !== "disponible") {
    return { error: `${marque} ${modele} n'est plus disponible.` };
  }

  const montant = vehicule.prix_vente ? Number(vehicule.prix_vente) : null;

  const { data: demande, error: demandeErr } = await admin
    .from("demandes_transport")
    .insert({
      client_id: user.sub,
      vehicule_id: vehiculeId,
      type: "achat",
      categorie: categorie || "leger",
      statut: "en_attente_validation",
      montant,
      avec_chauffeur: false,
      negociation_note: message || null,
    })
    .select("id")
    .single();

  if (demandeErr) return { error: demandeErr.message };

  redirect(`/profil/reservations?achat=${demande.id}`);
}

const TAUX_ACOMPTE_DEFAUT = 0.2;

export async function accepterAchatAvecAcompte(
  _prev: AchatState,
  formData: FormData
): Promise<AchatState> {
  await requireStaff();
  const admin = getAdmin();

  const demandeId = formData.get("demande_id") as string;
  const acompteStr = formData.get("acompte") as string;
  const acompte = Number(acompteStr);

  if (!demandeId) return { error: "Demande invalide." };

  const { data: demande } = await admin
    .from("demandes_transport")
    .select("*")
    .eq("id", demandeId)
    .single();

  if (!demande) return { error: "Demande introuvable." };
  if (demande.type !== "achat") return { error: "Cette demande n'est pas un achat." };
  if (demande.statut !== "en_attente_validation") {
    return { error: "Cette demande n'est plus en attente de validation." };
  }

  const montantTotal = demande.montant ? Number(demande.montant) : 0;
  const montantAcompte = acompte > 0
    ? acompte
    : Math.round(montantTotal * TAUX_ACOMPTE_DEFAUT);

  if (montantAcompte <= 0) {
    return { error: "Le montant de l'acompte doit être supérieur à 0." };
  }

  const { error } = await admin
    .from("demandes_transport")
    .update({
      prix_negocie: montantAcompte,
      statut: "en_attente_paiement",
      updated_at: new Date().toISOString(),
    })
    .eq("id", demandeId)
    .eq("statut", "en_attente_validation");

  if (error) return { error: error.message };

  await notifierClient(
    demande.client_id,
    "Demande d'achat acceptée — acompte requis",
    `Votre demande d'achat a été acceptée. Un acompte de ${montantAcompte.toLocaleString("fr-FR")} FCFA est requis pour réserver le véhicule. Connectez-vous pour procéder au paiement.`
  );

  revalidatePath("/admin/demandes");
  return { success: true };
}
