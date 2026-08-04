"use client"

import { useActionState } from "react"
import { modifierHorairesOuverture, type TarifState } from "@/app/actions/tarifs"
import { SubmitButton } from "@/components/submit-button"
import { Obligatoire } from "@/components/ui/obligatoire"

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/12 bg-white px-3 py-2 text-sm text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
const labelClass = "mb-1 block text-xs font-medium text-phoebe-anthracite"

const JOURS: Record<number, string> = {
  1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven", 6: "Sam", 7: "Dim",
}

/**
 * Jours et heures d'ouverture de GROUP PHOEBE.
 *
 * Ils se réglaient avec les délais transport, ce qui était vrai tant que le
 * transport était seul à s'en servir. Les rendez-vous de dépôt lisent les mêmes
 * horaires : ils ont désormais leur propre bloc, parce qu'ils valent pour toute
 * la maison et que deux endroits pour un même réglage finissent par diverger.
 */
export function HorairesForm({
  initial,
}: {
  initial: { jours: number[]; ouverture: string; fermeture: string }
}) {
  const [state, action] = useActionState<TarifState, FormData>(
    modifierHorairesOuverture,
    {}
  )

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-phoebe-anthracite">
          Jours et heures d&apos;ouverture
        </h3>
        <p className="mt-1 text-xs text-phoebe-anthracite/70">
          Un seul calendrier pour toute la maison : il sert au décompte des
          délais transport en heures ouvrées <em>et</em> aux créneaux de
          rendez-vous du service assistance.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-lg bg-phoebe-green/10 px-3 py-2 text-xs text-phoebe-green-deep">
          Horaires mis à jour.
        </p>
      )}

      <fieldset>
        <legend className={labelClass}>
          Jours d&apos;ouverture<Obligatoire />
        </legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((j) => (
            <label key={j} className="flex items-center gap-1.5 text-xs text-phoebe-anthracite">
              <input
                type="checkbox"
                name="jours_ouvres"
                value={j}
                defaultChecked={initial.jours.includes(j)}
                className="h-3.5 w-3.5 accent-phoebe-green"
              />
              {JOURS[j]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="heure_ouverture" className={labelClass}>
            Ouverture<Obligatoire />
          </label>
          <input
            id="heure_ouverture"
            name="heure_ouverture"
            type="time"
            defaultValue={initial.ouverture.slice(0, 5)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="heure_fermeture" className={labelClass}>
            Fermeture<Obligatoire />
          </label>
          <input
            id="heure_fermeture"
            name="heure_fermeture"
            type="time"
            defaultValue={initial.fermeture.slice(0, 5)}
            required
            className={inputClass}
          />
        </div>
      </div>

      <SubmitButton>Enregistrer les horaires</SubmitButton>
    </form>
  )
}
