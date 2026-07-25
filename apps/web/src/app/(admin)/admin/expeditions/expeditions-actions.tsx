"use client"

import { useActionState } from "react"
import {
  affecterLivreurAuto,
  affecterLivreurManuel,
  changerStatutExpedition,
  type ExpeditionActionState,
} from "@/app/actions/livraison"

const btnPrimary =
  "rounded-lg bg-phoebe-green px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-phoebe-green-deep disabled:opacity-50"
const btnGhost =
  "rounded-lg border border-phoebe-anthracite/15 px-3 py-2 text-xs font-semibold text-phoebe-anthracite/80 transition-colors hover:border-phoebe-green hover:text-phoebe-green disabled:opacity-50"
const selectClass =
  "rounded-lg border border-phoebe-anthracite/15 bg-white px-3 py-2 text-xs text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/20"

export function ExpeditionActions({
  expeditionId,
  currentStatut,
  assigned,
  livreurs,
  statuts,
}: {
  expeditionId: string
  currentStatut: string
  assigned: boolean
  livreurs: { id: string; nom: string }[]
  statuts: { value: string; label: string }[]
}) {
  const [autoState, autoAction, autoPending] = useActionState<ExpeditionActionState, FormData>(affecterLivreurAuto, {})
  const [manuelState, manuelAction, manuelPending] = useActionState<ExpeditionActionState, FormData>(affecterLivreurManuel, {})
  const [statutState, statutAction, statutPending] = useActionState<ExpeditionActionState, FormData>(changerStatutExpedition, {})

  const erreur = autoState.error || manuelState.error || statutState.error

  return (
    <div className="mt-4 border-t border-phoebe-pearl pt-4">
      {erreur && (
        <p role="alert" className="mb-3 rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
          {erreur}
        </p>
      )}
      <div className="flex flex-wrap items-end gap-4">
        {/* Affectation livreur */}
        <div className="flex flex-wrap items-center gap-2">
          <form action={autoAction}>
            <input type="hidden" name="expedition_id" value={expeditionId} />
            <button type="submit" disabled={autoPending} className={btnGhost}>
              {autoPending ? "…" : assigned ? "Réaffecter auto" : "Affecter auto"}
            </button>
          </form>
          {livreurs.length > 0 && (
            <form action={manuelAction} className="flex items-center gap-2">
              <input type="hidden" name="expedition_id" value={expeditionId} />
              <label htmlFor={`liv-${expeditionId}`} className="sr-only">Livreur</label>
              <select id={`liv-${expeditionId}`} name="livreur_id" required defaultValue="" className={selectClass}>
                <option value="" disabled>Choisir un livreur…</option>
                {livreurs.map((l) => (
                  <option key={l.id} value={l.id}>{l.nom}</option>
                ))}
              </select>
              <button type="submit" disabled={manuelPending} className={btnGhost}>
                {manuelPending ? "…" : "Affecter"}
              </button>
            </form>
          )}
        </div>

        {/* Cycle de statut */}
        <form action={statutAction} className="flex items-center gap-2">
          <input type="hidden" name="expedition_id" value={expeditionId} />
          <label htmlFor={`stat-${expeditionId}`} className="sr-only">Statut</label>
          <select id={`stat-${expeditionId}`} name="statut" defaultValue={currentStatut} className={selectClass}>
            {statuts.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button type="submit" disabled={statutPending} className={btnPrimary}>
            {statutPending ? "…" : "Mettre à jour"}
          </button>
        </form>
      </div>
    </div>
  )
}
