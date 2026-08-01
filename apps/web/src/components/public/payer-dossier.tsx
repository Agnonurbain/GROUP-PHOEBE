"use client"

import { useActionState } from "react"
import { payerDossierVoyage, type AssistanceState } from "@/app/actions/assistance"

/**
 * Règlement d'un dossier visa ou études.
 *
 * Le dossier n'était jamais facturé : `montant_estime` était écrit depuis le
 * tarif et aucun paiement n'était créé. Le service était rendu, jamais encaissé,
 * et le client ne voyait même pas le montant.
 */
export function PayerDossier({
  dossierId,
  montant,
}: {
  dossierId: string
  montant: number
}) {
  const [state, action, enCours] = useActionState<AssistanceState, FormData>(
    payerDossierVoyage,
    {}
  )

  return (
    <form action={action} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="dossier_id" value={dossierId} />
      <span className="text-xs font-semibold text-accent-gold">
        À régler : {montant.toLocaleString("fr-FR")} FCFA
      </span>
      <div className="flex gap-1.5">
        <button
          type="submit"
          name="methode_paiement"
          value="stripe"
          disabled={enCours}
          className="rounded-lg bg-accent-gold px-3 py-1.5 text-xs font-semibold text-[#0A0A0A] transition-all hover:bg-accent-gold-hover active:scale-[0.98] disabled:opacity-50"
        >
          {enCours ? "…" : "Carte"}
        </button>
        <button
          type="submit"
          name="methode_paiement"
          value="cinetpay"
          disabled={enCours}
          className="rounded-lg border border-accent-gold/50 px-3 py-1.5 text-xs font-semibold text-accent-gold transition-all hover:bg-accent-gold/10 active:scale-[0.98] disabled:opacity-50"
        >
          {enCours ? "…" : "Mobile Money"}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="max-w-[12rem] text-right text-[11px] text-error">
          {state.error}
        </p>
      )}
    </form>
  )
}
