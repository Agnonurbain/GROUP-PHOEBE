// Régime d'indemnisation de la livraison.
//
// `valeur_declaree` était demandée au client sans rien promettre : ni assurance,
// ni plafond, ni recours. Plutôt que de laisser le champ décoratif ou d'inventer
// un barème — une décision commerciale, pas une déduction technique — les règles
// sont des paramètres pilotés par le propriétaire, et le texte affiché en
// découle.

export type ParametresIndemnisation = {
  indemnisation_active: boolean;
  indemnisation_taux: number;
  indemnisation_plafond: number;
  indemnisation_conditions: string;
};

export const INDEMNISATION_INACTIVE: ParametresIndemnisation = {
  indemnisation_active: false,
  indemnisation_taux: 0,
  indemnisation_plafond: 0,
  indemnisation_conditions: "",
};

/**
 * Montant dû pour une valeur déclarée.
 *
 * Renvoie 0 tant que le régime n'est pas activé : c'est l'état actuel, et il
 * doit être calculé comme tel plutôt que supposé. Le plafond à 0 signifie
 * « aucun plafond distinct du taux » — sinon activer le régime sans renseigner
 * de plafond n'indemniserait jamais rien, ce qui serait un piège.
 */
export function calculerIndemnisation(
  valeurDeclaree: number | null | undefined,
  params: ParametresIndemnisation
): number {
  if (!params.indemnisation_active) return 0;

  const valeur = Number(valeurDeclaree ?? 0);
  if (!Number.isFinite(valeur) || valeur <= 0) return 0;

  const taux = Number(params.indemnisation_taux ?? 0);
  if (!Number.isFinite(taux) || taux <= 0) return 0;

  const brut = (valeur * taux) / 100;
  const plafond = Number(params.indemnisation_plafond ?? 0);
  const borne = plafond > 0 ? Math.min(brut, plafond) : brut;

  return Math.round(borne);
}

/**
 * Ce qu'on annonce au client sous le champ « valeur déclarée ».
 *
 * Le texte suit les paramètres : tant que rien n'est activé, il dit clairement
 * qu'aucune indemnisation ne s'y rattache — laisser croire le contraire par
 * omission serait le vrai risque.
 */
export function libelleIndemnisation(params: ParametresIndemnisation): string {
  if (!params.indemnisation_active) {
    return (
      "Indicatif : nous aide à prendre les précautions de manutention adaptées. " +
      "Ne vaut pas assurance — aucune indemnisation ne s'y rattache."
    );
  }

  const taux = Number(params.indemnisation_taux ?? 0);
  const plafond = Number(params.indemnisation_plafond ?? 0);

  const base =
    plafond > 0
      ? `En cas de perte ou d'avarie, l'indemnisation s'élève à ${taux} % de la valeur déclarée, ` +
        `dans la limite de ${plafond.toLocaleString("fr-FR")} FCFA.`
      : `En cas de perte ou d'avarie, l'indemnisation s'élève à ${taux} % de la valeur déclarée.`;

  const conditions = (params.indemnisation_conditions ?? "").trim();
  return conditions ? `${base} ${conditions}` : base;
}
