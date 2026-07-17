"use client";

import { useState, useTransition } from "react";
import {
  validerVerification,
  rejeterVerification,
} from "@/app/actions/admin";

export function VerificationActions({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const [showRejet, setShowRejet] = useState(false);
  const [motif, setMotif] = useState("");

  return (
    <>
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              validerVerification(userId);
            })
          }
          className="rounded-lg bg-phoebe-green px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-phoebe-green-deep hover:shadow-md disabled:opacity-50"
        >
          Valider
        </button>
        <button
          disabled={pending}
          onClick={() => setShowRejet(true)}
          className="rounded-lg border border-error/30 px-3 py-1.5 text-xs font-semibold text-error hover:bg-error hover:text-white hover:shadow-md disabled:opacity-50"
        >
          Rejeter
        </button>
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
            <p className="mt-1 text-sm text-phoebe-anthracite/60">
              Le client verra cette raison sur son profil.
            </p>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex : Photo de la pièce d'identité illisible..."
              rows={3}
              className="mt-3 w-full rounded-lg border border-phoebe-pearl px-3 py-2 text-sm text-phoebe-anthracite placeholder:text-phoebe-anthracite/40 focus:border-phoebe-green focus:outline-none focus:ring-1 focus:ring-phoebe-green"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejet(false);
                  setMotif("");
                }}
                className="rounded-lg border border-phoebe-pearl px-4 py-2 text-sm text-phoebe-anthracite/70 hover:bg-phoebe-pearl hover:shadow-sm"
              >
                Annuler
              </button>
              <button
                disabled={pending || !motif.trim()}
                onClick={() =>
                  startTransition(async () => {
                    await rejeterVerification(userId, motif);
                    setShowRejet(false);
                    setMotif("");
                  })
                }
                className="rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-error/90 hover:shadow-md disabled:opacity-50"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
