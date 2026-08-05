"use server";

import { revalidatePath } from "next/cache";
import { err } from "@/lib/i18n/erreurs";
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
};

export async function creerDemandeAchat(
  _prev: AchatState,
  formData: FormData
): Promise<AchatState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: await err("vousDevezEtreConnecte") };

  const vehiculeId = formData.get("vehicule_id") as string;
  const marque = formData.get("marque") as string;
  const modele = formData.get("modele") as string;

  if (!vehiculeId || !marque || !modele) {
    return { error: await err("vehiculeInvalide") };
  }

  // Une case cochée dans le DOM n'est pas une preuve : le consentement est exigé
  // côté serveur, et c'est lui qui est enregistré.
  if (formData.get("accepte_cgv") !== "on") {
    return { error: await err("vousDevezAccepterLesConditionsGenerales") };
  }

  const admin = getAdmin();

  const { data: vehicule } = await admin
    .from("vehicules")
    .select("id, statut, prix_vente, marque, modele")
    .eq("id", vehiculeId)
    .single();

  if (!vehicule) return { error: await err("vehiculeIntrouvable") };
  if (vehicule.statut !== "disponible") {
    return { error: await err("vehiculePlusDisponible", { vehicule: `${marque} ${modele}` }) };
  }

  const montant = vehicule.prix_vente ? Number(vehicule.prix_vente) : null;

  const { data: demande, error: demandeErr } = await admin
    .from("demandes_transport")
    .insert({
      client_id: user.sub,
      vehicule_id: vehiculeId,
      type: "achat",
      // `demandes_transport.categorie` qualifie la DEMANDE
      // (classique | evenementiel | scolaire | personnel), pas le véhicule. On y
      // écrivait la catégorie du véhicule (leger | car | minibus), qu'aucune de
      // ces valeurs ne satisfait : la contrainte rejetait l'insert et le client
      // recevait l'erreur Postgres brute. Un achat est une demande classique ;
      // la catégorie du véhicule vit sur `vehicules`.
      categorie: "classique",
      accepte_cgv: true,
      statut: "en_attente_validation",
      montant,
      avec_chauffeur: false,
    })
    .select("id")
    .single();

  if (demandeErr) return { error: demandeErr.message };

  redirect(`/compte/reservations?achat=${demande.id}`);
}

const TAUX_ACOMPTE_DEFAUT = 0.2;

export async function envoyerPrixAchat(
  _prev: AchatState,
  formData: FormData
): Promise<AchatState> {
  await requireStaff();
  const admin = getAdmin();

  const demandeId = formData.get("demande_id") as string;
  const prixFinalStr = formData.get("prix_final") as string;
  const prixFinal = Number(prixFinalStr);
  const acompteStr = formData.get("acompte") as string;
  const acompteCustom = acompteStr ? Number(acompteStr) : 0;

  if (!demandeId) return { error: await err("demandeInvalide") };
  if (!prixFinal || prixFinal <= 0) {
    return { error: await err("lePrixFinalDoitEtreUn") };
  }

  const { data: demande } = await admin
    .from("demandes_transport")
    .select("*")
    .eq("id", demandeId)
    .single();

  if (!demande) return { error: await err("demandeIntrouvable") };
  if (demande.type !== "achat") return { error: await err("cetteDemandeNEstPasUn") };
  if (demande.statut !== "en_attente_validation") {
    return { error: await err("cetteDemandeNEstPlusEn") };
  }

  const montantAcompte = acompteCustom > 0
    ? acompteCustom
    : Math.round(prixFinal * TAUX_ACOMPTE_DEFAUT);

  if (montantAcompte <= 0) {
    return { error: await err("leMontantDeLAcompteDoit") };
  }

  const { error } = await admin
    .from("demandes_transport")
    .update({
      montant: prixFinal,
      prix_negocie: montantAcompte,
      statut: "en_attente_paiement",
      updated_at: new Date().toISOString(),
    })
    .eq("id", demandeId)
    .eq("statut", "en_attente_validation");

  if (error) return { error: error.message };

  await notifierClient(
    demande.client_id,
    "Prix d'achat confirmé — acompte requis",
    `Le prix de vente convenu est de ${prixFinal.toLocaleString("fr-FR")} FCFA. Un acompte de ${montantAcompte.toLocaleString("fr-FR")} FCFA est requis pour réserver le véhicule. Connectez-vous pour procéder au paiement.`
  );

  revalidatePath("/admin/demandes");
  return { success: true };
}
