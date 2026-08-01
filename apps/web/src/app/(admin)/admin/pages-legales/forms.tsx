"use client"

import { useActionState, useState } from "react"
import {
  modifierPageLegale,
  modifierIndemnisation,
  type PageLegaleState,
  type IndemnisationState,
} from "@/app/actions/pages-legales"
import { SubmitButton } from "@/components/submit-button"
import type { PageLegale, SectionLegale } from "@/lib/legal"
import { libelleIndemnisation } from "@/lib/indemnisation"

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/12 bg-white px-3 py-2 text-sm text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
const labelClass = "mb-1 block text-xs font-medium text-phoebe-anthracite"

export function PageLegaleForm({ page }: { page: PageLegale }) {
  const [state, action] = useActionState<PageLegaleState, FormData>(modifierPageLegale, {})
  const [sections, setSections] = useState<SectionLegale[]>(page.sections)

  function ajouterSection() {
    setSections((s) => [...s, { titre: "", paragraphes: [] }])
  }

  function retirerSection(i: number) {
    setSections((s) => s.filter((_, idx) => idx !== i))
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="slug" value={page.slug} />

      {state.error && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-lg bg-phoebe-green/10 px-3 py-2 text-xs text-phoebe-green-deep">
          Page enregistrée.
        </p>
      )}

      <div>
        <label htmlFor={`titre-${page.slug}`} className={labelClass}>Titre</label>
        <input
          id={`titre-${page.slug}`}
          name="titre"
          defaultValue={page.titre}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`chapeau-${page.slug}`} className={labelClass}>Chapeau</label>
        <textarea
          id={`chapeau-${page.slug}`}
          name="chapeau"
          rows={2}
          defaultValue={page.chapeau}
          className={inputClass}
        />
      </div>

      <div className="space-y-3">
        <p className={labelClass}>Sections</p>
        {sections.map((section, i) => (
          <div key={i} className="rounded-lg border border-phoebe-pearl p-3">
            <div className="flex items-center gap-2">
              <input
                name="section_titre"
                defaultValue={section.titre}
                placeholder="Titre de la section"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => retirerSection(i)}
                className="shrink-0 rounded-lg border border-error/30 px-2.5 py-2 text-xs text-error"
              >
                Retirer
              </button>
            </div>
            <textarea
              name="section_corps"
              rows={Math.max(3, section.paragraphes.length + 2)}
              defaultValue={section.paragraphes.join("\n\n")}
              placeholder="Un paragraphe par bloc, séparés par une ligne vide."
              className={`${inputClass} mt-2 font-mono text-xs`}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={ajouterSection}
          className="rounded-lg border border-phoebe-anthracite/15 px-3 py-1.5 text-xs font-semibold text-phoebe-anthracite"
        >
          Ajouter une section
        </button>
        <p className="text-[11px] text-phoebe-anthracite/60">
          Séparez les paragraphes par une ligne vide. Le texte est affiché tel
          quel — aucune mise en forme HTML n&apos;est interprétée.
        </p>
      </div>

      <label className="flex items-start gap-2 text-sm text-phoebe-anthracite">
        <input
          type="checkbox"
          name="publie"
          defaultChecked={page.publie}
          className="mt-0.5 h-4 w-4 rounded border-phoebe-anthracite/20 accent-phoebe-green"
        />
        <span>
          Publier
          <span className="mt-0.5 block text-[11px] text-phoebe-anthracite/60">
            Retire le bandeau « provisoire » et autorise l&apos;indexation.
            Impossible tant qu&apos;il reste un <span className="font-mono">[À COMPLÉTER]</span>.
          </span>
        </span>
      </label>

      <SubmitButton>Enregistrer</SubmitButton>
    </form>
  )
}

export function IndemnisationForm({
  initial,
}: {
  initial: {
    indemnisation_active: boolean
    indemnisation_taux: number
    indemnisation_plafond: number
    indemnisation_conditions: string
  }
}) {
  const [state, action] = useActionState<IndemnisationState, FormData>(modifierIndemnisation, {})
  const [apercu, setApercu] = useState(initial)

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
      {state.error && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-lg bg-phoebe-green/10 px-3 py-2 text-xs text-phoebe-green-deep">
          Régime mis à jour.
        </p>
      )}

      <label className="flex items-start gap-2 text-sm text-phoebe-anthracite">
        <input
          type="checkbox"
          name="indemnisation_active"
          defaultChecked={initial.indemnisation_active}
          onChange={(e) => setApercu((a) => ({ ...a, indemnisation_active: e.target.checked }))}
          className="mt-0.5 h-4 w-4 rounded border-phoebe-anthracite/20 accent-phoebe-green"
        />
        <span>
          Indemniser en cas de perte ou d&apos;avarie
          <span className="mt-0.5 block text-[11px] text-phoebe-anthracite/60">
            Désactivé, l&apos;interface annonce clairement qu&apos;aucune
            indemnisation ne s&apos;attache à la valeur déclarée — c&apos;est
            l&apos;état actuel, et le dire vaut mieux que le taire.
          </span>
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="indemnisation_taux" className={labelClass}>
            Taux (% de la valeur déclarée)
          </label>
          <input
            id="indemnisation_taux"
            name="indemnisation_taux"
            type="number"
            min={0}
            max={100}
            step="0.01"
            defaultValue={initial.indemnisation_taux}
            onChange={(e) => setApercu((a) => ({ ...a, indemnisation_taux: Number(e.target.value) }))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="indemnisation_plafond" className={labelClass}>
            Plafond (FCFA)
          </label>
          <input
            id="indemnisation_plafond"
            name="indemnisation_plafond"
            type="number"
            min={0}
            step={1000}
            defaultValue={initial.indemnisation_plafond}
            onChange={(e) => setApercu((a) => ({ ...a, indemnisation_plafond: Number(e.target.value) }))}
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-phoebe-anthracite/60">
            0 = pas de plafond, seul le taux s&apos;applique.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="indemnisation_conditions" className={labelClass}>
          Conditions (facultatif)
        </label>
        <textarea
          id="indemnisation_conditions"
          name="indemnisation_conditions"
          rows={2}
          defaultValue={initial.indemnisation_conditions}
          placeholder="Ex. sur présentation d'une facture d'achat, dans les 15 jours."
          className={inputClass}
        />
      </div>

      {/* Ce que le client lira réellement, calculé par la même fonction que le
          site : le régler à l'aveugle exposerait à publier une phrase qu'on
          n'avait pas voulue. */}
      <div className="rounded-lg bg-phoebe-pearl/40 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-phoebe-anthracite/70">
          Ce que verra le client
        </p>
        <p className="mt-1 text-xs text-phoebe-anthracite/80">
          {libelleIndemnisation({ ...apercu, indemnisation_conditions: initial.indemnisation_conditions })}
        </p>
      </div>

      <SubmitButton>Enregistrer</SubmitButton>
    </form>
  )
}
