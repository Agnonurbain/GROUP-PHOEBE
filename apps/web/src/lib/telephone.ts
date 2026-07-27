// Téléphone — source UNIQUE du format, partagée par les champs et le serveur.
//
// Il y avait trois vérités contradictoires : le `pattern` des formulaires
// acceptait n'importe quel pays (`[+][0-9]{7,15}`), le message d'erreur affirmait
// « doit commencer par +225 », et PHONE_PATTERN imposait la Côte d'Ivoire —
// pendant que la validation serveur, elle, acceptait l'international.
// Tout est désormais aligné sur ce fichier.

/** International E.164 : `+` puis 7 à 15 chiffres, le premier non nul. */
const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

/** Retire espaces, points, tirets et parenthèses. */
export function nettoyerTelephone(value: string): string {
  return value.replace(/[\s.\-()]/g, "");
}

/**
 * Numéro prêt à être transmis à Supabase, ou `null` s'il est invalide.
 *
 * À utiliser AVANT tout appel d'authentification : sans ça,
 * « +225 07 00 00 00 00 » et « +2250700000000 » désignent deux identités
 * différentes, et un compte créé avec l'un devient inaccessible avec l'autre.
 */
export function normaliserTelephone(value: string): string | null {
  const cleaned = nettoyerTelephone(value);
  return PHONE_REGEX.test(cleaned) ? cleaned : null;
}

export function validerTelephone(value: string): string | null {
  const cleaned = nettoyerTelephone(value);

  if (!cleaned.startsWith("+")) {
    return "Le numéro doit commencer par l'indicatif du pays, par exemple +225.";
  }

  if (!PHONE_REGEX.test(cleaned)) {
    return "Format invalide. Exemple : +225 07 00 00 00 00";
  }

  return null;
}

// ─── Attributs des champs ────────────────────────────────────────────────────
// Le pattern autorise les séparateurs que `nettoyerTelephone` sait retirer :
// refuser « +225 07 00 00 00 00 » alors que le placeholder l'affichait ainsi
// était la première cause d'échec de saisie.
export const PHONE_PATTERN = "[+][1-9][0-9 .()\\-]{6,20}";
export const PHONE_PLACEHOLDER = "+225 07 00 00 00 00";
export const PHONE_AIDE = "Indicatif pays obligatoire. Les espaces sont acceptés.";

/**
 * `tel` et non `numeric` : sur mobile, le pavé numérique n'expose pas la touche
 * `+`, pourtant exigée par le format. Le clavier téléphone, si.
 */
export const PHONE_INPUT_MODE = "tel" as const;
