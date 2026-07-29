"use client"

import { useActionState } from "react"
import {
  changerStatutDemandeImmobilier,
  affecterAgentImmobilier,
  type DemandeImmoActionState,
} from "@/app/actions/immobilier"

const btnPrimary =
  "rounded-lg bg-phoebe-green px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-phoebe-green-deep disabled:opacity-50"
const btnGhost =
  "rounded-lg border border-phoebe-anthracite/15 px-3 py-2 text-xs font-semibold text-phoebe-anthracite/80 transition-colors hover:border-phoebe-green hover:text-phoebe-green disabled:opacity-50"
const selectClass =
  "rounded-lg border border-phoebe-anthracite/15 bg-white px-3 py-2 text-xs text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/20"

export function DemandeImmoActions({
  demandeId,
  currentStatut,
  currentAgent,
  agents,
  statuts,
}: {
  demandeId: string
  currentStatut: string
  currentAgent: string | null
  agents: { id: string; nom: string }[]
  statuts: { value: string; label: string }[]
}) {
  const [statutState, statutAction, statutPending] = useActionState<DemandeImmoActionState, FormData>(changerStatutDemandeImmobilier, {})
  const [agentState, agentAction, agentPending] = useActionState<DemandeImmoActionState, FormData>(affecterAgentImmobilier, {})

  const erreur = statutState.error || agentState.error

  return (
    <div className="mt-4 border-t border-phoebe-pearl pt-4">
      {erreur && (
        <p role="alert" className="mb-3 rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
          {erreur}
        </p>
      )}
      {statutState.success && (
        <p className="mb-3 rounded-lg border border-phoebe-green/20 bg-phoebe-green/5 px-3 py-2 text-xs text-phoebe-green-deep">
          Statut mis à jour.
        </p>
      )}
      {agentState.success && (
        <p className="mb-3 rounded-lg border border-phoebe-green/20 bg-phoebe-green/5 px-3 py-2 text-xs text-phoebe-green-deep">
          Agent affecté.
        </p>
      )}
      <div className="flex flex-wrap items-end gap-4">
        {/* Statut */}
        <form action={statutAction} className="flex items-center gap-2">
          <input type="hidden" name="demande_id" value={demandeId} />
          <label htmlFor={`stat-${demandeId}`} className="sr-only">Statut</label>
          <select
            id={`stat-${demandeId}`}
            name="statut"
            defaultValue={currentStatut}
            key={`${demandeId}-stat-${currentStatut}`}
            className={selectClass}
          >
            {statuts.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button type="submit" disabled={statutPending} className={btnPrimary}>
            {statutPending ? "…" : "Mettre à jour"}
          </button>
        </form>

        {/* Agent */}
        <form action={agentAction} className="flex items-center gap-2">
          <input type="hidden" name="demande_id" value={demandeId} />
          <label htmlFor={`agent-${demandeId}`} className="sr-only">Agent</label>
          <select
            id={`agent-${demandeId}`}
            name="agent_id"
            defaultValue={currentAgent ?? ""}
            key={`${demandeId}-agent-${currentAgent ?? "null"}`}
            className={selectClass}
          >
            <option value="">Aucun agent</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.nom}</option>
            ))}
          </select>
          <button type="submit" disabled={agentPending} className={btnGhost}>
            {agentPending ? "…" : "Affecter"}
          </button>
        </form>
      </div>
    </div>
  )
}
