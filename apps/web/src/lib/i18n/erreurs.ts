import "server-only";

import { getT } from "./server";
import type { Dictionnaire } from "./index";
import { remplir } from "./format";

/** Les clés du catalogue de messages d'erreur. */
export type CleErreur = keyof Dictionnaire["err"];

/**
 * Un message d'erreur, dans la langue du visiteur.
 *
 * Les server actions renvoyaient leurs messages en français littéral : un
 * visiteur anglophone remplissait un formulaire et recevait « Vous devez être
 * connecté » — au moment précis où il a besoin de comprendre.
 *
 * Pourquoi une fonction et non un `const t = await getT()` en tête de chaque
 * action : les messages naissent partout, y compris dans des fonctions
 * auxiliaires et des blocs `catch` imbriqués. Un accesseur s'appelle là où le
 * message est produit, sans dépendre de ce qui est en portée.
 *
 *     return { error: await err("nonAuthentifie") };
 */
export async function err(
  cle: CleErreur,
  valeurs?: Record<string, string | number>
): Promise<string> {
  const modele = (await getT()).err[cle];
  return valeurs ? remplir(modele, valeurs) : modele;
}
