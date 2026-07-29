"use client"

import { useActionState, useState } from "react"
import { creerVisite, changerStatutVisite, type VisiteState } from "@/app/actions/immobilier"
import { STATUT_VISITE_LABELS, STATUT_VISITE_COLORS, STATUTS_VISITE } from "@/lib/immobilier"

const inputClass =
  "rounded-lg border border-phoebe-anthracite/15 bg-white px-3 py-2 text-xs text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/20"
const btnClass =
  "rounded-lg bg-phoebe-green px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-phoebe-green-deep disabled:opacity-50"

export function VisiteSection({
  demandeId,
  bienId,
  clientId,
  agentId,
  visites,
}: {
  demandeId: string
  bienId: string
  clientId: string
  agentId: string | null
  visites: { id: string; creneau: string; statut: string; agent_id: string | null }[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [creerState, creerAction, creerPending] = useActionState<VisiteState, FormData>(creerVisite, {})
  const [statutState, statutAction, statutPending] = useActionState<VisiteState, FormData>(changerStatutVisite, {})

  return (
    <div className="mt-3 border-t border-phoebe-pearl pt-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-phoebe-anthracite/80">
          Visites ({visites.length})
        </h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg border border-phoebe-anthracite/15 px-2.5 py-1 text-[11px] font-semibold text-phoebe-anthracite/70 transition-colors hover:border-phoebe-green hover:text-phoebe-green"
        >
          {showForm ? "Fermer" : "+ Programmer"}
        </button>
      </div>

      {creerState.error && (
        <p className="mt-2 rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">{creerState.error}</p>
      )}

      {showForm && (
        agentId ? (
          <form action={creerAction} className="mt-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="demande_id" value={demandeId} />
            <input type="hidden" name="bien_id" value={bienId} />
            <input type="hidden" name="client_id" value={clientId} />
            <input type="hidden" name="agent_id" value={agentId} />
            <div>
              <label className="mb-1 block text-[11px] font-medium text-phoebe-anthracite/60">Créneau</label>
              <input type="datetime-local" name="creneau" required className={inputClass} />
            </div>
            <button type="submit" disabled={creerPending} className={btnClass}>
              {creerPending ? "…" : "Créer la visite"}
            </button>
          </form>
        ) : (
          <p className="mt-2 text-xs text-phoebe-anthracite/60">
            Un agent doit d&apos;abord être affecté à la demande pour programmer une visite.
          </p>
        )
      )}

      {statutState.error && (
        <p className="mt-2 rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">{statutState.error}</p>
      )}

      {visites.length > 0 && (
        <div className="mt-3 space-y-2">
          {visites.map((v) => (
            <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-phoebe-pearl bg-phoebe-pearl/50 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-phoebe-anthracite">
                  {new Date(v.creneau).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUT_VISITE_COLORS[v.statut] ?? ""}`}>
                  {STATUT_VISITE_LABELS[v.statut] ?? v.statut}
                </span>
              </div>
              <form action={statutAction} className="flex items-center gap-1.5">
                <input type="hidden" name="visite_id" value={v.id} />
                <select name="statut" defaultValue={v.statut} key={`vs-${v.id}-${v.statut}`} className="rounded-lg border border-phoebe-anthracite/15 bg-white px-2 py-1 text-[11px] text-phoebe-anthracite">
                  {STATUTS_VISITE.map((s) => (
                    <option key={s} value={s}>{STATUT_VISITE_LABELS[s]}</option>
                  ))}
                </select>
                <button type="submit" disabled={statutPending} className="rounded-lg border border-phoebe-anthracite/15 px-2 py-1 text-[11px] font-semibold text-phoebe-anthracite/70 transition-colors hover:border-phoebe-green hover:text-phoebe-green">
                  OK
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
