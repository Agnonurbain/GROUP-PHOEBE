"use client"

import { useActionState } from "react"
import { repondreCreneauVisite, type VisiteState } from "@/app/actions/immobilier"

/**
 * Le créneau était en lecture seule côté client : un opérateur « confirmait »
 * un rendez-vous que personne n'avait accepté, alors que le client a payé des
 * frais de visite non remboursables pour ce déplacement.
 *
 * Décliner ne renonce pas à la visite — l'équipe reproposera un créneau.
 */
export function ReponseCreneauVisite({
  visiteId,
  creneau,
}: {
  visiteId: string
  creneau: string
}) {
  const [state, action, enCours] = useActionState<VisiteState, FormData>(
    repondreCreneauVisite,
    {}
  )

  if (state.success) {
    return (
      <p role="status" className="text-[11px] text-accent-green">
        Réponse enregistrée.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-[11px] text-public-text-muted">Ce créneau vous convient ?</span>
      <div className="flex gap-1.5">
        <form action={action}>
          <input type="hidden" name="visite_id" value={visiteId} />
          <input type="hidden" name="reponse" value="accepte" />
          <button
            type="submit"
            disabled={enCours}
            className="rounded-lg bg-accent-green px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
          >
            {enCours ? "…" : "Je confirme"}
          </button>
        </form>
        <form action={action}>
          <input type="hidden" name="visite_id" value={visiteId} />
          <input type="hidden" name="reponse" value="decline" />
          <button
            type="submit"
            disabled={enCours}
            className="rounded-lg border border-public-border px-2.5 py-1 text-[11px] font-medium text-public-text-muted disabled:opacity-50"
          >
            {enCours ? "…" : "Autre date"}
          </button>
        </form>
      </div>
      <span className="text-[10px] text-public-text-faint">{creneau}</span>
      {state.error && (
        <span role="alert" className="max-w-[12rem] text-right text-[11px] text-error">
          {state.error}
        </span>
      )}
    </div>
  )
}
