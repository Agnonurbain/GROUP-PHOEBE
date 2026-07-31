"use client"

import { useState, useTransition } from "react"
import { preuveDeLivraison } from "@/app/actions/livreur"

/**
 * Comme pour les factures : l'URL signée est demandée au clic, pas au rendu.
 * Signée à l'affichage, elle expirerait avant que le client ne clique.
 */
export function PreuveLivraison({
  expeditionId,
  recuPar,
  livreeAt,
}: {
  expeditionId: string
  recuPar: string | null
  livreeAt: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [erreur, setErreur] = useState<string | null>(null)

  function ouvrir() {
    setErreur(null)
    startTransition(async () => {
      const res = await preuveDeLivraison(expeditionId)
      if (res.error || !res.url) {
        setErreur(res.error ?? "Preuve indisponible.")
        return
      }
      window.open(res.url, "_blank", "noopener,noreferrer")
    })
  }

  const quand = livreeAt
    ? new Date(livreeAt).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  return (
    <div className="flex flex-col items-end">
      <span className="text-[11px] text-public-text-muted">
        {recuPar ? `Reçu par ${recuPar}` : "Colis remis"}
        {quand ? ` · ${quand}` : ""}
      </span>
      <button
        type="button"
        onClick={ouvrir}
        disabled={pending}
        className="text-xs text-public-text-muted transition-colors hover:text-accent-gold disabled:opacity-50"
      >
        {pending ? "…" : "Voir la preuve de remise"}
      </button>
      {erreur && (
        <p role="alert" className="max-w-[12rem] text-right text-[11px] text-error">
          {erreur}
        </p>
      )}
    </div>
  )
}
