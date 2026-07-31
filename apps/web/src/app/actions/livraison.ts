"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { creerSessionStripe } from "@/lib/payments/stripe";
import { creerSessionCinetPay } from "@/lib/payments/cinetpay";
import {
  computeLivraisonPrix,
  genererNumeroSuivi,
  deriverZoneLivraison,
  ZONE_LABELS,
  MODE_LABELS,
  STATUT_LIVRAISON,
  STATUT_LIVRAISON_LABELS,
  transitionAutorisee,
  couvreLaCommune,
  isModeLivraison,
  poidsMax,
  type CommuneMatch,
} from "@/lib/livraison";
import { logAudit } from "@/lib/audit";
import { getCommunes, getTarifsLivraison } from "@/lib/public-cache";
import { compressImage } from "@/lib/compress-image";
import { validateImageUpload } from "@/lib/upload-validation";
import { notifierClient } from "@/lib/notifications";
import { notifierAdminNouvelleReservation } from "./notifications-admin";

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
  if (!user) return { error: "Vous devez être connecté pour commander une livraison." };

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

  if (
    !expediteurNom || !expediteurContact ||
    !destinataireNom || !destinataireContact ||
    !detailCollecte || !detailLivraison ||
    !communeCollecte || !communeLivraison
  ) {
    return { error: "Tous les champs expéditeur, destinataire et adresses sont obligatoires." };
  }
  if (!isModeLivraison(mode)) {
    return { error: "Mode de livraison invalide." };
  }
  if (!["cinetpay", "stripe"].includes(methode)) {
    return { error: "Méthode de paiement invalide." };
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
  const { grille, paliers } = await getTarifsLivraison();
  const maxKg = poidsMax(paliers);

  // Le poids détermine le palier tarifaire : il est désormais obligatoire.
  const poidsKg = poidsRaw ? Number(poidsRaw) : null;
  if (poidsKg === null || Number.isNaN(poidsKg) || poidsKg <= 0) {
    return { error: "Indiquez le poids du colis (en kg)." };
  }
  if (poidsKg > maxKg) {
    return {
      error: `Au-delà de ${maxKg} kg, la livraison se fait sur devis. Contactez-nous pour organiser l'envoi.`,
    };
  }
  const valeurDeclaree = valeurRaw ? Number(valeurRaw) : null;
  if (valeurDeclaree !== null && (Number.isNaN(valeurDeclaree) || valeurDeclaree < 0)) {
    return { error: "La valeur déclarée est invalide." };
  }

  // Prix recalculé côté serveur (autoritaire) : grille zone × mode, pondérée
  // par le palier de poids.
  const prix = computeLivraisonPrix(zone, mode, poidsKg, grille, paliers);
  if (prix === null) return { error: "Tarif indisponible pour cette combinaison." };

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
    return { error: "Impossible de créer l'expédition. Veuillez réessayer." };
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
      methode: methode as "cinetpay" | "stripe",
      statut: "en_attente",
    })
    .select("id")
    .single();

  if (paiementErr || !paiement) {
    await admin.from("expeditions").delete().eq("id", expedition.id);
    return { error: "Erreur lors de la création du paiement." };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const description = `Livraison ${MODE_LABELS[mode]} · ${ZONE_LABELS[zone]}`;

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
  } catch (err) {
    return {
      error: `Erreur d'initialisation du paiement : ${err instanceof Error ? err.message : "erreur inconnue"}`,
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
    .select("id, capacite_max_par_jour, zone_couverture")
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
    (l) => (charge.get(l.id) ?? 0) < (l.capacite_max_par_jour ?? Number.POSITIVE_INFINITY)
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
  if (!expeditionId) return { error: "Expédition invalide." };

  const { data: exp } = await admin
    .from("expeditions")
    .select("commune_collecte")
    .eq("id", expeditionId)
    .single();
  if (!exp) return { error: "Expédition introuvable." };

  const livreurId = await choisirLivreurAuto(admin, exp.commune_collecte);
  if (!livreurId) {
    return { error: "Aucun livreur disponible : tous ont atteint leur capacité du jour." };
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
  if (!expeditionId || !livreurId) return { error: "Expédition ou livreur manquant." };

  return assignerEtNotifier(admin, expeditionId, livreurId);
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
    return { error: "Statut invalide." };
  }

  const { data: exp } = await admin
    .from("expeditions")
    .select("client_id, numero_suivi, statut")
    .eq("id", expeditionId)
    .single();
  if (!exp) return { error: "Expédition introuvable." };

  // Le cycle était libre : un colis livré pouvait repasser en « enregistrée »,
  // ou sauter le transit. Chaque changement écrivant une ligne d'historique,
  // la timeline publique — seule chose que le client voit — pouvait afficher
  // une chronologie impossible.
  if (exp.statut === statut) return { success: true };
  if (!transitionAutorisee(exp.statut, statut)) {
    return {
      error: `Passage impossible de « ${
        STATUT_LIVRAISON_LABELS[exp.statut] ?? exp.statut
      } » à « ${STATUT_LIVRAISON_LABELS[statut] ?? statut} ».`,
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

  if (!expeditionId) return { error: "Expédition invalide." };
  if (!Number.isFinite(nouveauPrix) || nouveauPrix <= 0) {
    return { error: "Le prix doit être un montant positif." };
  }
  if (!motif) return { error: "Indiquez le motif de l'ajustement." };

  const { data: exp } = await admin
    .from("expeditions")
    .select("client_id, numero_suivi, prix, statut")
    .eq("id", expeditionId)
    .single();
  if (!exp) return { error: "Expédition introuvable." };

  const ajustable: string[] = [STATUT_LIVRAISON.creee, STATUT_LIVRAISON.priseEnCharge];
  if (!ajustable.includes(exp.statut)) {
    return { error: "Le prix ne peut plus être ajusté une fois le colis en transit." };
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
