/**
 * Regroupement par jour pour les graphiques du tableau de bord. Module pur :
 * aucune dépendance serveur, testable isolément.
 *
 * Les jours sans activité sont **remplis à zéro** : sans ça, Recharts relierait
 * deux points distants d'une semaine par une droite, ce qui laisse croire à une
 * activité continue qui n'a pas eu lieu.
 */

export type PointSerie = {
  /** Clé ISO `AAAA-MM-JJ`, utilisée comme identifiant d'axe. */
  date: string
  /** Libellé court affiché sur l'axe (ex. « 14 juil. »). */
  label: string
  valeur: number
}

/** Clé jour locale. `toISOString()` bascule en UTC et décale les dates du soir. */
export function cleJour(d: Date): string {
  const an = d.getFullYear()
  const mois = String(d.getMonth() + 1).padStart(2, "0")
  const jour = String(d.getDate()).padStart(2, "0")
  return `${an}-${mois}-${jour}`
}

const FORMAT_JOUR = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" })

function labelJour(cle: string): string {
  const [an, mois, jour] = cle.split("-").map(Number)
  return FORMAT_JOUR.format(new Date(an, mois - 1, jour))
}

/**
 * Construit une série continue sur `jours` jours jusqu'à `fin` (incluse).
 *
 * @param lignes  enregistrements horodatés
 * @param valeur  extrait la quantité à cumuler ; `1` pour un simple comptage
 */
export function serieParJour<T extends { created_at: string }>(
  lignes: T[] | null | undefined,
  jours: number,
  valeur: (ligne: T) => number = () => 1,
  fin: Date = new Date()
): PointSerie[] {
  const cumul = new Map<string, number>()

  // Squelette : toutes les journées de la période, à zéro.
  for (let i = jours - 1; i >= 0; i--) {
    const d = new Date(fin)
    d.setDate(d.getDate() - i)
    cumul.set(cleJour(d), 0)
  }

  for (const ligne of lignes ?? []) {
    const d = new Date(ligne.created_at)
    if (Number.isNaN(d.getTime())) continue
    const cle = cleJour(d)
    // Une ligne hors période est ignorée plutôt que d'étirer l'axe.
    if (!cumul.has(cle)) continue
    cumul.set(cle, (cumul.get(cle) ?? 0) + (Number(valeur(ligne)) || 0))
  }

  return [...cumul.entries()].map(([date, v]) => ({
    date,
    label: labelJour(date),
    valeur: v,
  }))
}

/** Évolution en % entre la première et la seconde moitié de la période. */
export function evolution(serie: PointSerie[]): number | null {
  if (serie.length < 2) return null
  const milieu = Math.floor(serie.length / 2)
  const debut = serie.slice(0, milieu).reduce((s, p) => s + p.valeur, 0)
  const fin = serie.slice(milieu).reduce((s, p) => s + p.valeur, 0)
  // Partir de zéro rend le pourcentage infini : on ne l'affiche pas.
  if (debut === 0) return null
  return Math.round(((fin - debut) / debut) * 100)
}
