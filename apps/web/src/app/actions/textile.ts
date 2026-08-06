"use server";

import { redirect } from "next/navigation";
import { err } from "@/lib/i18n/erreurs";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import {
  validerDemandeTextile,
  isStatutTextile,
  transitionTextileAutorisee,
  STATUT_TEXTILE_LABELS,
  libelleTypePagne,
  type TypePagne,
  type ArticlePagne,
} from "@/lib/textile";
import { notifierClient } from "@/lib/notifications";
import { notifierAdminNouvelleDemandeTextile } from "./notifications-admin";
import { logAudit } from "@/lib/audit";

export type TextileState = { error?: string; success?: boolean };

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

// Chiffrer une demande, c'est écrire un montant facturé : propriétaire seul.
// Cf. __tests__/prix-proprietaire.test.ts et le trigger garde_montant_textile.
async function requireProprietaireAvecId() {
  const { userId, role } = await requireStaff();
  if (role !== "proprietaire") throw new Error("Accès refusé : propriétaire requis");
  return userId;
}

/** Les types de pagne encore au catalogue. */
export async function typesPagneActifs(): Promise<TypePagne[]> {
  const admin = getAdmin();
  const { data } = await admin
    .from("types_pagne")
    .select("cle, marque, gamme, description, ordre")
    .eq("actif", true)
    .order("ordre");

  return (data ?? []).map((t) => ({
    cle: t.cle,
    marque: t.marque,
    gamme: t.gamme,
    description: t.description,
    ordre: t.ordre,
  }));
}

/**
 * Le catalogue, prêt à afficher.
 *
 * Les URLs publiques sont construites ici, une bonne fois : le bucket est
 * public — ce sont des photos de vitrine, pas des pièces d'identité — et les
 * signer à chaque vignette reviendrait à protéger ce qu'on cherche à montrer.
 */
