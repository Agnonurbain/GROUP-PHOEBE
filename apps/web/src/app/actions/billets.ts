"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import {
  validerDemandeBillet,
  isStatutBillet,
  transitionBilletAutorisee,
  STATUT_BILLET_LABELS,
  STATUTS_BILLET_OUVERTS,
  libelleVoyageurs,
  TYPE_TRAJET_LABELS,
  type PassagerSaisie,
} from "@/lib/billets";
import { getParametresBillet } from "@/lib/public-cache";
import { notifierClient } from "@/lib/notifications";
import { notifierAdminNouvelleDemandeBillet } from "./notifications-admin";
import { logAudit } from "@/lib/audit";
import { creerSessionStripe } from "@/lib/payments/stripe";
import { creerSessionCinetPay } from "@/lib/payments/cinetpay";

export type BilletState = {
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
  if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
    throw new Error("Accès refusé");
  }
  return { userId: user.sub as string, role: profile.role as string };
}

// Chiffrer un billet, c'est écrire un montant facturé : propriétaire seul.
// Cf. __tests__/prix-proprietaire.test.ts et le trigger garde_montant (00055).
async function requireProprietaireAvecId() {
  const { userId, role } = await requireStaff();
  if (role !== "proprietaire") throw new Error("Accès refusé : propriétaire requis");
  return userId;
}

const nombre = (v: FormDataEntryValue | null, defaut = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : defaut;
};

const texte = (v: FormDataEntryValue | null): string =>
  typeof v === "string" ? v.trim() : "";

/**
 * Le fichier est déposé par le NAVIGATEUR — une pièce va jusqu'à 10 Mo et un
 * dossier jusqu'à 9 voyageurs, quand une Server Action plafonne à 1 Mo. Seul le
 * chemin arrive ici, et un chemin est une chaîne que le client choisit.
 *
 * On n'accepte donc que `billets/<son propre identifiant>/…` : sans cela, un
 * client attacherait à sa demande la pièce d'un autre, que le staff ouvrirait
 * de bonne foi. La policy de dépôt pose la même borne côté base (00079) — les
 * deux disent la même chose, et aucune ne suffit seule : celle-ci couvre le
 * chemin d'un fichier qui existe déjà, l'autre le moment où il est écrit.
 */
function cheminAutorise(v: FormDataEntryValue | null, userId: string): string | null {
  const chemin = texte(v);
  if (!chemin) return null;
  if (!chemin.startsWith(`billets/${userId}/`)) return null;
  // Une remontée de dossier ferait sortir du préfixe qu'on vient de vérifier.
  if (chemin.includes("..")) return null;
  return chemin;
}

/**
 * Accompagnants saisis dans le formulaire de demande.
 *
 * Ils étaient auparavant lus à l'étape du PAIEMENT, où aucun champ ne les
 * envoyait : toute demande à plus d'un voyageur était impayable. La collecte
 * remonte ici, là où le client saisit déjà son propre passeport.
 */
function lirePassagers(formData: FormData, userId: string): PassagerSaisie[] {
  const out: PassagerSaisie[] = [];
  for (let i = 0; formData.has(`passager_nom_${i}`); i++) {
    const type = texte(formData.get(`passager_type_${i}`));
    out.push({
      nom: texte(formData.get(`passager_nom_${i}`)),
      passeportNumero: texte(formData.get(`passager_passeport_numero_${i}`)),
      passeportExpiration: texte(formData.get(`passager_passeport_expiration_${i}`)),
      passeportFichier: cheminAutorise(formData.get(`passager_passeport_fichier_${i}`), userId),
      type: type === "enfant" ? "enfant" : "adulte",
    });
  }
  return out;
}

/**
 * Demande de réservation de billet. Aucun paiement à cette étape : il n'y a pas
 * de recherche de vol en direct, l'équipe cherche puis répond avec un prix.
 */
