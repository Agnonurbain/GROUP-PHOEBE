"use client"

import { useActionState, useState, useTransition } from "react"
import {
  deposerPieceDossier,
  lienPieceDossier,
  type AssistanceState,
} from "@/app/actions/assistance"
import {
  TYPES_DOCUMENT,
  TYPE_DOCUMENT_LABELS,
  STATUT_DOCUMENT_LABELS,
  type TypeDocument,
} from "@/lib/assistance"
import { Obligatoire } from "@/components/ui/obligatoire"
import { useT } from "@/lib/langue-context"
import { remplir } from "@/lib/i18n/format"

export type PieceClient = {
  id: string
  type_document: string
  statut: string
  commentaire: string | null
}

const COULEURS: Record<string, string> = {
  soumis: "text-accent-gold",
  valide: "text-accent-green",
  rejete: "text-error",
}

/**
 * Pièces d'un dossier visa ou études.
 *
 * Le statut `pieces_complementaires_requises` demandait des documents qu'aucun
 * canal ne permettait d'envoyer : `documents_dossier_voyage` existait depuis la
 * migration initiale sans une ligne de code. Le client peut désormais déposer,
 * voir ce qui a été validé, et lire pourquoi une pièce a été rejetée.
 */
export function DossierPieces({
  dossierId,
  pieces,
}: {
  dossierId: string
  pieces: PieceClient[]
}) {
  const t = useT()
  const [ouvert, setOuvert] = useState(false)
  const [state, action, enCours] = useActionState<AssistanceState, FormData>(
    deposerPieceDossier,
    {}
  )

  return (
    <details
      className="w-full max-w-xs rounded-xl border border-public-border p-3"
      open={ouvert}
      onToggle={(e) => setOuvert((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer text-xs font-medium text-public-text">
        {remplir(t.divers.mesPieces, { n: pieces.length })}
      </summary>

      {pieces.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {pieces.map((p) => (
            <li key={p.id} className="text-[11px]">
              <LignePiece piece={p} />
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="mt-3 space-y-2 border-t border-public-border pt-3">
        <input type="hidden" name="dossier_id" value={dossierId} />

        <label htmlFor={`type-${dossierId}`} className="block text-[11px] font-medium">
          {t.divers.ajouterPiece}<Obligatoire />
        </label>
        <select
          id={`type-${dossierId}`}
          name="type_document"
          required
          defaultValue=""
          className="w-full rounded-lg border border-public-border bg-public-bg px-2 py-1.5 text-xs"
        >
          <option value="" disabled>{t.divers.typePiece}</option>
          {TYPES_DOCUMENT.map((t) => (
            <option key={t} value={t}>{TYPE_DOCUMENT_LABELS[t as TypeDocument]}</option>
          ))}
        </select>
        <label htmlFor={`fichier-${dossierId}`} className="block text-[11px] font-medium">
          Fichier<Obligatoire />
        </label>
        <input
          id={`fichier-${dossierId}`}
          name="fichier"
          type="file"
          accept="application/pdf,image/*"
          required
          className="w-full rounded-lg border border-public-border bg-public-bg px-2 py-1.5 text-xs"
        />

        {state.error && (
          <p role="alert" className="text-[11px] text-error">{state.error}</p>
        )}
        {state.success && (
          <p role="status" className="text-[11px] text-accent-green">
            Pièce envoyée — notre équipe la vérifie.
          </p>
        )}

        <button
          type="submit"
          disabled={enCours}
          className="w-full rounded-lg bg-accent-gold px-3 py-1.5 text-[11px] font-semibold text-[#0A0A0A] disabled:opacity-50"
        >
          {enCours ? "Envoi…" : "Envoyer"}
        </button>
        <p className="text-[10px] text-public-text-faint">
          PDF ou image. Redéposer une pièce rejetée la remplace.
        </p>
      </form>
    </details>
  )
}

function LignePiece({ piece }: { piece: PieceClient }) {
  const [pending, startTransition] = useTransition()
  const [erreur, setErreur] = useState<string | null>(null)

  // Bucket privé : l'URL est signée au clic, jamais au rendu.
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

  return (
    <div className="flex flex-col">
      <span className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={ouvrir}
          disabled={pending}
          className="text-public-text underline decoration-dotted disabled:opacity-50"
        >
          {TYPE_DOCUMENT_LABELS[piece.type_document as TypeDocument] ?? piece.type_document}
        </button>
        <span className={COULEURS[piece.statut] ?? "text-public-text-muted"}>
          {STATUT_DOCUMENT_LABELS[piece.statut as keyof typeof STATUT_DOCUMENT_LABELS] ?? piece.statut}
        </span>
      </span>
      {/* Le motif du rejet : sans lui, le client redépose la même pièce. */}
      {piece.commentaire && (
        <span className="text-[10px] text-error">{piece.commentaire}</span>
      )}
      {erreur && <span className="text-[10px] text-error">{erreur}</span>}
    </div>
  )
}
