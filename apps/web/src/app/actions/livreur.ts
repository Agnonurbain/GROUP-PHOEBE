"use server";

import { revalidatePath } from "next/cache";
import { err } from "@/lib/i18n/erreurs";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import {
  STATUT_LIVRAISON,
  STATUT_LIVRAISON_LABELS,
  transitionAutorisee,
  isStatutLivraison,
} from "@/lib/livraison";
import { logAudit } from "@/lib/audit";
import { notifierClient } from "@/lib/notifications";
import { compressImage } from "@/lib/compress-image";
import { validateImageUpload } from "@/lib/upload-validation";

export type LivreurState = {
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
 * Le livreur courant, actif, ou une erreur.
 *
 * Un livreur désactivé n'est plus un livreur : il perd l'accès sans qu'il faille
 * lui retirer ses affectations une à une.
 */
export async function requireLivreur(): Promise<{ livreurId: string; userId: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) throw new Error("Non authentifié");

  const admin = getAdmin();
  const { data: livreur } = await admin
    .from("livreurs")
    .select("id, actif")
    .eq("user_id", user.sub as string)
    .single();

  if (!livreur || !livreur.actif) throw new Error("Accès refusé : livreur actif requis");
  return { livreurId: livreur.id, userId: user.sub as string };
}

/**
 * Charge une expédition en vérifiant qu'elle appartient bien au livreur courant.
 *
 * Le contrôle est explicite plutôt que délégué à la RLS : les server actions
 * écrivent en clé de service, qui la contourne. Une garde implicite ici
 * laisserait un livreur agir sur le colis d'un autre.
 */
async function chargerExpeditionDuLivreur(expeditionId: string, livreurId: string) {
  const admin = getAdmin();
  const { data: exp } = await admin
    .from("expeditions")
    .select("id, statut, client_id, numero_suivi, livreur_id, prix")
    .eq("id", expeditionId)
    .single();

  if (!exp) return { erreur: "Expédition introuvable." as const };
  if (exp.livreur_id !== livreurId) {
    return { erreur: "Ce colis ne vous est pas affecté." as const };
  }
  return { exp };
}

async function appliquerStatut(
  expeditionId: string,
  depuis: string,
  vers: string,
  champs: Record<string, unknown>,
  contexte: { livreurId: string; userId: string; clientId: string; numeroSuivi: string },
  /** Paiement à la livraison à capturer, une fois la transition acquise. */
  paiementACapturer: string | null = null
): Promise<LivreurState> {
  if (!transitionAutorisee(depuis, vers)) {
    return {
      error: await err("passageImpossible", {
        de: STATUT_LIVRAISON_LABELS[depuis] ?? depuis,
        vers: STATUT_LIVRAISON_LABELS[vers] ?? vers,
      }),
    };
  }

  const admin = getAdmin();
  // Le filtre sur le statut d'origine rend l'opération idempotente : deux
  // validations parties du même écran ne produisent qu'une transition, et la
  // seconde ne réécrit pas une preuve par-dessus l'autre.
  const { error, count } = await admin
    .from("expeditions")
    .update({ statut: vers, updated_at: new Date().toISOString(), ...champs } as never, {
      count: "exact",
    })
    .eq("id", expeditionId)
    .eq("statut", depuis);

  if (error) return { error: error.message };
  if (!count) return { error: await err("leColisAChangeDEtat") };

  if (paiementACapturer) {
    // Le filtre sur `en_attente` fait office de verrou : deux validations
    // concurrentes ne capturent qu'une fois.
    const { error: errPaiement } = await admin
      .from("paiements")
      .update({ statut: "capture" })
      .eq("id", paiementACapturer)
      .eq("statut", "en_attente");

    // La remise est faite et l'argent est pris : on ne la défait pas pour une
    // écriture ratée. L'écart est signalé, il se règle à la remontée de caisse.
    if (errPaiement) {
      console.error(
        `Encaissement non enregistré (paiement ${paiementACapturer}, expédition ${expeditionId}) :`,
        errPaiement.message
      );
    }
  }

  await logAudit({
    userId: contexte.userId,
    action: "livreur_changer_statut",
    tableName: "expeditions",
    recordId: expeditionId,
    oldValues: { statut: depuis },
    newValues: { statut: vers, ...champs },
  });

  await notifierClient(
    contexte.clientId,
    "Mise à jour de votre livraison",
    `Votre colis ${contexte.numeroSuivi} : ${STATUT_LIVRAISON_LABELS[vers] ?? vers}.`
  );

  revalidatePath("/terrain/livreur");
  revalidatePath("/admin/expeditions");
  return { success: true };
}

