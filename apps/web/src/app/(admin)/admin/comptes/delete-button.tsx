"use client";

import { useState, useTransition } from "react";
import { supprimerCompteInterne } from "@/app/actions/admin";

export function DeleteAccountButton({
  userId,
  nom,
}: {
  userId: string;
  nom: string;
}) {
  const [pending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [motif, setMotif] = useState("");

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setShowModal(true)}
        className="text-xs text-error/70 transition-colors hover:text-error disabled:opacity-50"
      >
        Supprimer
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-phoebe-anthracite/40"
          onClick={() => setShowModal(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl border border-phoebe-pearl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-phoebe-anthracite">
              Supprimer le compte
            </h3>
            <p className="mt-1 text-sm text-phoebe-anthracite/60">
              Vous êtes sur le point de supprimer le compte de{" "}
              <strong>{nom}</strong>. Cette action est irréversible.
            </p>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Motif de la suppression..."
              rows={3}
              className="mt-3 w-full rounded-lg border border-phoebe-pearl px-3 py-2 text-sm text-phoebe-anthracite placeholder:text-phoebe-anthracite/40 focus:border-error focus:outline-none focus:ring-1 focus:ring-error"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setMotif("");
                }}
                className="rounded-lg border border-phoebe-pearl px-4 py-2 text-sm text-phoebe-anthracite/70 transition-colors hover:bg-phoebe-pearl"
              >
                Annuler
              </button>
              <button
                disabled={pending || !motif.trim()}
                onClick={() =>
                  startTransition(async () => {
                    await supprimerCompteInterne(userId, motif);
                    setShowModal(false);
                    setMotif("");
                  })
                }
                className="rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-error/90 disabled:opacity-50"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
