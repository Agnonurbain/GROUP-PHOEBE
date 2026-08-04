"use client"

import { useActionState, useState } from "react"
import {
  creerMoyenLivraison,
  modifierMoyenLivraison,
  basculerMoyenLivraison,
  modifierCoefficientsMode,
  type TarifState,
} from "@/app/actions/tarifs"
import { SubmitButton } from "@/components/submit-button"
import { Obligatoire } from "@/components/ui/obligatoire"

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/12 bg-white px-3 py-2 text-sm text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
const labelClass = "mb-1 block text-xs font-medium text-phoebe-anthracite"

const ZONES = [
  ["intracommunale", "Même commune"],
  ["intercommunale", "Entre communes"],
  ["nationale", "National"],
] as const

const MODES = [
  ["standard", "Standard"],
  ["express", "Express"],
  ["meme_jour", "Même jour"],
  ["programmee", "Programmée"],
] as const

export type MoyenAdmin = {
  cle: string
  label: string
  famille: string
  charge_max_kg: number
  ordre: number
  actif: boolean
  prix: Record<string, number>
}

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`

/** Une ligne modifiable : nom, famille, charge, et les trois prix de zone. */
function LigneMoyen({ moyen }: { moyen: MoyenAdmin }) {
  const [ouvert, setOuvert] = useState(false)
  const [state, action] = useActionState<TarifState, FormData>(modifierMoyenLivraison, {})
  const [bascule, actionBascule] = useActionState<TarifState, FormData>(basculerMoyenLivraison, {})

  return (
    <li className={`rounded-lg border p-3 ${moyen.actif ? "border-phoebe-pearl" : "border-phoebe-anthracite/10 bg-phoebe-pearl/20"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-sm font-semibold text-phoebe-anthracite">{moyen.label}</span>
          <span className="ml-2 rounded-full bg-phoebe-pearl px-2 py-0.5 text-[11px] text-phoebe-anthracite/70">
            {moyen.famille}
          </span>
          {!moyen.actif && (
            <span className="ml-2 text-[11px] font-medium text-error">Retiré du catalogue</span>
          )}
          <p className="mt-0.5 text-[11px] text-phoebe-anthracite/60">
            Jusqu&apos;à {moyen.charge_max_kg} kg ·{" "}
            {ZONES.map(([z, l]) => `${l} ${fcfa(moyen.prix[z] ?? 0)}`).join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOuvert((o) => !o)}
            className="text-[11px] text-phoebe-green underline decoration-dotted"
          >
            {ouvert ? "Fermer" : "Modifier"}
          </button>
          <form action={actionBascule}>
            <input type="hidden" name="cle" value={moyen.cle} />
            <input type="hidden" name="actif" value={moyen.actif ? "0" : "1"} />
            <button
              type="submit"
              className="text-[11px] text-phoebe-anthracite/60 underline decoration-dotted hover:text-error"
            >
              {moyen.actif ? "Retirer" : "Remettre"}
            </button>
          </form>
        </div>
      </div>

      {bascule.error && (
        <p role="alert" className="mt-1 text-[11px] text-error">{bascule.error}</p>
      )}

      {ouvert && (
        <form action={action} className="mt-3 space-y-3 border-t border-phoebe-pearl pt-3">
          <input type="hidden" name="cle" value={moyen.cle} />
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor={`label-${moyen.cle}`} className={labelClass}>Nom<Obligatoire /></label>
              <input id={`label-${moyen.cle}`} name="label" defaultValue={moyen.label} required className={inputClass} />
            </div>
            <div>
              <label htmlFor={`famille-${moyen.cle}`} className={labelClass}>Famille<Obligatoire /></label>
              <input id={`famille-${moyen.cle}`} name="famille" defaultValue={moyen.famille} required className={inputClass} />
            </div>
            <div>
              <label htmlFor={`charge-${moyen.cle}`} className={labelClass}>Charge utile (kg)<Obligatoire /></label>
              <input
                id={`charge-${moyen.cle}`}
                name="charge_max_kg"
                type="number"
                min={1}
                step={1}
                defaultValue={moyen.charge_max_kg}
                required
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {ZONES.map(([zone, libelle]) => (
              <div key={zone}>
                <label htmlFor={`${zone}-${moyen.cle}`} className={labelClass}>{libelle} (FCFA)<Obligatoire /></label>
                <input
                  id={`${zone}-${moyen.cle}`}
                  name={`prix_${zone}`}
                  type="number"
                  min={1}
                  step={100}
                  defaultValue={moyen.prix[zone] ?? ""}
                  required
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          {state.error && <p role="alert" className="text-xs text-error">{state.error}</p>}
          {state.success && <p role="status" className="text-xs text-phoebe-green-deep">Enregistré.</p>}
          <SubmitButton>Enregistrer ce moyen</SubmitButton>
        </form>
      )}
    </li>
  )
}

/**
 * Les moyens de livraison, et ce qui va avec.
 *
 * « Il y a moto et puis il y a le cargo […] 3 types de cargo : petit, moyen,
 * grand. En fonction des types de cargo, il y a aussi les tarifs qui vont
 * avec. » La liste reste ouverte : un fourgon, un camion, une barque s'ajoutent
 * sans déploiement.
 *
 * Le prix se lit `tarif(zone × moyen) × coefficient(mode)`. Une grille complète
 * aurait fait 48 prix à saisir pour la même information.
 */
export function MoyensLivraisonForm({
  moyens,
  coefficients,
}: {
  moyens: MoyenAdmin[]
  coefficients: Record<string, number>
}) {
  const [creation, actionCreation] = useActionState<TarifState, FormData>(creerMoyenLivraison, {})
  const [coefs, actionCoefs] = useActionState<TarifState, FormData>(modifierCoefficientsMode, {})
  const [ouvrirCreation, setOuvrirCreation] = useState(false)

  return (
    <div className="space-y-4 rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-phoebe-anthracite">
          Moyens de livraison et tarifs
        </h3>
        <p className="mt-1 text-xs text-phoebe-anthracite/70">
          Le prix d&apos;une livraison vaut <strong>tarif de la zone pour ce moyen</strong>,
          multiplié par le <strong>coefficient du délai</strong>. Le poids n&apos;entre plus
          dans le calcul : il sert à écarter les moyens trop justes pour le colis.
        </p>
      </div>

      <ul className="space-y-2">
        {moyens.map((m) => (
          <LigneMoyen key={m.cle} moyen={m} />
        ))}
      </ul>

      {!ouvrirCreation ? (
        <button
          type="button"
          onClick={() => setOuvrirCreation(true)}
          className="text-xs font-medium text-phoebe-green underline decoration-dotted"
        >
          Ajouter un moyen de livraison
        </button>
      ) : (
        <form action={actionCreation} className="space-y-3 rounded-lg border border-phoebe-green/30 bg-phoebe-green/5 p-3">
          <p className="text-xs font-semibold text-phoebe-anthracite">Nouveau moyen</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="n-label" className={labelClass}>Nom<Obligatoire /></label>
              <input id="n-label" name="label" required placeholder="Ex. Fourgon" className={inputClass} />
            </div>
            <div>
              <label htmlFor="n-famille" className={labelClass}>Famille<Obligatoire /></label>
              <input id="n-famille" name="famille" required placeholder="Ex. fourgon" className={inputClass} />
              <p className="mt-1 text-[11px] text-phoebe-anthracite/60">
                Les moyens d&apos;une même famille sont proposés ensemble au client.
              </p>
            </div>
            <div>
              <label htmlFor="n-charge" className={labelClass}>Charge utile (kg)<Obligatoire /></label>
              <input id="n-charge" name="charge_max_kg" type="number" min={1} step={1} required className={inputClass} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {ZONES.map(([zone, libelle]) => (
              <div key={zone}>
                <label htmlFor={`n-${zone}`} className={labelClass}>{libelle} (FCFA)<Obligatoire /></label>
                <input id={`n-${zone}`} name={`prix_${zone}`} type="number" min={1} step={100} required className={inputClass} />
              </div>
            ))}
          </div>
          {creation.error && <p role="alert" className="text-xs text-error">{creation.error}</p>}
          {creation.success && <p role="status" className="text-xs text-phoebe-green-deep">Moyen créé.</p>}
          <div className="flex items-center gap-3">
            <SubmitButton>Créer ce moyen</SubmitButton>
            <button
              type="button"
              onClick={() => setOuvrirCreation(false)}
              className="text-[11px] text-phoebe-anthracite/60 underline decoration-dotted"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <form action={actionCoefs} className="space-y-3 rounded-lg border border-phoebe-pearl p-3">
        <p className="text-xs font-semibold text-phoebe-anthracite">Coefficient par délai</p>
        <p className="text-[11px] text-phoebe-anthracite/60">
          Appliqué au tarif de base. À 1, le délai ne change rien au prix.
        </p>
        <div className="grid gap-3 sm:grid-cols-4">
          {MODES.map(([mode, libelle]) => (
            <div key={mode}>
              <label htmlFor={`coef-${mode}`} className={labelClass}>{libelle}<Obligatoire /></label>
              <input
                id={`coef-${mode}`}
                name={`coef_${mode}`}
                type="number"
                min={0.1}
                max={10}
                step={0.1}
                defaultValue={coefficients[mode] ?? 1}
                required
                className={inputClass}
              />
            </div>
          ))}
        </div>
        {coefs.error && <p role="alert" className="text-xs text-error">{coefs.error}</p>}
        {coefs.success && <p role="status" className="text-xs text-phoebe-green-deep">Coefficients mis à jour.</p>}
        <SubmitButton>Enregistrer les coefficients</SubmitButton>
      </form>
    </div>
  )
}
