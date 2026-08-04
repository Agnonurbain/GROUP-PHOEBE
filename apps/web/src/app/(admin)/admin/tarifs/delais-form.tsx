"use client"

import { useActionState } from "react"
import { modifierDelaisTransport, type TarifState } from "@/app/actions/tarifs"
import { SubmitButton } from "@/components/submit-button"
import { formaterDelai } from "@/lib/parametres-transport"
import { Obligatoire } from "@/components/ui/obligatoire"

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/12 bg-white px-3 py-2 text-sm text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
const labelClass = "mb-1 block text-xs font-medium text-phoebe-anthracite"


/**
 * Délais du cycle transport.
 *
 * Ils vivaient dans `lib/constants.ts` : les changer demandait un déploiement,
 * alors que l'un d'eux décide d'une rétention de caution.
 */
export function DelaisForm({
  initial,
}: {
  initial: {
    delai_negociation_heures: number
    delai_sans_reponse_heures: number
    delai_non_presentation_heures: number
    delai_negociation_ouvre: boolean
    delai_sans_reponse_ouvre: boolean
    delai_non_presentation_ouvre: boolean
  }
}) {
  const [state, action] = useActionState<TarifState, FormData>(modifierDelaisTransport, {})

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
      {state.error && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-lg bg-phoebe-green/10 px-3 py-2 text-xs text-phoebe-green-deep">
          Délais mis à jour.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="delai_negociation_heures" className={labelClass}>
            Réponse à une demande de prix (h)<Obligatoire />
          </label>
          <input
            id="delai_negociation_heures"
            name="delai_negociation_heures"
            type="number"
            min={0.25}
            max={168}
            step={0.25}
            defaultValue={initial.delai_negociation_heures}
            required
            className={inputClass}
          />
          <label className="mt-1.5 flex items-start gap-1.5 text-[11px] text-phoebe-anthracite/70">
            <input
              type="checkbox"
              name="delai_negociation_ouvre"
              defaultChecked={initial.delai_negociation_ouvre}
              className="mt-0.5 h-3.5 w-3.5 accent-phoebe-green"
            />
            Décompter en heures ouvrées
          </label>
          <p className="mt-1 text-[11px] text-phoebe-anthracite/60">
            Actuellement {formaterDelai(initial.delai_negociation_heures)}. Le
            véhicule est réservé pendant ce temps et le délai est annoncé au
            client. Trop court, une demande du soir expire avant d&apos;être vue.
          </p>
        </div>

        <div>
          <label htmlFor="delai_sans_reponse_heures" className={labelClass}>
            Demande acceptée sans suite (h)<Obligatoire />
          </label>
          <input
            id="delai_sans_reponse_heures"
            name="delai_sans_reponse_heures"
            type="number"
            min={0.25}
            max={168}
            step={0.25}
            defaultValue={initial.delai_sans_reponse_heures}
            required
            className={inputClass}
          />
          <label className="mt-1.5 flex items-start gap-1.5 text-[11px] text-phoebe-anthracite/70">
            <input
              type="checkbox"
              name="delai_sans_reponse_ouvre"
              defaultChecked={initial.delai_sans_reponse_ouvre}
              className="mt-0.5 h-3.5 w-3.5 accent-phoebe-green"
            />
            Décompter en heures ouvrées
          </label>
          <p className="mt-1 text-[11px] text-phoebe-anthracite/60">
            Actuellement {formaterDelai(initial.delai_sans_reponse_heures)}. Au-delà,
            la demande est annulée et le véhicule libéré.
          </p>
        </div>

        <div>
          <label htmlFor="delai_non_presentation_heures" className={labelClass}>
            Retard au retrait (h)<Obligatoire />
          </label>
          <input
            id="delai_non_presentation_heures"
            name="delai_non_presentation_heures"
            type="number"
            min={0.25}
            max={168}
            step={0.25}
            defaultValue={initial.delai_non_presentation_heures}
            required
            className={inputClass}
          />
          <label className="mt-1.5 flex items-start gap-1.5 text-[11px] text-phoebe-anthracite/70">
            <input
              type="checkbox"
              name="delai_non_presentation_ouvre"
              defaultChecked={initial.delai_non_presentation_ouvre}
              className="mt-0.5 h-3.5 w-3.5 accent-phoebe-green"
            />
            Décompter en heures ouvrées
          </label>
          <p className="mt-1 text-[11px] font-medium text-error">
            Actuellement {formaterDelai(initial.delai_non_presentation_heures)}. Au-delà,
            la caution est <strong>retenue</strong> : le raccourcir transforme un
            retard ordinaire en pénalité.
          </p>
        </div>
      </div>


      <SubmitButton>Enregistrer les délais</SubmitButton>
    </form>
  )
}
