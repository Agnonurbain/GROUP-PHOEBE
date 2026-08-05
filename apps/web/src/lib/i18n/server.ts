import "server-only";

import { cookies, headers } from "next/headers";
import { LANGUE_COOKIE, detecterLangue, getLangues } from "@/lib/langues";
import { dictionnaire, type Dictionnaire } from "./index";

/**
 * Langue de la requête courante — la SEULE résolution.
 *
 * Elle se décidait à deux endroits qui ne disaient pas la même chose : ici,
 * cookie puis `Accept-Language` ; et dans `app/(public)/layout.tsx`, les mêmes
 * deux sources PLUS une condition de plus — la langue doit être active dans la
 * table `langues`. Le layout alimente le contexte client, `getT()` sert les
 * composants serveur : désactiver l'anglais en base aurait donné un en-tête en
 * français au-dessus d'une page en anglais, sans que rien ne le signale.
 *
 * La condition de la table est la bonne — c'est un réglage d'exploitation. Elle
 * s'applique donc aux deux, depuis ici.
 *
 * `server-only` rend la frontière explicite : importer ce fichier depuis un
 * composant client échoue à la compilation, au lieu de casser le build de
 * production sur une erreur de bundling difficile à lire.
 */
export async function langueCourante(): Promise<string> {
  const [entetes, cookieStore, langues] = await Promise.all([
    headers(),
    cookies(),
    getLangues(),
  ]);

  const detectee = detecterLangue(
    entetes.get("accept-language") ?? undefined,
    cookieStore.get(LANGUE_COOKIE)?.value
  );

  // Table illisible ou vide : on n'invente pas de restriction, la langue
  // détectée passe. Le repli du dictionnaire couvre le reste.
  if (langues.length === 0) return detectee;

  if (langues.some((l) => l.code === detectee)) return detectee;
  return langues.find((l) => l.defaut)?.code ?? "fr";
}

/** Raccourci serveur : `const t = await getT()`. */
export async function getT(): Promise<Dictionnaire> {
  return dictionnaire(await langueCourante());
}
