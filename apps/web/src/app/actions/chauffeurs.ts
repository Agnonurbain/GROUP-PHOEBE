"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { logAudit } from "@/lib/audit";
import { validerTelephone, normaliserTelephone } from "@/lib/telephone";

export type ChauffeurState = {
  error?: string;
  success?: boolean;
};

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Un chauffeur est une ressource, pas un compte : comme un véhicule, il est géré
 * par le staff. Il n'a pas d'identifiant de connexion — rien dans le produit ne
 * lui en donne l'usage aujourd'hui.
 */
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
  return user.sub as string;
}

function lireChamps(formData: FormData) {
  return {
    nom: ((formData.get("nom") as string) || "").trim(),
    telephone: ((formData.get("telephone") as string) || "").trim(),
    permis: ((formData.get("permis_professionnel_url") as string) || "").trim(),
  };
}

/**
 * Création d'un chauffeur.
 *
 * Aucun chemin n'existait : les pages admin ne faisaient que lire la table, et
 * `/admin/comptes` ne crée que des comptes (opérateur, livreur, agent). Avec
 * zéro chauffeur en base, toute réservation « avec chauffeur » échouait — et sur
 * un message parlant de la disponibilité du véhicule, qui était pourtant libre.
 */
export async function creerChauffeur(
  _prev: ChauffeurState,
  formData: FormData
): Promise<ChauffeurState> {
  const userId = await requireStaff();
  const { nom, telephone, permis } = lireChamps(formData);

  if (!nom) return { error: "Le nom est obligatoire." };
  const errTel = validerTelephone(telephone);
  if (errTel) return { error: errTel };

  // Même normalisation qu'à l'inscription : sans elle, « 07 00 00 00 00 » et
  // « +2250700000000 » désignent deux chauffeurs pour la même personne.
  const telephoneNormalise = normaliserTelephone(telephone);
  if (!telephoneNormalise) return { error: "Format de téléphone invalide." };

  const admin = getAdmin();

  const { data: existant } = await admin
    .from("chauffeurs")
    .select("id, nom")
    .eq("telephone", telephoneNormalise)
    .maybeSingle();

  if (existant) {
    return { error: `Ce numéro est déjà celui de ${existant.nom}.` };
  }

  const { data: cree, error } = await admin
    .from("chauffeurs")
    .insert({
      nom,
      telephone: telephoneNormalise,
      permis_professionnel_url: permis || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: "creer_chauffeur",
    tableName: "chauffeurs",
    recordId: cree.id,
    newValues: { nom, telephone: telephoneNormalise },
  });

  revalidatePath("/admin/chauffeurs");
  return { success: true };
}

export async function modifierChauffeur(
  _prev: ChauffeurState,
  formData: FormData
): Promise<ChauffeurState> {
  const userId = await requireStaff();

  const chauffeurId = formData.get("chauffeur_id") as string;
  const { nom, telephone, permis } = lireChamps(formData);
  const actif = formData.get("actif") === "on";

  if (!chauffeurId) return { error: "Chauffeur invalide." };
  if (!nom) return { error: "Le nom est obligatoire." };
  const errTel = validerTelephone(telephone);
  if (errTel) return { error: errTel };

  const telephoneNormalise = normaliserTelephone(telephone);
  if (!telephoneNormalise) return { error: "Format de téléphone invalide." };

  const admin = getAdmin();

  const { data: ancien } = await admin
    .from("chauffeurs")
    .select("nom, telephone, actif, permis_professionnel_url")
    .eq("id", chauffeurId)
    .single();
  if (!ancien) return { error: "Chauffeur introuvable." };

  const { data: doublon } = await admin
    .from("chauffeurs")
    .select("id, nom")
    .eq("telephone", telephoneNormalise)
    .neq("id", chauffeurId)
    .maybeSingle();
  if (doublon) return { error: `Ce numéro est déjà celui de ${doublon.nom}.` };

  // Une désactivation ne doit pas laisser des courses orphelines : le chauffeur
  // reste sur ses réservations en cours, mais l'affectation automatique ne le
  // retiendra plus (elle filtre sur `actif`).
  if (ancien.actif && !actif) {
    const { count } = await admin
      .from("demandes_transport")
      .select("id", { count: "exact", head: true })
      .eq("chauffeur_id", chauffeurId)
      .in("statut", ["en_attente_validation", "acceptee", "en_cours"]);

    if (count && count > 0) {
      return {
        error: `${count} course${count > 1 ? "s" : ""} en cours avec ce chauffeur. Réaffectez-la${count > 1 ? "s" : ""} avant de le désactiver.`,
      };
    }
  }

  const { error } = await admin
    .from("chauffeurs")
    .update({
      nom,
      telephone: telephoneNormalise,
      permis_professionnel_url: permis || null,
      actif,
    })
    .eq("id", chauffeurId);

  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: "modifier_chauffeur",
    tableName: "chauffeurs",
    recordId: chauffeurId,
    oldValues: ancien,
    newValues: { nom, telephone: telephoneNormalise, actif },
  });

  revalidatePath("/admin/chauffeurs");
  revalidatePath("/admin/vehicules");
  return { success: true };
}
