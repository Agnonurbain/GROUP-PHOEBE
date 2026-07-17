"use client";

import { useState } from "react";
import { deconnexion } from "@/app/actions/auth";

export function LogoutButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Déconnexion
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-phoebe-anthracite/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl border border-phoebe-pearl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-phoebe-anthracite">
              Déconnexion
            </h3>
            <p className="mt-2 text-sm text-phoebe-anthracite/60">
              Voulez-vous vraiment vous déconnecter ?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-phoebe-pearl px-4 py-2 text-sm text-phoebe-anthracite/70 hover:bg-phoebe-pearl hover:shadow-sm"
              >
                Annuler
              </button>
              <form action={deconnexion}>
                <button
                  type="submit"
                  className="rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-error/90 hover:shadow-md"
                >
                  Se déconnecter
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
