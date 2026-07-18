"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  accepterDemande,
  refuserDemande,
  type DemandeActionState,
} from "@/app/actions/demandes";
import { envoyerPrixNegocie, type NegociationState } from "@/app/actions/negociation";
import { accepterAchatAvecAcompte, contreProposerAchat, type AchatState } from "@/app/actions/achat";
import { SubmitButton } from "@/components/submit-button";

export function DemandeActions({
  demandeId,
  statut,
  type,
  negociationNote,
  montantEstime,
}: {
  demandeId: string;
  statut: string;
  type?: string;
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
  const [achatState, achatAction] = useActionState<AchatState, FormData>(
    accepterAchatAvecAcompte,
    {}
  );
  const [contreState, contreAction] = useActionState<AchatState, FormData>(
    contreProposerAchat,
    {}
  );
  const [showPrixForm, setShowPrixForm] = useState(false);
  const [showAcompteForm, setShowAcompteForm] = useState(false);
  const [showContreForm, setShowContreForm] = useState(false);
  const isAchat = type === "achat";

  return (
    <div className="flex flex-col items-end gap-2">
      {(acceptState.error || refusState.error || negoState.error || achatState.error || contreState.error) && (
        <p className="text-xs text-error">
          {acceptState.error || refusState.error || negoState.error || achatState.error || contreState.error}
        </p>
      )}
      {acceptState.success && (
        <p className="text-xs text-phoebe-green">Acceptée</p>
      )}
      {achatState.success && (
        <p className="text-xs text-phoebe-green">Acompte demandé au client</p>
      )}
      {contreState.success && (
        <p className="text-xs text-phoebe-green">Contre-proposition envoyée</p>
      )}
      {refusState.success && (
        <p className="text-xs text-phoebe-green">Refusée + remboursement</p>
      )}
      {negoState.success && (
        <p className="text-xs text-phoebe-green">Prix envoyé au client</p>
      )}

      {statut === "en_attente_validation" && !isAchat && (
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

      {statut === "en_attente_validation" && isAchat && !achatState.success && !contreState.success && (
        <div className="space-y-2">
          {negociationNote && (
            <p className="max-w-xs text-right text-xs text-phoebe-anthracite/50 italic">
              {negociationNote}
            </p>
          )}
          {!showAcompteForm && !showContreForm ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowAcompteForm(true)}
                className="rounded-lg bg-phoebe-gold px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-phoebe-gold/90 hover:shadow-md"
              >
                Accepter (acompte)
              </button>
              <button
                type="button"
                onClick={() => setShowContreForm(true)}
                className="rounded-lg border border-phoebe-gold/30 bg-phoebe-gold/5 px-3 py-1.5 text-xs font-medium text-phoebe-gold hover:bg-phoebe-gold/10 hover:shadow-md"
              >
                Contre-proposer
              </button>
              <form action={refusAction}>
                <input type="hidden" name="demande_id" value={demandeId} />
                <SubmitButton className="rounded-lg border border-error/20 bg-error/5 px-3 py-1.5 text-xs font-medium text-error hover:bg-error hover:text-white hover:shadow-md">
                  Refuser
                </SubmitButton>
              </form>
            </div>
          ) : showAcompteForm ? (
            <form action={achatAction} className="flex items-end gap-2">
              <input type="hidden" name="demande_id" value={demandeId} />
              <div>
                <label className="mb-0.5 block text-[10px] text-phoebe-anthracite/50">
                  Acompte (FCFA)
                </label>
                <input
                  name="acompte"
                  type="number"
                  min={1}
                  step={1000}
                  required
                  defaultValue={montantEstime ? Math.round(Number(montantEstime) * 0.2) : ""}
                  placeholder="20% du prix"
                  className="w-36 rounded-lg border border-phoebe-anthracite/20 px-2 py-1.5 text-sm"
                />
              </div>
              <SubmitButton className="rounded-lg bg-phoebe-gold px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-phoebe-gold/90 hover:shadow-md">
                Valider
              </SubmitButton>
            </form>
          ) : (
            <form action={contreAction} className="flex items-end gap-2">
              <input type="hidden" name="demande_id" value={demandeId} />
              <div>
                <label className="mb-0.5 block text-[10px] text-phoebe-anthracite/50">
                  Votre prix (FCFA)
                </label>
                <input
                  name="prix_contre"
                  type="number"
                  min={1}
                  step={1000}
                  required
                  defaultValue={montantEstime ?? ""}
                  className="w-36 rounded-lg border border-phoebe-anthracite/20 px-2 py-1.5 text-sm"
                />
              </div>
              <SubmitButton className="rounded-lg border border-phoebe-gold/30 bg-phoebe-gold/5 px-3 py-1.5 text-xs font-medium text-phoebe-gold hover:bg-phoebe-gold/10 hover:shadow-md">
                Envoyer
              </SubmitButton>
            </form>
          )}
        </div>
      )}

      {statut === "en_negociation" && !isAchat && !negoState.success && (
        <div className="space-y-2">
          {negociationNote && (
            <p className="max-w-xs text-right text-xs text-phoebe-anthracite/50 italic">
              &laquo; {negociationNote} &raquo;
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

      {statut === "en_negociation" && isAchat && !achatState.success && !contreState.success && (
        <div className="space-y-2">
          <p className="max-w-xs text-right text-xs text-phoebe-anthracite/50">
            En attente de la réponse du client
          </p>
          {montantEstime && (
            <p className="text-right text-xs font-medium text-phoebe-gold">
              Prix proposé : {Number(montantEstime).toLocaleString("fr-FR")} FCFA
            </p>
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
