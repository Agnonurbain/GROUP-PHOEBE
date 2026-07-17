"use client";

import { useState, useTransition } from "react";
import { verifierDisponibilite } from "@/app/actions/disponibilites";

export function DisponibiliteChecker({
  vehiculeId,
  chauffeurDisponible,
}: {
  vehiculeId: string;
  chauffeurDisponible: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [resultat, setResultat] = useState<{
    disponible: boolean;
    raison?: string;
  } | null>(null);

  function handleSubmit(formData: FormData) {
    const debut = formData.get("debut") as string;
    const fin = formData.get("fin") as string;
    const avecChauffeur = formData.get("avec_chauffeur") === "on";

    if (!debut || !fin) return;

    startTransition(async () => {
      const res = await verifierDisponibilite(
        vehiculeId,
        debut,
        fin,
        avecChauffeur
      );
      setResultat(res);
    });
  }

  return (
    <div className="rounded-xl bg-phoebe-pearl p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
        Vérifier la disponibilité
      </h2>

      <form action={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="dispo-debut" className="mb-1 block text-sm text-phoebe-anthracite/60">
              Du
            </label>
            <input
              id="dispo-debut"
              type="date"
              name="debut"
              required
              min={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-phoebe-anthracite/20 bg-white px-3 py-2 text-sm focus:border-phoebe-green"
            />
          </div>
          <div>
            <label htmlFor="dispo-fin" className="mb-1 block text-sm text-phoebe-anthracite/60">
              Au
            </label>
            <input
              id="dispo-fin"
              type="date"
              name="fin"
              required
              min={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-phoebe-anthracite/20 bg-white px-3 py-2 text-sm focus:border-phoebe-green"
            />
          </div>
        </div>

        {chauffeurDisponible && (
          <label className="flex items-center gap-2 text-sm text-phoebe-anthracite">
            <input
              type="checkbox"
              name="avec_chauffeur"
              className="rounded border-phoebe-anthracite/30 text-phoebe-green focus:ring-phoebe-green"
            />
            Avec chauffeur
          </label>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-phoebe-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-phoebe-green-deep disabled:opacity-50"
        >
          {isPending ? "Vérification…" : "Vérifier"}
        </button>
      </form>

      {resultat && (
        <div
          className={`mt-3 rounded-lg px-4 py-3 text-sm ${
            resultat.disponible
              ? "bg-phoebe-green/10 text-phoebe-green-deep"
              : "bg-error/10 text-error"
          }`}
        >
          {resultat.disponible
            ? "Ce véhicule est disponible sur cette période."
            : resultat.raison}
        </div>
      )}
    </div>
  );
}
