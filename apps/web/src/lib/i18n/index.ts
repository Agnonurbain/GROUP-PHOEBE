// Barrel PUR : dictionnaires et résolution, sans aucune dépendance serveur.
//
// C'est délibéré et ça a un coût d'attention : `langue-context.tsx` est un
// composant client et importe d'ici. Y remettre `next/headers` ferait entrer
// une API serveur dans le bundle navigateur — le build échoue, mais ni `tsc`
// ni ESLint ne le voient. Les helpers serveur vivent dans `./server`.

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
