"use client"

import { useActionState, useState, useTransition } from "react"
import {
  verifierPieceDossier,
  lienPieceDossier,
  type AssistanceState,
} from "@/app/actions/assistance"
import { TYPE_DOCUMENT_LABELS, STATUT_DOCUMENT_LABELS, type TypeDocument } from "@/lib/assistance"

export type PieceAdmin = {
  id: string
  type_document: string
  statut: string
  commentaire: string | null
}

const COULEURS: Record<string, string> = {
  soumis: "bg-phoebe-gold/10 text-phoebe-gold-dark",
  valide: "bg-phoebe-green/10 text-phoebe-green-deep",
  rejete: "bg-error/10 text-error",
}

/**
 * Pièces d'un dossier, côté équipe.
 *
 * `documents_dossier_voyage` n'était lu ni écrit nulle part : le statut
 * `pieces_complementaires_requises` réclamait des documents que personne ne
 * pouvait envoyer ni examiner.
 */
export function PiecesSection({ pieces }: { pieces: PieceAdmin[] }) {
  if (pieces.length === 0) {
    return (
      <p className="mt-3 text-xs text-phoebe-anthracite/60">
        Aucune pièce déposée. Le client peut en envoyer depuis « Mes réservations ».
      </p>
    )
  }

  return (
    <div className="mt-3 rounded-lg border border-phoebe-pearl bg-phoebe-pearl/20 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-phoebe-anthracite/70">
        Pièces justificatives
      </p>
      <ul className="mt-2 space-y-2">
        {pieces.map((p) => (
          <li key={p.id}>
            <LignePiece piece={p} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function LignePiece({ piece }: { piece: PieceAdmin }) {
  const [state, action, enCours] = useActionState<AssistanceState, FormData>(
    verifierPieceDossier,
    {}
  )
  const [pending, startTransition] = useTransition()
  const [erreur, setErreur] = useState<string | null>(null)
  const [rejetOuvert, setRejetOuvert] = useState(false)

  // Bucket privé : passeports, diplômes, actes de naissance. Signé au clic.
  function ouvrir() {
    setErreur(null)
    startTransition(async () => {
      const res = await lienPieceDossier(piece.id)
      if (res.error || !res.url) {
        setErreur(res.error ?? "Indisponible.")
        return
      }
      window.open(res.url, "_blank", "noopener,noreferrer")
    })
  }

  const aDecider = piece.statut === "soumis" && !state.success

  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={ouvrir}
          disabled={pending}
          className="font-medium text-phoebe-green underline decoration-dotted disabled:opacity-50"
        >
          {pending
            ? "…"
            : TYPE_DOCUMENT_LABELS[piece.type_document as TypeDocument] ?? piece.type_document}
        </button>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            COULEURS[piece.statut] ?? "bg-phoebe-pearl"
          }`}
        >
          {state.success
            ? "Traitée"
            : STATUT_DOCUMENT_LABELS[piece.statut as keyof typeof STATUT_DOCUMENT_LABELS] ??
              piece.statut}
        </span>

        {aDecider && (
          <span className="flex gap-1.5">
            <form action={action}>
              <input type="hidden" name="document_id" value={piece.id} />
              <input type="hidden" name="decision" value="valide" />
              <button
                type="submit"
                disabled={enCours}
                className="rounded-lg bg-phoebe-green px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
              >
                Valider
              </button>
            </form>
            <button
              type="button"
              onClick={() => setRejetOuvert((v) => !v)}
              className="rounded-lg border border-error/40 px-2.5 py-1 text-[11px] font-semibold text-error"
            >
              Rejeter
            </button>
          </span>
        )}
      </div>

      {piece.commentaire && (
        <p className="text-[11px] text-error">Motif : {piece.commentaire}</p>
      )}

      {/* Le motif est obligatoire : sans lui, le client redépose la même pièce. */}
      {aDecider && rejetOuvert && (
        <form action={action} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="document_id" value={piece.id} />
          <input type="hidden" name="decision" value="rejete" />
          <input
            name="commentaire"
            required
            placeholder="Ce qui ne va pas — le client doit savoir quoi corriger"
            className="min-w-[16rem] flex-1 rounded-lg border border-phoebe-anthracite/15 px-2.5 py-1.5 text-xs"
          />
          <button
            type="submit"
            disabled={enCours}
            className="rounded-lg bg-error px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
          >
            {enCours ? "…" : "Confirmer le rejet"}
          </button>
        </form>
      )}

      {(state.error || erreur) && (
        <p role="alert" className="text-[11px] text-error">
          {state.error ?? erreur}
        </p>
      )}
    </div>
  )
}