export async function catalogueArticles(): Promise<ArticlePagne[]> {
  const admin = getAdmin();
  const { data } = await admin
    .from("articles_pagne")
    .select("id, type_pagne, reference, nom, description, couleurs, photos, vedette, ordre")
    .eq("disponible", true)
    .order("vedette", { ascending: false })
    .order("ordre")
    .order("created_at", { ascending: false });

  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/catalogue-pagnes/`;

  return (data ?? []).map((a) => ({
    id: a.id,
    typePagne: a.type_pagne,
    reference: a.reference,
    nom: a.nom,
    description: a.description,
    couleurs: a.couleurs,
    photos: (a.photos ?? []).map((chemin: string) => `${base}${chemin}`),
    vedette: a.vedette,
  }));
}

/**
 * Demande de devis pour du pagne.
 *
 * Aucun montant n'est calculé ici, et il n'y en a nulle part à calculer : le
 * marché du pagne n'a pas de prix de référence tenable, chaque revendeur fixe
 * le sien. L'équipe consulte ses fournisseurs, puis chiffre.
 */
export async function creerDemandeTextile(
  _prev: TextileState,
  formData: FormData
): Promise<TextileState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: await err("vousDevezEtreConnectePourDemander2") };

  const { data: profile } = await supabase
    .from("users")
    .select("nom")
    .eq("id", user.sub)
    .single();
  if (!profile) return { error: await err("profilIntrouvable") };

  const saisie = {
    typePagne: ((formData.get("type_pagne") as string) || "").trim(),
    articleId: ((formData.get("article_id") as string) || "").trim() || null,
    motif: ((formData.get("motif") as string) || "").trim(),
    couleurs: ((formData.get("couleurs") as string) || "").trim(),
    quantite: Math.trunc(Number(formData.get("quantite"))),
    unite: ((formData.get("unite") as string) || "pagne").trim(),
    pourRevente: formData.get("pour_revente") === "on",
  };

  // Les types viennent de la base : un type retiré du catalogue ne doit plus
  // être demandable, même par un formulaire resté ouvert dans un onglet.
  const types = await typesPagneActifs();
  const validation = validerDemandeTextile(saisie, types.map((t) => t.cle));
  if ("error" in validation) return { error: validation.error };

  // L'article est vérifié en base, pas cru sur parole : un identifiant reçu du
  // formulaire pourrait désigner un article retiré du catalogue — ou n'importe
  // quoi. On le laisse tomber plutôt que de refuser la demande : le client a
  // décrit son besoin, l'essentiel est là.
  let articleValide: string | null = null;
  if (saisie.articleId) {
    const admin0 = getAdmin();
    const { data: article } = await admin0
      .from("articles_pagne")
      .select("id, type_pagne")
      .eq("id", saisie.articleId)
      .eq("disponible", true)
      .maybeSingle();
    if (article && article.type_pagne === saisie.typePagne) {
      articleValide = article.id;
    }
  }

  const admin = getAdmin();
  const { data: demande, error } = await admin
    .from("demandes_textile")
    .insert({
      client_id: user.sub as string,
      type_pagne: saisie.typePagne,
      article_id: articleValide,
      motif: saisie.motif || null,
      couleurs: saisie.couleurs || null,
      quantite: saisie.quantite,
      unite: saisie.unite,
      pour_revente: saisie.pourRevente,
      message: ((formData.get("message") as string) || "").trim() || null,
      statut: "soumise",
    })
    .select("id")
    .single();

  if (error || !demande) {
    return { error: await err("impossibleDEnregistrerLaDemandeVeuillez") };
  }

  const type = types.find((t) => t.cle === saisie.typePagne);
  await notifierAdminNouvelleDemandeTextile(
    demande.id,
    profile.nom,
    type ? libelleTypePagne(type) : saisie.typePagne,
    `${saisie.quantite} ${saisie.unite}`
  );

  redirect("/textile/confirmation");
}

// ─── Administration ──────────────────────────────────────────────────────────

/** Faire avancer une demande dans son cycle. */
export async function changerStatutTextile(
  _prev: TextileState,
  formData: FormData
): Promise<TextileState> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch {
    return { error: await err("sessionExpireeOuAccesRefuse") };
  }

  const demandeId = ((formData.get("demande_id") as string) || "").trim();
  const statut = ((formData.get("statut") as string) || "").trim();
  if (!demandeId || !isStatutTextile(statut)) return { error: await err("statutInvalide") };

  // « devis_envoye » suppose un montant : il ne s'obtient que par le devis,
  // sinon le client verrait un devis sans prix.
  if (statut === "devis_envoye") {
    return { error: await err("passezParLeFormulaireDeDevis") };
  }

  const admin = getAdmin();
  const { data: demande } = await admin
    .from("demandes_textile")
    .select("id, client_id, statut")
    .eq("id", demandeId)
    .single();

  if (!demande) return { error: await err("demandeIntrouvable") };
  if (!transitionTextileAutorisee(demande.statut, statut)) {
    return {
      error: await err("passageImpossible", {
        de: STATUT_TEXTILE_LABELS[demande.statut as keyof typeof STATUT_TEXTILE_LABELS] ?? demande.statut,
        vers: STATUT_TEXTILE_LABELS[statut],
      }),
    };
  }

  // Le filtre porte sur le statut ATTENDU, pas sur celui qu'on vient de lire :
  // entre la lecture et l'écriture, quelqu'un d'autre a pu trancher.
  const { count } = await admin
    .from("demandes_textile")
    .update({ statut, updated_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", demandeId)
    .eq("statut", demande.statut);

  if (!count) return { error: await err("laDemandeAChangeDEtat") };

  await notifierClient(
    demande.client_id,
    "Mise à jour de votre demande de pagne",
    `Votre demande : ${STATUT_TEXTILE_LABELS[statut]}.`
  );

  await logAudit({
    userId,
    action: "changer_statut_textile",
    tableName: "demandes_textile",
    recordId: demandeId,
    oldValues: { statut: demande.statut },
    newValues: { statut },
  });

  revalidatePath("/admin/textile");
  revalidatePath("/compte/reservations");
  return { success: true };
}

/**
 * Chiffrer une demande. Propriétaire seul.
 *
 * C'est ici que naît le seul montant du service : il n'existe aucun prix
 * catalogue à reprendre, l'équipe consulte ses fournisseurs et arrête un
 * chiffre pour cette demande-là.
 */
export async function proposerDevisTextile(
  _prev: TextileState,
  formData: FormData
): Promise<TextileState> {
  let userId: string;
  try {
    userId = await requireProprietaireAvecId();
  } catch {
    return { error: await err("accesRefuseSeulLeProprietairePeut") };
  }

  const demandeId = ((formData.get("demande_id") as string) || "").trim();
  const montant = Number(formData.get("montant"));
  const validiteJours = Math.trunc(Number(formData.get("validite_jours") || 7));

  if (!demandeId) return { error: await err("demandeInvalide") };
  if (!Number.isFinite(montant) || montant <= 0) {
    return { error: await err("leMontantDoitEtreUnChiffre") };
  }
  if (!Number.isInteger(validiteJours) || validiteJours < 1 || validiteJours > 90) {
    return { error: await err("laValiditeDuDevisVaDe") };
  }

  const admin = getAdmin();
  const { data: demande } = await admin
    .from("demandes_textile")
    .select("id, client_id, statut")
    .eq("id", demandeId)
    .single();

  if (!demande) return { error: await err("demandeIntrouvable") };
  if (!transitionTextileAutorisee(demande.statut, "devis_envoye")) {
    return { error: await err("cetteDemandeNEstPasA") };
  }

  const valable = new Date(Date.now() + validiteJours * 86_400_000);

  const { count } = await admin
    .from("demandes_textile")
    .update(
      {
        montant_propose: montant,
        devis_valable_jusqu_a: valable.toISOString(),
        statut: "devis_envoye",
        updated_at: new Date().toISOString(),
      },
      { count: "exact" }
    )
    .eq("id", demandeId)
    .eq("statut", demande.statut);

  if (!count) return { error: await err("laDemandeAChangeDEtat") };

  await notifierClient(
    demande.client_id,
    "Votre devis pagne est prêt",
    `Montant proposé : ${montant.toLocaleString("fr-FR")} FCFA, valable jusqu'au ${valable.toLocaleDateString("fr-FR")}.`
  );

  await logAudit({
    userId,
    action: "proposer_devis_textile",
    tableName: "demandes_textile",
    recordId: demandeId,
    newValues: { montant, validiteJours },
  });

  revalidatePath("/admin/textile");
  revalidatePath("/compte/reservations");
  return { success: true };
}

