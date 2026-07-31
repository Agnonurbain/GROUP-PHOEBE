"use client"

import { useActionState } from "react"
import { modifierLivreur, type LivreurAdminState } from "@/app/actions/livreurs-admin"
import { SubmitButton } from "@/components/submit-button"

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/12 bg-white px-3 py-2 text-sm text-phoebe-anthracite transition-colors focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"

export function LivreurForm({
  livreurId,
  initial,
}: {
  livreurId: string
  initial: {
    zone_couverture: string
    capacite_max_par_jour: number
    actif: boolean
  }
}) {
  const [state, action] = useActionState<LivreurAdminState, FormData>(modifierLivreur, {})

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="livreur_id" value={livreurId} />

      {state.error && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-lg bg-phoebe-green/10 px-3 py-2 text-xs text-phoebe-green-deep">
          Livreur mis à jour.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`zone-${livreurId}`}
            className="mb-1 block text-xs font-medium text-phoebe-anthracite"
          >
            Communes desservies
          </label>
          <input
            id={`zone-${livreurId}`}
            name="zone_couverture"
            defaultValue={initial.zone_couverture}
            placeholder="Cocody, Marcory"
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-phoebe-anthracite/60">
            Séparées par des virgules. <strong>Laissez vide pour desservir tout Abidjan</strong> —
            un colis est comparé à la commune de retrait. Si aucun livreur ne couvre
            cette commune, l&apos;affectation retombe sur l&apos;ensemble plutôt que
            de laisser le colis sans personne.
          </p>
        </div>

        <div>
          <label
            htmlFor={`capacite-${livreurId}`}
            className="mb-1 block text-xs font-medium text-phoebe-anthracite"
          >
            Capacité par jour
          </label>
          <input
            id={`capacite-${livreurId}`}
            name="capacite_max_par_jour"
            type="number"
            min={1}
            step={1}
            defaultValue={initial.capacite_max_par_jour}
            className={inputClass}
            required
          />
          <p className="mt-1 text-[11px] text-phoebe-anthracite/60">
            Au-delà, l&apos;affectation automatique le passe. Pour suspendre
            quelqu&apos;un, décochez « actif » plutôt que de descendre à zéro.
          </p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-phoebe-anthracite">
        <input
          type="checkbox"
          name="actif"
          defaultChecked={initial.actif}
          className="h-4 w-4 rounded border-phoebe-anthracite/20 accent-phoebe-green"
        />
        Actif — reçoit de nouvelles affectations et accède à son espace terrain
      </label>

      <SubmitButton>Enregistrer</SubmitButton>
    </form>
  )
}
