"use client"

import { useActionState } from "react"
import { proposerContreOffre, type ContreOffreState } from "@/app/actions/immobilier"
import { plancherContreOffre } from "@/lib/immobilier"
import { Obligatoire } from "@/components/ui/obligatoire"

const btnPrimary =
  "rounded-lg bg-phoebe-green px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-phoebe-green-deep disabled:opacity-50"
const inputClass =
  "w-40 rounded-lg border border-phoebe-anthracite/15 bg-white px-3 py-2 text-xs text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/20"

/**
 * Contre-offre : visible uniquement pour le propriétaire, et seulement sur une
 * demande de type « offre » encore négociable. Un opérateur n'écrit pas de
 * montant (cf. garde côté action + trigger base).
 */
export function ContreOffreForm({
  demandeId,
  montantOffre,
  prixBien,
  tauxMaxReduction,
  montantContreOffre,
}: {
  demandeId: string
  montantOffre: number
  prixBien: number
  tauxMaxReduction: number
  montantContreOffre: number | null
}) {
  const [state, action, pending] = useActionState<ContreOffreState, FormData>(proposerContreOffre, {})

  const plancher = plancherContreOffre(prixBien, tauxMaxReduction)
  const borneBasse = Math.max(plancher, montantOffre + 1)

  return (
    <div className="mt-4 rounded-xl border border-phoebe-gold/30 bg-phoebe-gold/5 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-phoebe-gold-dark">
          Contre-offre
        </h4>
        <p className="text-[11px] text-phoebe-anthracite/70">
          Offre client {montantOffre.toLocaleString("fr-FR")} FCFA · prix affiché{" "}
          {prixBien.toLocaleString("fr-FR")} FCFA · remise max {tauxMaxReduction} %
        </p>
      </div>

      {montantContreOffre != null && (
        <p className="mt-2 text-xs text-phoebe-anthracite/70">
          Contre-offre en cours :{" "}
          <span className="font-semibold text-phoebe-anthracite">
            {montantContreOffre.toLocaleString("fr-FR")} FCFA
          </span>
        </p>
      )}

      {state.error && (
        <p role="alert" className="mt-2 rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mt-2 rounded-lg border border-phoebe-green/20 bg-phoebe-green/5 px-3 py-2 text-xs text-phoebe-green-deep">
          Contre-offre envoyée au client.
        </p>
      )}

      <form action={action} className="mt-3 flex flex-wrap items-end gap-2">
        <input type="hidden" name="demande_id" value={demandeId} />
        <div>
          <label htmlFor={`co-${demandeId}`} className="block text-[11px] font-medium text-phoebe-anthracite">
            Montant proposé (FCFA)<Obligatoire />
          </label>
          <input
            id={`co-${demandeId}`}
            name="montant"
            type="number"
            min={borneBasse}
            max={prixBien}
            step={1000}
            required
            defaultValue={montantContreOffre ?? ""}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "…" : "Envoyer la contre-offre"}
        </button>
        <p className="text-[11px] text-phoebe-anthracite/60">
          Entre {borneBasse.toLocaleString("fr-FR")} et {prixBien.toLocaleString("fr-FR")} FCFA
        </p>
      </form>
    </div>
  )
}
