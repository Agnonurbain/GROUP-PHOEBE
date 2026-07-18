"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  accepterDemande,
  refuserDemande,
  type DemandeActionState,
} from "@/app/actions/demandes";
import { envoyerPrixNegocie, type NegociationState } from "@/app/actions/negociation";
import { envoyerPrixAchat, type AchatState } from "@/app/actions/achat";
import { SubmitButton } from "@/components/submit-button";

export function DemandeActions({
  demandeId,
  statut,
  type,
  negociationNote,
  montantEstime,
  clientTelephone,
}: {
  demandeId: string;
  statut: string;
  type?: string;
  negociationNote?: string | null;
  montantEstime?: number | null;
  clientTelephone?: string | null;
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
    envoyerPrixAchat,
    {}
  );
  const [showPrixForm, setShowPrixForm] = useState(false);
  const [showAchatForm, setShowAchatForm] = useState(false);
  const isAchat = type === "achat";

  const whatsappUrl = clientTelephone
    ? `https://wa.me/${clientTelephone.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <div className="flex flex-col items-end gap-2">
      {(acceptState.error || refusState.error || negoState.error || achatState.error) && (
        <p className="text-xs text-error">
          {acceptState.error || refusState.error || negoState.error || achatState.error}
        </p>
      )}
      {acceptState.success && (
        <p className="text-xs text-phoebe-green">Acceptée</p>
      )}
      {achatState.success && (
        <p className="text-xs text-phoebe-green">Prix envoyé au client</p>
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

      {statut === "en_attente_validation" && isAchat && !achatState.success && (
        <div className="space-y-2">
          {negociationNote && (
            <p className="max-w-xs text-right text-xs text-phoebe-anthracite/50 italic">
              {negociationNote}
            </p>
          )}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366]/10 px-3 py-1.5 text-xs font-medium text-[#25D366] hover:bg-[#25D366]/20"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 0 0 .612.612l4.458-1.495A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.344 0-4.523-.689-6.362-1.868l-.444-.295-3.09 1.035 1.035-3.09-.295-.444A9.935 9.935 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Négocier sur WhatsApp
            </a>
          )}
          {!showAchatForm ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAchatForm(true)}
                className="rounded-lg bg-phoebe-gold px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-phoebe-gold/90 hover:shadow-md"
              >
                Envoyer le prix
              </button>
              <form action={refusAction}>
                <input type="hidden" name="demande_id" value={demandeId} />
                <SubmitButton className="rounded-lg border border-error/20 bg-error/5 px-3 py-1.5 text-xs font-medium text-error hover:bg-error hover:text-white hover:shadow-md">
                  Refuser
                </SubmitButton>
              </form>
            </div>
          ) : (
            <form action={achatAction} className="space-y-2">
              <input type="hidden" name="demande_id" value={demandeId} />
              <div className="flex items-end gap-2">
                <div>
                  <label className="mb-0.5 block text-[10px] text-phoebe-anthracite/50">
                    Prix final (FCFA)
                  </label>
                  <input
                    name="prix_final"
                    type="number"
                    min={1}
                    step={1000}
                    required
                    defaultValue={montantEstime ?? ""}
                    className="w-36 rounded-lg border border-phoebe-anthracite/20 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-phoebe-anthracite/50">
                    Acompte (FCFA)
                  </label>
                  <input
                    name="acompte"
                    type="number"
                    min={1}
                    step={1000}
                    placeholder="20% auto"
                    defaultValue={montantEstime ? Math.round(Number(montantEstime) * 0.2) : ""}
                    className="w-28 rounded-lg border border-phoebe-anthracite/20 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              <SubmitButton className="w-full rounded-lg bg-phoebe-gold px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-phoebe-gold/90 hover:shadow-md">
                Envoyer au client
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

      {(statut === "acceptee" || statut === "en_cours") && !isAchat && (
        <Link
          href={`/admin/demandes/${demandeId}/etat-lieux`}
          className="rounded-lg bg-phoebe-pearl px-3 py-1.5 text-xs font-medium text-phoebe-anthracite shadow-sm hover:bg-phoebe-green/10 hover:text-phoebe-green hover:shadow-md"
        >
          État des lieux
        </Link>
      )}

      {statut === "acceptee" && isAchat && (
        <p className="text-xs text-phoebe-green">Acompte payé — vente en cours</p>
      )}
    </div>
  );
}
