import { cookies, headers } from "next/headers";
import { LANGUE_COOKIE, detecterLangue } from "@/lib/langues";
import { fr, type Dictionnaire } from "./fr";
import { en } from "./en";

export type { Dictionnaire };
export { fr, en };

/** Langues effectivement traduites. La table `langues` peut en annoncer d'autres. */
export const LANGUES_TRADUITES = ["fr", "en"] as const;
export type LangueTraduite = (typeof LANGUES_TRADUITES)[number];

const DICTIONNAIRES: Record<LangueTraduite, Dictionnaire> = { fr, en };

export function estLangueTraduite(code: string): code is LangueTraduite {
  return (LANGUES_TRADUITES as readonly string[]).includes(code);
}

/**
 * Dictionnaire d'une langue, avec repli sur le français.
 *
 * Le repli compte : la table `langues` est éditable en base, et rien n'empêche
 * d'y activer une langue dont l'interface n'existe pas. Mieux vaut un site en
 * français qu'un site vide.
 */
export function dictionnaire(code: string): Dictionnaire {
  return estLangueTraduite(code) ? DICTIONNAIRES[code] : fr;
}

/**
 * Langue de la requête courante, côté serveur : cookie d'abord, puis
 * `Accept-Language`. Même résolution que le layout public, isolée ici pour que
 * n'importe quelle page ou `generateMetadata` puisse s'en servir sans la
 * réécrire — c'est la duplication de cette logique qui fait diverger les pages.
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
