"use client";

import { useState } from "react";
import { NavLink } from "./nav-link";

export function AdminMobileNav({
  isProprietaire,
  nbDemandesEnAttente,
  nbRemboursements,
  nbPropositions,
}: {
  isProprietaire: boolean;
  nbDemandesEnAttente: number | null;
  nbRemboursements: number | null;
  nbPropositions: number | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-phoebe-green shadow-lg"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      {/* Full-screen overlay */}
      {open && (
        <div className="animate-fade-in fixed inset-0 z-50 flex flex-col bg-white">
          {/* Header with close button */}
          <div className="flex items-center justify-between border-b border-phoebe-pearl px-4 py-3">
            <span className="text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
              Menu
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-phoebe-anthracite/70 hover:bg-phoebe-pearl"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </button>
          </div>

          {/* Navigation links */}
          <nav
            className="flex-1 overflow-y-auto p-4 space-y-6"
            onClick={() => setOpen(false)}
          >
            {isProprietaire && (
              <div>
                <NavLink href="/admin">Tableau de bord</NavLink>
              </div>
            )}

            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
                Transport
              </h2>
              <div className="space-y-0.5">
                <NavLink href="/admin/demandes" badge={nbDemandesEnAttente}>
                  Demandes
                </NavLink>
                <NavLink href="/admin/vehicules">Vehicules</NavLink>
                <NavLink href="/admin/verifications" exact>
                  Verifications
                </NavLink>
                <NavLink href="/admin/verifications/historique">
                  Historique verif.
                </NavLink>
                {isProprietaire && (
                  <NavLink
                    href="/admin/remboursements"
                    badge={nbRemboursements}
                    badgeColor="bg-error"
                  >
                    Remboursements
                  </NavLink>
                )}
                {isProprietaire && (
                  <NavLink href="/admin/propositions" badge={nbPropositions}>
                    Propositions de prix
                  </NavLink>
                )}
              </div>
            </div>

            {isProprietaire && (
              <div>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
                  Administration
                </h2>
                <div className="space-y-0.5">
                  <NavLink href="/admin/comptes">Comptes internes</NavLink>
                </div>
              </div>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
