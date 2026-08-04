// Créneaux de rendez-vous pour le dépôt d'un dossier d'assistance.
//
// Module pur : la règle mêle jours d'ouverture, durée de créneau, fermetures
// exceptionnelles et délai de prévenance. Chacun de ces éléments est simple, la
// combinaison ne l'est pas — d'où le choix de la rendre testable sans base.
//
// FUSEAU — comme `heures-ouvrees`, les calculs utilisent l'heure UTC : Abidjan
// est à UTC+0 toute l'année, sans heure d'été. Exact ici, et seulement ici.

import { estOuvre, horairesUtilisables, type HorairesOuvres } from "@/lib/heures-ouvrees";

export type ParametresRendezVous = {
  /** Durée d'un créneau, en minutes. */
  duree_minutes: number;
  /** Combien de clients l'équipe peut recevoir en même temps. */
  capacite_par_creneau: number;
  /** Délai de prévenance : on ne réserve pas pour dans dix minutes. */
  delai_min_heures: number;
  /** Jusqu'où l'agenda est ouvert à la réservation. */
  horizon_jours: number;
};

export const PARAMETRES_RENDEZ_VOUS_DEFAUT: ParametresRendezVous = {
  duree_minutes: 30,
  capacite_par_creneau: 1,
  delai_min_heures: 24,
  horizon_jours: 60,
};

export type Creneau = {
  /** Début du créneau, en ISO. */
  debut: string;
  /** Fin du créneau, en ISO. */
  fin: string;
  /** Places restantes. Zéro = affiché mais non réservable. */
  restant: number;
};

/** « 2026-08-12 » à partir d'une date, en UTC. */
export function jourIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function minutesDeLHeure(heure: string): number {
  const [h, m] = heure.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Les créneaux d'une journée donnée.
 *
 * Renvoie une liste vide si le jour est fermé — jour non ouvré, fermeture
 * exceptionnelle, ou journée entièrement passée sous le délai de prévenance.
 * Une liste vide se dit « aucun créneau ce jour-là », jamais « erreur ».
 */
export function creneauxDuJour(
  jour: string,
  horaires: HorairesOuvres,
  params: ParametresRendezVous,
  options: {
    /** Maintenant. Injectable pour que les tests ne dépendent pas de l'heure. */
    maintenant?: Date;
    /** Dates fermées, au format « AAAA-MM-JJ ». */
    fermetures?: string[];
    /** Places déjà prises, par début de créneau ISO. */
    reserves?: Record<string, number>;
  } = {}
): Creneau[] {
  const { maintenant = new Date(), fermetures = [], reserves = {} } = options;

  if (fermetures.includes(jour)) return [];
  if (!horairesUtilisables(horaires)) return [];
  if (params.duree_minutes <= 0) return [];

  const debutJournee = new Date(`${jour}T00:00:00.000Z`);
  if (Number.isNaN(debutJournee.getTime())) return [];

  // Le jour est-il ouvré ? On interroge l'heure d'ouverture plutôt que minuit,
  // qui n'est jamais dans la plage.
  const sonde = new Date(debutJournee);
  const ouverture = minutesDeLHeure(horaires.ouverture);
  sonde.setUTCHours(Math.floor(ouverture / 60), ouverture % 60, 0, 0);
  if (!estOuvre(sonde, horaires)) return [];

  const fermeture = minutesDeLHeure(horaires.fermeture);
  const plancher = new Date(maintenant.getTime() + params.delai_min_heures * 3_600_000);

  const out: Creneau[] = [];
  // Le dernier créneau doit tenir ENTIER avant la fermeture : en proposer un
  // qui déborde ferait attendre un client devant une porte close.
  for (let m = ouverture; m + params.duree_minutes <= fermeture; m += params.duree_minutes) {
    const debut = new Date(debutJournee);
    debut.setUTCHours(Math.floor(m / 60), m % 60, 0, 0);
    if (debut < plancher) continue;

    const fin = new Date(debut.getTime() + params.duree_minutes * 60_000);
    const iso = debut.toISOString();
    const pris = reserves[iso] ?? 0;
    out.push({
      debut: iso,
      fin: fin.toISOString(),
      restant: Math.max(0, params.capacite_par_creneau - pris),
    });
  }
  return out;
}

/**
 * Les jours proposables à la réservation, du plus proche au plus lointain.
 *
 * On ne renvoie que les jours qui ont AU MOINS un créneau libre : afficher un
 * jour ouvrable entièrement complet n'apprend rien au client et l'oblige à
 * cliquer pour découvrir qu'il n'y a rien.
 */
export function joursDisponibles(
  horaires: HorairesOuvres,
  params: ParametresRendezVous,
  options: {
    maintenant?: Date;
    fermetures?: string[];
    reserves?: Record<string, number>;
  } = {}
): string[] {
  const { maintenant = new Date() } = options;
  const jours: string[] = [];

  // Borne de sûreté : un horizon démesuré ne doit pas faire tourner la boucle
  // sans fin. 400 jours couvrent plus d'un an.
  const limite = Math.min(Math.max(params.horizon_jours, 0), 400);
  for (let i = 0; i <= limite; i++) {
    const d = new Date(maintenant.getTime() + i * 86_400_000);
    const jour = jourIso(d);
    const creneaux = creneauxDuJour(jour, horaires, params, options);
    if (creneaux.some((c) => c.restant > 0)) jours.push(jour);
  }
  return jours;
}

/**
 * Un créneau proposé est-il encore valide au moment de réserver ?
 *
 * Entre l'affichage et le clic, la journée avance et d'autres clients
 * réservent. Vérifier côté serveur est ce qui empêche une réservation à une
 * heure qui n'existe plus — la contrainte d'exclusion en base est le dernier
 * rempart, pas le premier.
 */
export function creneauReservable(
  debutIso: string,
  horaires: HorairesOuvres,
  params: ParametresRendezVous,
  options: {
    maintenant?: Date;
    fermetures?: string[];
    reserves?: Record<string, number>;
  } = {}
): { ok: true } | { error: string } {
  const debut = new Date(debutIso);
  if (Number.isNaN(debut.getTime())) return { error: "Créneau invalide." };

  const creneaux = creneauxDuJour(jourIso(debut), horaires, params, options);
  const trouve = creneaux.find((c) => c.debut === debut.toISOString());

  if (!trouve) {
    return { error: "Ce créneau n'est plus proposé. Choisissez-en un autre." };
  }
  if (trouve.restant <= 0) {
    return { error: "Ce créneau vient d'être pris. Choisissez-en un autre." };
  }
  return { ok: true };
}

/** « mercredi 12 août, 09:00 – 09:30 » */
export function libelleCreneau(debutIso: string, finIso: string): string {
  const debut = new Date(debutIso);
  const fin = new Date(finIso);
  const jour = debut.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  const heure = (d: Date) =>
    `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  return `${jour}, ${heure(debut)} – ${heure(fin)}`;
}
