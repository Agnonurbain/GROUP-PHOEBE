/**
 * Les colonnes `periode` (demandes_transport, disponibilites_vehicule,
 * disponibilites_chauffeur) sont des ranges Postgres `tstzrange`.
 * `supabase gen types` les expose en `unknown` : le narrowing se fait ici,
 * une fois pour toutes, plutôt qu'avec un cast à chaque lecture.
 *
 * Format attendu : `[2026-01-01T00:00:00+00:00,2026-01-05T00:00:00+00:00)`
 */
export function parsePeriodeRange(raw: unknown): { debut: string; fin: string } | null {
  if (typeof raw !== "string") return null;
  const [debut, fin] = raw.replace(/[\[\]()]/g, "").split(",");
  if (!debut || !fin) return null;
  return { debut: debut.trim(), fin: fin.trim() };
}

/** Début de la période sous forme de Date, ou null si la borne est illisible. */
export function parsePeriodeDebut(raw: unknown): Date | null {
  const parsed = parsePeriodeRange(raw);
  if (!parsed) return null;
  const debut = new Date(parsed.debut);
  return Number.isNaN(debut.getTime()) ? null : debut;
}
