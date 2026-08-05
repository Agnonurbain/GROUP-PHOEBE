"use client"

import { useActionState } from "react"
import {
  changerStatutTextile,
  proposerDevisTextile,
  type TextileState,
} from "@/app/actions/textile"
import { SubmitButton } from "@/components/submit-button"
import { Obligatoire } from "@/components/ui/obligatoire"
import {
  STATUT_TEXTILE_LABELS,
  TRANSITIONS_TEXTILE,
  type StatutTextile,
} from "@/lib/textile"

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/12 bg-white px-3 py-2 text-sm text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
const labelClass = "mb-1 block text-xs font-medium text-phoebe-anthracite"

/**
 * Traiter une demande de pagne.
 *
 * Le devis est séparé du changement de statut : « devis_envoye » suppose un
 * montant, et le poser par le sélecteur générique afficherait au client un
 * devis sans prix.
 */
export function TextileActions({
  demandeId,
  statut,
  estProprietaire,
  montant,
}: {
  demandeId: string
  statut: StatutTextile
  estProprietaire: boolean
  montant: number | null
}) {
  const [state, action] = useActionState<TextileState, FormData>(changerStatutTextile, {})
  const [devis, actionDevis] = useActionState<TextileState, FormData>(proposerDevisTextile, {})

  // Le sélecteur ne montre que les passages réellement possibles : proposer
  // l'impossible fait cliquer pour rien.
  const suites = TRANSITIONS_TEXTILE[statut].filter((s) => s !== "devis_envoye")
  const peutChiffrer = TRANSITIONS_TEXTILE[statut].includes("devis_envoye")

  return (
    <div className="mt-3 space-y-3 border-t border-phoebe-pearl pt-3">
      {suites.length > 0 && (
        <form action={action} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="demande_id" value={demandeId} />
          <div>
            <label htmlFor={`statut-${demandeId}`} className={labelClass}>
              Faire avancer<Obligatoire />
            </label>
            <select id={`statut-${demandeId}`} name="statut" required className={inputClass}>
              {suites.map((s) => (
                <option key={s} value={s}>{STATUT_TEXTILE_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <SubmitButton>Appliquer</SubmitButton>
          {state.error && <span role="alert" className="text-xs text-error">{state.error}</span>}
          {state.success && <span role="status" className="text-xs text-phoebe-green-deep">Fait.</span>}
        </form>
      )}

      {peutChiffrer && (
        estProprietaire ? (
          <form action={actionDevis} className="flex flex-wrap items-end gap-2 rounded-lg border border-phoebe-gold/30 bg-phoebe-gold/5 p-3">
            <input type="hidden" name="demande_id" value={demandeId} />
            <div>
              <label htmlFor={`montant-${demandeId}`} className={labelClass}>
                Montant (FCFA)<Obligatoire />
              </label>
              <input
                id={`montant-${demandeId}`}
                name="montant"
                type="number"
                min={1}
                step={100}
                defaultValue={montant ?? ""}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor={`validite-${demandeId}`} className={labelClass}>
                Valable (jours)<Obligatoire />
              </label>
              <input
                id={`validite-${demandeId}`}
                name="validite_jours"
                type="number"
                min={1}
                max={90}
                defaultValue={7}
                required
                className={inputClass}
              />
            </div>
            <SubmitButton>Envoyer le devis</SubmitButton>
            {devis.error && <span role="alert" className="text-xs text-error">{devis.error}</span>}
            {devis.success && <span role="status" className="text-xs text-phoebe-green-deep">Devis envoyé.</span>}
          </form>
        ) : (
          // Chiffrer, c'est écrire un montant facturé : le dire plutôt que
          // d'afficher un formulaire qui sera refusé.
          <p className="rounded-lg border border-phoebe-gold/30 bg-phoebe-gold/5 px-3 py-2 text-xs text-phoebe-anthracite">
            Le chiffrage est réservé au propriétaire.
          </p>
        )
      )}
    </div>
  )
}
