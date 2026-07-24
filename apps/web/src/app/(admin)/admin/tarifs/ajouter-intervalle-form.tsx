"use client";

import { useActionState, useRef } from "react";
import { ajouterIntervalle, type TarifState } from "@/app/actions/tarifs";
import { SubmitButton } from "@/components/submit-button";

export function AjouterIntervalleForm({ zoneId }: { zoneId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState<TarifState, FormData>(
    async (prev, fd) => {
      const result = await ajouterIntervalle(prev, fd);
      if (result.success) formRef.current?.reset();
      return result;
    },
    {}
  );

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="zone_id" value={zoneId} />
      <div>
        <label className="mb-1 block text-xs text-phoebe-anthracite/70">Catégorie</label>
        <select
          name="categorie_vehicule"
          required
          className="rounded-lg border border-phoebe-anthracite/20 px-2 py-1.5 text-sm"
        >
          <option value="leger">Véhicule léger</option>
          <option value="car">Car</option>
          <option value="minibus">Minibus</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-phoebe-anthracite/70">Type</label>
        <select
          name="type"
          required
          className="rounded-lg border border-phoebe-anthracite/20 px-2 py-1.5 text-sm"
        >
          <option value="location">Location</option>
          <option value="vente">Vente</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-phoebe-anthracite/70">Min (FCFA)</label>
        <input
          name="prix_min"
          type="number"
          min={0}
          step={1000}
          required
          placeholder="25 000"
          className="w-28 rounded-lg border border-phoebe-anthracite/20 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-phoebe-anthracite/70">Max (FCFA)</label>
        <input
          name="prix_max"
          type="number"
          min={0}
          step={1000}
          required
          placeholder="50 000"
          className="w-28 rounded-lg border border-phoebe-anthracite/20 px-2 py-1.5 text-sm"
        />
      </div>
      <SubmitButton>Ajouter</SubmitButton>
      {state.error && (
        <span className="w-full text-xs text-error">{state.error}</span>
      )}
    </form>
  );
}
