"use client";

import { useState, useActionState } from "react";
import { proposerModificationZone, type PropositionZoneState } from "@/app/actions/propositions-zones";
import { SubmitButton } from "@/components/submit-button";

const inputClass =
  "w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/15";

type Zone = {
  id: string;
  nom: string;
  coefficient_majoration: number;
  caution_multiplicateur: number;
  km_inclus_par_jour: number;
  supplement_km_fcfa: number;
  tarif_chauffeur_journalier: number;
};

const CHAMP_LABELS: Record<string, string> = {
  coefficient_majoration: "Coefficient de majoration",
  caution_multiplicateur: "Multiplicateur de caution",
  km_inclus_par_jour: "Km inclus par jour",
  supplement_km_fcfa: "Supplément km (FCFA)",
  tarif_chauffeur_journalier: "Tarif chauffeur journalier (FCFA)",
};

export function ProposerModificationZoneForm({ zones }: { zones: Zone[] }) {
  const [state, action] = useActionState<PropositionZoneState, FormData>(proposerModificationZone, {});
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id ?? "");
  const [selectedChamp, setSelectedChamp] = useState("coefficient_majoration");

  const zone = zones.find((z) => z.id === selectedZoneId);

  return (
    <div className="rounded-xl border border-phoebe-gold/30 bg-phoebe-gold/5 p-4">
      <h2 className="mb-3 text-sm font-semibold text-phoebe-anthracite">
        Proposer une modification de coefficient zone
      </h2>
      <p className="mb-3 text-xs text-phoebe-anthracite/60">
        La proposition sera soumise au propriétaire pour validation.
        Les modifications de ±15 % ou moins sont approuvées automatiquement.
      </p>

      {state.error && (
        <div className="mb-3 rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="mb-3 rounded-lg bg-phoebe-green/10 px-3 py-2 text-xs text-phoebe-green-deep">
          Proposition envoyée.
        </div>
      )}

      <form action={action} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-phoebe-anthracite">Zone</label>
            <select
              name="zone_id"
              required
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className={inputClass}
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-phoebe-anthracite">Champ</label>
            <select
              name="champ"
              required
              value={selectedChamp}
              onChange={(e) => setSelectedChamp(e.target.value)}
              className={inputClass}
            >
              {Object.entries(CHAMP_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {zone && (
          <div className="text-xs text-phoebe-anthracite/60 bg-phoebe-pearl/30 rounded-lg px-3 py-2">
            Valeur actuelle de <strong>{CHAMP_LABELS[selectedChamp]}</strong> pour <strong>{zone.nom}</strong> :{" "}
            {String((zone as Record<string, unknown>)[selectedChamp] ?? "—")}
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-phoebe-anthracite">Nouvelle valeur</label>
          <input
            name="valeur_proposee"
            type="text"
            required
            className={inputClass}
            placeholder="Ex: 1.30"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-phoebe-anthracite">Commentaire (optionnel)</label>
          <input name="commentaire" className={inputClass} placeholder="Raison de la modification" />
        </div>

        <SubmitButton className="rounded-lg bg-phoebe-gold px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-phoebe-gold/80 hover:shadow-md">
          Envoyer la proposition
        </SubmitButton>
      </form>
    </div>
  );
}
