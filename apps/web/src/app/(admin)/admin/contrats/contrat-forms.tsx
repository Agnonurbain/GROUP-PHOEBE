"use client"

import { useActionState, useState } from "react"
import {
  creerContrat,
  changerStatutContrat,
  changerStatutEcheance,
  type ContratState,
} from "@/app/actions/contrats"
import { SubmitButton } from "@/components/submit-button"
import { CATEGORIES_CONTRAT, CATEGORIE_CONTRAT_LABELS, FREQUENCES, FREQUENCE_LABELS, JOURS_LABELS } from "@/lib/contrats"

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/12 bg-white px-3 py-2 text-sm text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
const labelClass = "mb-1 block text-xs font-medium text-phoebe-anthracite"
const btnGhost =
  "rounded-lg border border-phoebe-anthracite/15 px-3 py-1.5 text-xs font-semibold text-phoebe-anthracite/80 transition-colors hover:border-phoebe-green hover:text-phoebe-green disabled:opacity-50"

type Option = { id: string; nom: string }

export function NouveauContrat({
  clients,
  vehicules,
  chauffeurs,
}: {
  clients: Option[]
  vehicules: Option[]
  chauffeurs: Option[]
}) {
  const [ouvert, setOuvert] = useState(false)
  const [state, action] = useActionState<ContratState, FormData>(creerContrat, {})

  if (state.success && ouvert) setOuvert(false)

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="rounded-lg bg-phoebe-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-phoebe-green-deep"
      >
        Nouvel abonnement
      </button>
    )
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-phoebe-anthracite">Nouvel abonnement</h2>

      {state.error && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="client_id" className={labelClass}>Client</label>
          <select id="client_id" name="client_id" required defaultValue="" className={inputClass}>
            <option value="" disabled>Choisir…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="categorie" className={labelClass}>Type</label>
          <select id="categorie" name="categorie" required defaultValue="scolaire" className={inputClass}>
            {CATEGORIES_CONTRAT.map((c) => (
              <option key={c} value={c}>{CATEGORIE_CONTRAT_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="vehicule_id" className={labelClass}>Véhicule</label>
          <select id="vehicule_id" name="vehicule_id" defaultValue="" className={inputClass}>
            <option value="">Aucun</option>
            {vehicules.map((v) => (
              <option key={v.id} value={v.id}>{v.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="chauffeur_id" className={labelClass}>Chauffeur</label>
          <select id="chauffeur_id" name="chauffeur_id" defaultValue="" className={inputClass}>
            <option value="">Aucun</option>
            {chauffeurs.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date_debut" className={labelClass}>Début</label>
          <input id="date_debut" name="date_debut" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="date_fin" className={labelClass}>Fin (facultatif)</label>
          <input id="date_fin" name="date_fin" type="date" className={inputClass} />
        </div>
        <div>
          <label htmlFor="frequence_facturation" className={labelClass}>Facturation</label>
          <select id="frequence_facturation" name="frequence_facturation" required defaultValue="mensuelle" className={inputClass}>
            {FREQUENCES.map((f) => (
              <option key={f} value={f}>{FREQUENCE_LABELS[f]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="montant_periodique" className={labelClass}>Montant par période (FCFA)</label>
          <input
            id="montant_periodique"
            name="montant_periodique"
            type="number"
            min={1}
            step={1000}
            required
            className={inputClass}
          />
        </div>
      </div>

      <fieldset className="rounded-lg border border-phoebe-pearl p-3">
        <legend className="px-1 text-xs font-medium text-phoebe-anthracite">Créneau desservi</legend>
        <p className="mb-2 text-[11px] text-phoebe-anthracite/60">
          C&apos;est ce qui distingue un abonnement d&apos;une immobilisation : le
          véhicule n&apos;est pris que ces jours-là, à ces heures-là. Le reste du
          temps il demeure louable.
        </p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((j) => (
            <label key={j} className="flex items-center gap-1.5 text-xs text-phoebe-anthracite">
              <input
                type="checkbox"
                name="jours_semaine"
                value={j}
                defaultChecked={j <= 5}
                className="h-3.5 w-3.5 accent-phoebe-green"
              />
              {JOURS_LABELS[j].slice(0, 3)}
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="heure_debut" className={labelClass}>De</label>
            <input id="heure_debut" name="heure_debut" type="time" required defaultValue="06:30" className={inputClass} />
          </div>
          <div>
            <label htmlFor="heure_fin" className={labelClass}>À</label>
            <input id="heure_fin" name="heure_fin" type="time" required defaultValue="08:00" className={inputClass} />
          </div>
        </div>
      </fieldset>

      <div className="flex gap-2">
        <SubmitButton>Créer l&apos;abonnement</SubmitButton>
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="rounded-lg border border-phoebe-anthracite/15 px-4 py-2 text-sm text-phoebe-anthracite"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}

export function ContratActions({ contratId, statut }: { contratId: string; statut: string }) {
  const [state, action, enCours] = useActionState<ContratState, FormData>(changerStatutContrat, {})

  // Un contrat résilié ne se rouvre pas : la génération d'échéances rattraperait
  // toute la période d'interruption comme si le service avait été rendu.
  const cibles =
    statut === "actif"
      ? [
          { value: "suspendu", label: "Suspendre" },
          { value: "resilie", label: "Résilier" },
        ]
      : statut === "suspendu"
        ? [
            { value: "actif", label: "Reprendre" },
            { value: "resilie", label: "Résilier" },
          ]
        : []

  if (cibles.length === 0) {
    return <p className="text-xs text-phoebe-anthracite/60">Contrat résilié — créez-en un nouveau pour reprendre.</p>
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {cibles.map((c) => (
        <form key={c.value} action={action}>
          <input type="hidden" name="contrat_id" value={contratId} />
          <input type="hidden" name="statut" value={c.value} />
          <button type="submit" disabled={enCours} className={btnGhost}>
            {enCours ? "…" : c.label}
          </button>
        </form>
      ))}
      {state.error && (
        <span role="alert" className="text-[11px] text-error">{state.error}</span>
      )}
    </div>
  )
}

export function EcheanceActions({ echeanceId, statut }: { echeanceId: string; statut: string }) {
  const [state, action, enCours] = useActionState<ContratState, FormData>(changerStatutEcheance, {})

  const cibles: { value: string; label: string }[] = []
  if (statut === "a_facturer") cibles.push({ value: "facturee", label: "Facturer" })
  if (statut === "facturee" || statut === "impayee") cibles.push({ value: "payee", label: "Encaissée" })
  if (statut !== "payee" && statut !== "annulee") cibles.push({ value: "annulee", label: "Annuler" })

  if (cibles.length === 0) return null

  return (
    <span className="flex items-center gap-1.5">
      {cibles.map((c) => (
        <form key={c.value} action={action}>
          <input type="hidden" name="echeance_id" value={echeanceId} />
          <input type="hidden" name="statut" value={c.value} />
          <button
            type="submit"
            disabled={enCours}
            className="text-[11px] text-phoebe-green hover:underline disabled:opacity-50"
          >
            {enCours ? "…" : c.label}
          </button>
        </form>
      ))}
      {state.error && <span role="alert" className="text-[11px] text-error">{state.error}</span>}
    </span>
  )
}
