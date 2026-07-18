"use client";

import { useActionState, useState, useTransition } from "react";
import { annulerParClient } from "@/app/actions/demandes";
import { noterVehicule, type AvisState } from "@/app/actions/avis";
import { payerPrixNegocie, type NegociationState } from "@/app/actions/negociation";
import { SubmitButton } from "@/components/submit-button";

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  en_attente_paiement: { label: "En attente de paiement", color: "bg-blue-50 text-blue-700" },
  en_negociation: { label: "En négociation", color: "bg-phoebe-gold/10 text-phoebe-gold" },
  en_attente_validation: { label: "En attente de validation", color: "bg-phoebe-gold/10 text-phoebe-gold" },
  acceptee: { label: "Acceptée", color: "bg-phoebe-green/10 text-phoebe-green-deep" },
  en_cours: { label: "En cours", color: "bg-blue-50 text-blue-700" },
  refusee: { label: "Refusée", color: "bg-error/10 text-error" },
  annulee: { label: "Annulée", color: "bg-phoebe-anthracite/10 text-phoebe-anthracite" },
  terminee: { label: "Terminée", color: "bg-phoebe-pearl text-phoebe-anthracite" },
};

type LigneDemande = {
  id: string;
  vehicule_id: string;
  avec_chauffeur: boolean;
  montant_ligne: number | null;
  vehicules: { marque: string; modele: string } | null;
};

type Demande = {
  id: string;
  statut: string;
  periode: string | null;
  montant: number | null;
  caution: number | null;
  avec_chauffeur: boolean;
  ville_depart: string | null;
  destination: string | null;
  caution_retenue: number;
  prix_negocie: number | null;
  created_at: string;
  lignes_demande?: LigneDemande[];
};

