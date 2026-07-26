"use client"

import { useActionState } from "react"
import { payerPrixNegocie, type NegociationState } from "@/app/actions/negociation"

export function PayerAcompte({
  demandeId,
  montant,
  isAchat,
}: {
  demandeId: string
  montant: number
  isAchat: boolean
}) {
  const [state, action, isPending] = useActionState<NegociationState, FormData>(
    payerPrixNegocie,
    {}
  )

  return (
    <form action={action} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="demande_id" value={demandeId} />
      <span className="text-xs font-semibold text-accent-gold">
        {isAchat ? "Acompte" : "À payer"} : {montant.toLocaleString("fr-FR")} FCFA
      </span>
      <div className="flex gap-1.5">
        <button
          type="submit"
          name="methode_paiement"
          value="stripe"
          disabled={isPending}
          className="rounded-lg bg-accent-gold px-3 py-1.5 text-xs font-semibold text-[#0A0A0A] transition-all hover:bg-accent-gold-hover active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? "…" : "Carte"}
        </button>
        <button
          type="submit"
          name="methode_paiement"
          value="cinetpay"
          disabled={isPending}
          className="rounded-lg border border-accent-gold/50 px-3 py-1.5 text-xs font-semibold text-accent-gold transition-all hover:bg-accent-gold/10 active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? "…" : "Mobile Money"}
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
