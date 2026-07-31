"use client"

import { useState, useTransition } from "react"
import { telechargerFacture } from "@/app/actions/factures"

/**
 * Le lien n'est pas rendu avec la page : il est signé au clic. Une URL signée
 * au rendu expirerait avant même que le client ne clique, et allonger sa
 * validité pour compenser laisserait traîner un accès à un document qui porte
 * ses coordonnées et ses montants.
 */
export function TelechargerFacture({
  factureId,
  label,
}: {
  factureId: string
  label: string
}) {
  const [pending, startTransition] = useTransition()
  const [erreur, setErreur] = useState<string | null>(null)

  function ouvrir() {
    setErreur(null)
    startTransition(async () => {
      const res = await telechargerFacture(factureId)
      if (res.error || !res.pdf_url) {
        setErreur(res.error ?? "Facture indisponible.")
        return
      }
      window.open(res.pdf_url, "_blank", "noopener,noreferrer")
    })
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={ouvrir}
        disabled={pending}
        className="text-xs text-public-text-muted transition-colors hover:text-accent-gold disabled:opacity-50"
      >
        {pending ? "…" : label}
      </button>
      {erreur && (
        <p role="alert" className="max-w-[12rem] text-right text-[11px] text-error">
          {erreur}
        </p>
      )}
    </div>
  )
}
