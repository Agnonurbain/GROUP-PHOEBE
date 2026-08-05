/**
 * À quel service appartient une page du site public.
 *
 * Cette question se décidait à DEUX endroits, indépendamment : `smart-header`
 * pour choisir le logo, `vertical-layout` pour poser `data-vertical` et donc la
 * couleur d'accent. Les deux listes ne disaient pas la même chose, et aucune
 * n'était complète.
 *
 * Conséquence visible : le panier, le tunnel de réservation et le suivi de
 * colis affichaient le logo GROUP PHOEBE générique alors qu'ils appartiennent
 * clairement à un service. Le client changeait d'univers en cours de parcours,
 * au moment précis où il paie.
 *
 * Une seule fonction désormais. Ajouter une page de service, c'est ajouter un
 * préfixe ici — et un test vérifie que les deux consommateurs passent bien par
 * elle.
 */

export type Verticale = "transport" | "livraison" | "immobilier" | "assistance" | "textile"

/**
 * Préfixes de chemin, par service.
 *
 * L'ordre n'a pas d'importance : les préfixes sont disjoints. Ce qui compte,
 * c'est que les parcours RATTACHÉS à un service y figurent, pas seulement les
 * pages qui portent son nom.
 */
const PREFIXES: Record<Verticale, string[]> = {
  transport: [
    "/transport",
    // Le panier ne contient que des véhicules, et le tunnel de réservation
    // n'existe que pour eux.
    "/panier",
    "/reservation",
  ],
  livraison: [
    "/livraison",
    // « Suivre un colis » : la page ne porte pas le nom du service, elle en
    // fait pourtant entièrement partie.
    "/suivi",
  ],
  immobilier: ["/immobilier"],
  assistance: ["/assistance"],
  textile: ["/textile"],
}

/** Le service d'un chemin, ou `null` pour les pages transverses. */
export function verticaleDeChemin(pathname: string): Verticale | null {
  for (const [verticale, prefixes] of Object.entries(PREFIXES) as [Verticale, string[]][]) {
    // `startsWith` sur le préfixe exact ou suivi d'un `/` : sans quoi
    // « /transportation » passerait pour du transport.
    if (prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return verticale
    }
  }
  return null
}

/**
 * Valeur de l'attribut `data-vertical`, qui porte la couleur d'accent.
 *
 * « accueil » pour tout ce qui n'appartient à aucun service : l'accueil
 * lui-même, mais aussi le compte, le blog, le contact et les pages légales.
 */
export function attributVerticale(pathname: string): string {
  return verticaleDeChemin(pathname) ?? "accueil"
}
