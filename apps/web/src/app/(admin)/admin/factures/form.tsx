"use client";

import { useActionState } from "react";
import {
  modifierParametresFacturation,
  type ParametresFacturationState,
} from "@/app/actions/factures";
import { SubmitButton } from "@/components/submit-button";
import { Obligatoire } from "@/components/ui/obligatoire"

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/12 bg-white px-3 py-2 text-sm text-phoebe-anthracite transition-colors focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15";

export function ParametresFacturationForm({
  initial,
}: {
  initial: {
    taux_tva: number;
    prefixe_facture: string;
    numero_suivant: number;
    email_cc: string;
  };
}) {
  const [state, action] = useActionState<ParametresFacturationState, FormData>(
    modifierParametresFacturation,
    {}
  );

  return (
    <form
      action={action}
      className="space-y-6 rounded-xl border border-phoebe-pearl bg-white p-6 shadow-sm"
    >
      {state.error && (
        <p role="alert" className="rounded-lg bg-error/10 px-4 py-2 text-xs text-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p
          role="status"
          className="rounded-lg bg-phoebe-green/10 px-4 py-2 text-xs text-phoebe-green-deep"
        >
          Paramètres mis à jour.
        </p>
      )}

      <div className="space-y-2">
        <label
          htmlFor="taux_tva"
          className="block text-sm font-medium text-phoebe-anthracite"
        >
          Taux de TVA (%)<Obligatoire />
        </label>
        <input
          id="taux_tva"
          name="taux_tva"
          type="number"
          min={0}
          max={100}
          step="0.01"
          defaultValue={initial.taux_tva}
          className={inputClass}
          required
        />
        <p className="text-xs text-phoebe-anthracite/60">
          Le montant encaissé est le TTC : la facture le ventile en HT et TVA à
          ce taux. 0 est accepté (exonération).
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="prefixe_facture"
          className="block text-sm font-medium text-phoebe-anthracite"
        >
          Préfixe de numérotation<Obligatoire />
        </label>
        <input
          id="prefixe_facture"
          name="prefixe_facture"
          type="text"
          maxLength={10}
          defaultValue={initial.prefixe_facture}
          className={inputClass}
          required
        />
        <p className="text-xs text-phoebe-anthracite/60">
          Prochaine facture :{" "}
          <span className="font-medium text-phoebe-anthracite">
            {initial.prefixe_facture}-{new Date().getFullYear()}-
            {String(initial.numero_suivant).padStart(4, "0")}
          </span>
          . Le compteur avance seul à chaque émission et ne se remet pas en
          arrière : un numéro réservé n&apos;est jamais rendu.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="email_cc"
          className="block text-sm font-medium text-phoebe-anthracite"
        >
          Email en copie (optionnel)
        </label>
        <input
          id="email_cc"
          name="email_cc"
          type="email"
          defaultValue={initial.email_cc}
          placeholder="comptabilite@groupphoebe.ci"
          className={inputClass}
        />
        <p className="text-xs text-phoebe-anthracite/60">
          Adresse mise en copie des factures envoyées aux clients.
        </p>
      </div>

      <SubmitButton>Enregistrer</SubmitButton>
    </form>
  );
}
