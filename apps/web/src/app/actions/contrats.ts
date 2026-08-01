"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { logAudit } from "@/lib/audit";
import { notifierClient } from "@/lib/notifications";
import {
  isFrequence,
  isCategorieContrat,
  STATUTS_CONTRAT,
  type StatutContrat,
} from "@/lib/contrats";

export type ContratState = {
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
 * Un abonnement engage un montant périodique : c'est un prix, donc propriétaire
 * seul — la même règle que partout ailleurs dans le projet.
 */
async function requireProprietaire() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();
  if (profile?.role !== "proprietaire") {
    throw new Error("Accès refusé : propriétaire requis");
  }
  return user.sub as string;
}

function lireJours(formData: FormData): number[] {
  return formData
    .getAll("jours_semaine")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 7);
}

export async function creerContrat(
  _prev: ContratState,
  formData: FormData
): Promise<ContratState> {
  const userId = await requireProprietaire();

  const clientId = (formData.get("client_id") as string) || "";
  const categorie = (formData.get("categorie") as string) || "";
  const vehiculeId = (formData.get("vehicule_id") as string) || "";
  const chauffeurId = (formData.get("chauffeur_id") as string) || "";
  const dateDebut = (formData.get("date_debut") as string) || "";
  const dateFin = (formData.get("date_fin") as string) || "";
  const frequence = (formData.get("frequence_facturation") as string) || "";
  const montant = Number(formData.get("montant_periodique"));
  const heureDebut = (formData.get("heure_debut") as string) || "";
  const heureFin = (formData.get("heure_fin") as string) || "";
  const jours = lireJours(formData);

  if (!clientId) return { error: "Choisissez un client." };
  if (!isCategorieContrat(categorie)) return { error: "Catégorie invalide." };
  if (!dateDebut) return { error: "La date de début est obligatoire." };
  if (dateFin && dateFin < dateDebut) {
    return { error: "La date de fin précède la date de début." };
  }
  if (!isFrequence(frequence)) return { error: "Fréquence de facturation invalide." };
  if (!Number.isFinite(montant) || montant <= 0) {
    return { error: "Le montant périodique doit être positif." };
  }

  // Le créneau est ce qui distingue un abonnement d'une immobilisation : sans
  // jour ni horaire, le contrat ne décrirait aucun usage et ne réserverait rien.
  if (jours.length === 0) return { error: "Sélectionnez au moins un jour desservi." };
  if (!heureDebut || !heureFin) return { error: "Indiquez les heures du créneau." };
  if (heureDebut >= heureFin) return { error: "L'heure de fin doit suivre l'heure de début." };

  const admin = getAdmin();

  const { data: cree, error } = await admin
    .from("contrats_recurrents")
    .insert({
      client_id: clientId,
      categorie,
      vehicule_id: vehiculeId || null,
      chauffeur_id: chauffeurId || null,
      date_debut: dateDebut,
      date_fin: dateFin || null,
      frequence_facturation: frequence,
      montant_periodique: montant,
      jours_semaine: jours,
      heure_debut: heureDebut,
      heure_fin: heureFin,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: "creer_contrat_recurrent",
    tableName: "contrats_recurrents",
    recordId: cree.id,
    newValues: { clientId, categorie, montant, frequence, jours },
  });

  await notifierClient(
    clientId,
    "Abonnement enregistré",
    `Votre abonnement ${categorie === "scolaire" ? "de ramassage scolaire" : "chauffeur personnel"} ` +
      `démarre le ${new Date(dateDebut).toLocaleDateString("fr-FR")}.`
  );

  revalidatePath("/admin/contrats");
  return { success: true };
}

/**
 * Suspension, reprise ou résiliation.
 *
 * Un contrat suspendu ou résilié cesse aussitôt de mobiliser le véhicule
 * (`contratMobilise` ne regarde que les actifs) et sort de la génération
 * d'échéances. Les échéances déjà émises restent : elles correspondent à un
 * service rendu, les effacer masquerait une créance.
 */
