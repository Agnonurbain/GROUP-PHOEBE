"use client";

import { useActionState } from "react";
import { modifierIntervalle, type TarifState } from "@/app/actions/tarifs";
import { SubmitButton } from "@/components/submit-button";

type Intervalle = {
  id: string;
  categorie: string;
  type: string;
  prix_min: number;
  prix_max: number;
};

function IntervalleRow({ ip }: { ip: Intervalle }) {
  const [state, formAction] = useActionState<TarifState, FormData>(
    modifierIntervalle,
    {}
  );

  return (
    <form action={formAction} className="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-2">
      <input type="hidden" name="id" value={ip.id} />
      <span className="text-sm text-phoebe-anthracite">{ip.categorie}</span>
      <span className="text-xs text-phoebe-anthracite/50">{ip.type}</span>
      <input
        name="prix_min"
        type="number"
        min={0}
        step={1000}
        defaultValue={ip.prix_min}
        className="w-28 rounded-lg border border-phoebe-anthracite/20 px-2 py-1.5 text-sm text-right"
      />
      <input
        name="prix_max"
        type="number"
        min={0}
        step={1000}
        defaultValue={ip.prix_max}
        className="w-28 rounded-lg border border-phoebe-anthracite/20 px-2 py-1.5 text-sm text-right"
      />
      <SubmitButton>OK</SubmitButton>
      {state.error && (
        <span className="col-span-5 text-xs text-error">{state.error}</span>
      )}
    </form>
  );
}

export function IntervallesList({
  intervalles,
}: {
  intervalles: Intervalle[];
}) {
  if (intervalles.length === 0) {
    return (
      <p className="text-sm text-phoebe-anthracite/40">
        Aucun intervalle de prix.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2 text-xs font-medium uppercase tracking-wider text-phoebe-anthracite/40">
        <span>Catégorie</span>
        <span>Type</span>
        <span className="w-28 text-right">Min (FCFA)</span>
        <span className="w-28 text-right">Max (FCFA)</span>
        <span />
      </div>
      {intervalles.map((ip) => (
        <IntervalleRow key={ip.id} ip={ip} />
      ))}
    </div>
  );
}
