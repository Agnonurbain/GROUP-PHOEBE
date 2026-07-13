"use client";

import { useActionState } from "react";
import { marquerRembourse } from "@/app/actions/remboursements";
import { SubmitButton } from "@/components/submit-button";

export function MarquerRembourse({ paiementId }: { paiementId: string }) {
  const [state, formAction] = useActionState(marquerRembourse, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="paiement_id" value={paiementId} />
      {state.error && (
        <p className="mb-1 text-xs text-error">{state.error}</p>
      )}
      {state.success ? (
        <span className="text-xs font-medium text-phoebe-green">Fait</span>
      ) : (
        <SubmitButton className="rounded-lg bg-phoebe-green px-3 py-1.5 text-xs font-medium text-white hover:bg-phoebe-green/90">
          Marquer remboursé
        </SubmitButton>
      )}
    </form>
  );
}
