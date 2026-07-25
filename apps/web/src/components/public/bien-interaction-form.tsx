"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { creerDemandeImmobilier, type ImmobilierState } from "@/app/actions/immobilier"
import { TYPES_DEMANDE, TYPE_DEMANDE_LABELS } from "@/lib/immobilier"

const inputClass =
  "w-full rounded-xl border border-public-border bg-public-bg px-4 py-2.5 text-sm text-public-text placeholder:text-public-text-faint transition-all duration-200 focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/20"

export function BienInteractionForm({
  bienId,
  isLoggedIn,
}: {
  bienId: string
  isLoggedIn: boolean
}) {
  const [state, action, pending] = useActionState<ImmobilierState, FormData>(creerDemandeImmobilier, {})
  const [type, setType] = useState<string>("information")

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-public-border bg-public-bg-card p-6">
        <p className="text-sm text-public-text-muted">
          Connectez-vous pour demander une information, réserver une visite ou faire une offre sur ce bien.
        </p>
        <Link
          href={`/connexion?redirect=/immobilier/${bienId}`}
          className="mt-4 block rounded-xl bg-accent-green px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-green-hover"
        >
          Se connecter
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="rounded-2xl border border-public-border bg-public-bg-card p-6">
      <input type="hidden" name="bien_id" value={bienId} />
      <input type="hidden" name="type" value={type} />

      <h2 className="text-base font-semibold text-public-text">Ce bien vous intéresse ?</h2>

      {state.error && (
        <p role="alert" className="mt-3 rounded-xl border border-error/20 bg-error/5 px-4 py-2.5 text-sm text-error">
          {state.error}
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {TYPES_DEMANDE.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-all ${
              type === t
                ? "border-accent-green bg-accent-green/10 text-accent-green"
                : "border-public-border text-public-text-muted hover:border-accent-green/40"
            }`}
          >
            {t === "information" ? "Info" : t === "visite" ? "Visite" : "Offre"}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {type === "visite" && (
          <div>
            <label htmlFor="date_souhaitee" className="mb-1.5 block text-sm font-medium text-public-text">
              Date souhaitée
            </label>
            <input id="date_souhaitee" name="date_souhaitee" type="date" className={`${inputClass} [color-scheme:dark]`} />
          </div>
        )}

        {type === "offre" && (
          <div>
            <label htmlFor="montant" className="mb-1.5 block text-sm font-medium text-public-text">
              Votre offre (FCFA) *
            </label>
            <input id="montant" name="montant" type="number" inputMode="numeric" min="0" required placeholder="Ex : 25 000 000" className={inputClass} />
          </div>
        )}

        <div>
          <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-public-text">
            Message {type === "information" ? "" : "(optionnel)"}
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            placeholder={
              type === "offre"
                ? "Conditions, financement, délai…"
                : type === "visite"
                  ? "Créneau préféré, précisions…"
                  : "Votre question sur ce bien…"
            }
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-xl bg-accent-green px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-green-hover active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Envoi…" : `Envoyer ma ${TYPE_DEMANDE_LABELS[type].toLowerCase()}`}
      </button>
      <p className="mt-3 text-center text-xs text-public-text-faint">
        Sans engagement — notre équipe vous recontacte.
      </p>
    </form>
  )
}
