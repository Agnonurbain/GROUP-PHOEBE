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
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="zone_id" value={zoneId} />
      <label htmlFor={`commune-${zoneId}`} className="sr-only">
        Nouvelle commune
      </label>
      <div className="flex gap-2">
        <input
          id={`commune-${zoneId}`}
          name="nom"
          placeholder="Nom de la commune…"
          required
          className="min-w-0 flex-1 rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
        />
        <SubmitButton className="shrink-0 rounded-xl bg-phoebe-green px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-md disabled:opacity-50">
          Ajouter
        </SubmitButton>
      </div>
      {state.error && (
        <p className="text-xs text-error">{state.error}</p>
      )}
    </form>
  );
}
