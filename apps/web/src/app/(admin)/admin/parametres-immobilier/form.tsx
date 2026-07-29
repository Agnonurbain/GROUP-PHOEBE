"use client";

import { useActionState } from "react";
import { modifierParametresImmobilier, type ParametresImmoState } from "@/app/actions/immobilier";
import { SubmitButton } from "@/components/submit-button";

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/12 bg-white px-3 py-2 text-sm text-phoebe-anthracite transition-colors focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15";

export function ParametresImmoForm({
  initial,
}: {
  initial: {
    caution_visite: number;
    taux_max_reduction: number;
    max_offres_client: number;
  };
}) {
  const [state, action] = useActionState<ParametresImmoState, FormData>(modifierParametresImmobilier, {});

  return (
    <form action={action} className="space-y-6 rounded-xl border border-phoebe-pearl bg-white p-6 shadow-sm">
      {state.error && (
        <p role="alert" className="rounded-lg bg-error/10 px-4 py-2 text-xs text-error">{state.error}</p>
      )}
      {state.success && (
        <p role="status" className="rounded-lg bg-phoebe-green/10 px-4 py-2 text-xs text-phoebe-green-deep">
          Paramètres mis à jour.
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="caution_visite" className="block text-sm font-medium text-phoebe-anthracite">
          Caution visite (FCFA)
        </label>
        <input
          id="caution_visite"
          name="caution_visite"
          type="number"
          min={1}
          defaultValue={initial.caution_visite}
          className={inputClass}
          required
        />
        <p className="text-xs text-phoebe-anthracite/60">
          Montant de la caution demandée à l&apos;acheteur pour programmer une visite.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="taux_max_reduction" className="block text-sm font-medium text-phoebe-anthracite">
          Taux max. de réduction (%)
        </label>
        <input
          id="taux_max_reduction"
          name="taux_max_reduction"
          type="number"
          min={0}
          max={100}
          defaultValue={initial.taux_max_reduction}
          className={inputClass}
          required
        />
        <p className="text-xs text-phoebe-anthracite/60">
          Pourcentage maximum de réduction qu&apos;un propriétaire peut appliquer sur le prix d&apos;un bien.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="max_offres_client" className="block text-sm font-medium text-phoebe-anthracite">
          Nombre max. d&apos;offres par client
        </label>
        <input
          id="max_offres_client"
          name="max_offres_client"
          type="number"
          min={1}
          defaultValue={initial.max_offres_client}
          className={inputClass}
          required
        />
        <p className="text-xs text-phoebe-anthracite/60">
          Limite du nombre d&apos;offres qu&apos;un même client peut soumettre simultanément.
        </p>
      </div>

      <div className="pt-2">
        <SubmitButton>Sauvegarder</SubmitButton>
      </div>
    </form>
  );
}
