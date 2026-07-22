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
import { finaliserInspection, type EtatLieuxState } from "@/app/actions/etat-lieux";
import { Button } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function DemandeActions({
  demandeId,
  statut,
  type,
  negociationNote,
  montantEstime,
  clientTelephone,
  cautionMax,
}: {
  demandeId: string;
  statut: string;
  type?: string;
  negociationNote?: string | null;
  montantEstime?: number | null;
  clientTelephone?: string | null;
  cautionMax?: number | null;
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
  const [inspState, inspAction] = useActionState<EtatLieuxState, FormData>(
    finaliserInspection,
    {}
  );
  const [showPrixForm, setShowPrixForm] = useState(false);
  const [showAchatForm, setShowAchatForm] = useState(false);
  const [showInspForm, setShowInspForm] = useState(false);
  const [showRefusForm, setShowRefusForm] = useState(false);
  const isAchat = type === "achat";

  const whatsappUrl = clientTelephone
    ? `https://wa.me/${clientTelephone.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <div className="flex flex-col items-end gap-2">
      {(acceptState.error || refusState.error || negoState.error || achatState.error || inspState.error) && (
        <p className="text-xs text-error">
          {acceptState.error || refusState.error || negoState.error || achatState.error || inspState.error}
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
        <div className="space-y-2">
          <div className="flex gap-2">
            <form action={acceptAction}>
              <input type="hidden" name="demande_id" value={demandeId} />
              <SubmitButton className="rounded-lg bg-phoebe-green px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-phoebe-green-deep hover:shadow-md">
                Accepter
              </SubmitButton>
            </form>
            {!showRefusForm ? (
              <Button
                variant="admin-ghost"
                size="sm"
                type="button"
                onClick={() => setShowRefusForm(true)}
                className="border-error/20 bg-error/5 text-error hover:bg-error hover:text-white"
              >
                Refuser
              </Button>
            ) : (
              <Button
                variant="admin-ghost"
                size="sm"
                type="button"
                onClick={() => setShowRefusForm(false)}
              >
                Annuler
              </Button>
            )}
          </div>
          {showRefusForm && (
            <form action={refusAction} className="space-y-2">
              <input type="hidden" name="demande_id" value={demandeId} />
              <textarea
                name="motif_refus"
                required
                rows={2}
                placeholder="Motif du refus (obligatoire)…"
                className="w-full rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-phoebe-anthracite placeholder:text-phoebe-anthracite/40 focus:border-error focus:outline-none focus:ring-1 focus:ring-error/30"
              />
              <SubmitButton className="rounded-lg bg-error px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-error/90 hover:shadow-md">
                Confirmer le refus
              </SubmitButton>
            </form>
          )}
        </div>
      )}

      {statut === "en_attente_validation" && isAchat && !achatState.success && (
        <div className="space-y-2">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#25D366]/90 hover:shadow-md"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Négocier avec le client
            </a>
          )}
          {!showAchatForm ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="admin-alert"
                  size="sm"
                  type="button"
                  onClick={() => setShowAchatForm(true)}
                >
                  Confirmer le prix
                </Button>
                {!showRefusForm ? (
                  <Button
                    variant="admin-ghost"
                    size="sm"
                    type="button"
                    onClick={() => setShowRefusForm(true)}
                    className="border-error/20 bg-error/5 text-error hover:bg-error hover:text-white"
                  >
                    Refuser
                  </Button>
                ) : (
                  <Button
                    variant="admin-ghost"
                    size="sm"
                    type="button"
                    onClick={() => setShowRefusForm(false)}
                  >
                    Annuler
                  </Button>
                )}
              </div>
              {showRefusForm && (
                <form action={refusAction} className="space-y-2">
                  <input type="hidden" name="demande_id" value={demandeId} />
                  <textarea
                    name="motif_refus"
                    required
                    rows={2}
                    placeholder="Motif du refus (obligatoire)…"
                    className="w-full rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-phoebe-anthracite placeholder:text-phoebe-anthracite/40 focus:border-error focus:outline-none focus:ring-1 focus:ring-error/30"
                  />
                  <SubmitButton className="rounded-lg bg-error px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-error/90 hover:shadow-md">
                    Confirmer le refus
                  </SubmitButton>
                </form>
              )}
            </div>
          ) : (
            <form action={achatAction} className="space-y-2">
              <input type="hidden" name="demande_id" value={demandeId} />
              <div className="flex items-end gap-2">
                <div>
                  <label className="mb-0.5 block text-[10px] text-phoebe-anthracite/50">
                    Prix convenu (FCFA)
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
            <Button
              variant="admin-alert"
              size="sm"
              type="button"
              onClick={() => setShowPrixForm(true)}
            >
              Proposer un prix
            </Button>
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

      {statut === "retour_en_inspection" && !inspState.success && (
        <div className="space-y-2">
          {!showInspForm ? (
            <Button
              variant="admin"
              size="sm"
              type="button"
              onClick={() => setShowInspForm(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Finaliser l&apos;inspection
            </Button>
          ) : (
            <form action={inspAction} className="flex items-end gap-2">
              <input type="hidden" name="demande_id" value={demandeId} />
              <div>
                <label className="mb-0.5 block text-[10px] text-phoebe-anthracite/50">
                  Caution retenue (FCFA)
                </label>
                <input
                  name="caution_retenue"
                  type="number"
                  min={0}
                  max={cautionMax ?? undefined}
                  defaultValue={0}
                  className="w-32 rounded-lg border border-phoebe-anthracite/20 px-2 py-1.5 text-sm"
                />
                {cautionMax != null && (
                  <p className="mt-0.5 text-[10px] text-phoebe-anthracite/40">
                    Max : {Number(cautionMax).toLocaleString("fr-FR")} FCFA
                  </p>
                )}
              </div>
              <SubmitButton className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-purple-700 hover:shadow-md">
                Clôturer
              </SubmitButton>
            </form>
          )}
        </div>
      )}
      {inspState.success && (
        <p className="text-xs text-phoebe-green">Inspection terminée — location clôturée</p>
      )}

      {statut === "acceptee" && isAchat && (
        <p className="text-xs text-phoebe-green">Acompte payé — vente en cours</p>
      )}
    </div>
  );
}
