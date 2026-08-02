/**
 * Marque visuelle d'un champ obligatoire.
 *
 * `aria-hidden` est délibéré : l'attribut `required` du champ dit déjà « champ
 * obligatoire » aux lecteurs d'écran. Sans cela, ils annonceraient en plus
 * « étoile » — un caractère de ponctuation lu à voix haute au milieu du
 * libellé, qui n'apporte rien à qui ne voit pas l'écran.
 *
 * Composant plutôt qu'une simple chaîne « * » collée dans chaque libellé :
 * c'est ce qui permet de porter cette règle une seule fois, et de la changer
 * partout d'un coup.
 */
export function Obligatoire() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-error">
      *
    </span>
  )
}
