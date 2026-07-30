"use client"

import { useActionState } from "react"
import {
  changerStatutBillet,
  proposerDevisBillet,
  affecterConseillerBillet,
  type BilletState,
} from "@/app/actions/billets"
import { STATUTS_BILLET, STATUT_BILLET_LABELS } from "@/lib/billets"

const btnPrimary =
  "rounded-lg bg-phoebe-green px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-phoebe-green-deep disabled:opacity-50"
const btnGhost =
  "rounded-lg border border-phoebe-anthracite/15 px-3 py-2 text-xs font-semibold text-phoebe-anthracite/80 transition-colors hover:border-phoebe-green hover:text-phoebe-green disabled:opacity-50"
const selectClass =
  "rounded-lg border border-phoebe-anthracite/15 bg-white px-3 py-2 text-xs text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/20"

export function BilletActions({
  demandeId,
  statut,
  conseillerId,
  conseillers,
  montantPropose,
  estProprietaire,
  ouverte,
}: {
  demandeId: string
  statut: string
  conseillerId: string | null
  conseillers: { id: string; nom: string }[]
  montantPropose: number | null
  /** Chiffrer un billet écrit un montant : propriétaire seul. */
  estProprietaire: boolean
  ouverte: boolean
}) {
  const [statutState, statutAction, statutPending] = useActionState<BilletState, FormData>(changerStatutBillet, {})
  const [devisState, devisAction, devisPending] = useActionState<BilletState, FormData>(proposerDevisBillet, {})
  const [conseillerState, conseillerAction, conseillerPending] = useActionState<BilletState, FormData>(affecterConseillerBillet, {})

  const erreur = statutState.error || devisState.error || conseillerState.error
  const succes = statutState.success || devisState.success || conseillerState.success

  return (
    <div className="mt-4 border-t border-phoebe-pearl pt-4">
      {erreur && (
        <p role="alert" className="mb-3 rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
          {erreur}
        </p>
      )}
      {succes && (
        <p className="mb-3 rounded-lg border border-phoebe-green/20 bg-phoebe-green/5 px-3 py-2 text-xs text-phoebe-green-deep">
          Enregistré.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <form action={statutAction} className="flex items-center gap-2">
          <input type="hidden" name="demande_id" value={demandeId} />
          <label htmlFor={`st-${demandeId}`} className="sr-only">Statut</label>
          <select
            id={`st-${demandeId}`}
            name="statut"
            defaultValue={statut}
            key={`${demandeId}-${statut}`}
            className={selectClass}
          >
            {STATUTS_BILLET.map((s) => (
              <option key={s} value={s}>{STATUT_BILLET_LABELS[s]}</option>
            ))}
          </select>
          <button type="submit" disabled={statutPending} className={btnPrimary}>
            {statutPending ? "…" : "Mettre à jour"}
          </button>
        </form>

        <form action={conseillerAction} className="flex items-center gap-2">
          <input type="hidden" name="demande_id" value={demandeId} />
          <label htmlFor={`cons-${demandeId}`} className="sr-only">Conseiller</label>
          <select
            id={`cons-${demandeId}`}
            name="conseiller_id"
            defaultValue={conseillerId ?? ""}
            key={`${demandeId}-${conseillerId ?? "null"}`}
            className={selectClass}
          >
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

      {estProprietaire && ouverte && statut !== "payee" && (
        <form action={devisAction} className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-phoebe-gold/30 bg-phoebe-gold/5 p-4">
          <input type="hidden" name="demande_id" value={demandeId} />
          <div>
            <label htmlFor={`devis-${demandeId}`} className="block text-[11px] font-medium text-phoebe-anthracite">
              Prix du billet (FCFA)
            </label>
            <input
              id={`devis-${demandeId}`}
              name="montant"
              type="number"
              min={1}
              step={1000}
              required
              defaultValue={montantPropose ?? ""}
              className="mt-1 w-40 rounded-lg border border-phoebe-anthracite/15 bg-white px-3 py-2 text-xs text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/20"
            />
          </div>
          <button type="submit" disabled={devisPending} className={btnPrimary}>
            {devisPending ? "…" : montantPropose != null ? "Réviser le devis" : "Envoyer le devis"}
          </button>
          <p className="text-[11px] text-phoebe-anthracite/60">
            Le client est prévenu et le statut passe à « Devis envoyé ».
          </p>
        </form>
      )}

      {!estProprietaire && ouverte && (
        <p className="mt-3 text-xs text-phoebe-anthracite/60">
          Le chiffrage du billet est réservé au propriétaire.
        </p>
      )}
    </div>
  )
}
