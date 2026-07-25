"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { getPays, isOffreKey, offreLabel } from "@/lib/assistance";
import { notifierAdminNouveauDossierVoyage } from "./notifications-admin";

export type AssistanceState = {
  error?: string;
};

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
  const offreKey = formData.get("offre") as string;

  const pays = getPays(slug);
  if (!pays) return { error: "Destination invalide." };
  if (!isOffreKey(offreKey)) return { error: "Offre invalide." };

  const admin = getAdmin();

  const { data: dossier, error: dossierErr } = await admin
    .from("dossiers_voyage")
    .insert({
      client_id: user.sub,
      type: pays.type,
      pays_cible: pays.name,
      statut: "soumis",
    })
    .select("id")
    .single();

  if (dossierErr || !dossier) {
    return { error: "Impossible de créer le dossier. Veuillez réessayer." };
  }

  const montantEstime = pays.prix[offreKey];
  await notifierAdminNouveauDossierVoyage(
    dossier.id,
    profile.nom,
    pays.name,
    offreLabel(offreKey),
    montantEstime
  );

  redirect(`/assistance/confirmation?pays=${encodeURIComponent(pays.name)}`);
}
