"use client";

import { useActionState } from "react";
import { modererAvisForm, type AvisState } from "@/app/actions/avis";
import { SubmitButton } from "@/components/submit-button";
import { Obligatoire } from "@/components/ui/obligatoire"

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/12 bg-white px-3 py-2 text-sm text-phoebe-anthracite transition-colors focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15";

export function AvisModerationForm({
  avisId,
  statutInitial,
  reponseInitiale,
}: {
  avisId: string;
  statutInitial: string;
  reponseInitiale: string | null;
}) {
  const [state, action] = useActionState<AvisState, FormData>(modererAvisForm, {});

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="avis_id" value={avisId} />

      {state.error && (
        <p role="alert" className="rounded-lg bg-error/10 px-4 py-2 text-xs text-error">{state.error}</p>
      )}
      {state.success && (
        <p role="status" className="rounded-lg bg-phoebe-green/10 px-4 py-2 text-xs text-phoebe-green-deep">
          Avis modéré avec succès.
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="statut" className="block text-sm font-medium text-phoebe-anthracite">
          Statut<Obligatoire />
        </label>
        <select
          id="statut"
          name="statut"
          defaultValue={statutInitial === "en_attente" ? "publie" : statutInitial}
          className={inputClass}
          required
        >
          <option value="publie">Publié</option>
          <option value="refuse">Refusé</option>
        </select>
        <p className="text-xs text-phoebe-anthracite/60">
          Un avis publié est visible sur le site. Un avis refusé reste masqué.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="reponse_admin" className="block text-sm font-medium text-phoebe-anthracite">
          Réponse de l&apos;administration
        </label>
        <textarea
          id="reponse_admin"
          name="reponse_admin"
          rows={4}
          defaultValue={reponseInitiale ?? ""}
          className={inputClass}
          placeholder="Vous pouvez répondre publiquement à cet avis…"
        />
        <p className="text-xs text-phoebe-anthracite/60">
          Cette réponse sera affichée publiquement sous l&apos;avis.
        </p>
      </div>

      <div className="pt-2">
        <SubmitButton>Enregistrer la modération</SubmitButton>
      </div>
    </form>
  );
}
