"use client"

import { useActionState } from "react"
import { payerDevisBillet, type BilletState } from "@/app/actions/billets"

export function PayerBillet({
  demandeId,
  total,
}: {
  demandeId: string
  total: number
}) {
  const [state, action, isPending] = useActionState<BilletState, FormData>(
    payerDevisBillet,
    {}
  )

  return (
    <form action={action} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="demande_id" value={demandeId} />
      <span className="text-xs font-semibold text-accent-gold">
        À payer : {total.toLocaleString("fr-FR")} FCFA
      </span>
      {state.success && (
        <p role="status" className="max-w-[14rem] text-right text-[11px] text-accent-green">
          Noté. Présentez-vous à notre bureau pour régler et retirer votre billet.
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-1.5">
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
        {/* Payer en ligne n'est pas une obligation : « on laisse la possibilité
            aux gens de venir payer le billet au bureau ou en ligne ». Sans ce
            troisième bouton, le client sans carte ni Mobile Money serait
            bloqué sur son devis. */}
        <button
          type="submit"
          name="methode_paiement"
          value="agence"
          disabled={isPending}
          className="rounded-lg border border-public-border px-3 py-1.5 text-xs font-semibold text-public-text-muted transition-all hover:text-public-text active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? "…" : "Payer au bureau"}
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
