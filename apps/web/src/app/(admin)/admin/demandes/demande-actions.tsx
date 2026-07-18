"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  accepterDemande,
  refuserDemande,
  type DemandeActionState,
} from "@/app/actions/demandes";
import { envoyerPrixNegocie, type NegociationState } from "@/app/actions/negociation";
import { SubmitButton } from "@/components/submit-button";

export function DemandeActions({
  demandeId,
  statut,
  negociationNote,
  montantEstime,
}: {
  demandeId: string;
  statut: string;
  negociationNote?: string | null;
  montantEstime?: number | null;
}) {
  const [acceptState, acceptAction] = useActionState<DemandeActionState, FormData>(
    accepterDemande,
    {}
  );
  const [refusState, refusAction] = useActionState<DemandeActionState, FormData>(
    refuserDemande,
    {}
  );
  const [negoState, negoAction] = useActionState<NegociationState, FormData>(
    envoyerPrixNegocie,
    {}
  );
  const [showPrixForm, setShowPrixForm] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2">
      {(acceptState.error || refusState.error || negoState.error) && (
        <p className="text-xs text-error">
          {acceptState.error || refusState.error || negoState.error}
        </p>
      )}
      {acceptState.success && (
        <p className="text-xs text-phoebe-green">Acceptée</p>
      )}
      {refusState.success && (
        <p className="text-xs text-phoebe-green">Refusée + remboursement</p>
      )}
      {negoState.success && (
        <p className="text-xs text-phoebe-green">Prix envoyé au client</p>
      )}

      {statut === "en_attente_validation" && (
        <div className="flex gap-2">
          <form action={acceptAction}>
            <input type="hidden" name="demande_id" value={demandeId} />
            <SubmitButton className="rounded-lg bg-phoebe-green px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-phoebe-green-deep hover:shadow-md">
              Accepter
            </SubmitButton>
          </form>
          <form action={refusAction}>
            <input type="hidden" name="demande_id" value={demandeId} />
            <SubmitButton className="rounded-lg border border-error/20 bg-error/5 px-3 py-1.5 text-xs font-medium text-error hover:bg-error hover:text-white hover:shadow-md">
              Refuser
            </SubmitButton>
          </form>
        </div>
      )}

      {statut === "en_negociation" && !negoState.success && (
        <div className="space-y-2">
          {negociationNote && (
            <p className="max-w-xs text-right text-xs text-phoebe-anthracite/50 italic">
              « {negociationNote} »
            </p>
          )}
          {montantEstime && (
            <p className="text-right text-xs text-phoebe-anthracite/50">
              Estimation : {Number(montantEstime).toLocaleString("fr-FR")} FCFA
            </p>
          )}
          {!showPrixForm ? (
            <button
              type="button"
              onClick={() => setShowPrixForm(true)}
              className="rounded-lg bg-phoebe-gold px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-phoebe-gold/90 hover:shadow-md"
            >
              Proposer un prix
            </button>
          ) : (
            <form action={negoAction} className="flex items-end gap-2">
              <input type="hidden" name="demande_id" value={demandeId} />
              <div>
                <label className="mb-0.5 block text-[10px] text-phoebe-anthracite/50">Prix (FCFA)</label>
                <input
                  name="prix_negocie"
                  type="number"
                  min={1}
                  step={500}
                  required
                  defaultValue={montantEstime ? Number(montantEstime) : ""}
                  className="w-32 rounded-lg border border-phoebe-anthracite/20 px-2 py-1.5 text-sm"
                />
              </div>
              <SubmitButton className="rounded-lg bg-phoebe-gold px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-phoebe-gold/90 hover:shadow-md">
                Envoyer
              </SubmitButton>
            </form>
          )}
        </div>
      )}

      {(statut === "acceptee" || statut === "en_cours") && (
        <Link
          href={`/admin/demandes/${demandeId}/etat-lieux`}
          className="rounded-lg bg-phoebe-pearl px-3 py-1.5 text-xs font-medium text-phoebe-anthracite shadow-sm hover:bg-phoebe-green/10 hover:text-phoebe-green hover:shadow-md"
        >
          État des lieux
        </Link>
      )}
    </div>
  );
}
