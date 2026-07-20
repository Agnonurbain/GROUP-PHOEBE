"use client";

import { useState } from "react";

export function DateSelector({ prixJournalier }: { prixJournalier: number }) {
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const nbJours =
    debut && fin
      ? Math.max(1, Math.ceil(
          (new Date(fin).getTime() - new Date(debut).getTime()) / (1000 * 60 * 60 * 24)
        ))
      : 0;

  const estimation = nbJours > 0 ? prixJournalier * nbJours : 0;

  return (
    <div className="rounded-2xl border border-phoebe-pearl bg-white p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/40">
        Période de location
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="detail-debut" className="mb-1 block text-xs font-medium text-phoebe-anthracite/50">
            Début
          </label>
          <input
            id="detail-debut"
            type="date"
            min={today}
            value={debut}
            onChange={(e) => setDebut(e.target.value)}
            className="w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-3 py-2 text-sm text-phoebe-anthracite transition-all focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
          />
        </div>
        <div>
          <label htmlFor="detail-fin" className="mb-1 block text-xs font-medium text-phoebe-anthracite/50">
            Fin
          </label>
          <input
            id="detail-fin"
            type="date"
            min={debut ? new Date(new Date(debut).getTime() + 86400000).toISOString().split("T")[0] : today}
            value={fin}
            onChange={(e) => setFin(e.target.value)}
            className="w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-3 py-2 text-sm text-phoebe-anthracite transition-all focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
          />
        </div>
      </div>
      {nbJours > 0 && (
        <div className="mt-3 rounded-lg bg-phoebe-green/5 px-3 py-2 text-center">
          <p className="text-sm font-semibold text-phoebe-green-deep">
            {nbJours} jour{nbJours > 1 ? "s" : ""} · {estimation.toLocaleString("fr-FR")} FCFA
          </p>
          <p className="text-xs text-phoebe-anthracite/40">
            {prixJournalier.toLocaleString("fr-FR")} FCFA/jour
          </p>
        </div>
      )}
      {!debut && !fin && (
        <div className="mt-3 text-center text-xs text-phoebe-anthracite/40">
          Sélectionnez une période pour voir le prix estimé
        </div>
      )}
    </div>
  );
}
