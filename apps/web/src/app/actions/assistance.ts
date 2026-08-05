"use server";

import { redirect } from "next/navigation";
import { err } from "@/lib/i18n/erreurs";
import { revalidatePath } from "next/cache";
import { getAgenda } from "@/lib/parametres-rendez-vous";
import {
  joursDisponibles,
  creneauxDuJour,
  creneauReservable,
  libelleCreneau,
} from "@/lib/rendez-vous";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { validateDocumentUpload } from "@/lib/upload-validation";
import { logAudit } from "@/lib/audit";
import {
  getPays,
  getPrestation,
  isStatutDossier,
  transitionDossierAutorisee,
  isTypeDocument,
  STATUT_DOSSIER_LABELS,
} from "@/lib/assistance";
import { getTarifsAssistance } from "@/lib/public-cache";
import { notifierClient } from "@/lib/notifications";
import {
  notifierAdminNouveauDossierVoyage,
  notifierAdminNouveauRendezVous,
  notifierAdminMessageDossier,
} from "./notifications-admin";

export type AssistanceState = {
  error?: string;
  /** Dépôt de pièce et règlement : le client doit voir que c'est passé. */
  success?: boolean;
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
  if (!user) return { error: await err("vousDevezEtreConnectePourSoumettre") };

  const { data: profile } = await supabase
    .from("users")
    .select("id, nom")
    .eq("id", user.sub)
    .single();
  if (!profile) return { error: await err("profilIntrouvable") };

  const slug = formData.get("pays_slug") as string;
  const prestationKey = formData.get("prestation") as string;

  // Tarifs pilotés depuis /admin/tarifs : même source que l'affichage client,
  // donc le montant notifié à l'équipe correspond au prix annoncé.
  const tarifs = await getTarifsAssistance();
  const pays = getPays(slug, tarifs);
  if (!pays) return { error: await err("destinationInvalide") };
  const prestation = prestationKey ? getPrestation(pays, prestationKey) : null;
  if (!prestation) return { error: await err("prestationInvalide") };

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
    return { error: await err("impossibleDeCreerLeDossierVeuillez") };
  }

  // Le dossier n'était jamais facturé : `montant_estime` était écrit depuis le
  // tarif, et aucun paiement de module `voyage` n'était créé nulle part. Le
  // service était rendu et jamais encaissé.
  //
  // Le paiement naît avec le dossier, en attente : le client règle depuis
  // « Mes réservations », comme un devis de billet. Facturer d'emblée
  // bloquerait la soumission d'un dossier que l'équipe n'a pas encore examiné.
  // Une prestation peut n'avoir aucun prix publié (« sur devis ») : on ne
  // fabrique pas de ligne de paiement à zéro, elle traînerait en attente.
  const prixPrestation = Number(prestation.prix ?? 0);
  if (prixPrestation > 0) {
    const { error: paiementErr } = await admin.from("paiements").insert({
      module: "voyage",
      reference_table: "dossiers_voyage",
      reference_id: dossier.id,
      type: "montant",
      montant: prixPrestation,
      // Le mode est choisi au règlement ; `agence` est le repli neutre tant que
      // le client n'a rien réglé.
      methode: "agence",
      statut: "en_attente",
    });

    // Non bloquant : un dossier reçu vaut mieux qu'un dossier perdu parce que
    // la ligne de paiement n'a pas pu s'écrire. L'écart se voit en admin.
    if (paiementErr) {
      console.error(
        `Paiement non créé pour le dossier ${dossier.id} :`,
        paiementErr.message
      );
    }
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
    return { error: await err("statutInvalide") };
  }

  const { data: dossier } = await admin
    .from("dossiers_voyage")
    .select("client_id, pays_cible, statut")
    .eq("id", dossierId)
    .single();
  if (!dossier) return { error: await err("dossierIntrouvable") };

  if (dossier.statut === statut) return { success: true };

  // Le cycle était libre : un dossier finalisé pouvait repasser à « soumis ».
  if (!transitionDossierAutorisee(dossier.statut, statut)) {
    return {
      error: await err("passageImpossible", {
        de: STATUT_DOSSIER_LABELS[dossier.statut] ?? dossier.statut,
        vers: STATUT_DOSSIER_LABELS[statut] ?? statut,
      }),
    };
  }

  const { error, count } = await admin
    .from("dossiers_voyage")
    .update({ statut, updated_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", dossierId)
    .eq("statut", dossier.statut);
  if (error) return { error: error.message };
  if (!count) return { error: await err("leDossierAChangeDEtat") };

  {
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

  if (!dossierId) return { error: await err("dossierInvalide") };

  const { error } = await admin
    .from("dossiers_voyage")
    .update({ conseiller_id: conseillerId, updated_at: new Date().toISOString() })
    .eq("id", dossierId);
  if (error) return { error: error.message };

  revalidatePath("/admin/dossiers-voyage");
  return { success: true };
}

/**
 * Règlement d'un dossier par le client.
 *
 * Le paiement naît en attente avec le dossier ; c'est ici qu'il est encaissé.
 * Le montant n'est jamais lu depuis le formulaire — il vient de la ligne de
 * paiement créée à la soumission, sur le tarif en vigueur ce jour-là. Le laisser
 * arriver du client permettrait de payer ce qu'on veut.
 */
/**
 * Le règlement d'un dossier ne passe plus par le site.
 *
 * `payerDossierVoyage` ouvrait une session Stripe ou CinetPay depuis « Mes
 * réservations ». Retiré sur demande de l'exploitant : « il n'y a pas de
 * paiement à faire en ligne, je ne veux pas qu'on fasse des paiements en
 * ligne. Quand tu cliques sur soumettre dossier, tu prends rendez-vous. »
 *
 * La ligne de paiement, elle, reste créée à la soumission : elle porte ce qui
 * est dû et se solde au bureau via `encaisserAuBureau`. La supprimer aurait
 * ramené le défaut corrigé auparavant — un service rendu et jamais encaissé.
 */

export async function deposerPieceDossier(
  _prev: AssistanceState,
  formData: FormData
): Promise<AssistanceState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: await err("vousDevezEtreConnecte") };

  const dossierId = formData.get("dossier_id") as string;
  const typeDocument = formData.get("type_document") as string;
  const fichier = formData.get("fichier") as File | null;

  if (!dossierId) return { error: await err("dossierInvalide") };
  if (!isTypeDocument(typeDocument)) return { error: await err("typeDePieceInvalide") };
  if (!fichier || typeof fichier === "string" || !fichier.size) {
    return { error: await err("choisissezUnFichier") };
  }

  const admin = getAdmin();
  const { data: dossier } = await admin
    .from("dossiers_voyage")
    .select("id, client_id")
    .eq("id", dossierId)
    .single();

  if (!dossier) return { error: await err("dossierIntrouvable") };
  if (dossier.client_id !== user.sub) return { error: await err("ceDossierNEstPasLe") };

  let ext: string;
  try {
    ({ ext } = validateDocumentUpload(fichier));
  } catch {
    return { error: await err("fichierInvalidePdfOuImage5") };
  }

  // Bucket privé : passeports, diplômes, actes de naissance. C'est le chemin
  // qui est stocké, l'URL se signe à la demande.
  const chemin = `${dossierId}/${typeDocument}-${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await admin.storage
    .from("dossiers-documents")
    .upload(chemin, await fichier.arrayBuffer(), { contentType: fichier.type });

  if (upErr) return { error: await err("echecDeLEnvoiReessayez") };

  // Redéposer une pièce rejetée doit la remplacer, pas en ajouter une seconde :
  // l'équipe verrait deux lignes à vérifier pour un seul document. L'unicité
  // (dossier_id, type_document) posée en 00073 tient la règle en base.
  const { error } = await admin
    .from("documents_dossier_voyage")
    .upsert(
      {
        dossier_id: dossierId,
        type_document: typeDocument,
        url: chemin,
        statut: "soumis",
        commentaire: null,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "dossier_id,type_document" }
    );

  if (error) return { error: error.message };

  revalidatePath("/compte/reservations");
  revalidatePath("/admin/dossiers-voyage");
  return { success: true };
}

/** Lien signé vers une pièce : le client pour les siennes, le staff pour toutes. */
export async function lienPieceDossier(
  documentId: string
): Promise<{ error?: string; url?: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: await err("nonAuthentifie") };

  const admin = getAdmin();
  const { data: doc } = await admin
    .from("documents_dossier_voyage")
    .select("url, dossier_id")
    .eq("id", documentId)
    .single();
  if (!doc) return { error: await err("pieceIntrouvable") };

  const { data: dossier } = await admin
    .from("dossiers_voyage")
    .select("client_id")
    .eq("id", doc.dossier_id)
    .single();

  if (dossier?.client_id !== user.sub) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.sub)
      .single();
    if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
      return { error: await err("accesRefuse") };
    }
  }

  const { data: signee, error } = await admin.storage
    .from("dossiers-documents")
    .createSignedUrl(doc.url, 60);

  if (error || !signee?.signedUrl) return { error: await err("lienIndisponible") };
  return { url: signee.signedUrl };
}

/**
 * Vérification d'une pièce par le staff.
 *
 * Le motif d'un rejet est obligatoire : sans lui, le client devine ce qu'il doit
 * corriger et redépose la même pièce.
 */
export async function verifierPieceDossier(
  _prev: AssistanceState,
  formData: FormData
): Promise<AssistanceState> {
  const { user } = await requireStaff();

  const documentId = formData.get("document_id") as string;
  const decision = formData.get("decision") as string;
  const commentaire = ((formData.get("commentaire") as string) || "").trim();

  if (!documentId || !["valide", "rejete"].includes(decision)) {
    return { error: await err("demandeInvalide") };
  }
  if (decision === "rejete" && !commentaire) {
    return { error: await err("indiquezCeQuiNeVaPas") };
  }

  const admin = getAdmin();

  // Le filtre porte sur l'état attendu : une pièce déjà tranchée n'est pas
  // rejouée, et deux opérateurs simultanés n'en produisent qu'une décision.
  const { error, count } = await admin
    .from("documents_dossier_voyage")
    .update(
      {
        statut: decision,
        commentaire: decision === "rejete" ? commentaire : null,
        updated_at: new Date().toISOString(),
      } as never,
      { count: "exact" }
    )
    .eq("id", documentId)
    .eq("statut", "soumis");

  if (error) return { error: error.message };
  if (!count) return { error: await err("cettePieceADejaEteTraitee") };

  await logAudit({
    userId: user.sub as string,
    action: decision === "valide" ? "valider_piece_dossier" : "rejeter_piece_dossier",
    tableName: "documents_dossier_voyage",
    recordId: documentId,
    newValues: { statut: decision, commentaire: commentaire || null },
  });

  revalidatePath("/admin/dossiers-voyage");
  revalidatePath("/compte/reservations");
  return { success: true };
}

// ─── Rendez-vous de dépôt de dossier ─────────────────────────────────────────
// « Il choisit la date et puis il prend le rendez-vous de dépôt de dossier. »
// C'est ce qui remplace le règlement en ligne : le parcours s'arrête sur une
// date convenue, plus sur un paiement.

/**
 * Créneaux encore libres, pour l'agenda affiché au client.
 *
 * Les places prises sont lues ici et non déduites côté navigateur : entre le
 * rendu de la page et le clic, d'autres clients réservent.
 */
export async function creneauxDisponibles(): Promise<{
  jours: string[];
  creneaux: Record<string, { debut: string; fin: string; restant: number }[]>;
}> {
  const { params, horaires, fermetures } = await getAgenda();
  const admin = getAdmin();

  const { data: pris } = await admin
    .from("rendez_vous_dossier")
    .select("debut")
    .eq("statut", "reserve")
    .gte("debut", new Date().toISOString());

  const reserves: Record<string, number> = {};
  for (const r of pris ?? []) {
    const iso = new Date(r.debut as string).toISOString();
    reserves[iso] = (reserves[iso] ?? 0) + 1;
  }

  const options = { fermetures, reserves };
  const jours = joursDisponibles(horaires, params, options);
  const creneaux: Record<string, { debut: string; fin: string; restant: number }[]> = {};
  for (const j of jours) {
    creneaux[j] = creneauxDuJour(j, horaires, params, options).filter((c) => c.restant > 0);
  }
  return { jours, creneaux };
}

/**
 * Réserver un créneau pour le dépôt d'un dossier.
 *
 * Trois remparts, dans cet ordre : le dossier appartient bien au client, le
 * créneau est encore proposé et libre, et l'index unique refuse un second
 * rendez-vous vivant sur le même dossier. Aucun ne suffit seul — le premier
 * couvre l'appartenance, le deuxième la fraîcheur de l'agenda, le troisième la
 * course entre deux clics.
 */
export async function reserverCreneau(
  _prev: AssistanceState,
  formData: FormData
): Promise<AssistanceState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: await err("vousDevezEtreConnecte") };

  const dossierId = ((formData.get("dossier_id") as string) || "").trim();
  const debutIso = ((formData.get("debut") as string) || "").trim();
  if (!dossierId || !debutIso) return { error: await err("creneauOuDossierManquant") };

  const admin = getAdmin();
  const { data: dossier } = await admin
    .from("dossiers_voyage")
    .select("id, client_id")
    .eq("id", dossierId)
    .single();

  if (!dossier) return { error: await err("dossierIntrouvable") };
  if (dossier.client_id !== user.sub) return { error: await err("ceDossierNEstPasLe") };

  const { params, horaires, fermetures } = await getAgenda();

  const { data: pris } = await admin
    .from("rendez_vous_dossier")
    .select("debut")
    .eq("statut", "reserve")
    .gte("debut", new Date().toISOString());

  const reserves: Record<string, number> = {};
  for (const r of pris ?? []) {
    const iso = new Date(r.debut as string).toISOString();
    reserves[iso] = (reserves[iso] ?? 0) + 1;
  }

  const verdict = creneauReservable(debutIso, horaires, params, { fermetures, reserves });
  if ("error" in verdict) return { error: verdict.error };

  const debut = new Date(debutIso);
  const fin = new Date(debut.getTime() + params.duree_minutes * 60_000);

  const { error } = await admin.from("rendez_vous_dossier").insert({
    dossier_id: dossierId,
    client_id: user.sub as string,
    debut: debut.toISOString(),
    fin: fin.toISOString(),
  } as never);

  if (error) {
    // 23505 : l'index unique a parlé — ce dossier a déjà un rendez-vous vivant.
    if ((error as { code?: string }).code === "23505") {
      return { error: await err("ceDossierADejaUnRendez") };
    }
    return { error: await err("impossibleDeReserverCeCreneauReessayez") };
  }

  await notifierAdminNouveauRendezVous(dossierId, libelleCreneau(debut.toISOString(), fin.toISOString()));

  revalidatePath("/compte/reservations");
  revalidatePath("/admin/dossiers-voyage");
  return { success: true };
}

/** Annuler son rendez-vous. Le créneau redevient disponible pour tous. */
export async function annulerRendezVous(
  _prev: AssistanceState,
  formData: FormData
): Promise<AssistanceState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: await err("vousDevezEtreConnecte") };

  const rendezVousId = ((formData.get("rendez_vous_id") as string) || "").trim();
  if (!rendezVousId) return { error: await err("rendezVousManquant") };

  const admin = getAdmin();
  // Le filtre porte sur le statut ATTENDU : annuler un rendez-vous déjà honoré
  // effacerait une visite qui a eu lieu.
  const { error, count } = await admin
    .from("rendez_vous_dossier")
    .update({ statut: "annule", updated_at: new Date().toISOString() } as never, { count: "exact" })
    .eq("id", rendezVousId)
    .eq("client_id", user.sub as string)
    .eq("statut", "reserve");

  if (error) return { error: error.message };
  if (count === 0) return { error: await err("ceRendezVousNEstPlus") };

  revalidatePath("/compte/reservations");
  revalidatePath("/admin/dossiers-voyage");
  return { success: true };
}

// ─── Écrire à l'équipe au sujet d'un dossier ─────────────────────────────────
// « Au cas où ils veulent avoir plus de renseignements, il faut qu'il y ait
// l'option écrire à l'équipe. » Le formulaire de contact général ne sait pas de
// quel dossier on parle : l'équipe recevait « j'ai une question sur mon visa »
// sans rien pour le raccrocher.

export type MessageDossier = {
  id: string;
  auteur_role: "client" | "equipe";
  auteur_nom: string;
  message: string;
  created_at: string;
};

/** Le fil d'un dossier, du plus ancien au plus récent. */
export async function messagesDuDossier(dossierId: string): Promise<MessageDossier[]> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) return [];

  // Client de session : la policy de lecture décide, et elle borne le client à
  // ses propres dossiers. Passer en clé de service ici exposerait le fil de
  // n'importe quel dossier à qui devine un identifiant.
  const { data } = await supabase
    .from("messages_dossier")
    .select("id, auteur_id, auteur_role, message, created_at")
    .eq("dossier_id", dossierId)
    .order("created_at");

  if (!data?.length) return [];

  const admin = getAdmin();
  const { data: auteurs } = await admin
    .from("users")
    .select("id, nom")
    .in("id", [...new Set(data.map((m) => m.auteur_id as string))]);
  const nom = new Map((auteurs ?? []).map((u) => [u.id, u.nom]));

  return data.map((m) => ({
    id: m.id as string,
    auteur_role: m.auteur_role as "client" | "equipe",
    auteur_nom: nom.get(m.auteur_id as string) ?? "—",
    message: m.message as string,
    created_at: String(m.created_at),
  }));
}

/**
 * Écrire sur un dossier — client ou équipe.
 *
 * Le rôle est déterminé ici, jamais reçu du formulaire : un client qui poste
 * `auteur_role=equipe` verrait sinon son message affiché comme une réponse
 * officielle de GROUP PHOEBE.
 */
export async function envoyerMessageDossier(
  _prev: AssistanceState,
  formData: FormData
): Promise<AssistanceState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: await err("vousDevezEtreConnecte") };

  const dossierId = ((formData.get("dossier_id") as string) || "").trim();
  const message = ((formData.get("message") as string) || "").trim();

  if (!dossierId) return { error: await err("dossierInvalide") };
  if (!message) return { error: await err("ecrivezVotreMessage") };
  if (message.length > 4000) return { error: await err("messageTropLong4000CaracteresMaximum") };

  const { data: profile } = await supabase
    .from("users")
    .select("role, nom")
    .eq("id", user.sub)
    .single();
  if (!profile) return { error: await err("profilIntrouvable") };

  const estEquipe = ["operateur", "proprietaire"].includes(profile.role);

  const admin = getAdmin();
  const { data: dossier } = await admin
    .from("dossiers_voyage")
    .select("id, client_id, pays_cible")
    .eq("id", dossierId)
    .single();

  if (!dossier) return { error: await err("dossierIntrouvable") };
  if (!estEquipe && dossier.client_id !== user.sub) {
    return { error: await err("ceDossierNEstPasLe") };
  }

  const { error } = await admin.from("messages_dossier").insert({
    dossier_id: dossierId,
    auteur_id: user.sub as string,
    auteur_role: estEquipe ? "equipe" : "client",
    message,
  } as never);

  if (error) return { error: await err("messageNonEnvoyeReessayez") };

  // Prévenir l'autre partie : un message que personne ne lit ne vaut pas mieux
  // que pas de message.
  if (estEquipe) {
    await notifierClient(
      dossier.client_id,
      "Réponse de GROUP PHOEBE",
      `Votre dossier ${dossier.pays_cible} : l'équipe vous a répondu.`
    );
  } else {
    await notifierAdminMessageDossier(dossierId, profile.nom, dossier.pays_cible);
  }

  revalidatePath("/compte/reservations");
  revalidatePath("/admin/dossiers-voyage");
  return { success: true };
}
