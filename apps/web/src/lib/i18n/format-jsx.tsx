import { Fragment, type ReactNode } from "react";

/**
 * Une phrase à trous dont les trous sont des ÉLÉMENTS, pas du texte.
 *
 * « J'ai lu et j'accepte les [CGV] et la [politique de confidentialité]. »
 * Le code découpait cette phrase en cinq morceaux autour de deux liens ; en
 * anglais, l'ordre et les liaisons diffèrent, et cinq morceaux ne se
 * traduisent pas. Ici la phrase reste entière dans le dictionnaire, avec ses
 * trous nommés, et c'est l'affichage qui y glisse les liens.
 *
 *     avecElements(t.divers.accepteCgv, {
 *       cgv: <Link href="/legal/cgv">{t.divers.conditionsVente}</Link>,
 *     })
 *
 * Un trou sans élément fourni reste visible (`{cgv}`) plutôt que de
 * disparaître : une phrase amputée passe inaperçue en relecture.
 */
export function avecElements(
  modele: string,
  elements: Record<string, ReactNode>
): ReactNode {
  const morceaux = modele.split(/(\{\w+\})/g);
  return (
    <>
      {morceaux.map((morceau, i) => {
        const cle = /^\{(\w+)\}$/.exec(morceau)?.[1];
        return (
          <Fragment key={i}>
            {cle && cle in elements ? elements[cle] : morceau}
          </Fragment>
        );
      })}
    </>
  );
}