export function ReservationCard({
  demande,
  vehicule,
  dejaNote,
}: {
  demande: Demande;
  vehicule: { marque: string; modele: string } | null;
  dejaNote: boolean;
}) {
  const s = STATUT_LABELS[demande.statut];
  const [showCancel, setShowCancel] = useState(false);
  const [cancelResult, setCancelResult] = useState<{ error?: string; success?: boolean }>({});
  const [isPending, startTransition] = useTransition();

  const [avisState, avisAction] = useActionState<AvisState, FormData>(noterVehicule, {});
  const [payNegoState, payNegoAction] = useActionState<NegociationState, FormData>(payerPrixNegocie, {});
  const [showAvis, setShowAvis] = useState(false);

  const lignes = demande.lignes_demande ?? [];
  const canCancel = ["en_attente_validation", "acceptee", "en_negociation"].includes(demande.statut);
  const canPayNego = demande.statut === "en_attente_paiement" && demande.prix_negocie != null;
  const canRate = demande.statut === "terminee" && !dejaNote && !avisState.success;

  const debut = demande.periode
    ? new Date(demande.periode.replace("[", "").split(",")[0])
    : null;
  const fin = demande.periode
    ? new Date(demande.periode.split(",")[1].replace(")", ""))
    : null;

  function handleCancel() {
    startTransition(async () => {
      const result = await annulerParClient(demande.id);
      setCancelResult(result);
    });
  }

  return (
    <div className="rounded-xl border border-phoebe-pearl bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-phoebe-anthracite">
              {lignes.length > 0
                ? lignes.length === 1
                  ? `${lignes[0].vehicules?.marque ?? ""} ${lignes[0].vehicules?.modele ?? ""}`
                  : `${lignes.length} véhicules`
                : vehicule
                  ? `${vehicule.marque} ${vehicule.modele}`
                  : "—"}
            </h3>
            {s && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
                {s.label}
              </span>
            )}
          </div>
          {lignes.length > 1 && (
            <ul className="mt-1 space-y-0.5">
              {lignes.map((l) => (
                <li key={l.id} className="text-xs text-phoebe-anthracite/50">
                  {l.vehicules?.marque} {l.vehicules?.modele}
                  {l.avec_chauffeur && " · chauffeur"}
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-phoebe-anthracite/60">
            {debut && fin
              ? `Du ${debut.toLocaleDateString("fr-FR")} au ${fin.toLocaleDateString("fr-FR")}`
              : "—"}
            {demande.ville_depart && ` · ${demande.ville_depart}`}
            {demande.destination && ` → ${demande.destination}`}
          </p>
          <p className="text-sm text-phoebe-anthracite">
            {demande.montant ? `${Number(demande.montant).toLocaleString("fr-FR")} FCFA` : ""}
            {demande.caution_retenue > 0 && (
              <span className="ml-2 text-xs text-error">
                {Number(demande.caution_retenue).toLocaleString("fr-FR")} FCFA retenus
              </span>
            )}
          </p>
        </div>

        <span className="text-xs text-phoebe-anthracite/40">
          {new Date(demande.created_at).toLocaleDateString("fr-FR")}
        </span>
      </div>

      {cancelResult.error && (
        <p className="text-xs text-error">{cancelResult.error}</p>
      )}
      {cancelResult.success && (
        <p className="text-xs text-phoebe-green">Réservation annulée.</p>
      )}

      {canCancel && !cancelResult.success && (
        <>
          {!showCancel ? (
            <button
              onClick={() => setShowCancel(true)}
              className="text-xs text-error hover:underline"
            >
              Annuler cette réservation
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-error/5 p-3">
              <p className="text-xs text-phoebe-anthracite/70">
                {debut && (debut.getTime() - Date.now()) / 3600000 < 48
                  ? "Annulation à moins de 48h — la caution sera retenue."
                  : "Remboursement intégral."}
              </p>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="rounded-lg bg-error px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-error/90 hover:shadow-md disabled:opacity-50"
              >
                {isPending ? "..." : "Confirmer"}
              </button>
              <button
                onClick={() => setShowCancel(false)}
                className="text-xs text-phoebe-anthracite/50 hover:underline"
              >
                Non
              </button>
            </div>
          )}
        </>
      )}

      {demande.statut === "en_negociation" && !demande.prix_negocie && (
        <div className="rounded-lg bg-phoebe-gold/5 px-4 py-3 text-sm text-phoebe-gold">
          En attente du prix négocié — un opérateur vous contactera.
        </div>
      )}

      {canPayNego && (
        <div className="rounded-xl border border-phoebe-gold/30 bg-phoebe-gold/5 p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-phoebe-anthracite">Prix négocié</span>
            <span className="text-lg font-bold text-phoebe-gold">
              {Number(demande.prix_negocie).toLocaleString("fr-FR")} FCFA
            </span>
          </div>
          {payNegoState.error && (
            <p className="text-xs text-error">{payNegoState.error}</p>
          )}
          <form action={payNegoAction} className="space-y-2">
            <input type="hidden" name="demande_id" value={demande.id} />
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 text-xs text-phoebe-anthracite">
                <input type="radio" name="methode_paiement" value="cinetpay" defaultChecked className="text-phoebe-gold focus:ring-phoebe-gold" />
                Mobile Money
              </label>
              <label className="flex items-center gap-1.5 text-xs text-phoebe-anthracite">
                <input type="radio" name="methode_paiement" value="stripe" className="text-phoebe-gold focus:ring-phoebe-gold" />
                Carte bancaire
              </label>
            </div>
            <SubmitButton className="w-full rounded-lg bg-phoebe-gold px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-phoebe-gold/90 hover:shadow-md">
              Payer {Number(demande.prix_negocie).toLocaleString("fr-FR")} FCFA
            </SubmitButton>
          </form>
        </div>
      )}

      {canRate && (
        <>
          {!showAvis ? (
            <button
              onClick={() => setShowAvis(true)}
              className="text-xs text-phoebe-green hover:underline"
            >
              Noter cette location
            </button>
          ) : (
            <form action={avisAction} className="space-y-2 rounded-lg bg-phoebe-pearl/50 p-3">
              <input type="hidden" name="demande_id" value={demande.id} />
              {avisState.error && (
                <p className="text-xs text-error">{avisState.error}</p>
              )}
              <div className="flex items-center gap-3">
                <select
                  name="note"
                  required
                  className="rounded-lg border border-phoebe-anthracite/20 px-2 py-1 text-sm"
                >
                  <option value="5">★★★★★ (5)</option>
                  <option value="4">★★★★☆ (4)</option>
                  <option value="3">★★★☆☆ (3)</option>
                  <option value="2">★★☆☆☆ (2)</option>
                  <option value="1">★☆☆☆☆ (1)</option>
                </select>
                <input
                  name="commentaire"
                  placeholder="Commentaire (optionnel)"
                  className="flex-1 rounded-lg border border-phoebe-anthracite/20 px-2 py-1 text-sm"
                />
              </div>
              <SubmitButton className="rounded-lg bg-phoebe-green px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-phoebe-green-deep hover:shadow-md">
                Envoyer
              </SubmitButton>
            </form>
          )}
        </>
      )}

      {avisState.success && (
        <p className="text-xs text-phoebe-green">Merci pour votre avis !</p>
      )}
    </div>
  );
}
