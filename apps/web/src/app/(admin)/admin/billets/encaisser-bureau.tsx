"use client"

import { useActionState } from "react"
import { encaisserAuBureau, type BilletState } from "@/app/actions/billets"

/**
 * Enregistrer un règlement reçu au bureau.
 *
 * L'exploitant a demandé que le paiement en ligne cesse d'être obligatoire :
 * « on laisse la possibilité aux gens de venir payer au bureau ou en ligne ».
 * Sans ce bouton, l'argent rentrerait au comptoir et le système afficherait
 * « en attente » indéfiniment — la moitié d'une fonctionnalité.
 *
 * Volontairement discret et sans confirmation : c'est un geste courant au
 * comptoir, et l'écran ne l'affiche que s'il reste un montant en attente.
 */
export function EncaisserAuBureau({
  referenceTable,
  referenceId,
  montant,
}: {
  referenceTable: "demandes_billet" | "dossiers_voyage"
  referenceId: string
  montant: number
}) {
  const [state, action, enCours] = useActionState<BilletState, FormData>(
    encaisserAuBureau,
    {}
  )

  if (state.success) {
    return (
      <span role="status" className="text-[11px] font-medium text-phoebe-green-deep">
        Encaissé au bureau ✓
      </span>
    )
  }

  return (
    <form action={action} className="inline-flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="reference_table" value={referenceTable} />
      <input type="hidden" name="reference_id" value={referenceId} />
      <button
        type="submit"
        disabled={enCours}
        className="rounded-lg border border-phoebe-green/50 px-2 py-1 text-[11px] font-semibold text-phoebe-green-deep transition-colors hover:bg-phoebe-green/10 disabled:opacity-50"
      >
        {enCours ? "…" : `Encaisser ${montant.toLocaleString("fr-FR")} FCFA au bureau`}
      </button>
      {state.error && (
        <span role="alert" className="text-[11px] text-error">
          {state.error}
        </span>
      )}
    </form>
  )
}
