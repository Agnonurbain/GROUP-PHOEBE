"use client"

import { useActionState, useState } from "react"
import {
  envoyerMessageDossier,
  type AssistanceState,
  type MessageDossier,
} from "@/app/actions/assistance"
import { Obligatoire } from "@/components/ui/obligatoire"
import { useT } from "@/lib/langue-context"

const dateHeure = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })

/**
 * Écrire à l'équipe au sujet d'un dossier.
 *
 * « Au cas où ils veulent avoir plus de renseignements, il faut qu'il y ait
 * l'option écrire à l'équipe. » Le formulaire de contact général existait déjà,
 * mais il ne sait pas de quel dossier on parle : l'équipe recevait « j'ai une
 * question sur mon visa » sans rien pour le raccrocher.
 *
 * Le fil va dans les deux sens. Le retour ne demandait que le sens client →
 * équipe, mais une question sans canal de réponse est un cul-de-sac : la
 * réponse serait donnée par téléphone, hors de toute trace.
 *
 * `variante` change l'habillage sans changer le fond : le back-office est sur
 * fond clair, le site public sur fond sombre.
 */
export function MessageEquipe({
  dossierId,
  messages,
  variante = "client",
}: {
  dossierId: string
  messages: MessageDossier[]
  variante?: "client" | "admin"
}) {
  const t = useT()
  const [ouvert, setOuvert] = useState(messages.length > 0)
  const [state, action, enCours] = useActionState<AssistanceState, FormData>(
    envoyerMessageDossier,
    {}
  )

  const admin = variante === "admin"
  const cadre = admin
    ? "rounded-lg border border-phoebe-pearl bg-phoebe-pearl/20 p-3"
    : "rounded-xl border border-public-border bg-public-bg p-3"
  const champ = admin
    ? "w-full rounded-lg border border-phoebe-anthracite/15 bg-white px-2.5 py-1.5 text-xs"
    : "w-full rounded-lg border border-public-border bg-public-bg-card px-2.5 py-1.5 text-xs text-public-text"
  const discret = admin ? "text-phoebe-anthracite/60" : "text-public-text-faint"
  const normal = admin ? "text-phoebe-anthracite" : "text-public-text"

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className={`text-xs underline decoration-dotted ${discret} hover:opacity-80`}
      >
        {admin ? "Répondre au client" : "Écrire à l'équipe"}
      </button>
    )
  }

  return (
    <div className={`w-full max-w-lg ${cadre}`}>
      <p className={`text-[11px] font-semibold ${normal}`}>
        {admin ? "Échanges avec le client" : "Échanges avec l'équipe"}
        {messages.length > 0 && ` (${messages.length})`}
      </p>

      {messages.length > 0 && (
        <ul className="mt-2 space-y-2">
          {messages.map((m) => (
            <li key={m.id} className="text-[11px]">
              <p className={discret}>
                <span className={`font-medium ${m.auteur_role === "equipe" ? "text-accent-gold" : normal}`}>
                  {m.auteur_role === "equipe" ? "GROUP PHOEBE" : m.auteur_nom}
                </span>{" "}
                · {dateHeure(m.created_at)}
              </p>
              <p className={`mt-0.5 whitespace-pre-wrap ${normal}`}>{m.message}</p>
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="mt-3 space-y-1.5">
        <input type="hidden" name="dossier_id" value={dossierId} />
        <label htmlFor={`msg-${dossierId}`} className={`block text-[11px] font-medium ${discret}`}>
          {admin ? "Votre réponse" : "Votre message à l'équipe"}<Obligatoire />
        </label>
        <textarea
          id={`msg-${dossierId}`}
          name="message"
          rows={2}
          required
          maxLength={4000}
          placeholder={admin ? "Votre réponse…" : "Votre question sur ce dossier…"}
          className={champ}
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={enCours}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50 ${
              admin
                ? "bg-phoebe-green text-white"
                : "bg-accent-blue text-white"
            }`}
          >
            {enCours ? "…" : "Envoyer"}
          </button>
          {state.success && (
            <span role="status" className="text-[11px] text-accent-green">{t.divers.envoye}</span>
          )}
          {state.error && (
            <span role="alert" className="text-[11px] text-error">{state.error}</span>
          )}
        </div>
      </form>
    </div>
  )
}
