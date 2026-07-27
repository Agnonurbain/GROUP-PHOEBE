"use client";

import { useActionState } from "react";
import {
  modifierTarifLivraison,
  modifierPalierPoids,
  type TarifState,
} from "@/app/actions/tarifs";
import {
  ZONES_LIVRAISON,
  MODES_LIVRAISON,
  ZONE_LABELS,
  MODE_LABELS,
  type GrilleTarifs,
} from "@/lib/livraison";

type PalierRow = {
  id: string;
  ordre: number;
  label: string;
  max_kg: number;
  multiplicateur: number;
};

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/15 bg-white px-3 py-2 text-sm text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/20";
const btn =
  "rounded-lg bg-phoebe-green px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-phoebe-green-deep disabled:opacity-50";

function Feedback({ state }: { state: TarifState }) {
  if (state.error) {
    return (
      <p role="alert" className="mt-3 rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="mt-3 rounded-lg border border-phoebe-green/20 bg-phoebe-green/5 px-3 py-2 text-xs text-phoebe-green-deep">
        Enregistré.
      </p>
    );
  }
  return null;
}

function TarifCell({ zone, mode, prix }: { zone: string; mode: string; prix: number }) {
  const [state, action, pending] = useActionState<TarifState, FormData>(modifierTarifLivraison, {});

  return (
    <form action={action} className="flex items-center gap-1.5">
      <input type="hidden" name="zone" value={zone} />
      <input type="hidden" name="mode" value={mode} />
      <label htmlFor={`t-${zone}-${mode}`} className="sr-only">
        {ZONE_LABELS[zone as keyof typeof ZONE_LABELS]} — {MODE_LABELS[mode as keyof typeof MODE_LABELS]}
      </label>
      <input
        id={`t-${zone}-${mode}`}
        name="prix"
        type="number"
        min="1"
        step="100"
        defaultValue={prix}
        required
        className={`${inputClass} w-28`}
        aria-invalid={state.error ? true : undefined}
      />
      <button type="submit" disabled={pending} className={btn}>
        {pending ? "…" : "OK"}
      </button>
    </form>
  );
}

function PalierRowForm({ palier }: { palier: PalierRow }) {
  const [state, action, pending] = useActionState<TarifState, FormData>(modifierPalierPoids, {});

  return (
    <div className="rounded-xl border border-phoebe-pearl bg-white p-4">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={palier.id} />
        <div className="min-w-[10rem] flex-1">
          <label htmlFor={`lbl-${palier.id}`} className="mb-1 block text-[11px] font-medium text-phoebe-anthracite/70">
            Libellé
          </label>
          <input id={`lbl-${palier.id}`} name="label" defaultValue={palier.label} required className={inputClass} />
        </div>
        <div>
          <label htmlFor={`max-${palier.id}`} className="mb-1 block text-[11px] font-medium text-phoebe-anthracite/70">
            Jusqu&apos;à (kg)
          </label>
          <input
            id={`max-${palier.id}`}
            name="max_kg"
            type="number"
            min="0.1"
            step="0.5"
            defaultValue={palier.max_kg}
            required
            className={`${inputClass} w-28`}
          />
        </div>
        <div>
          <label htmlFor={`mul-${palier.id}`} className="mb-1 block text-[11px] font-medium text-phoebe-anthracite/70">
            Coefficient
          </label>
          <input
            id={`mul-${palier.id}`}
            name="multiplicateur"
            type="number"
            min="0.1"
            step="0.1"
            defaultValue={palier.multiplicateur}
            required
            className={`${inputClass} w-28`}
          />
        </div>
        <button type="submit" disabled={pending} className={btn}>
          {pending ? "…" : "Enregistrer"}
        </button>
      </form>
      <Feedback state={state} />
    </div>
  );
}

export function LivraisonTarifsForm({
  grille,
  paliers,
}: {
  grille: GrilleTarifs;
  paliers: PalierRow[];
}) {
  const dernier = paliers.at(-1);

  return (
    <div className="space-y-8">
      {/* Grille zone × mode */}
      <section>
        <h2 className="text-lg font-bold text-phoebe-anthracite">Grille de livraison</h2>
        <p className="mt-1 text-sm text-phoebe-anthracite/70">
          Prix de base en FCFA, appliqué au premier palier de poids. La zone est déduite
          automatiquement des adresses de collecte et de livraison.
        </p>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-phoebe-pearl bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-phoebe-pearl bg-phoebe-pearl/30">
              <tr>
                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">
                  Zone
                </th>
                {MODES_LIVRAISON.map((mode) => (
                  <th key={mode} scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">
                    {MODE_LABELS[mode]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-phoebe-pearl/70">
              {ZONES_LIVRAISON.map((zone) => (
                <tr key={zone}>
                  <th scope="row" className="px-5 py-3 text-left font-semibold text-phoebe-anthracite">
                    {ZONE_LABELS[zone]}
                  </th>
                  {MODES_LIVRAISON.map((mode) => (
                    <td key={mode} className="px-5 py-3">
                      <TarifCell zone={zone} mode={mode} prix={grille[zone][mode]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Paliers de poids */}
      <section>
        <h2 className="text-lg font-bold text-phoebe-anthracite">Paliers de poids</h2>
        <p className="mt-1 text-sm text-phoebe-anthracite/70">
          Le prix de base est multiplié par le coefficient du palier. Les bornes doivent rester
          croissantes.
          {dernier && (
            <>
              {" "}
              Au-delà de <strong>{dernier.max_kg} kg</strong>, la commande en ligne est refusée et
              la livraison passe sur devis.
            </>
          )}
        </p>

        <div className="mt-5 space-y-3">
          {paliers.map((p) => (
            <PalierRowForm key={p.id} palier={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
