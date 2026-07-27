// Coordonnées et réseaux sociaux — source unique, pilotée depuis /admin/tarifs.
// Module pur (aucun import serveur) : la lecture en base se fait dans
// public-cache, les valeurs sont ensuite passées aux composants.
//
// Règle : un champ vide n'affiche RIEN. Le site a longtemps publié de fausses
// coordonnées (« +225 01 02 03 04 05 ») ; mieux vaut une absence qu'un faux
// numéro sur lequel un client peut appeler.

export type ParametresContact = {
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  horaires: string | null;
  whatsapp: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  tiktok: string | null;
  youtube: string | null;
};

export const CONTACT_VIDE: ParametresContact = {
  telephone: null,
  email: null,
  adresse: null,
  horaires: null,
  whatsapp: null,
  facebook: null,
  instagram: null,
  linkedin: null,
  tiktok: null,
  youtube: null,
};

/** Champs éditables, dans l'ordre d'affichage du formulaire admin. */
export const CHAMPS_CONTACT = [
  { key: "telephone", label: "Téléphone", placeholder: "+225 07 00 00 00 00", type: "tel" },
  { key: "email", label: "E-mail", placeholder: "contact@exemple.com", type: "email" },
  { key: "adresse", label: "Adresse", placeholder: "Cocody, Abidjan", type: "text" },
  { key: "horaires", label: "Horaires", placeholder: "Lun–Ven 8h–18h, Sam 9h–13h", type: "text" },
] as const;

export const CHAMPS_RESEAUX = [
  { key: "whatsapp", label: "WhatsApp", placeholder: "2250700000000 (chiffres seuls)", type: "text" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/…", type: "url" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/…", type: "url" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/…", type: "url" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@…", type: "url" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@…", type: "url" },
] as const;

export type ChampContact =
  | (typeof CHAMPS_CONTACT)[number]["key"]
  | (typeof CHAMPS_RESEAUX)[number]["key"];

/** `tel:` utilisable dans un href, ou null si aucun numéro n'est configuré. */
export function telHref(telephone: string | null): string | null {
  if (!telephone) return null;
  const compact = telephone.replace(/[^\d+]/g, "");
  return compact ? `tel:${compact}` : null;
}

/** Lien wa.me, ou null si aucun WhatsApp n'est configuré. */
export function whatsappHref(whatsapp: string | null, message?: string): string | null {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, "");
  if (!digits) return null;
  const suffixe = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${suffixe}`;
}

/** Réseaux réellement renseignés, prêts à afficher. */
export function reseauxActifs(
  contact: ParametresContact
): { key: string; label: string; url: string }[] {
  return CHAMPS_RESEAUX.filter((c) => c.key !== "whatsapp")
    .map((c) => ({ key: c.key, label: c.label, url: contact[c.key] ?? "" }))
    .filter((r) => r.url.trim() !== "");
}
