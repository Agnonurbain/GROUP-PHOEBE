"use client";

import { useActionState } from "react";
import { proposerPrix, type PropositionState } from "@/app/actions/propositions";
import { SubmitButton } from "@/components/submit-button";

const inputClass =
  "w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/15";

const CHAMP_OPTIONS = [
  { value: "prix_journalier", label: "Prix journalier" },
  { value: "prix_mensuel", label: "Prix mensuel" },
  { value: "prix_vente", label: "Prix de vente" },
];

export function ProposerPrixForm({
  vehiculeId,
  prixActuels,
}: {
  vehiculeId: string;
  prixActuels: {
    prix_journalier: number | null;
    prix_mensuel: number | null;
    prix_vente: number | null;
  };
}) {
  const [state, action] = useActionState<PropositionState, FormData>(proposerPrix, {});

  return (
    <div className="rounded-xl border border-phoebe-gold/30 bg-phoebe-gold/5 p-4">
      <h2 className="mb-3 text-sm font-semibold text-phoebe-anthracite">
        Proposer une modification de prix
      </h2>
      <p className="mb-3 text-xs text-phoebe-anthracite/60">
        La proposition sera soumise au propriétaire pour validation.
      </p>

      <div className="mb-3 text-xs text-phoebe-anthracite/50 space-y-0.5">
        <p>Journalier : {prixActuels.prix_journalier ? `${Number(prixActuels.prix_journalier).toLocaleString("fr-FR")} FCFA` : "—"}</p>
        <p>Mensuel : {prixActuels.prix_mensuel ? `${Number(prixActuels.prix_mensuel).toLocaleString("fr-FR")} FCFA` : "—"}</p>
        <p>Vente : {prixActuels.prix_vente ? `${Number(prixActuels.prix_vente).toLocaleString("fr-FR")} FCFA` : "—"}</p>
      </div>

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
        <input type="hidden" name="vehicule_id" value={vehiculeId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-phoebe-anthracite">
              Champ
            </label>
            <select name="champ" required className={inputClass}>
              {CHAMP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-phoebe-anthracite">
              Nouveau prix (FCFA)
            </label>
            <input
              name="valeur_proposee"
              type="number"
              min={1}
              required
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-phoebe-anthracite">
            Commentaire (optionnel)
          </label>
          <input name="commentaire" className={inputClass} placeholder="Raison de la modification" />
        </div>
        <SubmitButton className="rounded-lg bg-phoebe-gold px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-phoebe-gold/80 hover:shadow-md">
          Envoyer la proposition
        </SubmitButton>
      </form>
    </div>
  );
}
