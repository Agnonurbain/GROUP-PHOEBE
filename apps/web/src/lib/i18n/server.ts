import "server-only";

import { cookies, headers } from "next/headers";
import { LANGUE_COOKIE, detecterLangue } from "@/lib/langues";
import { dictionnaire, type Dictionnaire } from "./index";

/**
 * Langue de la requête courante : cookie d'abord, puis `Accept-Language`.
 *
 * Isolé ici pour que n'importe quelle page ou `generateMetadata` s'en serve sans
 * réécrire la résolution — c'est sa duplication qui fait diverger les pages.
 *
 * `server-only` rend la frontière explicite : importer ce fichier depuis un
 * composant client échoue à la compilation, au lieu de casser le build de
 * production sur une erreur de bundling difficile à lire.
 */
export async function langueCourante(): Promise<string> {
  const [entetes, cookieStore] = await Promise.all([headers(), cookies()]);
  return detecterLangue(
    entetes.get("accept-language") ?? undefined,
    cookieStore.get(LANGUE_COOKIE)?.value
  );
}

/** Raccourci serveur : `const t = await getT()`. */
export async function getT(): Promise<Dictionnaire> {
  return dictionnaire(await langueCourante());
}