export async function changerStatutContrat(
  _prev: ContratState,
  formData: FormData
): Promise<ContratState> {
  const userId = await requireProprietaire();

  const contratId = (formData.get("contrat_id") as string) || "";
  const statut = (formData.get("statut") as string) || "";

  if (!contratId) return { error: "Contrat invalide." };
  if (!(STATUTS_CONTRAT as readonly string[]).includes(statut)) {
    return { error: "Statut invalide." };
  }

  const admin = getAdmin();

  const { data: contrat } = await admin
    .from("contrats_recurrents")
    .select("statut, client_id")
    .eq("id", contratId)
    .single();
  if (!contrat) return { error: "Contrat introuvable." };
  if (contrat.statut === statut) return { success: true };

  // Un contrat résilié ne se rouvre pas : il faut en créer un nouveau, sinon la
  // génération d'échéances rattraperait toute la période d'interruption comme si
  // le service avait été rendu.
  if (contrat.statut === "resilie") {
    return { error: "Un contrat résilié ne peut pas être réactivé. Créez-en un nouveau." };
  }

  const { error, count } = await admin
    .from("contrats_recurrents")
    .update({ statut, updated_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", contratId)
    .eq("statut", contrat.statut);

  if (error) return { error: error.message };
  if (!count) return { error: "Le contrat a changé d'état entre-temps. Rechargez la page." };

  await logAudit({
    userId,
    action: "changer_statut_contrat",
    tableName: "contrats_recurrents",
    recordId: contratId,
    oldValues: { statut: contrat.statut },
    newValues: { statut },
  });

  const messages: Record<StatutContrat, string> = {
    actif: "Votre abonnement reprend.",
    suspendu: "Votre abonnement est suspendu. Aucune échéance ne sera émise pendant la suspension.",
    resilie: "Votre abonnement est résilié.",
  };
  await notifierClient(contrat.client_id, "Abonnement mis à jour", messages[statut as StatutContrat]);

  revalidatePath("/admin/contrats");
  return { success: true };
}

/**
 * Marque une échéance facturée ou payée.
 *
 * Le filtre porte sur l'état attendu, jamais sur celui qu'on vient de lire :
 * même règle que les paiements, une décision déjà prise ne se rejoue pas.
 */
export async function changerStatutEcheance(
  _prev: ContratState,
  formData: FormData
): Promise<ContratState> {
  const userId = await requireProprietaire();

  const echeanceId = (formData.get("echeance_id") as string) || "";
  const vers = (formData.get("statut") as string) || "";

  if (!echeanceId) return { error: "Échéance invalide." };

  const transitions: Record<string, string[]> = {
    facturee: ["a_facturer"],
    payee: ["facturee", "impayee"],
    annulee: ["a_facturer", "facturee", "impayee"],
  };
  const depuisAutorises = transitions[vers];
  if (!depuisAutorises) return { error: "Statut invalide." };

  const admin = getAdmin();
  const { data: echeance } = await admin
    .from("echeances_contrat")
    .select("statut")
    .eq("id", echeanceId)
    .single();
  if (!echeance) return { error: "Échéance introuvable." };

  if (!depuisAutorises.includes(echeance.statut)) {
    return { error: "Cette échéance ne peut pas passer à cet état." };
  }

  const { error, count } = await admin
    .from("echeances_contrat")
    .update({ statut: vers, updated_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", echeanceId)
    .eq("statut", echeance.statut);

  if (error) return { error: error.message };
  if (!count) return { error: "L'échéance a changé d'état entre-temps." };

  await logAudit({
    userId,
    action: "changer_statut_echeance",
    tableName: "echeances_contrat",
    recordId: echeanceId,
    oldValues: { statut: echeance.statut },
    newValues: { statut: vers },
  });

  revalidatePath("/admin/contrats");
  return { success: true };
}
