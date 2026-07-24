"use client";

import { useState, useTransition } from "react";
import {
  validerVerification,
  rejeterVerification,
} from "@/app/actions/admin";
import { Button } from "@/components/ui";

export function VerificationActions({ userId, sousAge }: { userId: string; sousAge?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [showRejet, setShowRejet] = useState(false);
  const [motif, setMotif] = useState("");
  const [derogation, setDerogation] = useState(false);

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        {sousAge && (
          <div className="flex items-center gap-1.5">
            <input
              id={`derog-${userId}`}
              type="checkbox"
              checked={derogation}
              onChange={(e) => setDerogation(e.target.checked)}
              className="rounded border-error/30 text-phoebe-gold-dark focus:ring-phoebe-gold"
            />
            <label htmlFor={`derog-${userId}`} className="text-[10px] font-medium text-error">
              Dérogation exceptionnelle
            </label>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="admin"
            size="sm"
            disabled={pending || (sousAge && !derogation)}
            onClick={() =>
              startTransition(() => {
                validerVerification(userId);
              })
            }
          >
            Valider
          </Button>
          <Button
            variant="admin-ghost"
            size="sm"
            disabled={pending}
            onClick={() => setShowRejet(true)}
            className="border-error/30 text-error hover:bg-error hover:text-white"
          >
            Rejeter
          </Button>
        </div>
        {sousAge && !derogation && (
          <p className="text-[10px] text-error/70 text-right max-w-32 leading-tight">
            Cocher &laquo;Dérogation&raquo; pour valider un mineur de moins de 21 ans
          </p>
        )}
      </div>

      {showRejet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-phoebe-anthracite/40"
          onClick={() => setShowRejet(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl border border-phoebe-pearl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-phoebe-anthracite">
              Motif du rejet
            </h3>
            <p className="mt-1 text-sm text-phoebe-anthracite/70">
              Le client verra cette raison sur son profil.
            </p>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex : Photo de la pièce d'identité illisible..."
              rows={3}
              className="mt-3 w-full rounded-lg border border-phoebe-pearl px-3 py-2 text-sm text-phoebe-anthracite placeholder:text-phoebe-anthracite/70 focus:border-phoebe-green focus:outline-none focus:ring-1 focus:ring-phoebe-green"
            />
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="admin-ghost" onClick={() => { setShowRejet(false); setMotif(""); }}>
                Annuler
              </Button>
              <Button
                variant="admin-danger"
                disabled={pending || !motif.trim()}
                onClick={() =>
                  startTransition(async () => {
                    await rejeterVerification(userId, motif);
                    setShowRejet(false);
                    setMotif("");
                  })
                }
              >
                Confirmer le rejet
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
