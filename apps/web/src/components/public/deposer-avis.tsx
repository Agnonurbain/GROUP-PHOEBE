"use client"

import { useActionState, useState } from "react"
import { soumettreAvis, type AvisState } from "@/app/actions/avis"

/**
 * Dépôt d'un avis.
 *
 * `soumettreAvis` existait sans qu'aucun composant ne l'appelle : personne ne
 * pouvait déposer d'avis, sur aucun module. `/avis` n'avait donc rien à publier
 * et la modération tournait à vide.
 *
 * Volontairement replié par défaut : l'écran « Mes réservations » est déjà
 * dense, et un formulaire ouvert sur chaque ligne terminée le noierait.
 */
export function DeposerAvis({
  referenceTable,
  referenceId,
}: {
  referenceTable: string
  referenceId: string
}) {
  const [ouvert, setOuvert] = useState(false)
  const [note, setNote] = useState(0)
  const [state, action, enCours] = useActionState<AvisState, FormData>(soumettreAvis, {})

  if (state.success) {
    return (
      <p role="status" className="text-[11px] text-accent-green">
        Merci — votre avis sera publié après relecture.
      </p>
    )
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="text-xs text-public-text-muted transition-colors hover:text-accent-gold"
      >
        Donner mon avis
      </button>
    )
  }

  return (
    <form action={action} className="w-full max-w-xs space-y-2 rounded-xl border border-public-border p-3">
      <input type="hidden" name="reference_table" value={referenceTable} />
      <input type="hidden" name="reference_id" value={referenceId} />
      <input type="hidden" name="note" value={note} />

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNote(n)}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            aria-pressed={note === n}
            className={`text-lg leading-none transition-colors ${
              n <= note ? "text-accent-gold" : "text-public-text-faint hover:text-accent-gold/60"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <input
        name="titre"
        placeholder="Titre (facultatif)"
        className="w-full rounded-lg border border-public-border bg-public-bg px-3 py-1.5 text-sm"
      />
      <textarea
        name="commentaire"
        rows={3}
        placeholder="Votre expérience…"
        className="w-full rounded-lg border border-public-border bg-public-bg px-3 py-1.5 text-sm"
      />

      {state.error && (
        <p role="alert" className="text-[11px] text-error">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enCours || note === 0}
          className="flex-1 rounded-lg bg-accent-gold px-3 py-2 text-xs font-semibold text-[#0A0A0A] disabled:opacity-50"
        >
          {enCours ? "…" : note === 0 ? "Choisissez une note" : "Envoyer"}
        </button>
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="rounded-lg border border-public-border px-3 py-2 text-xs"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
