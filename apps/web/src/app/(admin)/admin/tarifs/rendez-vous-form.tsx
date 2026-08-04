"use client"

import { useActionState } from "react"
import {
  modifierParametresRendezVous,
  basculerFermetureAgence,
  type TarifState,
} from "@/app/actions/tarifs"
import { SubmitButton } from "@/components/submit-button"
import { Obligatoire } from "@/components/ui/obligatoire"

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/12 bg-white px-3 py-2 text-sm text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
const labelClass = "mb-1 block text-xs font-medium text-phoebe-anthracite"

const dateFr = (j: string) =>
  new Date(`${j}T12:00:00.000Z`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })

/**
 * Réglages du rendez-vous de dépôt.
 *
 * Les JOURS ET HEURES d'ouverture ne sont pas ici : ils se règlent dans le bloc
 * des délais, juste au-dessus, et servent aussi au décompte des délais
 * transport. Un second jeu produirait deux calendriers qui finiraient par
 * diverger — c'est dit à l'écran pour que personne ne les cherche ici.
 */
export function RendezVousForm({
  initial,
  fermetures,
}: {
  initial: {
    duree_minutes: number
    capacite_par_creneau: number
    delai_min_heures: number
    horizon_jours: number
  }
  fermetures: { jour: string; motif: string | null }[]
}) {
  const [state, action] = useActionState<TarifState, FormData>(
    modifierParametresRendezVous,
    {}
  )
  const [fermeture, actionFermeture] = useActionState<TarifState, FormData>(
    basculerFermetureAgence,
    {}
  )

  return (
    <div className="space-y-4 rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-phoebe-anthracite">
          Rendez-vous de dépôt de dossier
        </h3>
        <p className="mt-1 text-xs text-phoebe-anthracite/70">
          Les jours et heures d&apos;ouverture se règlent dans le bloc des délais
          ci-dessus : ils servent aussi au décompte des délais transport, et il
          n&apos;existe qu&apos;un seul calendrier.
        </p>
      </div>

      <form action={action} className="space-y-4">
        {state.error && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
            {state.error}
          </p>
        )}
        {state.success && (
          <p role="status" className="rounded-lg bg-phoebe-green/10 px-3 py-2 text-xs text-phoebe-green-deep">
            Réglages mis à jour.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="duree_minutes" className={labelClass}>
              Durée d&apos;un créneau (min)<Obligatoire />
            </label>
            <input
              id="duree_minutes"
              name="duree_minutes"
              type="number"
              min={5}
              max={240}
              step={5}
              defaultValue={initial.duree_minutes}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="capacite_par_creneau" className={labelClass}>
              Personnes par créneau<Obligatoire />
            </label>
            <input
              id="capacite_par_creneau"
              name="capacite_par_creneau"
              type="number"
              min={1}
              max={20}
              defaultValue={initial.capacite_par_creneau}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="delai_min_heures" className={labelClass}>
              Prévenance (h)<Obligatoire />
            </label>
            <input
              id="delai_min_heures"
              name="delai_min_heures"
              type="number"
              min={0}
              max={720}
              defaultValue={initial.delai_min_heures}
              required
              className={inputClass}
            />
            <p className="mt-1 text-[11px] text-phoebe-anthracite/60">
              Aucun rendez-vous en deçà. À 0, un client réserve pour dans dix minutes.
            </p>
          </div>
          <div>
            <label htmlFor="horizon_jours" className={labelClass}>
              Agenda ouvert (jours)<Obligatoire />
            </label>
            <input
              id="horizon_jours"
              name="horizon_jours"
              type="number"
              min={1}
              max={400}
              defaultValue={initial.horizon_jours}
              required
              className={inputClass}
            />
          </div>
        </div>

        <SubmitButton>Enregistrer les rendez-vous</SubmitButton>
      </form>

      {/* Sans fermetures exceptionnelles, l'agenda proposerait le 1er janvier
          parce que c'est un mercredi. */}
      <fieldset className="rounded-lg border border-phoebe-pearl p-3">
        <legend className="px-1 text-xs font-medium text-phoebe-anthracite">
          Fermetures exceptionnelles
        </legend>
        <p className="mb-2 text-[11px] text-phoebe-anthracite/60">
          Jours fériés, congés, inventaire. Un jour listé ici ne propose aucun
          créneau, même s&apos;il est ouvré.
        </p>

        {fermeture.error && (
          <p role="alert" className="mb-2 text-xs text-error">{fermeture.error}</p>
        )}

        <form action={actionFermeture} className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="jour" className={labelClass}>Date<Obligatoire /></label>
            <input id="jour" name="jour" type="date" required className={inputClass} />
          </div>
          <div className="flex-1 min-w-[12rem]">
            <label htmlFor="motif" className={labelClass}>Motif</label>
            <input id="motif" name="motif" placeholder="Jour férié, congés…" className={inputClass} />
          </div>
          <SubmitButton>Fermer cette journée</SubmitButton>
        </form>

        {fermetures.length > 0 && (
          <ul className="mt-3 space-y-1">
            {fermetures.map((f) => (
              <li key={f.jour} className="flex items-center justify-between gap-3 text-xs text-phoebe-anthracite/80">
                <span>
                  {dateFr(f.jour)}
                  {f.motif ? ` — ${f.motif}` : ""}
                </span>
                <form action={actionFermeture}>
                  <input type="hidden" name="jour" value={f.jour} />
                  <input type="hidden" name="retirer" value="1" />
                  <button
                    type="submit"
                    className="text-[11px] text-phoebe-anthracite/60 underline decoration-dotted hover:text-error"
                  >
                    Rouvrir
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </fieldset>
    </div>
  )
}
