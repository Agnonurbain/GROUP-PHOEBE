"use server";

import { redirect } from "next/navigation";
import { err } from "@/lib/i18n/erreurs";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { creerSessionStripe } from "@/lib/payments/stripe";
import { creerSessionCinetPay } from "@/lib/payments/cinetpay";
import {
  computeLivraisonPrixMoyen,
  genererNumeroSuivi,
  deriverZoneLivraison,
  ZONE_LABELS,
  MODE_LABELS,
  STATUT_LIVRAISON,
  STATUT_LIVRAISON_LABELS,
  transitionAutorisee,
  couvreLaCommune,
  isModeLivraison,
  chargeMaxFlotte,
  type CommuneMatch,
} from "@/lib/livraison";
import { logAudit } from "@/lib/audit";
import { getParametresIndemnisation } from "@/lib/legal";
import { calculerIndemnisation } from "@/lib/indemnisation";
import { getCommunes, getTarifsLivraison } from "@/lib/public-cache";
import { compressImage } from "@/lib/compress-image";
import { validateImageUpload } from "@/lib/upload-validation";
import { notifierClient } from "@/lib/notifications";
import {
  notifierAdminNouvelleReservation,
  notifierAdminAnnulationExpedition,
} from "./notifications-admin";

export type LivraisonState = {
  error?: string;
};

export type ExpeditionActionState = {
  error?: string;
  success?: boolean;
};

// Statuts d'expédition sur lesquels un livreur est considéré « occupé ».
const STATUTS_EN_COURS = [
  STATUT_LIVRAISON.creee,
  STATUT_LIVRAISON.priseEnCharge,
  STATUT_LIVRAISON.enTransit,
] as const;

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
  return { user, role: profile.role as string };
}

