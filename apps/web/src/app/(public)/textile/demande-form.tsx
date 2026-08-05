"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { ArrowRight, Scissors } from "lucide-react"
import { creerDemandeTextile, type TextileState } from "@/app/actions/textile"
import {
  UNITES_PAGNE,
  UNITE_LABELS,
  type TypePagne,
} from "@/lib/textile"
import { Obligatoire } from "@/components/ui/obligatoire"

const champ =
  "w-full rounded-xl border border-public-border bg-public-bg px-4 py-2.5 text-sm text-public-text placeholder:text-public-text-faint transition-all duration-200 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20"
const label = "mb-1.5 block text-xs font-medium text-public-text-muted"

/**
 * Demande de devis pour du pagne.
 *
 * Il n'y a pas de prix à afficher, et ce n'est pas un oubli : « il y a
 * tellement de fournisseurs qui les vendent à leur prix […] on ne peut pas
 * afficher un prix comme ça ». Le formulaire dit donc ce qu'il fait — il
 * demande, il n'achète pas.
 */
export function DemandeTextileForm({
  isLoggedIn,
  types,
}: {
  isLoggedIn: boolean
  types: TypePagne[]
}) {
  const [state, action, pending] = useActionState<TextileState, FormData>(
    creerDemandeTextile,
    {}
  )
  const [type, setType] = useState(types[0]?.cle ?? "")

  const marques = [...new Set(types.map((t) => t.marque))]
  const choisi = types.find((t) => t.cle === type) ?? null

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-public-border bg-public-bg-card p-8 text-center">
        <Scissors size={28} className="mx-auto text-accent-gold" aria-hidden="true" />
        <p className="mt-3 text-sm text-public-text-muted">
          Connectez-vous pour demander un devis : nous vous répondons avec un prix
          ferme après consultation de nos fournisseurs.
        </p>
        <Link
          href="/connexion?redirect=/textile"
          className="mt-5 inline-block rounded-xl bg-accent-gold px-5 py-3 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-accent-gold-hover"
        >
          Se connecter
        </Link>
      </div>
    )
  }

  if (types.length === 0) {
    return (
      <p className="rounded-2xl border border-public-border bg-public-bg-card p-6 text-sm text-public-text-muted">
        Aucun type de pagne n&apos;est proposé pour le moment. Contactez-nous
        directement.
      </p>
    )
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="type_pagne" value={type} />

      {state.error && (
        <p role="alert" className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
          {state.error}
        </p>
      )}

      {/* Le client choisit d'abord la marque, puis la gamme — c'est ainsi que
          le pagne se demande au marché. */}
      <fieldset className="rounded-2xl border border-public-border bg-public-bg-card p-5">
        <legend className="px-1 text-sm font-semibold text-public-text">
          Quel pagne cherchez-vous ?<Obligatoire />
        </legend>
        <div className="mt-3 space-y-4">
          {marques.map((marque) => (
            <div key={marque}>
              <p className="text-[11px] uppercase tracking-wider text-public-text-faint">
                {marque}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {types
                  .filter((t) => t.marque === marque)
                  .map((t) => (
                    <button
                      key={t.cle}
                      type="button"
                      onClick={() => setType(t.cle)}
                      aria-pressed={type === t.cle}
                      className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                        type === t.cle
                          ? "border-accent-gold bg-accent-gold/10 text-public-text"
                          : "border-public-border text-public-text-muted hover:text-public-text"
                      }`}
                    >
                      {t.gamme}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
        {choisi?.description && (
          <p className="mt-3 text-xs text-public-text-muted">{choisi.description}</p>
        )}
      </fieldset>

      <div className="grid gap-4 rounded-2xl border border-public-border bg-public-bg-card p-5 sm:grid-cols-2">
        <div>
          <label htmlFor="quantite" className={label}>Quantité<Obligatoire /></label>
          <input
            id="quantite"
            name="quantite"
            type="number"
            inputMode="numeric"
            min={1}
            max={10000}
            defaultValue={1}
            required
            className={champ}
          />
        </div>
        <div>
          <label htmlFor="unite" className={label}>Unité<Obligatoire /></label>
          <select id="unite" name="unite" defaultValue="pagne" required className={champ}>
            {UNITES_PAGNE.map((u) => (
              <option key={u} value={u}>{UNITE_LABELS[u]}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="motif" className={label}>Motif recherché</label>
          <input
            id="motif"
            name="motif"
            maxLength={500}
            placeholder="Décrivez le motif, ou laissez vide si vous êtes ouvert"
            className={champ}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="couleurs" className={label}>Couleurs souhaitées</label>
          <input
            id="couleurs"
            name="couleurs"
            maxLength={200}
            placeholder="Ex. bleu et or"
            className={champ}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="message" className={label}>Précisions</label>
          <textarea
            id="message"
            name="message"
            rows={2}
            placeholder="Occasion, délai souhaité, quoi que ce soit d'utile…"
            className={champ}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-gold px-5 py-3.5 text-sm font-semibold text-[#0A0A0A] shadow-sm transition-all hover:bg-accent-gold-hover active:scale-[0.99] disabled:opacity-50 sm:w-auto"
      >
        {pending ? "Envoi…" : "Demander un devis"}
        {!pending && <ArrowRight size={16} aria-hidden="true" />}
      </button>

      {/* Dire pourquoi il n'y a pas de prix, plutôt que de laisser le client
          chercher une grille qui n'existe pas. */}
      <p className="rounded-xl border border-accent-gold/25 bg-accent-gold/5 p-4 text-xs leading-relaxed text-public-text-muted">
        <strong className="text-public-text">Pourquoi pas de prix affiché ?</strong>{" "}
        Le pagne n&apos;a pas de prix de référence : chaque fournisseur vend au
        sien, et il bouge. Nous consultons les nôtres pour votre demande précise,
        puis nous vous envoyons un prix ferme — sans engagement de votre part.
      </p>
    </form>
  )
}
