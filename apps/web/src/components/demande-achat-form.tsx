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

        <div className="flex items-center gap-3 rounded-xl bg-phoebe-green/5 px-4 py-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-phoebe-green">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-phoebe-green-deep">Documents vérifiés par GROUP PHOEBE</p>
            <p className="text-xs text-phoebe-anthracite/50">Carte grise et certificat de non-gage contrôlés avant mise en vente.</p>
          </div>
        </div>

        <div className="rounded-xl border border-phoebe-anthracite/10 px-4 py-3">
          <p className="text-xs text-phoebe-anthracite/60">
            La carte grise et le certificat de non-gage vous seront présentés après versement de l&apos;acompte, lors du rendez-vous de remise du véhicule.
          </p>
          <p className="mt-1 text-xs font-medium text-phoebe-green-deep">
            Garantie : si les documents ne sont pas conformes, votre acompte est intégralement remboursé.
          </p>
        </div>

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

        <div>
          <label className="mb-1 block text-xs font-medium text-phoebe-anthracite/60">
            Votre proposition de prix (optionnel)
          </label>
          <div className="flex items-center gap-2">
            <input
              name="prix_propose"
              type="number"
              min={1}
              step={1000}
              placeholder={prixVente ? String(prixVente) : ""}
              className="w-full rounded-xl border border-phoebe-anthracite/20 px-4 py-3 text-sm text-phoebe-anthracite placeholder:text-phoebe-anthracite/40 focus:border-phoebe-gold focus:ring-1 focus:ring-phoebe-gold focus:outline-none"
            />
            <span className="shrink-0 text-sm text-phoebe-anthracite/50">FCFA</span>
          </div>
          {prixVente && prixVente > 0 && (
            <p className="mt-1 text-xs text-phoebe-anthracite/40">
              Laissez vide pour accepter le prix affiché
            </p>
          )}
        </div>

        <textarea
          name="message"
          placeholder="Message pour l'opérateur (optionnel)"
          rows={2}
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
