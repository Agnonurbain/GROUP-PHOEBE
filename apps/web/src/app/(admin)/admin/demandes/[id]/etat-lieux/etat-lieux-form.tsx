"use client";

import { useActionState, useState } from "react";
import {
  enregistrerEtatLieuxDepart,
  enregistrerEtatLieuxRetour,
  type EtatLieuxState,
} from "@/app/actions/etat-lieux";
import { SubmitButton } from "@/components/submit-button";

const inputClass =
  "w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/15";

const CARBURANT_OPTIONS = [
  { value: "plein", label: "Plein" },
  { value: "trois_quarts", label: "3/4" },
  { value: "demi", label: "1/2" },
  { value: "quart", label: "1/4" },
  { value: "vide", label: "Vide" },
];

const CARBURANT_FRACTION: Record<string, number> = {
  plein: 1,
  trois_quarts: 0.75,
  demi: 0.5,
  quart: 0.25,
  vide: 0,
};

const PRIX_LITRE_FCFA = 650;
const CAPACITE_RESERVOIR_L = 50;

export function EtatLieuxForm({
  demandeId,
  type,
  cautionMax,
  kmDepart,
  carburantDepart,
  kmInclusParJour,
  supplementKmFcfa,
  nbJours,
}: {
  demandeId: string;
  type: "depart" | "retour";
  cautionMax?: number;
  kmDepart?: number;
  carburantDepart?: string;
  kmInclusParJour?: number;
  supplementKmFcfa?: number;
  nbJours?: number;
}) {
  const action = type === "depart" ? enregistrerEtatLieuxDepart : enregistrerEtatLieuxRetour;
  const [state, formAction] = useActionState<EtatLieuxState, FormData>(action, {});
  const [kmRetour, setKmRetour] = useState<number | "">("");
  const [carburantRetour, setCarburantRetour] = useState("plein");

  const kmParcourus = typeof kmRetour === "number" && kmDepart != null ? kmRetour - kmDepart : null;
  const kmAutorise = kmInclusParJour && nbJours ? kmInclusParJour * nbJours : null;
  const kmExcedent = kmParcourus != null && kmAutorise != null ? Math.max(0, kmParcourus - kmAutorise) : null;
  const supplementKm = kmExcedent != null && supplementKmFcfa ? kmExcedent * supplementKmFcfa : 0;

  const fractionDepart = carburantDepart ? CARBURANT_FRACTION[carburantDepart] ?? 1 : 1;
  const fractionRetour = CARBURANT_FRACTION[carburantRetour] ?? 1;
  const litresManquants = Math.max(0, fractionDepart - fractionRetour) * CAPACITE_RESERVOIR_L;
  const coutCarburant = Math.round(litresManquants * PRIX_LITRE_FCFA);

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
              {...(type === "retour" ? {
                value: kmRetour,
                onChange: (e) => setKmRetour(e.target.value === "" ? "" : Number(e.target.value)),
              } : {})}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-phoebe-anthracite">
              Niveau de carburant *
            </label>
            <select
              name="carburant"
              required
              defaultValue={type === "retour" ? undefined : "plein"}
              value={type === "retour" ? carburantRetour : undefined}
              onChange={type === "retour" ? (e) => setCarburantRetour(e.target.value) : undefined}
              className={inputClass}
            >
              {CARBURANT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {type === "retour" && kmExcedent != null && kmExcedent > 0 && (
          <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3">
            <p className="text-sm font-medium text-error">
              Dépassement kilométrique : {kmExcedent.toLocaleString("fr-FR")} km
            </p>
            <p className="mt-0.5 text-xs text-error/70">
              {kmParcourus!.toLocaleString("fr-FR")} km parcourus — {kmAutorise!.toLocaleString("fr-FR")} km inclus ({kmInclusParJour} km/j × {nbJours} j)
              {supplementKm > 0 && ` — Supplément : ${supplementKm.toLocaleString("fr-FR")} FCFA`}
            </p>
          </div>
        )}

        {type === "retour" && coutCarburant > 0 && (
          <div className="rounded-lg border border-phoebe-gold/20 bg-phoebe-gold/5 px-4 py-3">
            <p className="text-sm font-medium text-phoebe-gold-dark">
              Carburant manquant : {litresManquants.toFixed(1)} L — {coutCarburant.toLocaleString("fr-FR")} FCFA
            </p>
            <p className="mt-0.5 text-xs text-phoebe-anthracite/70">
              Départ {CARBURANT_OPTIONS.find((o) => o.value === carburantDepart)?.label ?? carburantDepart} → Retour {CARBURANT_OPTIONS.find((o) => o.value === carburantRetour)?.label ?? carburantRetour} · {PRIX_LITRE_FCFA} FCFA/L · réservoir {CAPACITE_RESERVOIR_L} L
            </p>
          </div>
        )}

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
            <p className="mt-1 text-xs text-phoebe-anthracite/70">
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