// ─── Le catalogue, côté propriétaire ─────────────────────────────────────────
// Sans ces actions, le catalogue serait une vitrine qu'on ne peut pas garnir.

/**
 * Créer un article.
 *
 * Les photos sont déposées AVANT, depuis le navigateur : le bucket est public
 * et les fichiers pèsent lourd — une Server Action plafonne à 10 Mo pour
 * l'ensemble d'une requête, et un article en compte volontiers trois.
 */
export async function creerArticlePagne(
  _prev: TextileState,
  formData: FormData
): Promise<TextileState> {
  let userId: string;
  try {
    userId = await requireProprietaireAvecId();
  } catch {
    return { error: await err("accesRefuseProprietaireRequis") };
  }

  const nom = ((formData.get("nom") as string) || "").trim();
  const typePagne = ((formData.get("type_pagne") as string) || "").trim();
  if (!nom) return { error: await err("donnezUnNomACeModele") };
  if (!typePagne) return { error: await err("choisissezUneGamme") };

  const types = await typesPagneActifs();
  if (!types.some((t) => t.cle === typePagne)) {
    return { error: await err("cetteGammeNExistePas") };
  }

  // Les chemins viennent du navigateur : on n'accepte que ceux du dossier du
  // catalogue, un chemin forgé désignerait un fichier d'un autre bucket.
  const photos = formData
    .getAll("photos")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((c) => c && !c.includes("..") && c.startsWith("articles/"));

  const admin = getAdmin();
  const { data: dernier } = await admin
    .from("articles_pagne")
    .select("ordre")
    .order("ordre", { ascending: false })
    .limit(1);

  const { error } = await admin.from("articles_pagne").insert({
    type_pagne: typePagne,
    nom,
    reference: ((formData.get("reference") as string) || "").trim() || null,
    couleurs: ((formData.get("couleurs") as string) || "").trim() || null,
    description: ((formData.get("description") as string) || "").trim() || null,
    photos,
    vedette: formData.get("vedette") === "on",
    ordre: (dernier?.[0]?.ordre ?? 0) + 1,
  });

  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: "creer_article_pagne",
    tableName: "articles_pagne",
    newValues: { nom, typePagne, photos: photos.length },
  });

  revalidatePath("/admin/textile");
  revalidatePath("/textile");
  return { success: true };
}

/**
 * Retirer ou remettre un article au catalogue.
 *
 * On ne supprime pas : des demandes passées le désignent, et effacer son nom
 * rendrait leur historique illisible.
 */
export async function basculerArticlePagne(
  _prev: TextileState,
  formData: FormData
): Promise<TextileState> {
  let userId: string;
  try {
    userId = await requireProprietaireAvecId();
  } catch {
    return { error: await err("accesRefuseProprietaireRequis") };
  }

  const id = ((formData.get("article_id") as string) || "").trim();
  const disponible = formData.get("disponible") === "1";
  if (!id) return { error: await err("articleInconnu") };

  const admin = getAdmin();
  const { error } = await admin
    .from("articles_pagne")
    .update({ disponible, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: disponible ? "remettre_article_pagne" : "retirer_article_pagne",
    tableName: "articles_pagne",
    recordId: id,
    newValues: { disponible },
  });

  revalidatePath("/admin/textile");
  revalidatePath("/textile");
  return { success: true };
}

/** Le catalogue complet, disponibles et retirés — pour l'écran propriétaire. */
export async function catalogueComplet(): Promise<
  (ArticlePagne & { disponible: boolean })[]
