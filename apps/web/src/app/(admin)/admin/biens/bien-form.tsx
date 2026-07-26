"use client";

import { useActionState } from "react";
import type { Tables } from "@group-phoebe/database/types";
import type { BienState } from "@/app/actions/biens";
import {
  TYPE_BIEN_LABELS,
  TRANSACTION_LABELS,
  STATUT_BIEN_LABELS,
} from "@/lib/immobilier";
import { SubmitButton } from "@/components/submit-button";

type Agent = { id: string; nom: string };

type Props = {
  bien?: Tables<"biens">;
  agents?: Agent[];
  action: (prev: BienState, formData: FormData) => Promise<BienState>;
};

const inputClass =
  "w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/15";
const labelClass = "mb-1.5 block text-sm font-medium text-phoebe-anthracite";

export default function BienForm({ bien, agents = [], action }: Props) {
  const [state, formAction] = useActionState<BienState, FormData>(action, {});

  return (
    <>
      {state.error && (
        <div role="alert" className="mb-5 animate-fade-in rounded-xl border border-error/20 bg-error/5 px-5 py-3.5 text-sm text-error">
          {state.error}
        </div>
      )}
      {state.success && (
        <div role="status" className="mb-5 animate-fade-in rounded-xl border border-phoebe-green/20 bg-phoebe-green/5 px-5 py-3.5 text-sm font-medium text-phoebe-green-deep">
          Bien enregistré.
        </div>
      )}

      <form action={formAction} className="space-y-8">
        {bien && <input type="hidden" name="id" value={bien.id} />}

        {/* Caractéristiques */}
        <fieldset className="space-y-4 rounded-2xl border border-phoebe-pearl bg-white p-6 shadow-sm">
          <legend className="text-lg font-bold tracking-tight text-phoebe-anthracite">
            Caractéristiques
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="type" className={labelClass}>Type *</label>
              <select id="type" name="type" required defaultValue={bien?.type ?? "maison"} className={inputClass}>
                {Object.entries(TYPE_BIEN_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="transaction" className={labelClass}>Transaction *</label>
              <select id="transaction" name="transaction" required defaultValue={bien?.transaction ?? "vente"} className={inputClass}>
                {Object.entries(TRANSACTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="localisation" className={labelClass}>Localisation *</label>
            <input
              id="localisation"
              name="localisation"
              required
              defaultValue={bien?.localisation ?? ""}
              placeholder="Ex. Cocody, Abidjan"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="prix" className={labelClass}>Prix (FCFA) *</label>
              <input
                id="prix"
                name="prix"
                type="number"
                min="0"
                step="1000"
                required
                defaultValue={bien?.prix ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="surface_m2" className={labelClass}>Surface (m²)</label>
              <input
                id="surface_m2"
                name="surface_m2"
                type="number"
                min="0"
                step="0.5"
                defaultValue={bien?.surface_m2 ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="nb_chambres" className={labelClass}>Chambres</label>
              <input
                id="nb_chambres"
                name="nb_chambres"
                type="number"
                min="0"
                step="1"
                defaultValue={bien?.nb_chambres ?? ""}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={bien?.description ?? ""}
              placeholder="Atouts du bien, environnement, standing…"
              className={inputClass}
            />
          </div>
        </fieldset>

        {/* Suivi */}
        <fieldset className="space-y-4 rounded-2xl border border-phoebe-pearl bg-white p-6 shadow-sm">
          <legend className="text-lg font-bold tracking-tight text-phoebe-anthracite">
            Suivi
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {bien && (
              <div>
                <label htmlFor="statut" className={labelClass}>Statut</label>
                <select id="statut" name="statut" defaultValue={bien.statut} className={inputClass}>
                  {Object.entries(STATUT_BIEN_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="agent_id" className={labelClass}>Agent référent</label>
              <select id="agent_id" name="agent_id" defaultValue={bien?.agent_id ?? ""} className={inputClass}>
                <option value="">— Non affecté —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.nom}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <SubmitButton>{bien ? "Enregistrer les modifications" : "Créer le bien"}</SubmitButton>
      </form>
    </>
  );
}
