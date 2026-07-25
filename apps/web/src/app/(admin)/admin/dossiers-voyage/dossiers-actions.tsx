"use client"

import { useActionState } from "react"
import {
  changerStatutDossier,
  affecterConseiller,
  type DossierActionState,
} from "@/app/actions/assistance"

const btnPrimary =
  "rounded-lg bg-phoebe-green px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-phoebe-green-deep disabled:opacity-50"
const btnGhost =
  "rounded-lg border border-phoebe-anthracite/15 px-3 py-2 text-xs font-semibold text-phoebe-anthracite/80 transition-colors hover:border-phoebe-green hover:text-phoebe-green disabled:opacity-50"
const selectClass =
  "rounded-lg border border-phoebe-anthracite/15 bg-white px-3 py-2 text-xs text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/20"

export function DossierActions({
  dossierId,
  currentStatut,
  currentConseiller,
  conseillers,
  statuts,
}: {
  dossierId: string
  currentStatut: string
  currentConseiller: string | null
  conseillers: { id: string; nom: string }[]
  statuts: { value: string; label: string }[]
}) {
  const [statutState, statutAction, statutPending] = useActionState<DossierActionState, FormData>(changerStatutDossier, {})
  const [conseillerState, conseillerAction, conseillerPending] = useActionState<DossierActionState, FormData>(affecterConseiller, {})

  const erreur = statutState.error || conseillerState.error

  return (
    <div className="mt-4 border-t border-phoebe-pearl pt-4">
      {erreur && (
        <p role="alert" className="mb-3 rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
          {erreur}
        </p>
      )}
      <div className="flex flex-wrap items-end gap-4">
        {/* Statut */}
        <form action={statutAction} className="flex items-center gap-2">
          <input type="hidden" name="dossier_id" value={dossierId} />
          <label htmlFor={`stat-${dossierId}`} className="sr-only">Statut</label>
          <select id={`stat-${dossierId}`} name="statut" defaultValue={currentStatut} className={selectClass}>
            {statuts.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button type="submit" disabled={statutPending} className={btnPrimary}>
            {statutPending ? "…" : "Mettre à jour"}
          </button>
        </form>

        {/* Conseiller */}
        <form action={conseillerAction} className="flex items-center gap-2">
          <input type="hidden" name="dossier_id" value={dossierId} />
          <label htmlFor={`cons-${dossierId}`} className="sr-only">Conseiller</label>
          <select id={`cons-${dossierId}`} name="conseiller_id" defaultValue={currentConseiller ?? ""} className={selectClass}>
            <option value="">Aucun conseiller</option>
            {conseillers.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
          <button type="submit" disabled={conseillerPending} className={btnGhost}>
            {conseillerPending ? "…" : "Affecter"}
          </button>
        </form>
      </div>
    </div>
  )
}
