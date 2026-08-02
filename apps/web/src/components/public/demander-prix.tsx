"use client"

import { useActionState, useState } from "react"
import {
  creerDemandeNegociation,
  type NegociationState,
} from "@/app/actions/negociation"
import { useT } from "@/lib/langue-context"
import { Obligatoire } from "@/components/ui/obligatoire"

export type LigneNegociation = {
  groupKey: string
  marque: string
  modele: string
  quantite: number
  avecChauffeur: boolean
}

export type CommuneOption = { id: string; nom: string }

const inputClass =
  "w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm text-public-text focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20"
const labelClass = "mb-1 block text-xs font-medium text-public-text"

/**
 * Demande de prix sur une location.
 *
 * Toute la chaîne existait — l'opérateur répond un prix, le client paie, un cron
 * libère le véhicule au bout de 30 minutes — mais `creerDemandeNegociation`
 * n'avait aucun appelant : la négociation était inatteignable, et le cron
 * tournait sur un ensemble vide.
 *
 * Le véhicule est réservé dès l'envoi : c'est voulu, sinon deux clients
 * pourraient négocier le même créneau. L'échéance de 30 minutes est ce qui
 * empêche cette réserve de durer, et le formulaire le dit — un client qui ne
 * sait pas que sa demande expire ne comprend pas de la voir disparaître.
 */
export function DemanderPrix({
  lignes,
  communes,
  delai,
  variante = "principal",
}: {
  lignes: LigneNegociation[]
  communes: CommuneOption[]
  /** Délai réglé en admin, déjà mis en forme (« 4 h », « 30 min »). */
  delai: string
  /** `discret` sur la fiche véhicule, où « Réserver » reste l'action première. */
  variante?: "principal" | "discret"
}) {
  const t = useT()
  const [ouvert, setOuvert] = useState(false)
  const [villeDepart, setVilleDepart] = useState("")
  const [destination, setDestination] = useState("")
  const [state, action, enCours] = useActionState<NegociationState, FormData>(
    creerDemandeNegociation,
    {}
  )

  // Aujourd'hui exclu : une location négociée ne peut pas démarrer avant que
  // l'équipe ait eu le temps de répondre.
  const [demain] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  )

  if (lignes.length === 0) return null

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className={
          variante === "principal"
            ? "w-full rounded-xl border border-accent-gold px-4 py-3 text-sm font-semibold text-accent-gold transition-colors hover:bg-accent-gold/10"
            : "w-full rounded-xl border border-public-border px-4 py-2.5 text-sm font-medium text-public-text-muted transition-colors hover:border-accent-gold hover:text-accent-gold"
        }
      >
        {t.negociation.demanderPrix}
      </button>
    )
  }

  return (
    <form action={action} className="space-y-3 rounded-xl border border-accent-gold/40 bg-accent-gold/5 p-4">
      <div>
        <p className="text-sm font-semibold text-public-text">{t.negociation.titre}</p>
        <p className="mt-0.5 text-xs text-public-text-muted">{t.negociation.explication}</p>
      </div>

      {/* Les lignes voyagent en JSON : l'action attend la même forme que le
          panier, donc une demande d'un véhicule et une demande d'un lot
          empruntent exactement le même chemin serveur. */}
      <input type="hidden" name="lignes" value={JSON.stringify(lignes)} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="neg-debut" className={labelClass}>{t.negociation.du}<Obligatoire /></label>
          <input id="neg-debut" name="debut" type="date" required min={demain} className={inputClass} />
        </div>
        <div>
          <label htmlFor="neg-fin" className={labelClass}>{t.negociation.au}<Obligatoire /></label>
          <input id="neg-fin" name="fin" type="date" required min={demain} className={inputClass} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="neg-depart" className={labelClass}>{t.negociation.villeDepart}</label>
          <select
            id="neg-depart"
            name="ville_depart"
            value={villeDepart}
            onChange={(e) => setVilleDepart(e.target.value)}
            className={inputClass}
          >
            <option value="">{t.negociation.choisir}</option>
            {communes.map((c) => (
              <option key={c.id} value={c.nom}>{c.nom}</option>
            ))}
            <option value="autre">{t.negociation.autre}</option>
          </select>
          {villeDepart === "autre" && (
            <input
              name="ville_depart_autre"
              placeholder={t.negociation.preciser}
              className={`${inputClass} mt-2`}
            />
          )}
        </div>
        <div>
          <label htmlFor="neg-destination" className={labelClass}>{t.negociation.destination}</label>
          <select
            id="neg-destination"
            name="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className={inputClass}
          >
            <option value="">{t.negociation.choisir}</option>
            {communes.map((c) => (
              <option key={c.id} value={c.nom}>{c.nom}</option>
            ))}
            <option value="autre">{t.negociation.autre}</option>
          </select>
          {destination === "autre" && (
            <input
              name="destination_autre"
              placeholder={t.negociation.preciser}
              className={`${inputClass} mt-2`}
            />
          )}
        </div>
      </div>

      <div>
        <label htmlFor="neg-note" className={labelClass}>{t.negociation.votreDemande}</label>
        <textarea
          id="neg-note"
          name="negociation_note"
          rows={3}
          placeholder={t.negociation.exempleNote}
          className={inputClass}
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
          {state.error}
        </p>
      )}

      <p className="text-[11px] text-public-text-muted">
        {t.negociation.delai.replace("{delai}", delai)}
      </p>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enCours}
          className="flex-1 rounded-lg bg-accent-gold px-4 py-2.5 text-sm font-semibold text-[#0A0A0A] disabled:opacity-50"
        >
          {enCours ? t.commun.envoi : t.negociation.envoyer}
        </button>
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="rounded-lg border border-public-border px-4 py-2.5 text-sm text-public-text"
        >
          {t.commun.annuler}
        </button>
      </div>
    </form>
  )
}
