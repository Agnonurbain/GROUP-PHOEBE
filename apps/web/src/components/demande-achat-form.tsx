"use client";

import { useActionState, useState } from "react";
import { creerDemandeAchat, type AchatState } from "@/app/actions/achat";
import { SubmitButton } from "@/components/submit-button";

export function DemandeAchatForm({
  vehiculeId,
  marque,
  modele,
  categorie,
  prixVente,
}: {
  vehiculeId: string;
  marque: string;
  modele: string;
  categorie: string;
  prixVente: number | null;
}) {
  const [state, action] = useActionState<AchatState, FormData>(creerDemandeAchat, {});
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <div className="space-y-3">
        {prixVente && prixVente > 0 && (
          <div className="rounded-xl bg-phoebe-gold/10 p-4 text-center">
            <p className="text-sm text-phoebe-anthracite/60">Prix de vente</p>
            <p className="text-2xl font-bold text-phoebe-gold">
              {prixVente.toLocaleString("fr-FR")} FCFA
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="block w-full cursor-pointer rounded-xl bg-phoebe-gold py-3 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-gold/90 hover:shadow-md active:scale-[0.98]"
        >
          Faire une demande d&apos;achat
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prixVente && prixVente > 0 && (
        <div className="rounded-xl bg-phoebe-gold/10 p-4 text-center">
          <p className="text-sm text-phoebe-anthracite/60">Prix de vente</p>
          <p className="text-2xl font-bold text-phoebe-gold">
            {prixVente.toLocaleString("fr-FR")} FCFA
          </p>
        </div>
      )}

      <form action={action} className="space-y-3">
        <input type="hidden" name="vehicule_id" value={vehiculeId} />
        <input type="hidden" name="marque" value={marque} />
        <input type="hidden" name="modele" value={modele} />
        <input type="hidden" name="categorie" value={categorie} />

        <textarea
          name="message"
          placeholder="Message pour l'opérateur (optionnel)"
          rows={3}
          className="w-full rounded-xl border border-phoebe-anthracite/20 px-4 py-3 text-sm text-phoebe-anthracite placeholder:text-phoebe-anthracite/40 focus:border-phoebe-gold focus:ring-1 focus:ring-phoebe-gold focus:outline-none"
        />

        {state.error && (
          <p className="text-xs text-error">{state.error}</p>
        )}

        <div className="flex gap-2">
          <SubmitButton className="flex-1 rounded-xl bg-phoebe-gold py-3 text-sm font-semibold text-white shadow-sm hover:bg-phoebe-gold/90 hover:shadow-md">
            Confirmer la demande d&apos;achat
          </SubmitButton>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="cursor-pointer rounded-xl border border-phoebe-anthracite/20 px-4 py-3 text-sm text-phoebe-anthracite/60 hover:bg-phoebe-pearl"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
