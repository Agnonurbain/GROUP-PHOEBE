// Décompte du temps en heures ouvrées.
//
// Module pur : la règle est subtile et mérite d'être testée sans base.
//
// FUSEAU — Abidjan est à UTC+0 toute l'année, sans heure d'été. Les calculs
// utilisent donc l'heure UTC directement, ce qui est exact ici et seulement
// ici : le jour où GROUP PHOEBE opérerait depuis un autre fuseau, il faudrait
// convertir avant de comparer aux horaires d'ouverture.

export type HorairesOuvres = {
  /** Jours desservis, 1 = lundi … 7 = dimanche (ISO). */
  jours: number[];
  /** « 08:00 » */
  ouverture: string;
  /** « 18:00 » */
  fermeture: string;
};

export const HORAIRES_DEFAUT: HorairesOuvres = {
  jours: [1, 2, 3, 4, 5, 6],
  ouverture: "08:00",
  fermeture: "18:00",
};

/** Minutes depuis minuit, pour « HH:MM » ou « HH:MM:SS ». */
function minutesDeLHeure(heure: string): number {
  const [h, m] = heure.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function jourIso(d: Date): number {
  const j = d.getUTCDay();
  return j === 0 ? 7 : j;
}

function minutesDansLaJournee(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/**
 * Les horaires sont-ils exploitables ?
 *
 * Aucun jour ouvré, ou une fermeture avant l'ouverture, rendrait tout calcul
 * insoluble : le budget ne s'épuiserait jamais et la boucle tournerait sans
 * fin. Dans ce cas on retombe sur un décompte calendaire, qui expire au moins
 * quelque chose — mieux qu'un véhicule immobilisé pour toujours.
 */
export function horairesUtilisables(h: HorairesOuvres): boolean {
  if (!h.jours || h.jours.length === 0) return false;
  return minutesDeLHeure(h.ouverture) < minutesDeLHeure(h.fermeture);
}

/** Le moment tombe-t-il dans une plage ouvrée ? */
export function estOuvre(d: Date, h: HorairesOuvres): boolean {
  if (!horairesUtilisables(h)) return true;
  if (!h.jours.includes(jourIso(d))) return false;
  const m = minutesDansLaJournee(d);
  return m >= minutesDeLHeure(h.ouverture) && m < minutesDeLHeure(h.fermeture);
}

/** Début de la prochaine plage ouverte, au plus tôt `depuis`. */
function prochaineOuverture(depuis: Date, h: HorairesOuvres): Date {
  const ouverture = minutesDeLHeure(h.ouverture);
  const curseur = new Date(depuis);

  // 14 jours suffisent à trouver la prochaine ouverture dès qu'un jour est
  // desservi ; au-delà, c'est que les horaires sont inexploitables.
  for (let i = 0; i < 14 * 24 * 60; i++) {
    if (h.jours.includes(jourIso(curseur))) {
      const m = minutesDansLaJournee(curseur);
      if (m < ouverture) {
        curseur.setUTCHours(Math.floor(ouverture / 60), ouverture % 60, 0, 0);
        return curseur;
      }
      if (estOuvre(curseur, h)) return curseur;
    }
    // Jour suivant, à l'ouverture.
    curseur.setUTCDate(curseur.getUTCDate() + 1);
    curseur.setUTCHours(Math.floor(ouverture / 60), ouverture % 60, 0, 0);
  }
  return depuis;
}

/**
 * Échéance obtenue en ne consommant que du temps ouvré.
 *
 * Une demande reçue vendredi à 17 h avec 4 heures ouvrées expire lundi à 11 h,
 * pas samedi à 21 h. C'est ce qui distingue un délai de réponse d'un compte à
 * rebours aveugle : l'équipe ne peut pas répondre la nuit, et le client n'a pas
 * à en payer le prix.
 */
export function echeanceOuvree(
  depuis: Date,
  heures: number,
  h: HorairesOuvres = HORAIRES_DEFAUT
): Date {
  if (!horairesUtilisables(h)) {
    return new Date(depuis.getTime() + heures * 60 * 60 * 1000);
  }

  let budget = Math.round(heures * 60);
  if (budget <= 0) return new Date(depuis);

  const fermeture = minutesDeLHeure(h.fermeture);
  let curseur = prochaineOuverture(depuis, h);

  // Borne de sûreté : un budget démesuré ne doit pas faire tourner la boucle
  // indéfiniment. 400 itérations couvrent plus d'un an de jours ouvrés.
  for (let i = 0; i < 400 && budget > 0; i++) {
    const restantCeJour = fermeture - minutesDansLaJournee(curseur);

    if (restantCeJour >= budget) {
      return new Date(curseur.getTime() + budget * 60 * 1000);
    }

    budget -= restantCeJour;
    // Fin de journée : on repart à la prochaine ouverture.
    const lendemain = new Date(curseur);
    lendemain.setUTCDate(lendemain.getUTCDate() + 1);
    lendemain.setUTCHours(0, 0, 0, 0);
    curseur = prochaineOuverture(lendemain, h);
  }

  return curseur;
}

/**
 * Temps ouvré écoulé entre deux instants, en heures.
 *
 * Sert aux crons : ils préfiltrent en SQL sur le temps calendaire — toujours
 * supérieur ou égal au temps ouvré — puis tranchent ici. Le préfiltre ne peut
 * donc jamais écarter une ligne qui aurait dû expirer.
 */
export function heuresOuvreesEcoulees(
  depuis: Date,
  jusqua: Date,
  h: HorairesOuvres = HORAIRES_DEFAUT
): number {
  if (jusqua <= depuis) return 0;
  if (!horairesUtilisables(h)) {
    return (jusqua.getTime() - depuis.getTime()) / (60 * 60 * 1000);
  }

  const ouverture = minutesDeLHeure(h.ouverture);
  const fermeture = minutesDeLHeure(h.fermeture);
  let minutes = 0;

  const curseur = new Date(
    Date.UTC(depuis.getUTCFullYear(), depuis.getUTCMonth(), depuis.getUTCDate())
  );

  for (let i = 0; i < 400 && curseur <= jusqua; i++) {
    if (h.jours.includes(jourIso(curseur))) {
      const debutPlage = new Date(curseur);
      debutPlage.setUTCHours(Math.floor(ouverture / 60), ouverture % 60, 0, 0);
      const finPlage = new Date(curseur);
      finPlage.setUTCHours(Math.floor(fermeture / 60), fermeture % 60, 0, 0);

      const debut = depuis > debutPlage ? depuis : debutPlage;
      const fin = jusqua < finPlage ? jusqua : finPlage;
      if (fin > debut) minutes += (fin.getTime() - debut.getTime()) / 60000;
    }
    curseur.setUTCDate(curseur.getUTCDate() + 1);
  }

  return minutes / 60;
}
