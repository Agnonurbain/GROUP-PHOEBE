"use client";

import { useTransition } from "react";
import {
  supprimerBlocageVehicule,
  supprimerBlocageChauffeur,
} from "@/app/actions/disponibilites";
import { Button } from "@/components/ui";

type Blocage = {
  id: string;
  periode: string | null;
  type?: string;
};

function parsePeriode(raw: string | null): { debut: string; fin: string } {
  if (!raw) return { debut: "—", fin: "—" };
  const cleaned = raw.replace(/[\[\]()]/g, "");
  const [debut, fin] = cleaned.split(",");
  return {
    debut: new Date(debut.trim()).toLocaleDateString("fr-FR"),
    fin: new Date(fin.trim()).toLocaleDateString("fr-FR"),
  };
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  reservation: { label: "Réservation", color: "bg-blue-50 text-blue-700" },
  maintenance: { label: "Maintenance", color: "bg-phoebe-gold/10 text-phoebe-gold-dark" },
  bloque: { label: "Bloqué", color: "bg-phoebe-anthracite/10 text-phoebe-anthracite" },
};

export function BlocagesVehiculeList({
  blocages,
  vehiculeId,
}: {
  blocages: Blocage[];
  vehiculeId: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (blocages.length === 0) {
    return (
      <p className="text-sm text-phoebe-anthracite/70">
        Aucune période bloquée.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {blocages.map((b) => {
        const { debut, fin } = parsePeriode(b.periode);
        const typeInfo = TYPE_LABELS[b.type ?? "bloque"];

        return (
          <div
            key={b.id}
            className="flex items-center justify-between rounded-lg border border-phoebe-pearl px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeInfo.color}`}
              >
                {typeInfo.label}
              </span>
              <span className="text-sm text-phoebe-anthracite">
                {debut} → {fin}
              </span>
            </div>
            {b.type !== "reservation" && (
              <Button
                variant="admin-ghost"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await supprimerBlocageVehicule(b.id, vehiculeId);
                  });
                }}
                className="border-0 text-error hover:underline"
              >
                Supprimer
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function BlocagesChauffeurList({
  blocages,
  vehiculeId,
}: {
  blocages: Blocage[];
  vehiculeId: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (blocages.length === 0) {
    return (
      <p className="text-sm text-phoebe-anthracite/70">
        Aucune période bloquée pour le chauffeur.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {blocages.map((b) => {
        const { debut, fin } = parsePeriode(b.periode);

        return (
          <div
            key={b.id}
            className="flex items-center justify-between rounded-lg border border-phoebe-pearl px-4 py-3"
          >
            <span className="text-sm text-phoebe-anthracite">
              {debut} → {fin}
            </span>
            <Button
              variant="admin-ghost"
              size="sm"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await supprimerBlocageChauffeur(b.id, vehiculeId);
                });
              }}
              className="border-0 text-error hover:underline"
            >
              Supprimer
            </Button>
          </div>
        );
      })}
    </div>
  );
}
