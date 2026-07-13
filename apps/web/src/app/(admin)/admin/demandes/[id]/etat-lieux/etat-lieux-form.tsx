"use client";

import { useActionState } from "react";
import {
  enregistrerEtatLieuxDepart,
  enregistrerEtatLieuxRetour,
  type EtatLieuxState,
} from "@/app/actions/etat-lieux";
import { SubmitButton } from "@/components/submit-button";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-phoebe-green";

const CARBURANT_OPTIONS = [
  { value: "plein", label: "Plein" },
  { value: "trois_quarts", label: "3/4" },
  { value: "demi", label: "1/2" },
  { value: "quart", label: "1/4" },
  { value: "vide", label: "Vide" },
];

export function EtatLieuxForm({
  demandeId,
  type,
  cautionMax,
}: {
  demandeId: string;
  type: "depart" | "retour";
  cautionMax?: number;
}) {
  const action = type === "depart" ? enregistrerEtatLieuxDepart : enregistrerEtatLieuxRetour;
  const [state, formAction] = useActionState<EtatLieuxState, FormData>(action, {});

  return (
    <div className="rounded-xl border border-phoebe-pearl bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-phoebe-anthracite">
        {type === "depart" ? "État des lieux — Départ" : "État des lieux — Retour"}
      </h2>

      {state.error && (
        <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="mb-4 rounded-lg bg-phoebe-green/10 px-4 py-3 text-sm text-phoebe-green-deep">
          État des lieux enregistré.
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="demande_id" value={demandeId} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-phoebe-anthracite">
              Kilométrage *
            </label>
            <input
              name="kilometrage"
              type="number"
              min={0}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-phoebe-anthracite">
              Niveau de carburant *
            </label>
            <select name="carburant" required defaultValue="plein" className={inputClass}>
              {CARBURANT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-phoebe-anthracite">
            Photos horodatées
          </label>
          <input
            name="photos"
            type="file"
            accept="image/*"
            multiple
            className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-phoebe-pearl file:px-3 file:py-2 file:text-sm file:text-phoebe-anthracite"
          />
        </div>

        {type === "retour" && cautionMax != null && cautionMax > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-phoebe-anthracite">
              Montant de caution à retenir (FCFA)
            </label>
            <input
              name="caution_retenue"
              type="number"
              min={0}
              max={cautionMax}
              defaultValue={0}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-phoebe-anthracite/50">
              Caution totale : {cautionMax.toLocaleString("fr-FR")} FCFA — saisissez 0 pour libération intégrale
            </p>
          </div>
        )}

        <SubmitButton>
          {type === "depart" ? "Enregistrer le départ" : "Enregistrer le retour et clôturer"}
        </SubmitButton>
      </form>
    </div>
  );
}
