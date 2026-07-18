"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type AchatState = {
  error?: string;
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
