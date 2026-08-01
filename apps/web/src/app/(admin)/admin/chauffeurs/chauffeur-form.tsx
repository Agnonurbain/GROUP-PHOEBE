"use client"

import { useActionState, useState } from "react"
import {
  creerChauffeur,
  modifierChauffeur,
  type ChauffeurState,
} from "@/app/actions/chauffeurs"
import { SubmitButton } from "@/components/submit-button"

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/12 bg-white px-3 py-2 text-sm text-phoebe-anthracite transition-colors focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
const labelClass = "mb-1 block text-xs font-medium text-phoebe-anthracite"

export function NouveauChauffeur() {
  const [ouvert, setOuvert] = useState(false)
  const [state, action] = useActionState<ChauffeurState, FormData>(creerChauffeur, {})

  if (state.success && ouvert) setOuvert(false)

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="rounded-lg bg-phoebe-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-phoebe-green-deep"
      >
        Ajouter un chauffeur
      </button>
    )
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-phoebe-anthracite">Nouveau chauffeur</h2>

      {state.error && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nouveau-nom" className={labelClass}>Nom</label>
          <input id="nouveau-nom" name="nom" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="nouveau-tel" className={labelClass}>Téléphone</label>
          <input
            id="nouveau-tel"
            name="telephone"
            required
            placeholder="+225 07 00 00 00 00"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="nouveau-permis" className={labelClass}>
          Permis professionnel (URL, facultatif)
        </label>
        <input id="nouveau-permis" name="permis_professionnel_url" type="url" className={inputClass} />
      </div>

      <div className="flex gap-2">
        <SubmitButton>Créer</SubmitButton>
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

export function ChauffeurForm({
  chauffeurId,
  initial,
}: {
  chauffeurId: string
  initial: {
    nom: string
    telephone: string
    permis_professionnel_url: string
    actif: boolean
  }
}) {
  const [state, action] = useActionState<ChauffeurState, FormData>(modifierChauffeur, {})

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="chauffeur_id" value={chauffeurId} />

      {state.error && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-lg bg-phoebe-green/10 px-3 py-2 text-xs text-phoebe-green-deep">
          Chauffeur mis à jour.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`nom-${chauffeurId}`} className={labelClass}>Nom</label>
          <input
            id={`nom-${chauffeurId}`}
            name="nom"
            defaultValue={initial.nom}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`tel-${chauffeurId}`} className={labelClass}>Téléphone</label>
          <input
            id={`tel-${chauffeurId}`}
            name="telephone"
            defaultValue={initial.telephone}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`permis-${chauffeurId}`} className={labelClass}>
          Permis professionnel (URL, facultatif)
        </label>
        <input
          id={`permis-${chauffeurId}`}
          name="permis_professionnel_url"
          type="url"
          defaultValue={initial.permis_professionnel_url}
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-phoebe-anthracite">
        <input
          type="checkbox"
          name="actif"
          defaultChecked={initial.actif}
          className="h-4 w-4 rounded border-phoebe-anthracite/20 accent-phoebe-green"
        />
        Actif — reçoit de nouvelles affectations
      </label>
      <p className="text-[11px] text-phoebe-anthracite/60">
        Le désactiver ne le retire pas de ses courses en cours : réaffectez-les
        d&apos;abord, sinon l&apos;enregistrement est refusé.
      </p>

      <SubmitButton>Enregistrer</SubmitButton>
    </form>
  )
}