/** Prise en charge et mise en transit : pas de pièce jointe, juste l'horodatage. */
export async function avancerStatutLivraison(
  _prev: LivreurState,
  formData: FormData
): Promise<LivreurState> {
  const { livreurId, userId } = await requireLivreur();

  const expeditionId = formData.get("expedition_id") as string;
  const vers = formData.get("statut") as string;
  if (!expeditionId || !isStatutLivraison(vers)) return { error: await err("demandeInvalide") };

  // La livraison et l'échec ont leurs propres actions : elles exigent une pièce.
  if (vers === STATUT_LIVRAISON.livree || vers === STATUT_LIVRAISON.echecLivraison) {
    return { error: await err("ceStatutDemandeUnePreuveOu") };
  }

  const { exp, erreur } = await chargerExpeditionDuLivreur(expeditionId, livreurId);
  if (erreur) return { error: erreur };

  return appliquerStatut(expeditionId, exp.statut, vers, {}, {
    livreurId,
    userId,
    clientId: exp.client_id,
    numeroSuivi: exp.numero_suivi,
  });
}

/**
 * Livraison effectuée : photo de remise et nom du réceptionnaire obligatoires.
 *
 * Un colis était « livré » parce que quelqu'un l'avait tapé. La photo et le nom
 * de celui qui a réceptionné sont ce qui distingue une livraison d'une
 * affirmation — le destinataire déclaré n'est d'ailleurs pas toujours celui qui
 * ouvre la porte.
 */
