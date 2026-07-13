"use client";

import { useActionState } from "react";
import { traiterProposition, type PropositionState } from "@/app/actions/propositions";
import { SubmitButton } from "@/components/submit-button";

export function PropositionActions({ propositionId }: { propositionId: string }) {
  const [state, action] = useActionState<PropositionState, FormData>(traiterProposition, {});

  if (state.success) {
    return <span className="text-xs text-phoebe-green">Traité.</span>;
  }

  return (
    <div className="flex items-center gap-2">
      {state.error && <span className="text-xs text-error">{state.error}</span>}
      <form action={action}>
        <input type="hidden" name="proposition_id" value={propositionId} />
        <input type="hidden" name="decision" value="acceptee" />
        <SubmitButton className="rounded-lg bg-phoebe-green px-3 py-1.5 text-xs font-medium text-white hover:bg-phoebe-green/90">
          Accepter
        </SubmitButton>
      </form>
      <form action={action}>
        <input type="hidden" name="proposition_id" value={propositionId} />
        <input type="hidden" name="decision" value="refusee" />
        <SubmitButton className="rounded-lg border border-error/30 px-3 py-1.5 text-xs font-medium text-error hover:bg-error/5">
          Refuser
        </SubmitButton>
      </form>
    </div>
  );
}
