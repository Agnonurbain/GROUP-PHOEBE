"use client";

import { useActionState, useState } from "react";
import { modifierCoefficients, type TarifState } from "@/app/actions/tarifs";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui";

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/12 bg-white px-3 py-2 text-sm text-phoebe-anthracite transition-colors focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15";

const CHAUFFEUR_OPTIONS = [
  { value: "optionnel", label: "Optionnel" },
  { value: "recommande", label: "Recommandé" },
  { value: "obligatoire", label: "Obligatoire" },
];

export function CoefficientsForm({
  zoneId,
  initial,
}: {
  zoneId: string;
  initial: {
    coefficient_majoration: number;
    caution_multiplicateur: number;
    km_inclus_par_jour: number;
    supplement_km_fcfa: number;
    chauffeur_statut: string;
    tarif_chauffeur_journalier: number;
  };
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<TarifState, FormData>(modifierCoefficients, {});

  return (
    <div>
      <Button
        variant="admin-ghost"
        onClick={() => setOpen(!open)}
        className="text-phoebe-gold hover:text-phoebe-gold-dark"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        Paramètres de zone
        <span className="rounded-full bg-phoebe-pearl px-1.5 py-0.5 text-[10px] text-phoebe-anthracite/50">
          ×{initial.coefficient_majoration}
        </span>
      </Button>

      {open && (
        <form action={action} className="mt-3 rounded-xl border border-phoebe-pearl bg-phoebe-pearl/10 p-4 space-y-3">
          <input type="hidden" name="zone_id" value={zoneId} />

          {state.error && (
            <p className="text-xs text-error">{state.error}</p>
          )}
          {state.success && (
            <p className="text-xs text-phoebe-green-deep">Paramètres mis à jour.</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-phoebe-anthracite/60">
                Coefficient prix
              </label>
              <input
                name="coefficient_majoration"
                type="number"
                step="0.01"
                min="0.5"
                max="5"
                defaultValue={initial.coefficient_majoration}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-phoebe-anthracite/60">
                Multiplicateur caution
              </label>
              <input
                name="caution_multiplicateur"
                type="number"
                step="0.01"
                min="0.5"
                max="5"
                defaultValue={initial.caution_multiplicateur}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-phoebe-anthracite/60">
                KM inclus/jour
              </label>
              <input
                name="km_inclus_par_jour"
                type="number"
                min="0"
                defaultValue={initial.km_inclus_par_jour}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-phoebe-anthracite/60">
                Supplément km (FCFA)
              </label>
              <input
                name="supplement_km_fcfa"
                type="number"
                min="0"
                defaultValue={initial.supplement_km_fcfa}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-phoebe-anthracite/60">
                Chauffeur
              </label>
              <select
                name="chauffeur_statut"
                defaultValue={initial.chauffeur_statut}
                required
                className={inputClass}
              >
                {CHAUFFEUR_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-phoebe-anthracite/60">
                Tarif chauffeur/jour (FCFA)
              </label>
              <input
                name="tarif_chauffeur_journalier"
                type="number"
                min="0"
                defaultValue={initial.tarif_chauffeur_journalier}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-phoebe-anthracite/60">
              Commentaire *
            </label>
            <textarea
              name="commentaire"
              required
              rows={2}
              placeholder="Raison de la modification..."
              className="w-full rounded-lg border border-phoebe-anthracite/12 bg-white px-3 py-2 text-sm text-phoebe-anthracite transition-colors focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
            />
          </div>

          <div className="flex gap-2">
            <SubmitButton className="rounded-lg bg-phoebe-gold px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-phoebe-gold/80">
              Enregistrer
            </SubmitButton>
            <Button variant="admin-ghost" size="sm" type="button" onClick={() => setOpen(false)}>
              Fermer
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
