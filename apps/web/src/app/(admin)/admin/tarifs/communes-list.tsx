"use client";

import { useTransition } from "react";
import { supprimerCommune } from "@/app/actions/tarifs";

type Commune = {
  id: string;
  nom: string;
  ajoutee_par_client: boolean;
};

export function CommunesList({ communes }: { communes: Commune[] }) {
  const [pending, startTransition] = useTransition();

  if (communes.length === 0) {
    return (
      <p className="text-sm text-phoebe-anthracite/40">Aucune commune.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {communes.map((c) => (
        <span
          key={c.id}
          className="inline-flex items-center gap-1 rounded-full bg-phoebe-pearl px-3 py-1 text-sm text-phoebe-anthracite"
        >
          {c.nom}
          {c.ajoutee_par_client && (
            <span className="text-xs text-phoebe-gold" title="Ajoutée par un client">*</span>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(() => {
                supprimerCommune(c.id);
              })
            }
            className="ml-0.5 text-phoebe-anthracite/30 transition-colors hover:text-error disabled:opacity-50"
            title="Supprimer"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
