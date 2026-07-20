// Validation phone — Côte d'Ivoire (+225) + international
const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;
const CI_REGEX = /^\+225\s?0[1-9]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/;

export function nettoyerTelephone(value: string): string {
  return value.replace(/[\s.\-()]/g, "");
}

export function validerTelephone(value: string): string | null {
  const cleaned = nettoyerTelephone(value);

  if (!cleaned.startsWith("+")) {
    return "Le numéro doit commencer par +225 (Côte d'Ivoire)";
  }

  if (!PHONE_REGEX.test(cleaned)) {
    return "Format invalide. Exemple: +225 07 00 00 00 00";
  }

  return null;
}

export const PHONE_PATTERN = "[+]225[0-9]{10}";
export const PHONE_PLACEHOLDER = "+225 XX XX XX XX XX";
export const PHONE_INPUT_MODE = "tel" as const;
