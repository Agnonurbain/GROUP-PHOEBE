/**
 * Ce qui reste d'une phrase quand on la traduit : ses trous, et son pluriel.
 *
 * Le code composait ses phrases par concaténation — « Votre réservation » +
 * « pour le {véhicule} » + la suite, ou « véhicule » + (n > 1 ? "s" : ""). Les
 * deux fonctionnent tant qu'il n'y a qu'une langue, et cessent dès la seconde :
 * l'anglais ne coupe pas ses phrases au même endroit, et ne compte pas comme
 * le français.
 */

/**
 * Remplit les trous d'un modèle : `remplir("Payer {montant}", { montant })`.
 *
 * Les trous sont nommés, jamais positionnels : `{0}` et `{1}` s'inversent d'une
 * langue à l'autre sans que personne ne s'en aperçoive.
 */
export function remplir(
  modele: string,
  valeurs: Record<string, string | number>
): string {
  return modele.replace(/\{(\w+)\}/g, (entier, cle: string) =>
    cle in valeurs ? String(valeurs[cle]) : entier
  );
}

/**
 * La forme qui convient au nombre, dans LA LANGUE affichée.
 *
 * `n > 1 ? "s" : ""` est faux en anglais dès zéro : le français écrit
 * « 0 véhicule », l'anglais « 0 vehicles ». `Intl.PluralRules` connaît cette
 * règle pour les deux, et pour celles qu'on ajouterait ensuite — c'est la
 * raison de passer par lui plutôt que par une comparaison écrite à la main.
 *
 * `{n}` est remplacé par le nombre, en plus des valeurs fournies.
 */
export function pluriel(
  langue: string,
  formes: { un: string; autre: string },
  n: number,
  valeurs: Record<string, string | number> = {}
): string {
  const regle = new Intl.PluralRules(langue).select(n);
  const modele = regle === "one" ? formes.un : formes.autre;
  return remplir(modele, { n, ...valeurs });
}

/**
 * Le libellé d'une valeur de base — statut, mode, type de pièce.
 *
 * Les tables du dictionnaire sont indexées par les valeurs stockées en base :
 * `libelle(t.libelles.statutLivraison, "en_transit")`. La clé arrive presque
 * toujours en `string`, jamais en littéral, d'où cet accesseur plutôt qu'un
 * `as keyof typeof …` répété à chaque appel.
 *
 * Une clé inconnue renvoie la valeur brute, comme le faisait le `?? statut` des
 * tables de `lib/` : un statut ajouté en base et pas encore traduit s'affiche
 * tel quel plutôt que de laisser un vide.
 */
export function libelle(
  table: Record<string, string>,
  cle: string | null | undefined
): string {
  if (!cle) return "";
  return table[cle] ?? cle;
}
