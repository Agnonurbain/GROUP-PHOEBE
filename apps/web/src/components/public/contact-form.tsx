"use client"

import { useActionState } from "react"
import { Button, Input } from "@/components/ui"
import { envoyerMessageContact, type ContactState } from "@/app/actions/contact"
import { CheckIcon } from "@/components/icons"
import { useT } from "@/lib/langue-context"

const SUJETS = [
  "Transport & Livraison",
  "Immobilier",
  "Assistance Voyages",
  "Partenariat",
  "Autre",
]

export function ContactForm({
  defaultCategory = "Transport & Livraison",
  defaultMessage = "",
}: {
  defaultCategory?: string
  defaultMessage?: string
}) {
  const t = useT()
  const [state, action, pending] = useActionState<ContactState, FormData>(envoyerMessageContact, {})

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-accent-green/20 bg-public-bg-card p-10 text-center">
        <CheckIcon size={48} className="text-accent-green" />
        <h2 className="text-2xl font-bold text-public-text">{t.divers.messageEnvoye}</h2>
        <p className="max-w-sm text-sm text-public-text-muted">
          {t.divers.messageRecu}
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-8">
      {state.error && (
        <p role="alert" className="rounded-xl border border-error/30 bg-error/5 px-5 py-3 text-sm text-error">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="c-prenom" className="text-sm font-medium text-public-text-muted">{t.divers.prenom}</label>
          <Input id="c-prenom" name="prenom" type="text" variant="default" className="mt-1" placeholder="Jean" />
        </div>
        <div>
          <label htmlFor="c-nom" className="text-sm font-medium text-public-text-muted">Nom</label>
          <Input id="c-nom" name="nom" type="text" variant="default" className="mt-1" placeholder={t.divers.exemplePrenom} />
        </div>
      </div>
      <div>
        <label htmlFor="c-email" className="text-sm font-medium text-public-text-muted">Email</label>
        <Input id="c-email" name="email" type="email" variant="default" className="mt-1" placeholder={t.divers.exempleEmail} />
      </div>
      <div>
        <label htmlFor="c-tel" className="text-sm font-medium text-public-text-muted">{t.auth.telephone}</label>
        <Input id="c-tel" name="telephone" type="tel" inputMode="tel" variant="default" className="mt-1" placeholder="+225 01 02 03 04" />
      </div>
      <div>
        <label htmlFor="c-sujet" className="text-sm font-medium text-public-text-muted">Sujet</label>
        <select
          id="c-sujet"
          name="sujet"
          defaultValue={SUJETS.includes(defaultCategory) ? defaultCategory : "Autre"}
          className="mt-1 w-full rounded-lg border border-public-border bg-public-bg px-4 py-2.5 text-sm text-public-text"
        >
          {SUJETS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="c-message" className="text-sm font-medium text-public-text-muted">Message</label>
        <textarea
          id="c-message"
          name="message"
          rows={5}
          defaultValue={defaultMessage}
          className="mt-1 w-full rounded-lg border border-public-border bg-public-bg px-4 py-2.5 text-sm text-public-text placeholder-public-text-faint"
          placeholder={t.divers.exempleMessage}
        />
      </div>
      <Button type="submit" variant="default" disabled={pending} className="w-full">
        {pending ? "Envoi…" : "Envoyer le message"}
      </Button>
    </form>
  )
}
