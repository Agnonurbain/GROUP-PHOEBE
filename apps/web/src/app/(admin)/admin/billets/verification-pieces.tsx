"use client"

import { useActionState, useState, useTransition } from "react"
import {
  verifierPieceBillet,
  lienPieceBillet,
  type BilletState,
} from "@/app/actions/billets"

type Piece = "fievre_jaune" | "autorisation_mineur"

/**
 * Vérification d'une pièce de billet.
 *
 * Les deux drapeaux étaient affichés avec un « Vérifié » ou un « À régulariser »
 * et n'étaient écrits par personne : ils restaient NULL indéfiniment. Les
 * actions existaient depuis 00073 — et n'étaient branchées nulle part, ce qui
 * revenait au même. C'est ce composant qui ferme la boucle.
 */
export function VerificationPiece({
  demandeId,
  piece,
  declaree,
  valide,
  aUnDocument,
}: {
  demandeId: string
  piece: Piece
  declaree: boolean
  valide: boolean | null
  aUnDocument: boolean
}) {
  const [state, action, enCours] = useActionState<BilletState, FormData>(
    verifierPieceBillet,
    {}
  )
  const [pending, startTransition] = useTransition()
  const [erreur, setErreur] = useState<string | null>(null)

  // Bucket privé : l'URL est signée au clic, jamais au rendu.
  function ouvrir() {
    setErreur(null)
    startTransition(async () => {
      const res = await lienPieceBillet(demandeId, piece)
      if (res.error || !res.url) {
        setErreur(res.error ?? "Indisponible.")
        return
      }
      window.open(res.url, "_blank", "noopener,noreferrer")
    })
  }

  // Rien à vérifier tant que le client n'a rien déclaré : proposer de valider
  // une pièce absente ferait cocher une case pour un document qui n'existe pas.
  if (!declaree) return null

  const traite = state.success || valide !== null

  return (
    <span className="ml-1.5 inline-flex flex-wrap items-center gap-1.5">
      {aUnDocument && (
        <button
          type="button"
          onClick={ouvrir}
          disabled={pending}
          className="text-phoebe-green underline decoration-dotted disabled:opacity-50"
        >
          {pending ? "…" : "Voir"}
        </button>
      )}

      {!traite && (
        <>
          <form action={action} className="inline">
            <input type="hidden" name="demande_id" value={demandeId} />
            <input type="hidden" name="piece" value={piece} />
            <input type="hidden" name="valide" value="1" />
            <button
              type="submit"
              disabled={enCours}
              className="rounded bg-phoebe-green px-1.5 py-0.5 text-[10px] font-semibold text-white disabled:opacity-50"
            >
              Valider
            </button>
          </form>
          <form action={action} className="inline">
            <input type="hidden" name="demande_id" value={demandeId} />
            <input type="hidden" name="piece" value={piece} />
            <input type="hidden" name="valide" value="0" />
            <button
              type="submit"
              disabled={enCours}
              className="rounded border border-error/40 px-1.5 py-0.5 text-[10px] font-semibold text-error disabled:opacity-50"
            >
              Refuser
            </button>
          </form>
        </>
      )}

      {(state.error || erreur) && (
        <span role="alert" className="text-[10px] text-error">
          {state.error ?? erreur}
        </span>
      )}
    </span>
  )
}
