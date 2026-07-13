"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  accepterDemande,
  refuserDemande,
  type DemandeActionState,
} from "@/app/actions/demandes";
import { SubmitButton } from "@/components/submit-button";

export function DemandeActions({
  demandeId,
  statut,
}: {
  demandeId: string;
  statut: string;
}) {
  const [acceptState, acceptAction] = useActionState<DemandeActionState, FormData>(
    accepterDemande,
    {}
  );
  const [refusState, refusAction] = useActionState<DemandeActionState, FormData>(
    refuserDemande,
    {}
  );

  return (
    <div className="flex flex-col items-end gap-2">
      {(acceptState.error || refusState.error) && (
        <p className="text-xs text-error">
          {acceptState.error || refusState.error}
        </p>
      )}
      {acceptState.success && (
        <p className="text-xs text-phoebe-green">Acceptée</p>
      )}
      {refusState.success && (
        <p className="text-xs text-phoebe-green">Refusée + remboursement</p>
      )}

      {statut === "en_attente_validation" && (
        <div className="flex gap-2">
          <form action={acceptAction}>
            <input type="hidden" name="demande_id" value={demandeId} />
            <SubmitButton className="rounded-lg bg-phoebe-green px-3 py-1.5 text-xs font-medium text-white hover:bg-phoebe-green/90">
              Accepter
            </SubmitButton>
          </form>
          <form action={refusAction}>
            <input type="hidden" name="demande_id" value={demandeId} />
            <SubmitButton className="rounded-lg bg-error/10 px-3 py-1.5 text-xs font-medium text-error hover:bg-error/20">
              Refuser
            </SubmitButton>
          </form>
        </div>
      )}

      {(statut === "acceptee" || statut === "en_cours") && (
        <Link
          href={`/admin/demandes/${demandeId}/etat-lieux`}
          className="rounded-lg bg-phoebe-pearl px-3 py-1.5 text-xs font-medium text-phoebe-anthracite hover:bg-phoebe-pearl/80"
        >
          État des lieux
        </Link>
      )}
    </div>
  );
}
