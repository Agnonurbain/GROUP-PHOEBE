"use client"

import { useActionState, useState } from "react"
import {
  creerTypePagne,
  basculerTypePagne,
  type TextileState,
} from "@/app/actions/textile"
import { SubmitButton } from "@/components/submit-button"
import { Obligatoire } from "@/components/ui/obligatoire"
import type { TypePagne } from "@/lib/textile"

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/12 bg-white px-3 py-2 text-sm text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
const labelClass = "mb-1 block text-xs font-medium text-phoebe-anthracite"

/**
 * Les gammes de pagne, côté propriétaire.
 *
 * 00087 les annonçait « pilotables, marque libre » — et elles l'étaient, en
 * base. Aucun écran ne les touchait : ajouter une marque demandait du SQL. Une
 * pilotabilité sans écran n'existe pas pour celui qui exploite.
 */
export function GammesForm({ types }: { types: (TypePagne & { actif: boolean })[] }) {
  const [state, action] = useActionState<TextileState, FormData>(creerTypePagne, {})
  const [bascule, actionBascule] = useActionState<TextileState, FormData>(basculerTypePagne, {})
  const [ouvert, setOuvert] = useState(false)

  const actives = types.filter((t) => t.actif).length

  return (
    <div className="space-y-4 rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-phoebe-anthracite">
          Gammes ({actives} proposée{actives > 1 ? "s" : ""})
        </h2>
        <p className="mt-1 text-xs text-phoebe-anthracite/70">
          Ce que le client peut choisir dans le formulaire. Une gamme retirée
          disparaît du choix sans effacer les demandes qui la portent — et ses
          modèles restent au catalogue tant que vous ne les retirez pas.
        </p>
      </div>

      <ul className="divide-y divide-phoebe-pearl">
        {types.map((t) => (
          <li key={t.cle} className="flex items-start justify-between gap-3 py-2">
            <div className={t.actif ? "" : "opacity-50"}>
              <p className="text-xs font-medium text-phoebe-anthracite">
                {t.marque} — {t.gamme}
                {!t.actif && (
                  <span className="ml-2 rounded bg-phoebe-pearl px-1.5 py-0.5 text-[10px] font-normal">
                    retirée
                  </span>
                )}
              </p>
              {t.description && (
                <p className="mt-0.5 max-w-prose text-[11px] text-phoebe-anthracite/60">
                  {t.description}
                </p>
              )}
            </div>
            <form action={actionBascule}>
              <input type="hidden" name="cle" value={t.cle} />
              <input type="hidden" name="actif" value={t.actif ? "0" : "1"} />
              <button
                type="submit"
                className="whitespace-nowrap text-[11px] text-phoebe-anthracite/60 underline decoration-dotted hover:text-error"
              >
                {t.actif ? "Retirer" : "Remettre"}
              </button>
            </form>
          </li>
        ))}
      </ul>

      {bascule.error && <p role="alert" className="text-xs text-error">{bascule.error}</p>}

      {!ouvert ? (
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="text-xs font-medium text-phoebe-green underline decoration-dotted"
        >
          Ajouter une gamme
        </button>
      ) : (
        <form
          action={action}
          className="space-y-3 rounded-lg border border-phoebe-green/30 bg-phoebe-green/5 p-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="g-marque" className={labelClass}>
                Marque<Obligatoire />
              </label>
              <input
                id="g-marque"
                name="marque"
                required
                maxLength={60}
                placeholder="Ex. Vlisco"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="g-gamme" className={labelClass}>
                Gamme<Obligatoire />
              </label>
              <input
                id="g-gamme"
                name="gamme"
                required
                maxLength={60}
                placeholder="Ex. Super Wax"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="g-desc" className={labelClass}>
                Description
              </label>
              <input
                id="g-desc"
                name="description"
                placeholder="Ce qui distingue cette gamme, en une phrase"
                className={inputClass}
              />
            </div>
          </div>

          {state.error && <p role="alert" className="text-xs text-error">{state.error}</p>}
          {state.success && (
            <p role="status" className="text-xs text-phoebe-green-deep">Gamme ajoutée.</p>
          )}

          <div className="flex items-center gap-3">
            <SubmitButton>Ajouter la gamme</SubmitButton>
            <button
              type="button"
              onClick={() => setOuvert(false)}
              className="text-[11px] text-phoebe-anthracite/60 underline decoration-dotted"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