> {
  try {
    await requireStaff();
  } catch {
    return [];
  }

  const admin = getAdmin();
  const { data } = await admin
    .from("articles_pagne")
    .select("id, type_pagne, reference, nom, description, couleurs, photos, vedette, disponible, ordre")
    .order("disponible", { ascending: false })
    .order("ordre");

  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/catalogue-pagnes/`;

  return (data ?? []).map((a) => ({
    id: a.id,
    typePagne: a.type_pagne,
    reference: a.reference,
    nom: a.nom,
    description: a.description,
    couleurs: a.couleurs,
    photos: (a.photos ?? []).map((c: string) => `${base}${c}`),
    vedette: a.vedette,
    disponible: a.disponible,
  }));
}

/** Les gammes, actives et retirées — pour l'écran propriétaire. */
export async function typesPagneComplet(): Promise<(TypePagne & { actif: boolean })[]> {
  try {
    await requireStaff();
  } catch {
    return [];
  }

  const admin = getAdmin();
  const { data } = await admin
    .from("types_pagne")
    .select("cle, marque, gamme, description, ordre, actif")
    .order("ordre");

  return (data ?? []).map((t) => ({
    cle: t.cle,
    marque: t.marque,
    gamme: t.gamme,
    description: t.description,
    ordre: t.ordre,
    actif: t.actif,
  }));
}

/**
 * Ajouter une gamme.
 *
 * 00087 annonçait les types « pilotables, marque libre », et ils l'étaient — en
 * base. Aucun écran ne les touchait : ajouter une marque demandait du SQL. Une
 * pilotabilité qui n'a pas d'écran n'existe pas pour celui qui exploite.
 *
 * Propriétaire seul, comme le catalogue : une gamme engage ce que la maison
 * déclare vendre.
 */
export async function creerTypePagne(
  _prev: TextileState,
  formData: FormData
): Promise<TextileState> {
  let userId: string;
  try {
    userId = await requireProprietaireAvecId();
  } catch {
    return { error: await err("accesRefuseProprietaireRequis") };
  }

  const marque = ((formData.get("marque") as string) || "").trim();
  const gamme = ((formData.get("gamme") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim() || null;

  if (!marque || marque.length > 60) return { error: await err("marqueManquanteOuTropLongue") };
  if (!gamme || gamme.length > 60) return { error: await err("gammeManquanteOuTropLongue") };

  // La clé se dérive du libellé plutôt que de se saisir : elle doit respecter
  // `^[a-z0-9_]+$`, et la faire taper à l'exploitant transformerait une
  // contrainte technique en message d'erreur pour lui.
  const cle = `${marque}_${gamme}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // les accents, invisibles autrement
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);

  if (!cle) return { error: await err("ceLibelleNeDonneAucuneCle") };

  const admin = getAdmin();

  // `ordre` est unique : le calculer évite de demander un numéro à l'exploitant
  // pour ne rien lui dire d'utile.
  const { data: dernier } = await admin
    .from("types_pagne")
    .select("ordre")
    .order("ordre", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await admin
    .from("types_pagne")
    .insert({ cle, marque, gamme, description, ordre: (dernier?.ordre ?? 0) + 1 });

  if (error) {
    return {
      error: error.code === "23505"
        ? "Cette gamme existe déjà."
        : error.message,
    };
  }

  await logAudit({
    userId,
    action: "creer_type_pagne",
    tableName: "types_pagne",
    recordId: cle,
    newValues: { marque, gamme },
  });

  revalidatePath("/admin/textile");
  revalidatePath("/textile");
  return { success: true };
}

/**
 * Retirer ou remettre une gamme.
 *
 * Elle ne se supprime pas : des demandes passées la référencent, et
 * `demandes_textile.type_pagne` est une clé étrangère. `actif` la sort du choix
 * sans effacer l'historique — même raison que `disponible` sur un article.
 */
export async function basculerTypePagne(
  _prev: TextileState,
  formData: FormData
): Promise<TextileState> {
  let userId: string;
  try {
    userId = await requireProprietaireAvecId();
  } catch {
    return { error: await err("accesRefuseProprietaireRequis") };
  }

  const cle = ((formData.get("cle") as string) || "").trim();
  const actif = formData.get("actif") === "1";
  if (!cle) return { error: await err("gammeInconnue") };

  const admin = getAdmin();

  // Retirer la dernière gamme active fermerait le formulaire public : il n'y
  // aurait plus rien à choisir, et la demande deviendrait impossible à envoyer.
  if (!actif) {
    const { count } = await admin
      .from("types_pagne")
      .select("cle", { count: "exact", head: true })
      .eq("actif", true);
    if ((count ?? 0) <= 1) {
      return { error: await err("cEstLaDerniereGammeActive") };
    }
  }

  const { error } = await admin
    .from("types_pagne")
    .update({ actif, updated_at: new Date().toISOString() })
    .eq("cle", cle);

  if (error) return { error: error.message };

  await logAudit({
    userId,
    action: actif ? "remettre_type_pagne" : "retirer_type_pagne",
    tableName: "types_pagne",
    recordId: cle,
    newValues: { actif },
  });

  revalidatePath("/admin/textile");
  revalidatePath("/textile");
  return { success: true };
}