export async function confirmerLivraison(
  _prev: LivreurState,
  formData: FormData
): Promise<LivreurState> {
  const { livreurId, userId } = await requireLivreur();

  const expeditionId = formData.get("expedition_id") as string;
  const recuPar = ((formData.get("recu_par") as string) || "").trim();
  const latRaw = formData.get("latitude") as string | null;
  const lngRaw = formData.get("longitude") as string | null;
  const photo = formData.get("preuve_photo") as File | null;

  if (!expeditionId) return { error: await err("expeditionInvalide") };
  if (!recuPar) return { error: await err("indiquezQuiAReceptionneLeColis") };
  if (!photo || typeof photo === "string" || !photo.size) {
    return { error: await err("unePhotoDeLaRemiseEst") };
  }

  const { exp, erreur } = await chargerExpeditionDuLivreur(expeditionId, livreurId);
  if (erreur) return { error: erreur };

  let ext: string;
  try {
    ({ ext } = validateImageUpload(photo));
  } catch {
    return { error: await err("photoInvalideFormatsAcceptesJpegPng") };
  }

  const admin = getAdmin();
  const compressed = await compressImage(photo);
  // Bucket privé : la photo montre la porte de quelqu'un et le nom de qui a
  // réceptionné. C'est le chemin qui est conservé, l'URL est signée à la
  // demande — les photos du colis, elles, restent dans le bucket public.
  const chemin = `${expeditionId}/preuve-${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await admin.storage
    .from("livraison-preuves")
    .upload(chemin, await compressed.arrayBuffer(), { contentType: compressed.type });

  if (upErr) return { error: await err("echecDeLEnvoiDeLa") };

  // La position est déclarative et facultative : un GPS refusé ou indisponible
  // ne doit pas empêcher un livreur de clôturer une course déjà faite.
  const lat = latRaw ? Number(latRaw) : null;
  const lng = lngRaw ? Number(lngRaw) : null;

  // Paiement à la livraison : remettre le colis et encaisser sont un seul geste.
  // Un colis remis sans encaissement serait une perte sèche, et un encaissement
  // déclaré sans remise fausserait la caisse — les deux vont ensemble ou aucun.
  const { data: paiement } = await admin
    .from("paiements")
    .select("id, statut")
    .eq("reference_table", "expeditions")
    .eq("reference_id", expeditionId)
    .eq("methode", "a_la_livraison")
    .maybeSingle();

  const aEncaisser = paiement?.statut === "en_attente";
  if (aEncaisser && formData.get("encaissement_confirme") !== "on") {
    return {
      error: await err("confirmezEncaissement", { montant: Number(exp.prix ?? 0).toLocaleString("fr-FR") }),
    };
  }

  const champsEncaissement = aEncaisser
    ? {
        paiement_encaisse_at: new Date().toISOString(),
        paiement_encaisse_par: livreurId,
      }
    : {};

  return appliquerStatut(
    expeditionId,
    exp.statut,
    STATUT_LIVRAISON.livree,
    {
      preuve_chemin: chemin,
      preuve_latitude: Number.isFinite(lat) ? lat : null,
      preuve_longitude: Number.isFinite(lng) ? lng : null,
      recu_par: recuPar,
      livree_at: new Date().toISOString(),
      ...champsEncaissement,
    },
    { livreurId, userId, clientId: exp.client_id, numeroSuivi: exp.numero_suivi },
    // Le paiement n'est capturé que si la transition aboutit : sinon un
    // encaissement serait enregistré sur un colis resté en transit.
    aEncaisser ? paiement!.id : null
  );
}

/**
 * Échec de livraison : le motif est obligatoire.
 *
 * Sans lui, le statut est un cul-de-sac — ni seconde présentation, ni retour,
 * ni remboursement ne peuvent être instruits, et le client lit « Échec de
 * livraison » sans savoir pourquoi.
 */
export async function signalerEchecLivraison(
  _prev: LivreurState,
  formData: FormData
): Promise<LivreurState> {
  const { livreurId, userId } = await requireLivreur();

  const expeditionId = formData.get("expedition_id") as string;
  const motif = ((formData.get("echec_motif") as string) || "").trim();

  if (!expeditionId) return { error: await err("expeditionInvalide") };
  if (!motif) return { error: await err("indiquezLeMotifDeLEchec") };

  const { exp, erreur } = await chargerExpeditionDuLivreur(expeditionId, livreurId);
  if (erreur) return { error: erreur };

  const res = await appliquerStatut(
    expeditionId,
    exp.statut,
    STATUT_LIVRAISON.echecLivraison,
    { echec_motif: motif },
    { livreurId, userId, clientId: exp.client_id, numeroSuivi: exp.numero_suivi }
  );

  if (res.success) {
    await notifierClient(
      exp.client_id,
      "Livraison non aboutie",
      `Le colis ${exp.numero_suivi} n'a pas pu être remis : ${motif}. Notre équipe vous recontacte pour convenir d'une nouvelle présentation.`
    );
  }

  return res;
}

/**
 * Preuve de remise, pour le client.
 *
 * La photo était collectée sans que le destinataire du service la voie jamais :
 * elle ne servait qu'à l'équipe. « Reçu par X, le Y » est précisément ce qui
 * coupe court à une contestation.
 *
 * La lecture passe par la session du demandeur — c'est `expeditions_select_own`
 * qui tranche. Interroger en clé de service rendrait la preuve de n'importe quel
 * colis lisible par qui connaît un identifiant.
 */
export async function preuveDeLivraison(
  expeditionId: string
): Promise<{ error?: string; url?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: await err("nonAuthentifie") };

  const { data: exp } = await supabase
    .from("expeditions")
    .select("preuve_chemin")
    .eq("id", expeditionId)
    .single();

  if (!exp?.preuve_chemin) return { error: await err("aucunePreuveDisponible") };

  const admin = getAdmin();
  const { data: signee, error } = await admin.storage
    .from("livraison-preuves")
    .createSignedUrl(exp.preuve_chemin, 60);

  if (error || !signee?.signedUrl) return { error: await err("lienIndisponible") };
  return { url: signee.signedUrl };
}
