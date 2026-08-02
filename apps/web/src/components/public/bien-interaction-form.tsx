"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { creerDemandeImmobilier, type ImmobilierState } from "@/app/actions/immobilier"
import { TYPES_DEMANDE, TYPE_DEMANDE_LABELS } from "@/lib/immobilier"
import { Obligatoire } from "@/components/ui/obligatoire"

const inputClass =
  "w-full rounded-xl border border-public-border bg-public-bg px-4 py-2.5 text-sm text-public-text placeholder:text-public-text-faint transition-all duration-200 focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/20"

export function BienInteractionForm({
  bienId,
  isLoggedIn,
  fraisVisite,
  estLocation,
}: {
  bienId: string
  isLoggedIn: boolean
  /** Frais de visite dus et non remboursables : annoncés avant tout paiement. */
  fraisVisite: number
  /** Une location se négocie avec une période : loyer mensuel, début, durée. */
  estLocation: boolean
}) {
  const [state, action, pending] = useActionState<ImmobilierState, FormData>(creerDemandeImmobilier, {})
  const [type, setType] = useState<string>("information")
  const [methode, setMethode] = useState<"cinetpay" | "stripe">("cinetpay")

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
          <>
            <div>
              <label htmlFor="date_souhaitee" className="mb-1.5 block text-sm font-medium text-public-text">
                Date souhaitée
              </label>
              <input
                id="date_souhaitee"
                name="date_souhaitee"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                className={`${inputClass} [color-scheme:dark]`}
              />
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-public-text">
                Moyen de paiement
              </span>
              <input type="hidden" name="methode_paiement" value={methode} />
              <div className="grid grid-cols-2 gap-2">
                {([
                  { v: "cinetpay", label: "Mobile Money", detail: "Wave, Orange, MTN" },
                  { v: "stripe", label: "Carte bancaire", detail: "Visa, Mastercard" },
                ] as const).map((m) => (
                  <button
                    key={m.v}
                    type="button"
                    onClick={() => setMethode(m.v)}
                    aria-pressed={methode === m.v}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                      methode === m.v
                        ? "border-accent-green bg-accent-green/10"
                        : "border-public-border hover:border-accent-green/40"
                    }`}
                  >
                    <span className="block text-xs font-semibold text-public-text">{m.label}</span>
                    <span className="block text-[11px] text-public-text-muted">{m.detail}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Le bouton mène droit au paiement : le client doit connaître le
                montant et son caractère définitif avant de cliquer. */}
            <div className="rounded-xl border border-accent-gold/30 bg-accent-gold/5 p-4">
              <p className="text-sm font-semibold text-public-text">
                Frais de visite : {fraisVisite.toLocaleString("fr-FR")} FCFA
              </p>
              <p className="mt-1 text-xs text-public-text-muted">
                À régler maintenant pour réserver votre visite. Ces frais couvrent
                l&apos;organisation de la visite et ne sont pas remboursables.
              </p>
            </div>
          </>
        )}

        {type === "offre" && (
          <>
            <div>
              <label htmlFor="montant" className="mb-1.5 block text-sm font-medium text-public-text">
                {estLocation ? "Votre offre de loyer mensuel (FCFA) *" : "Votre offre (FCFA) *"}<Obligatoire />
              </label>
              <input
                id="montant"
                name="montant"
                type="number"
                inputMode="numeric"
                min="0"
                required
                placeholder={estLocation ? "Ex : 250 000" : "Ex : 25 000 000"}
                className={inputClass}
              />
            </div>

            {estLocation && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="location_debut" className="mb-1.5 block text-sm font-medium text-public-text">
                    Début souhaité *<Obligatoire />
                  </label>
                  <input
                    id="location_debut"
                    name="location_debut"
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    className={`${inputClass} [color-scheme:dark]`}
                  />
                </div>
                <div>
                  <label htmlFor="location_duree_mois" className="mb-1.5 block text-sm font-medium text-public-text">
                    Durée (mois) *<Obligatoire />
                  </label>
                  <input
                    id="location_duree_mois"
                    name="location_duree_mois"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    required
                    placeholder="Ex : 12"
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </>
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
        {pending
          ? "Envoi…"
          : type === "visite"
            ? `Payer ${fraisVisite.toLocaleString("fr-FR")} FCFA et demander la visite`
            : `Envoyer ma ${TYPE_DEMANDE_LABELS[type].toLowerCase()}`}
      </button>
      <p className="mt-3 text-center text-xs text-public-text-faint">
        {type === "visite"
          ? "Paiement sécurisé. Notre équipe vous confirme le créneau."
          : "Sans engagement — notre équipe vous recontacte."}
      </p>
    </form>
  )
}