/** Tout ce qui touche à un montant facturé est réservé au propriétaire. */
async function requireProprietaire() {
  const { user, role } = await requireStaff();
  if (role !== "proprietaire") {
    throw new Error("Accès refusé : seul le propriétaire peut modifier un prix");
  }
  return user;
}

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function creerExpedition(
  _prev: LivraisonState,
  formData: FormData
): Promise<LivraisonState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: await err("vousDevezEtreConnectePourCommander") };

  const expediteurNom = (formData.get("expediteur_nom") as string)?.trim();
  const expediteurContact = (formData.get("expediteur_contact") as string)?.trim();
  const destinataireNom = (formData.get("destinataire_nom") as string)?.trim();
  const destinataireContact = (formData.get("destinataire_contact") as string)?.trim();
  const detailCollecte = (formData.get("adresse_collecte") as string)?.trim();
  const detailLivraison = (formData.get("adresse_livraison") as string)?.trim();
  const communeCollecte = ((formData.get("commune_collecte") as string) || "").trim();
  const communeLivraison = ((formData.get("commune_livraison") as string) || "").trim();
  const mode = formData.get("mode") as string;
  const natureColis = ((formData.get("nature_colis") as string) || "").trim() || null;
  const dimensions = ((formData.get("dimensions") as string) || "").trim() || null;
  const poidsRaw = formData.get("poids_kg") as string;
  const valeurRaw = formData.get("valeur_declaree") as string;
  const methode = formData.get("methode_paiement") as string;
  const dateSouhaitee = ((formData.get("date_souhaitee") as string) || "").trim();

  if (
    !expediteurNom || !expediteurContact ||
    !destinataireNom || !destinataireContact ||
    !detailCollecte || !detailLivraison ||
    !communeCollecte || !communeLivraison
  ) {
    return { error: await err("tousLesChampsExpediteurDestinataireEt") };
  }
  if (!isModeLivraison(mode)) {
    return { error: await err("modeDeLivraisonInvalide") };
  }

  // Le mode « programmée » n'a de sens qu'avec une date, et une date n'en a pas
  // sur les autres modes — elle y laisserait croire à un engagement de créneau.
  if (mode === "programmee") {
    if (!dateSouhaitee) return { error: await err("indiquezLaDateDeLivraisonSouhaitee") };
    const demain = new Date();
    demain.setHours(0, 0, 0, 0);
    demain.setDate(demain.getDate() + 1);
    if (Number.isNaN(Date.parse(dateSouhaitee)) || new Date(dateSouhaitee) < demain) {
      return { error: await err("laDateProgrammeeDoitEtreAu") };
    }
  }
  if (!["cinetpay", "stripe", "a_la_livraison"].includes(methode)) {
    return { error: await err("methodeDePaiementInvalide") };
  }

  // Zone déduite (autoritaire) des communes saisies : même source de matching
  // que le client (communes en cache) → montant affiché == montant facturé.
  const communes = await getCommunes();
  const matchCommune = (t: string): CommuneMatch => {
    const q = t.trim().toLowerCase();
    if (!q) return null;
    const c = communes.find((cc) => cc.nom.toLowerCase() === q);
    return c ? { id: c.id, zoneId: c.zone_id ?? null } : null;
  };
  const zone = deriverZoneLivraison(matchCommune(communeCollecte), matchCommune(communeLivraison));

  // Adresses complètes = détail + commune.
  const adresseCollecte = `${detailCollecte} — ${communeCollecte}`;
  const adresseLivraison = `${detailLivraison} — ${communeLivraison}`;

  // Grille et paliers pilotés depuis /admin/tarifs : même source que l'affichage
  // client, donc montant affiché == montant facturé.
  const { moyens, grilleMoyens, coefficientsMode } = await getTarifsLivraison();
  const maxKg = chargeMaxFlotte(moyens);

  // Le poids détermine le palier tarifaire : il est désormais obligatoire.
  const poidsKg = poidsRaw ? Number(poidsRaw) : null;
  if (poidsKg === null || Number.isNaN(poidsKg) || poidsKg <= 0) {
    return { error: await err("indiquezLePoidsDuColisEn") };
  }
  if (poidsKg > maxKg) {
    return {
      error: await err("auDelaDevisLivraison", { max: maxKg }),
    };
  }
  const valeurDeclaree = valeurRaw ? Number(valeurRaw) : null;
  if (valeurDeclaree !== null && (Number.isNaN(valeurDeclaree) || valeurDeclaree < 0)) {
    return { error: await err("laValeurDeclareeEstInvalide") };
  }

  // Le moyen — le véhicule — a remplacé le poids dans le prix (00084). Le poids
  // reste exigé : le livreur doit le connaître, et il écarte les moyens trop
  // justes pour le colis.
  const moyenCle = ((formData.get("moyen") as string) || "").trim();
  if (!moyenCle) return { error: await err("choisissezUnMoyenDeLivraison") };

  const moyen = moyens.find((m) => m.cle === moyenCle);
  if (!moyen) return { error: await err("ceMoyenDeLivraisonNEst") };

  // Le navigateur filtre déjà la liste, mais rien n'oblige un formulaire à
  // passer par le navigateur : sans ce contrôle, on accepterait une moto pour
  // 40 kg et le livreur découvrirait le colis sur place.
  if (poidsKg > moyen.chargeMaxKg) {
    return {
      error: await err("moyenInadapte", { moyen: moyen.label, max: moyen.chargeMaxKg, poids: poidsKg }),
    };
  }

  // Prix recalculé côté serveur, autoritaire : tarif(zone × moyen) × coefficient(mode).
  const prix = computeLivraisonPrixMoyen(zone, moyen.cle, mode, grilleMoyens, coefficientsMode);
  if (prix === null) return { error: await err("tarifIndisponiblePourCetteCombinaison") };

  const admin = getAdmin();
  const numeroSuivi = genererNumeroSuivi();

  const { data: expedition, error: expErr } = await admin
    .from("expeditions")
    .insert({
      client_id: user.sub,
      expediteur_nom: expediteurNom,
      expediteur_contact: expediteurContact,
      destinataire_nom: destinataireNom,
      destinataire_contact: destinataireContact,
      adresse_collecte: adresseCollecte,
      adresse_livraison: adresseLivraison,
      zone,
      // La commune était fondue dans l'adresse (« détail — Commune ») : plus
      // rien ne permettait de rattacher un colis à une commune sans reparser du
      // texte libre. L'affectation automatique en dépend.
      commune_collecte: communeCollecte,
      commune_livraison: communeLivraison,
      mode,
      moyen: moyen.cle,
      date_souhaitee: mode === "programmee" ? dateSouhaitee : null,
      nature_colis: natureColis,
      dimensions,
      poids_kg: poidsKg,
      valeur_declaree: valeurDeclaree,
      prix,
      numero_suivi: numeroSuivi,
      // statut par défaut "creee" ; l'état de paiement est porté par la table
      // paiements (en_attente → capture).
    })
    .select("id")
    .single();

  if (expErr || !expedition) {
    return { error: await err("impossibleDeCreerLExpeditionVeuillez") };
  }

  // Photos du colis (optionnelles) : upload en service-role vers le bucket
  // public colis-photos. Une photo invalide est ignorée sans bloquer la commande.
  const files = formData.getAll("photos") as File[];
  const photoUrls: string[] = [];
  for (const file of files) {
    if (!file || typeof file === "string" || !file.size) continue;
    let ext: string;
    try {
      ({ ext } = validateImageUpload(file));
    } catch {
      continue;
    }
    const compressed = await compressImage(file);
    const path = `${expedition.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await admin.storage
      .from("colis-photos")
      .upload(path, await compressed.arrayBuffer(), { contentType: compressed.type });
    if (upErr) continue;
    const { data: { publicUrl } } = admin.storage.from("colis-photos").getPublicUrl(path);
    photoUrls.push(publicUrl);
  }
  if (photoUrls.length > 0) {
    await admin.from("expeditions").update({ photos: photoUrls } as never).eq("id", expedition.id);
  }

  const { data: paiement, error: paiementErr } = await admin
    .from("paiements")
    .insert({
      module: "livraison",
      reference_table: "expeditions",
      reference_id: expedition.id,
      type: "montant",
      montant: prix,
      methode: methode as "cinetpay" | "stripe" | "a_la_livraison",
      statut: "en_attente",
    })
    .select("id")
    .single();

  if (paiementErr || !paiement) {
    await admin.from("expeditions").delete().eq("id", expedition.id);
    return { error: await err("erreurLorsDeLaCreationDu") };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const description = `Livraison ${MODE_LABELS[mode]} · ${ZONE_LABELS[zone]}`;

  // Paiement à la livraison : le colis part sans encaissement, le paiement
  // reste `en_attente` jusqu'à ce que le livreur encaisse à la remise. On ne
  // passe donc par aucun prestataire, et le client va directement à la
  // confirmation — c'est la commande qui est acquise, pas l'argent.
  if (methode === "a_la_livraison") {
    await notifierAdminNouvelleReservation(expedition.id, expediteurNom, 1, prix);
    redirect(`/livraison/confirmation?exp=${expedition.id}`);
  }

  let paymentUrl: string;
  try {
    if (methode === "stripe") {
      paymentUrl = await creerSessionStripe({
        montantCFA: prix,
        description,
        paiementId: paiement.id,
        successUrl: `${baseUrl}/livraison/confirmation?exp=${expedition.id}`,
        cancelUrl: `${baseUrl}/livraison?echec=1`,
      });
    } else {
      paymentUrl = await creerSessionCinetPay({
        montantCFA: prix,
        description,
        paiementId: paiement.id,
        returnUrl: `${baseUrl}/livraison/confirmation?exp=${expedition.id}`,
        notifyUrl: `${baseUrl}/api/webhooks/cinetpay`,
      });
    }
  } catch (erreurAttrapee) {
    return {
      error: await err("erreurInitialisationPaiement", {
          detail: erreurAttrapee instanceof Error ? erreurAttrapee.message : "",
        }),
    };
  }

  await notifierAdminNouvelleReservation(expedition.id, expediteurNom, 1, prix);

  redirect(paymentUrl);
}

// ─── Admin : affectation livreur & cycle de statut ───────────────────────────

type AdminClient = ReturnType<typeof createAdminClient<Database>>;

// Choisit automatiquement un livreur actif : préfère ceux qui desservent la
// commune de collecte (ou qui n'ont pas de zone déclarée, donc couvrent tout),
// et prend le moins chargé sous sa capacité.
//
// Le paramètre était la `zone` de l'expédition — `intracommunale`,
// `intercommunale`, `nationale` — comparée par égalité à `zone_couverture`.
// C'est une classe de trajet, pas un territoire : personne ne couvre
// « l'intercommunal ». Le filtre ne pouvait donc jamais correspondre.
async function choisirLivreurAuto(
  admin: AdminClient,
  communeCollecte: string | null
): Promise<string | null> {
  const { data: livreurs } = await admin
    .from("livreurs")
    .select("id, charge_max_simultanee, zone_couverture")
    .eq("actif", true);
  if (!livreurs || livreurs.length === 0) return null;

  const { data: enCours } = await admin
    .from("expeditions")
    .select("livreur_id")
    .in("statut", [...STATUTS_EN_COURS])
    .not("livreur_id", "is", null);

  const charge = new Map<string, number>();
  for (const e of enCours ?? []) {
    if (e.livreur_id) charge.set(e.livreur_id, (charge.get(e.livreur_id) ?? 0) + 1);
  }

  // Un livreur sans zone dessert tout : c'est le défaut, et le seul qui
  // garantisse qu'un colis trouve preneur tant que personne n'a paramétré les
  // couvertures. Si aucun ne couvre la commune, on retombe sur l'ensemble
  // plutôt que de laisser le colis sans livreur.
  const preferes = livreurs.filter((l) => couvreLaCommune(l.zone_couverture, communeCollecte));
  const pool = preferes.length > 0 ? preferes : livreurs;
  const disponibles = pool.filter(
    (l) => (charge.get(l.id) ?? 0) < (l.charge_max_simultanee ?? Number.POSITIVE_INFINITY)
  );
  if (disponibles.length === 0) return null;

  disponibles.sort((a, b) => (charge.get(a.id) ?? 0) - (charge.get(b.id) ?? 0));
  return disponibles[0].id;
}

async function assignerEtNotifier(
  admin: AdminClient,
  expeditionId: string,
  livreurId: string
): Promise<ExpeditionActionState> {
  const { data: exp } = await admin
    .from("expeditions")
    .select("client_id, numero_suivi")
    .eq("id", expeditionId)
    .single();

  const { error } = await admin
    .from("expeditions")
    .update({ livreur_id: livreurId, updated_at: new Date().toISOString() })
    .eq("id", expeditionId);
  if (error) return { error: error.message };

  if (exp) {
    await notifierClient(
      exp.client_id,
      "Livreur affecté",
      `Un livreur a été affecté à votre colis ${exp.numero_suivi}.`
    );
  }
  revalidatePath("/admin/expeditions");
  return { success: true };
}

export async function affecterLivreurAuto(
  _prev: ExpeditionActionState,
  formData: FormData
): Promise<ExpeditionActionState> {
  await requireStaff();
  const admin = getAdmin();
  const expeditionId = formData.get("expedition_id") as string;
  if (!expeditionId) return { error: await err("expeditionInvalide") };

  const { data: exp } = await admin
    .from("expeditions")
    .select("commune_collecte")
    .eq("id", expeditionId)
    .single();
  if (!exp) return { error: await err("expeditionIntrouvable") };

  const livreurId = await choisirLivreurAuto(admin, exp.commune_collecte);
  if (!livreurId) {
    return { error: await err("aucunLivreurDisponibleTousOntAtteint") };
  }

  return assignerEtNotifier(admin, expeditionId, livreurId);
}

export async function affecterLivreurManuel(
  _prev: ExpeditionActionState,
  formData: FormData
): Promise<ExpeditionActionState> {
  await requireStaff();
  const admin = getAdmin();
  const expeditionId = formData.get("expedition_id") as string;
  const livreurId = formData.get("livreur_id") as string;
  if (!expeditionId || !livreurId) return { error: await err("expeditionOuLivreurManquant") };

  return assignerEtNotifier(admin, expeditionId, livreurId);
}

/**
 * Retire le livreur d'une expédition.
 *
 * On pouvait réaffecter, jamais désaffecter : un colis confié à quelqu'un
 * d'indisponible restait sur son écran, et l'opérateur devait choisir un autre
 * livreur pour l'en sortir — même quand personne n'était disponible. Le colis
 * retourne dans la file des non affectées, là où il est visible.
 */
export async function desaffecterLivreur(
  _prev: ExpeditionActionState,
  formData: FormData
): Promise<ExpeditionActionState> {
  const { user } = await requireStaff();
  const admin = getAdmin();

  const expeditionId = formData.get("expedition_id") as string;
  if (!expeditionId) return { error: await err("expeditionInvalide") };

  const { data: exp } = await admin
    .from("expeditions")
    .select("livreur_id, statut")
    .eq("id", expeditionId)
    .single();
  if (!exp) return { error: await err("expeditionIntrouvable") };
  if (!exp.livreur_id) return { success: true };

  // Un colis remis n'est plus à personne : lui retirer son livreur effacerait
  // qui l'a livré, alors que la preuve de remise y renvoie.
  if (exp.statut === STATUT_LIVRAISON.livree) {
    return { error: await err("unColisDejaLivreNePeut") };
  }

  const { error } = await admin
    .from("expeditions")
    .update({ livreur_id: null, updated_at: new Date().toISOString() })
    .eq("id", expeditionId);
  if (error) return { error: error.message };

  await logAudit({
    userId: user.sub as string,
    action: "desaffecter_livreur",
    tableName: "expeditions",
    recordId: expeditionId,
    oldValues: { livreur_id: exp.livreur_id },
    newValues: { livreur_id: null },
  });

  revalidatePath("/admin/expeditions");
  revalidatePath("/terrain/livreur");
  return { success: true };
}

export async function changerStatutExpedition(
  _prev: ExpeditionActionState,
  formData: FormData
): Promise<ExpeditionActionState> {
  await requireStaff();
  const admin = getAdmin();
  const expeditionId = formData.get("expedition_id") as string;
  const statut = formData.get("statut") as string;

  const valides = Object.values(STATUT_LIVRAISON) as string[];
  if (!expeditionId || !valides.includes(statut)) {
    return { error: await err("statutInvalide") };
  }

  const { data: exp } = await admin
    .from("expeditions")
    .select("client_id, numero_suivi, statut")
    .eq("id", expeditionId)
    .single();
  if (!exp) return { error: await err("expeditionIntrouvable") };

  // Le cycle était libre : un colis livré pouvait repasser en « enregistrée »,
  // ou sauter le transit. Chaque changement écrivant une ligne d'historique,
  // la timeline publique — seule chose que le client voit — pouvait afficher
  // une chronologie impossible.
  if (exp.statut === statut) return { success: true };
  if (!transitionAutorisee(exp.statut, statut)) {
    return {
      error: await err("passageImpossible", {
        de: STATUT_LIVRAISON_LABELS[exp.statut] ?? exp.statut,
        vers: STATUT_LIVRAISON_LABELS[statut] ?? statut,
      }),
    };
  }

  const { error } = await admin
    .from("expeditions")
    .update({ statut, updated_at: new Date().toISOString() })
    .eq("id", expeditionId);
  if (error) return { error: error.message };

  if (exp) {
    await notifierClient(
      exp.client_id,
      "Mise à jour de votre livraison",
      `Votre colis ${exp.numero_suivi} : ${STATUT_LIVRAISON_LABELS[statut] ?? statut}.`
    );
  }
  revalidatePath("/admin/expeditions");
  return { success: true };
}

/**
 * Ajuste le prix d'une expédition (staff).
 *
 * La zone est déduite de la commune déclarée par le client : si l'adresse réelle
 * ne correspond pas (commune sous-déclarée pour payer moins), l'équipe doit
 * pouvoir rétablir le juste prix. Autorisé tant que le colis n'est pas parti
 * (`creee` ou `prise_en_charge`) — au-delà, la course est engagée.
 *
 * Le paiement déjà encaissé n'est PAS modifié : l'écart se règle hors ligne.
 * Chaque ajustement est tracé dans le journal d'audit et notifié au client.
 */
export async function ajusterPrixExpedition(
  _prev: ExpeditionActionState,
  formData: FormData
): Promise<ExpeditionActionState> {
  const user = await requireProprietaire();
  const admin = getAdmin();

  const expeditionId = formData.get("expedition_id") as string;
  const nouveauPrix = Number(formData.get("prix") as string);
  const motif = ((formData.get("motif") as string) || "").trim();

  if (!expeditionId) return { error: await err("expeditionInvalide") };
  if (!Number.isFinite(nouveauPrix) || nouveauPrix <= 0) {
    return { error: await err("lePrixDoitEtreUnMontant") };
  }
  if (!motif) return { error: await err("indiquezLeMotifDeLAjustement") };

  const { data: exp } = await admin
    .from("expeditions")
    .select("client_id, numero_suivi, prix, statut")
    .eq("id", expeditionId)
    .single();
  if (!exp) return { error: await err("expeditionIntrouvable") };

  const ajustable: string[] = [STATUT_LIVRAISON.creee, STATUT_LIVRAISON.priseEnCharge];
  if (!ajustable.includes(exp.statut)) {
    return { error: await err("lePrixNePeutPlusEtre") };
  }

  const ancienPrix = Number(exp.prix);
  if (ancienPrix === nouveauPrix) return { success: true };

  const { error } = await admin
    .from("expeditions")
    .update({ prix: nouveauPrix, updated_at: new Date().toISOString() })
    .eq("id", expeditionId);
  if (error) return { error: error.message };

  await logAudit({
    userId: user.sub as string,
    action: "ajustement_prix_expedition",
    tableName: "expeditions",
    recordId: expeditionId,
    oldValues: { prix: ancienPrix },
    newValues: { prix: nouveauPrix, motif },
  });

  const sens = nouveauPrix > ancienPrix ? "revu à la hausse" : "revu à la baisse";
  await notifierClient(
    exp.client_id,
    "Prix de votre livraison ajusté",
    `Le tarif du colis ${exp.numero_suivi} a été ${sens} : ${nouveauPrix.toLocaleString("fr-FR")} FCFA (${motif}). Notre équipe vous recontacte pour la régularisation.`
  );

  revalidatePath("/admin/expeditions");
  return { success: true };
}

/**
 * Clôture définitive d'une expédition en échec.
 *
 * `echec_livraison` n'était pas terminal — une seconde présentation est le
 * déroulé normal. Mais quand l'envoi est abandonné pour de bon, rien
 * n'instruisait la suite : le client avait payé un service non rendu et aucun
 * chemin ne menait au remboursement. Les expéditions étaient absentes de
 * `remboursements.ts`.
 *
 * Le paiement suit ce qui s'est réellement passé :
 *  - encaissé        → `remboursement_requis`, la file d'attente existante prend le relais ;
 *  - jamais encaissé → `echoue`, il n'y a rien à rendre (cas nominal du paiement
 *                      à la livraison sur un colis jamais remis).
 */
export async function cloturerEchecLivraison(
  _prev: ExpeditionActionState,
  formData: FormData
): Promise<ExpeditionActionState> {
  const { user } = await requireStaff();
  const admin = getAdmin();

  const expeditionId = formData.get("expedition_id") as string;
  const motif = ((formData.get("motif") as string) || "").trim();
  if (!expeditionId) return { error: await err("expeditionInvalide") };
  if (!motif) return { error: await err("indiquezLeMotifDeLaCloture") };

  const { data: exp } = await admin
    .from("expeditions")
    .select("statut, client_id, numero_suivi, valeur_declaree, indemnisation_montant")
    .eq("id", expeditionId)
    .single();
  if (!exp) return { error: await err("expeditionIntrouvable") };

  if (exp.statut !== STATUT_LIVRAISON.echecLivraison) {
    return { error: await err("seuleUneExpeditionEnEchecPeut") };
  }

  const { data: paiement } = await admin
    .from("paiements")
    .select("id, statut, montant")
    .eq("reference_table", "expeditions")
    .eq("reference_id", expeditionId)
    .maybeSingle();

  let messageClient = `Votre envoi ${exp.numero_suivi} est clôturé : ${motif}.`;
  let sortPaiement: string | null = null;

  // Indemnisation calculée avec le barème en vigueur AUJOURD'HUI, puis figée sur
  // l'expédition : faire évoluer les paramètres plus tard ne doit pas réécrire
  // ce qui a été promis à ce client. C'est la même raison qui fait figer le taux
  // de TVA sur une facture.
  const indemnisation =
    exp.indemnisation_montant != null
      ? Number(exp.indemnisation_montant)
      : calculerIndemnisation(exp.valeur_declaree, await getParametresIndemnisation());

  if (indemnisation > 0 && exp.indemnisation_montant == null) {
    await admin
      .from("expeditions")
      .update({ indemnisation_montant: indemnisation } as never)
      .eq("id", expeditionId);

    messageClient +=
      ` Une indemnisation de ${indemnisation.toLocaleString("fr-FR")} FCFA vous est due` +
      ` au titre de la valeur déclarée ; notre équipe vous recontacte.`;
  }

  if (paiement) {
    // Le filtre porte sur le statut ATTENDU, jamais sur celui qu'on vient de
    // lire. Conditionner à l'observé rendait l'opération destructrice au second
    // passage : la clôture ne change pas le statut de l'expédition, donc elle
    // est rejouable — et un paiement déjà passé en `remboursement_requis`,
    // n'étant plus en `capture`, aurait été basculé en `echoue`. Le
    // remboursement disparaissait de la file, sans bruit.
    if (paiement.statut === "capture") {
      const { error: errPaiement } = await admin
        .from("paiements")
        .update({ statut: "remboursement_requis" })
        .eq("id", paiement.id)
        .eq("statut", "capture");
      if (errPaiement) return { error: errPaiement.message };

      sortPaiement = "remboursement_requis";
      messageClient +=
        ` Le remboursement de ${Number(paiement.montant).toLocaleString("fr-FR")} FCFA est engagé,` +
        ` notre équipe vous recontacte.`;
    } else if (paiement.statut === "en_attente") {
      const { error: errPaiement } = await admin
        .from("paiements")
        .update({ statut: "echoue" })
        .eq("id", paiement.id)
        .eq("statut", "en_attente");
      if (errPaiement) return { error: errPaiement.message };

      sortPaiement = "echoue";
    } else {
      // Remboursé, remboursement déjà requis, ou déjà clos : le sort du
      // paiement est arrêté, le redire l'abîmerait.
      return { error: await err("lePaiementDeCetEnvoiEst") };
    }
  }

  await logAudit({
    userId: user.sub as string,
    action: "cloturer_echec_livraison",
    tableName: "expeditions",
    recordId: expeditionId,
    oldValues: { statut: exp.statut, paiement: paiement?.statut ?? null },
    newValues: { motif, paiement: sortPaiement, indemnisation },
  });

  await notifierClient(exp.client_id, "Envoi clôturé", messageClient);

  revalidatePath("/admin/expeditions");
  revalidatePath("/admin/remboursements");
  return { success: true };
}

/**
 * Annulation d'une livraison par le client.
 *
 * Elle n'existait pas : `annulerParClient` est propre au transport, et le bouton
 * de « Mes réservations » est conditionné à cette verticale. Un colis commandé
 * par erreur ne se réglait qu'au téléphone.
 *
 * Bornée à `creee` : une fois le colis pris en charge, le livreur s'est déplacé
 * et la course est engagée — annuler à ce stade est une décision d'équipe, pas
 * un geste de client.
 */
export async function annulerExpeditionParClient(
  expeditionId: string
): Promise<ExpeditionActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: await err("nonAuthentifie") };

  const admin = getAdmin();
  const { data: exp } = await admin
    .from("expeditions")
    .select("client_id, statut, numero_suivi")
    .eq("id", expeditionId)
    .single();

  if (!exp) return { error: await err("expeditionIntrouvable") };
  if (exp.client_id !== user.sub) return { error: await err("cetEnvoiNEstPasLe") };

  if (exp.statut !== STATUT_LIVRAISON.creee) {
    return {
      error: await err("leColisEstDejaPrisEn"),
    };
  }

  // La transition d'abord, le paiement ensuite. L'inverse touchait l'argent
  // avant d'avoir acquis le droit d'annuler : deux requêtes concurrentes, ou un
  // colis déjà pris en charge entre-temps, laissaient un paiement modifié sur
  // une expédition qui n'a pas bougé.
  //
  // Statut dédié, et le livreur est retiré : sans cela le colis restait sur son
  // écran (echec_livraison compte parmi les statuts actifs) et il pouvait le
  // reprendre puis le livrer, alors que le paiement est déjà marqué remboursable.
  const { error, count } = await admin
    .from("expeditions")
    .update(
      {
        statut: STATUT_LIVRAISON.annulee,
        livreur_id: null,
        updated_at: new Date().toISOString(),
      },
      { count: "exact" }
    )
    .eq("id", expeditionId)
    .eq("statut", STATUT_LIVRAISON.creee);

  if (error) return { error: error.message };
  if (!count) return { error: await err("leColisAChangeDEtat") };

  const { data: paiement } = await admin
    .from("paiements")
    .select("id, statut")
    .eq("reference_table", "expeditions")
    .eq("reference_id", expeditionId)
    .maybeSingle();

  // Comme à la clôture d'un échec : le filtre porte sur le statut attendu, écrit
  // en clair. Un paiement déjà instruit n'est pas retouché.
  const aRembourser = paiement?.statut === "capture";
  if (paiement?.statut === "capture") {
    await admin
      .from("paiements")
      .update({ statut: "remboursement_requis" })
      .eq("id", paiement.id)
      .eq("statut", "capture");
  } else if (paiement?.statut === "en_attente") {
    await admin
      .from("paiements")
      .update({ statut: "echoue" })
      .eq("id", paiement.id)
      .eq("statut", "en_attente");
  }

  await logAudit({
    userId: user.sub as string,
    action: "annuler_expedition_client",
    tableName: "expeditions",
    recordId: expeditionId,
    oldValues: { statut: exp.statut },
    newValues: { statut: STATUT_LIVRAISON.annulee },
  });

  await notifierAdminAnnulationExpedition(exp.numero_suivi, aRembourser);

  revalidatePath("/compte/reservations");
  revalidatePath("/admin/expeditions");
  return { success: true };
}
