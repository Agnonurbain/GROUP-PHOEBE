"use client";

import { useActionState, useRef } from "react";
import { ajouterCommune, type TarifState } from "@/app/actions/tarifs";
import { SubmitButton } from "@/components/submit-button";

export function AjouterCommuneForm({ zoneId }: { zoneId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState<TarifState, FormData>(
    async (prev, fd) => {
      const result = await ajouterCommune(prev, fd);
      if (result.success) formRef.current?.reset();
      return result;
    },
    {}
  );

  return (
    <form ref={formRef} action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="zone_id" value={zoneId} />
      <div className="flex-1">
        <label htmlFor={`commune-${zoneId}`} className="sr-only">
          Nouvelle commune
        </label>
        <input
          id={`commune-${zoneId}`}
          name="nom"
          placeholder="Ajouter une commune..."
          required
          className="w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
        />
      </div>
      <SubmitButton>Ajouter</SubmitButton>
      {state.error && (
        <span className="text-xs text-error">{state.error}</span>
      )}
    </form>
  );
}