export async function creerDemandeBillet(
  _prev: BilletState,
  formData: FormData
): Promise<BilletState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Vous devez être connecté pour demander un billet." };

  const { data: profile } = await supabase
    .from("users")
    .select("nom")
    .eq("id", user.sub)
    .single();
  if (!profile) return { error: "Profil introuvable." };

  const typeTrajet = ((formData.get("type_trajet") as string) || "").trim();
  const saisie = {
    typeTrajet,
    depart: ((formData.get("depart") as string) || "").trim(),
    destination: ((formData.get("destination") as string) || "").trim(),
    dateDepart: ((formData.get("date_depart") as string) || "").trim(),
    // Le champ retour reste dans le DOM quand on repasse en aller simple :
    // on l'ignore explicitement plutôt que de laisser passer une incohérence.
    dateRetour: typeTrajet === "aller_retour"
      ? ((formData.get("date_retour") as string) || "").trim()
      : "",
    classe: ((formData.get("classe") as string) || "economique").trim(),
    voyageurs: {
      adultes: nombre(formData.get("nb_adultes"), 1),
      enfants: nombre(formData.get("nb_enfants")),
      bebes: nombre(formData.get("nb_bebes")),
    },
    passeportNom: ((formData.get("passeport_nom") as string) || "").trim(),
    passeportNumero: ((formData.get("passeport_numero") as string) || "").trim(),
    passeportExpiration: ((formData.get("passeport_expiration") as string) || "").trim(),
    certificatFievreJaune: formData.get("certificat_fievre_jaune") === "1",
    mineurAutorisationParentale: formData.get("mineur_autorisation_parentale") === "1",
    passagers: lirePassagers(formData, user.sub as string),
    // Chemin déposé par le navigateur : borné au dossier du client, sinon un
    // chemin forgé désignerait la pièce d'un autre.
    passeportFichier: cheminAutorise(formData.get("passeport_fichier"), user.sub as string),
  };

  // Règles pilotées depuis /admin/tarifs : validité de passeport exigée et
  // plafond de voyageurs. Même source que ce que le formulaire annonce.
  const params = await getParametresBillet();
  const validation = validerDemandeBillet(saisie, params);
  if ("error" in validation) return { error: validation.error };

  const admin = getAdmin();
  const { data: demande, error } = await admin
    .from("demandes_billet")
    .insert({
      client_id: user.sub as string,
      type_trajet: saisie.typeTrajet,
      depart: saisie.depart,
      destination: saisie.destination,
      date_depart: saisie.dateDepart,
      date_retour: saisie.typeTrajet === "aller_retour" ? saisie.dateRetour : null,
      nb_adultes: saisie.voyageurs.adultes,
      nb_enfants: saisie.voyageurs.enfants,
      nb_bebes: saisie.voyageurs.bebes,
      classe: saisie.classe,
      passeport_nom: saisie.passeportNom,
      passeport_numero: saisie.passeportNumero,
      passeport_expiration: saisie.passeportExpiration,
      passeport_fichier: saisie.passeportFichier,
      certificat_fievre_jaune: saisie.certificatFievreJaune,
      mineur_autorisation_parentale: saisie.mineurAutorisationParentale,
      message: ((formData.get("message") as string) || "").trim() || null,
      // Frais figés au barème du jour : le paramètre peut changer, pas ce qui a
      // été annoncé au client au moment de sa demande.
      frais_service: params.frais_service,
      statut: "soumise",
    })
    .select("id")
    .single();

  if (error || !demande) {
    return { error: "Impossible d'enregistrer la demande. Veuillez réessayer." };
  }

  // Les accompagnants sont écrits ici, pas au paiement. En un seul appel : neuf
  // insertions séquentielles pouvaient échouer à la sixième et laisser un
  // dossier à moitié peuplé, sans que rien ne le signale.
  if (saisie.passagers.length > 0) {
    const { error: passErr } = await admin.from("passagers_billet").insert(
      saisie.passagers.map((p) => ({
        demande_id: demande.id,
        nom: p.nom,
        passeport_numero: p.passeportNumero,
        passeport_expiration: p.passeportExpiration,
        passeport_fichier: p.passeportFichier,
        type: p.type,
      })) as never
    );
    if (passErr) {
      // Sans les accompagnants, le billet ne peut pas être émis : mieux vaut
      // refuser la demande que la laisser incomplète et paraître acceptée.
      await admin.from("demandes_billet").delete().eq("id", demande.id);
      return { error: "Impossible d'enregistrer les voyageurs. Veuillez réessayer." };
    }
  }

  await notifierAdminNouvelleDemandeBillet(
    profile.nom,
    `${saisie.depart} → ${saisie.destination}`,
    TYPE_TRAJET_LABELS[saisie.typeTrajet] ?? saisie.typeTrajet,
    libelleVoyageurs(saisie.voyageurs)
  );

  redirect("/assistance/confirmation?type=billet");
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function changerStatutBillet(
  _prev: BilletState,
  formData: FormData
): Promise<BilletState> {
  try {
    await requireStaff();
  } catch {
    return { error: "Session expirée ou accès refusé." };
  }

  const demandeId = formData.get("demande_id") as string;
  const statut = formData.get("statut") as string;
  if (!demandeId || !isStatutBillet(statut)) return { error: "Statut invalide." };

  // « devis_envoye » suppose un montant : il ne s'obtient que par le devis,
  // sinon le client verrait un devis sans prix.
  if (statut === "devis_envoye") {
    return { error: "Passez par le formulaire de devis pour ce statut." };
  }

  const admin = getAdmin();
  const { data: demande } = await admin
    .from("demandes_billet")
    .select("client_id, depart, destination, statut")
    .eq("id", demandeId)
    .single();
  if (!demande) return { error: "Demande introuvable." };

  if (demande.statut === statut) return { success: true };

  // `emise` est terminal : un billet émis auprès de la compagnie ne se dénoue
  // pas par un retour en arrière dans notre outil.
  if (!transitionBilletAutorisee(demande.statut, statut)) {
    return {
      error: `Passage impossible de « ${STATUT_BILLET_LABELS[demande.statut] ?? demande.statut} » à « ${STATUT_BILLET_LABELS[statut] ?? statut} ».`,
    };
  }

  const { error, count } = await admin
    .from("demandes_billet")
    .update({ statut, updated_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", demandeId)
    .eq("statut", demande.statut);
  if (error) return { error: error.message };
  if (!count) return { error: "La demande a changé d'état entre-temps. Rechargez la page." };

  {
    await notifierClient(
      demande.client_id,
      "Mise à jour de votre demande de billet",
      `${demande.depart} → ${demande.destination} : ${STATUT_BILLET_LABELS[statut] ?? statut}.`
    );
  }

  revalidatePath("/admin/billets");
  revalidatePath("/compte/reservations");
  return { success: true };
}

/** Chiffrer la demande et envoyer le devis au client. Propriétaire seul. */
export async function proposerDevisBillet(
  _prev: BilletState,
  formData: FormData
): Promise<BilletState> {
  let proprietaireId: string;
  try {
    proprietaireId = await requireProprietaireAvecId();
  } catch {
    return { error: "Seul le propriétaire peut chiffrer un billet." };
  }

  const demandeId = formData.get("demande_id") as string;
  const montant = Number(formData.get("montant"));
  if (!demandeId) return { error: "Demande invalide." };
  if (!Number.isFinite(montant) || montant <= 0) {
    return { error: "Le montant doit être un montant positif." };
  }

  const admin = getAdmin();
  const { data: demande } = await admin
    .from("demandes_billet")
    .select("client_id, statut, depart, destination, montant_propose, frais_service")
    .eq("id", demandeId)
    .single();
  if (!demande) return { error: "Demande introuvable." };

  if (!(STATUTS_BILLET_OUVERTS as readonly string[]).includes(demande.statut)) {
    return { error: `Demande ${STATUT_BILLET_LABELS[demande.statut] ?? demande.statut} : elle est close.` };
  }

  const paramsBillet = await getParametresBillet();
  const devisExpiration = new Date(
    Date.now() + paramsBillet.validite_devis_heures * 60 * 60 * 1000
  ).toISOString();

  const { error } = await admin
    .from("demandes_billet")
    .update({
      montant_propose: montant,
      statut: "devis_envoye",
      devis_valable_jusqu_a: devisExpiration,
      updated_at: new Date().toISOString(),
    })
    .eq("id", demandeId);
  if (error) return { error: error.message };

  await logAudit({
    userId: proprietaireId,
    action: "devis_billet",
    tableName: "demandes_billet",
    recordId: demandeId,
    oldValues: { montant_propose: demande.montant_propose, statut: demande.statut },
    newValues: { montant_propose: montant, statut: "devis_envoye" },
  });

  // Le client doit lire le total qu'il aura à régler, pas le seul prix du vol.
  const frais = Number(demande.frais_service ?? 0);
  const total = montant + frais;
  await notifierClient(
    demande.client_id,
    "Votre devis de billet est prêt",
    `${demande.depart} → ${demande.destination} : ${total.toLocaleString("fr-FR")} FCFA` +
      (frais > 0
        ? ` (vol ${montant.toLocaleString("fr-FR")} + frais de service ${frais.toLocaleString("fr-FR")})`
        : "") +
      `. Retrouvez le détail dans « Mes réservations ».`
  );

  revalidatePath("/admin/billets");
  revalidatePath("/compte/reservations");
  return { success: true };
}

/** Payer un devis de billet. Le client accepte le devis et paie le total. */
export async function payerDevisBillet(
  _prev: BilletState,
  formData: FormData
): Promise<BilletState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Vous devez être connecté." };

  const demandeId = formData.get("demande_id") as string;
  const methode = formData.get("methode_paiement") as string;

  if (!["cinetpay", "stripe"].includes(methode)) {
    return { error: "Méthode de paiement invalide." };
  }

  const admin = getAdmin();
  const { data: demande } = await admin
    .from("demandes_billet")
    .select("id, client_id, statut, depart, destination, montant_propose, frais_service, devis_valable_jusqu_a, nb_adultes, nb_enfants, nb_bebes")
    .eq("id", demandeId)
    .eq("client_id", user.sub)
    .single();

  if (!demande) return { error: "Demande introuvable." };
  if (demande.statut !== "devis_envoye") {
    return { error: "Cette demande n'a pas de devis en attente." };
  }
  if (demande.montant_propose == null) {
    return { error: "Le devis n'a pas de montant." };
  }

  // Vérifier la validité du devis
  if (demande.devis_valable_jusqu_a && new Date(demande.devis_valable_jusqu_a) < new Date()) {
    return { error: "Ce devis a expiré. Contactez-nous pour un nouveau devis." };
  }

  // Les accompagnants ne sont plus demandés ici : ils sont saisis avec la
  // demande, en même temps que le passeport du voyageur principal (00079).
  //
  // Cette étape les lisait dans le formulaire — `passager_nom_0` et suivants —
  // alors que l'écran de paiement n'envoie que l'identifiant et la méthode.
  // Toute demande à plus d'un voyageur était donc impayable : le client
  // recevait « Le nom du passager 1 est obligatoire » pour un champ qui ne lui
  // avait jamais été présenté.

  // Créer le paiement
  const total = Number(demande.montant_propose) + Number(demande.frais_service ?? 0)

  const { data: paiement, error: paiementErr } = await admin
    .from("paiements")
    .insert({
      module: "billet",
      reference_table: "demandes_billet",
      reference_id: demande.id,
      type: "montant",
      montant: total,
      methode: methode as "cinetpay" | "stripe",
      statut: "en_attente",
    })
    .select("id")
    .single()

  if (paiementErr) return { error: paiementErr.message }

  const description =`Billet ${demande.depart} → ${demande.destination}`
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  let paymentUrl: string
  try {
    if (methode === "stripe") {
      paymentUrl = await creerSessionStripe({
        montantCFA: total,
        description,
        paiementId: paiement.id,
        successUrl: `${baseUrl}/reservation/confirmation?demande=${demande.id}`,
        cancelUrl: `${baseUrl}/reservation/echec?demande=${demande.id}`,
      })
    } else {
      paymentUrl = await creerSessionCinetPay({
        montantCFA: total,
        description,
        paiementId: paiement.id,
        returnUrl: `${baseUrl}/reservation/confirmation?demande=${demande.id}`,
        notifyUrl: `${baseUrl}/api/webhooks/cinetpay`,
      })
    }
  } catch (err) {
    return {
      error: `Erreur d'initialisation du paiement : ${err instanceof Error ? err.message : "erreur inconnue"}`,
    }
  }

  redirect(paymentUrl)
}

export async function affecterConseillerBillet(
  _prev: BilletState,
  formData: FormData
): Promise<BilletState> {
  try {
    await requireStaff();
  } catch {
    return { error: "Session expirée ou accès refusé." };
  }

  const demandeId = formData.get("demande_id") as string;
  const conseillerId = (formData.get("conseiller_id") as string) || null;
  if (!demandeId) return { error: "Demande invalide." };

  const admin = getAdmin();
  const { error } = await admin
    .from("demandes_billet")
    .update({ conseiller_id: conseillerId, updated_at: new Date().toISOString() })
    .eq("id", demandeId);
  if (error) return { error: error.message };

  revalidatePath("/admin/billets");
  return { success: true };
}

// ─── Paramètres (propriétaire seul) ──────────────────────────────────────────

export async function modifierParametresBillet(
  _prev: BilletState,
  formData: FormData
): Promise<BilletState> {
  // frais_service est un montant facturé au client : propriétaire uniquement.
  try {
    await requireProprietaireAvecId();
  } catch {
    return { error: "Seul le propriétaire peut modifier ces paramètres." };
  }

  const nb = (cle: string) => Number(formData.get(cle));
  const frais_service = nb("frais_service");
  const mois_validite_passeport = nb("mois_validite_passeport");
  const max_voyageurs = nb("max_voyageurs");
  const delai_reponse_heures = nb("delai_reponse_heures");
  const validite_devis_heures = nb("validite_devis_heures");

  // 0 est légitime pour les frais comme pour la validité exigée : on teste la
  // finitude et les bornes, jamais la vérité de la valeur.
  if (!Number.isFinite(frais_service) || frais_service < 0) {
    return { error: "Les frais de service doivent être positifs ou nuls." };
  }
  if (!Number.isInteger(mois_validite_passeport) || mois_validite_passeport < 0 || mois_validite_passeport > 24) {
    return { error: "La validité de passeport exigée doit être entre 0 et 24 mois." };
  }
  if (!Number.isInteger(max_voyageurs) || max_voyageurs < 1 || max_voyageurs > 50) {
    return { error: "Le nombre maximum de voyageurs doit être entre 1 et 50." };
  }
  if (!Number.isInteger(delai_reponse_heures) || delai_reponse_heures < 1 || delai_reponse_heures > 720) {
    return { error: "Le délai de réponse doit être entre 1 et 720 heures." };
  }
  if (!Number.isInteger(validite_devis_heures) || validite_devis_heures < 1 || validite_devis_heures > 720) {
    return { error: "La validité du devis doit être entre 1 et 720 heures." };
  }

  const admin = getAdmin();
  const { error } = await admin.from("parametres_billet").upsert({
    id: 1,
    frais_service,
    mois_validite_passeport,
    max_voyageurs,
    delai_reponse_heures,
    validite_devis_heures,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  (revalidateTag as (tag: string) => void)("parametres_billet");
  revalidatePath("/assistance");
  return { success: true };
}

/**
 * Vérification d'une pièce de billet par le staff.
 *
 * `certificat_fievre_jaune_valide` et `mineur_autorisation_verifie` étaient
 * affichés en admin avec un ✓ ou un ✗ et **n'étaient écrits par personne** :
 * ils restaient NULL indéfiniment. L'écran suggérait un contrôle qui n'existait
 * pas — et pour cause, il n'y avait aucun document à contrôler, seulement une
 * case que le client avait cochée.
 */
export async function verifierPieceBillet(
  _prev: BilletState,
  formData: FormData
): Promise<BilletState> {
  try {
    await requireStaff()
  } catch {
    return { error: "Session expirée ou accès refusé." }
  }

  const demandeId = formData.get("demande_id") as string
  const piece = formData.get("piece") as string
  const valide = formData.get("valide") === "1"

  const colonnes: Record<string, string> = {
    fievre_jaune: "certificat_fievre_jaune_valide",
    autorisation_mineur: "mineur_autorisation_verifie",
  }
  const colonne = colonnes[piece]
  if (!demandeId || !colonne) return { error: "Pièce inconnue." }

  const admin = getAdmin()
  const { error } = await admin
    .from("demandes_billet")
    .update({ [colonne]: valide, updated_at: new Date().toISOString() } as never)
    .eq("id", demandeId)

  if (error) return { error: error.message }

  revalidatePath("/admin/billets")
  return { success: true }
}

/** Lien signé vers une pièce de billet. Bucket privé, staff seul. */
export async function lienPieceBillet(
  demandeId: string,
  piece: string
): Promise<{ error?: string; url?: string }> {
  try {
    await requireStaff()
  } catch {
    return { error: "Accès refusé." }
  }

  const admin = getAdmin()
  let chemin: string | null | undefined

  // `passager:<id>` : la pièce vit dans la table fille, pas sur la demande.
  // L'identifiant est recoupé avec la demande, sinon il suffirait d'en forger un
  // pour lire le passeport d'un dossier auquel on n'a pas accès.
  if (piece.startsWith("passager:")) {
    const { data } = await admin
      .from("passagers_billet")
      .select("passeport_fichier")
      .eq("id", piece.slice("passager:".length))
      .eq("demande_id", demandeId)
      .maybeSingle()
    chemin = (data as { passeport_fichier: string | null } | null)?.passeport_fichier
  } else {
    const colonnes: Record<string, string> = {
      fievre_jaune: "certificat_fievre_jaune_url",
      autorisation_mineur: "mineur_autorisation_url",
      passeport: "passeport_fichier",
    }
    const colonne = colonnes[piece]
    if (!colonne) return { error: "Pièce inconnue." }

    const { data } = await admin
      .from("demandes_billet")
      .select(colonne)
      .eq("id", demandeId)
      .single()

    chemin = (data as Record<string, string | null> | null)?.[colonne]
  }

  if (!chemin) return { error: "Aucun document déposé." }

  const { data: signee, error } = await admin.storage
    .from("dossiers-documents")
    .createSignedUrl(chemin, 60)

  if (error || !signee?.signedUrl) return { error: "Lien indisponible." }
  return { url: signee.signedUrl }
}
