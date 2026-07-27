"use client";

import { useActionState } from "react";
import { modifierTarifAssistance, type TarifState } from "@/app/actions/tarifs";
import { PAYS_LIST, type Prestation } from "@/lib/assistance";

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/15 bg-white px-3 py-2 text-sm text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/20";
const btn =
  "rounded-lg bg-phoebe-green px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-phoebe-green-deep disabled:opacity-50";

function PrestationRow({
  paysSlug,
  prestation,
  prix,
}: {
  paysSlug: string;
  prestation: Prestation;
  prix: number | null;
}) {
  const [state, action, pending] = useActionState<TarifState, FormData>(modifierTarifAssistance, {});
  const id = `${paysSlug}-${prestation.key}`;

  return (
    <div className="flex flex-wrap items-end gap-3 border-t border-phoebe-pearl py-3 first:border-t-0">
      <div className="min-w-[14rem] flex-1">
        <p className="text-sm font-medium text-phoebe-anthracite">{prestation.name}</p>
        <p className="text-[11px] text-phoebe-anthracite/60">
          {prix === null ? "Actuellement : sur devis" : `Actuellement : ${prix.toLocaleString("fr-FR")} FCFA`}
        </p>
      </div>
      <form action={action} className="flex items-end gap-2">
        <input type="hidden" name="pays_slug" value={paysSlug} />
        <input type="hidden" name="prestation_key" value={prestation.key} />
        <div>
          <label htmlFor={`p-${id}`} className="mb-1 block text-[11px] font-medium text-phoebe-anthracite/70">
            Prix (FCFA)
          </label>
          <input
            id={`p-${id}`}
            name="prix"
            type="number"
            min="1"
            step="1000"
            defaultValue={prix ?? ""}
            placeholder="Vide = sur devis"
            className={`${inputClass} w-40`}
          />
        </div>
        <button type="submit" disabled={pending} className={btn}>
          {pending ? "…" : "Enregistrer"}
        </button>
      </form>
      {state.error && (
        <p role="alert" className="w-full rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="w-full text-xs text-phoebe-green-deep">
          Enregistré.
        </p>
      )}
    </div>
  );
}

export function AssistanceTarifsForm({
  tarifs,
}: {
  tarifs: Record<string, Record<string, number | null>>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-phoebe-anthracite">Tarifs d&apos;assistance</h2>
        <p className="mt-1 text-sm text-phoebe-anthracite/70">
          Prix affiché au client pour chaque prestation. <strong>Laissez vide pour « Sur devis »</strong> —
          c&apos;est l&apos;état actuel des destinations Europe, en attente de vos tarifs.
        </p>
      </div>

      {PAYS_LIST.map((pays) => (
        <section key={pays.slug} className="rounded-2xl border border-phoebe-pearl bg-white p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-phoebe-anthracite">
            <span aria-hidden="true">{pays.flag}</span>
            {pays.name}
            <span className="rounded-full bg-phoebe-pearl px-2 py-0.5 text-[11px] font-medium text-phoebe-anthracite/70">
              {pays.categorie === "etudes" ? "Études" : "Voyage"}
            </span>
          </h3>
          <div className="mt-3">
            {pays.prestations.map((prestation) => (
              <PrestationRow
                key={prestation.key}
                paysSlug={pays.slug}
                prestation={prestation}
                prix={tarifs[pays.slug]?.[prestation.key] ?? prestation.prix}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
