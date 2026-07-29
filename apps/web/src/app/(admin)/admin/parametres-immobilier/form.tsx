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
    frais_visite: number;
    taux_commission: number;
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
        <label htmlFor="frais_visite" className="block text-sm font-medium text-phoebe-anthracite">
          Frais de visite (FCFA)
        </label>
        <input
          id="frais_visite"
          name="frais_visite"
          type="number"
          min={1}
          defaultValue={initial.frais_visite}
          className={inputClass}
          required
        />
        <p className="text-xs text-phoebe-anthracite/60">
          Frais dus par le client pour programmer une visite. Non remboursables, et
          annoncés sur la fiche du bien avant paiement.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="taux_commission" className="block text-sm font-medium text-phoebe-anthracite">
          Commission GROUP PHOEBE (%)
        </label>
        <input
          id="taux_commission"
          name="taux_commission"
          type="number"
          min={0}
          max={100}
          step={0.5}
          defaultValue={initial.taux_commission}
          className={inputClass}
          required
        />
        <p className="text-xs text-phoebe-anthracite/60">
          Part prélevée sur le montant convenu, les biens appartenant à des
          propriétaires tiers. Usuellement 10 à 12 %. Due dès l&apos;acceptation de
          l&apos;offre, et figée sur la transaction au taux du jour.
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
