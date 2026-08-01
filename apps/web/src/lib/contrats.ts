// Abonnements récurrents (table `contrats_recurrents`).
//
// Module pur : aucune dépendance serveur, pour que la règle qui décide si un
// véhicule est pris soit testable sans base.

export const CATEGORIES_CONTRAT = ["scolaire", "personnel"] as const;
export type CategorieContrat = (typeof CATEGORIES_CONTRAT)[number];

export const CATEGORIE_CONTRAT_LABELS: Record<CategorieContrat, string> = {
  scolaire: "Ramassage scolaire",
  personnel: "Chauffeur personnel",
};

export const FREQUENCES = ["mensuelle", "trimestrielle", "annuelle"] as const;
export type Frequence = (typeof FREQUENCES)[number];

export const FREQUENCE_LABELS: Record<Frequence, string> = {
  mensuelle: "Mensuelle",
  trimestrielle: "Trimestrielle",
  annuelle: "Annuelle",
};

/** Nombre de mois couverts par une échéance. */
export const MOIS_PAR_FREQUENCE: Record<Frequence, number> = {
  mensuelle: 1,
  trimestrielle: 3,
  annuelle: 12,
};

export const STATUTS_CONTRAT = ["actif", "suspendu", "resilie"] as const;
export type StatutContrat = (typeof STATUTS_CONTRAT)[number];

export const STATUT_CONTRAT_LABELS: Record<StatutContrat, string> = {
  actif: "Actif",
  suspendu: "Suspendu",
  resilie: "Résilié",
};

export const STATUTS_ECHEANCE = [
  "a_facturer",
  "facturee",
  "payee",
  "impayee",
  "annulee",
] as const;
export type StatutEcheance = (typeof STATUTS_ECHEANCE)[number];

export const STATUT_ECHEANCE_LABELS: Record<StatutEcheance, string> = {
  a_facturer: "À facturer",
  facturee: "Facturée",
  payee: "Payée",
  impayee: "Impayée",
  annulee: "Annulée",
};

export const JOURS_LABELS: Record<number, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  7: "Dimanche",
};

export function isFrequence(v: unknown): v is Frequence {
  return typeof v === "string" && (FREQUENCES as readonly string[]).includes(v);
}

export function isCategorieContrat(v: unknown): v is CategorieContrat {
  return typeof v === "string" && (CATEGORIES_CONTRAT as readonly string[]).includes(v);
}

/** Jour ISO (1 = lundi … 7 = dimanche). `getDay()` place dimanche à 0. */
export function jourIso(d: Date): number {
  const j = d.getUTCDay();
  return j === 0 ? 7 : j;
}

export type CreneauContrat = {
  jours_semaine: number[] | null;
  heure_debut: string | null;
  heure_fin: string | null;
  date_debut: string;
  date_fin: string | null;
  statut: string;
};

/** Minutes depuis minuit, pour une heure « HH:MM » ou « HH:MM:SS ». */
function minutes(heure: string): number {
  const [h, m] = heure.split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * Le contrat mobilise-t-il le véhicule pendant la période demandée ?
 *
 * On ne bloque pas l'intervalle entier de l'abonnement : un ramassage scolaire
 * court sur neuf mois mais ne prend le véhicule que le matin et le soir, les
 * jours d'école. Confronter la demande au créneau, jour par jour, laisse le
 * reste du temps louable — c'est tout l'intérêt de ne pas avoir posé
 * l'abonnement dans `disponibilites_vehicule`.
 *
 * Un contrat suspendu ou résilié ne mobilise rien. Un contrat sans jour ni
 * horaire non plus : il ne décrit aucun usage.
 */
export function contratMobilise(
  contrat: CreneauContrat,
  debut: Date,
  fin: Date
): boolean {
  if (contrat.statut !== "actif") return false;

  const jours = contrat.jours_semaine ?? [];
  if (jours.length === 0) return false;
  if (!contrat.heure_debut || !contrat.heure_fin) return false;
  if (fin <= debut) return false;

  // Hors de la durée de vie du contrat, rien n'est mobilisé.
  const contratDebut = new Date(`${contrat.date_debut}T00:00:00Z`);
  const contratFin = contrat.date_fin
    ? new Date(`${contrat.date_fin}T23:59:59Z`)
    : null;
  if (fin <= contratDebut) return false;
  if (contratFin && debut >= contratFin) return false;

  const debutEffectif = debut > contratDebut ? debut : contratDebut;
  const finEffective = contratFin && fin > contratFin ? contratFin : fin;

  const creneauDebut = minutes(contrat.heure_debut);
  const creneauFin = minutes(contrat.heure_fin);

  // Une demande de plusieurs jours croise forcément le créneau dès qu'un jour
  // desservi tombe dedans : on n'a pas à comparer les heures ce jour-là.
  const joursCouverts =
    (finEffective.getTime() - debutEffectif.getTime()) / 86_400_000;

  const curseur = new Date(
    Date.UTC(
      debutEffectif.getUTCFullYear(),
      debutEffectif.getUTCMonth(),
      debutEffectif.getUTCDate()
    )
  );

  while (curseur <= finEffective) {
    if (jours.includes(jourIso(curseur))) {
      if (joursCouverts >= 1) return true;

      // Même journée : il faut que les plages horaires se chevauchent.
      const demandeDebut =
        debutEffectif.getUTCHours() * 60 + debutEffectif.getUTCMinutes();
      const demandeFin =
        finEffective.getUTCHours() * 60 + finEffective.getUTCMinutes();
      if (demandeDebut < creneauFin && creneauDebut < demandeFin) return true;
    }
    curseur.setUTCDate(curseur.getUTCDate() + 1);
  }

  return false;
}

/**
 * Périodes de facturation dues depuis le début du contrat jusqu'à `jusquA`.
 *
 * Renvoie toutes les périodes échues, pas seulement la dernière : un contrat
 * créé en retard, ou un cron qui n'a pas tourné, doivent rattraper. L'unicité
 * `(contrat_id, periode_debut)` en base écarte les doublons à l'insertion, donc
 * on peut recalculer largement sans risque.
 */
export function periodesDues(
  dateDebut: string,
  dateFin: string | null,
  frequence: Frequence,
  jusquA: Date
): { debut: string; fin: string }[] {
  const pas = MOIS_PAR_FREQUENCE[frequence];
  const out: { debut: string; fin: string }[] = [];

  const depart = new Date(`${dateDebut}T00:00:00Z`);
  const terme = dateFin ? new Date(`${dateFin}T00:00:00Z`) : null;

  const curseur = new Date(depart);
  // Garde-fou : un contrat très ancien ne doit pas boucler indéfiniment si une
  // date aberrante se glisse en base.
  for (let i = 0; i < 240 && curseur <= jusquA; i++) {
    const debut = new Date(curseur);
    const fin = new Date(curseur);
    fin.setUTCMonth(fin.getUTCMonth() + pas);
    fin.setUTCDate(fin.getUTCDate() - 1);

    if (terme && debut > terme) break;
    const finBornee = terme && fin > terme ? terme : fin;

    out.push({
      debut: debut.toISOString().slice(0, 10),
      fin: finBornee.toISOString().slice(0, 10),
    });

    curseur.setUTCMonth(curseur.getUTCMonth() + pas);
  }

  return out;
}
