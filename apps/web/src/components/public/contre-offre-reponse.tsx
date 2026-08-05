"use client"

import { useState, useTransition } from "react"
import { repondreContreOffre } from "@/app/actions/immobilier"
import { Button } from "@/components/ui"
import { useT } from "@/lib/langue-context"

/**
 * Réponse du client à une contre-offre du propriétaire. Deux issues seulement :
 * accepter (le bien passe en réservé) ou refuser (il est libéré). Le refus
 * demande une confirmation — il ferme la négociation sans retour possible.
 */
export function ContreOffreReponse({
  demandeId,
  montant,
}: {
  demandeId: string
  montant: number
}) {
  const t = useT()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmeRefus, setConfirmeRefus] = useState(false)

  function repondre(reponse: "accepter" | "refuser") {
    setError(null)
    startTransition(async () => {
      const res = await repondreContreOffre(demandeId, reponse)
      if (res.error) setError(res.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <p className="text-xs text-public-text-muted">
        Contre-offre :{" "}
        <span className="font-bold text-public-text">{montant.toLocaleString("fr-FR")} FCFA</span>
      </p>

      {error && (
        <p role="alert" className="max-w-xs text-right text-xs text-[#EF4444]">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="green"
          size="sm"
          disabled={pending}
          onClick={() => repondre("accepter")}
        >
          {pending ? "…" : "Accepter"}
        </Button>

        {confirmeRefus ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={() => repondre("refuser")}
          >
            {t.divers.confirmerRefus}
          </Button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmeRefus(true)}
            className="text-xs text-public-text-muted transition-colors hover:text-[#EF4444] disabled:opacity-50"
          >
            Refuser
          </button>
        )}
      </div>
    </div>
  )
}
