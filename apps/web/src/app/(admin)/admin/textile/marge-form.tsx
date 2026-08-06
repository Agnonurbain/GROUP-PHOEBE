"use client"

import { useActionState } from "react"
import { modifierMargeRevendeur, type TextileState } from "@/app/actions/textile"
import { SubmitButton } from "@/components/submit-button"
import { Obligatoire } from "@/components/ui/obligatoire"

/**
 * La marge revendeur, pilotable par le propriétaire.
 *
 * Elle vit en base et non dans le code : une marge se négocie et se révise,
 * elle suit le marché et non un déploiement.
 *
 * Elle ne quitte JAMAIS l'administration. Annoncer une marge revient à donner
 * le prix d'achat à qui sait faire une règle de trois — et ce service
 * n'affiche aucun prix, par décision de l'exploitant (00087).
 */
export function MargeForm({ marge }: { marge: number }) {
  const [state, action] = useActionState<TextileState, FormData>(
    modifierMargeRevendeur,
    {}
  )

  return (
    <div className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-phoebe-anthracite">Marge revendeur</h2>
      <p className="mt-1 max-w-prose text-xs text-phoebe-anthracite/70">
        Appliquée au tarif de gros quand un client déclare acheter pour
        revendre. Elle sert à chiffrer : elle n&apos;apparaît nulle part sur le
        site, pas plus qu&apos;un prix.
      </p>

      <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor="marge_revendeur_pct"
            className="mb-1 block text-xs font-medium text-phoebe-anthracite"
          >
            Marge (%)<Obligatoire />
          </label>
          <input
            id="marge_revendeur_pct"
            name="marge_revendeur_pct"
            type="number"
            inputMode="decimal"
            step="0.5"
            min={0}
            max={500}
            required
            defaultValue={marge}
            className="w-32 rounded-lg border border-phoebe-anthracite/12 bg-white px-3 py-2 text-sm text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
          />
        </div>
        <SubmitButton>Enregistrer</SubmitButton>
        {state.error && (
          <p role="alert" className="text-xs text-error">
            {state.error}
          </p>
        )}
        {state.success && (
          <p role="status" className="text-xs text-phoebe-green-deep">
            Marge enregistrée.
          </p>
        )}
      </form>
    </div>
  )
}
