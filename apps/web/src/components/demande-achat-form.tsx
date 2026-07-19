"use client";

import { useActionState, useState } from "react";
import { creerDemandeAchat, type AchatState } from "@/app/actions/achat";
import { SubmitButton } from "@/components/submit-button";

const WHATSAPP_NUMBER = "2250778631983";

export function DemandeAchatForm({
  vehiculeId,
  marque,
  modele,
  categorie,
  prixVente,
  etat,
}: {
  vehiculeId: string;
  marque: string;
  modele: string;
  categorie: string;
  prixVente: number | null;
  etat: string;
}) {
  const [state, action] = useActionState<AchatState, FormData>(creerDemandeAchat, {});
  const [showForm, setShowForm] = useState(false);

  const etatLabel = etat === "neuf" ? "neuf" : "d'occasion";
  const whatsappMessage = `Bonjour, je suis intéressé(e) par l'achat du ${marque} ${modele} (${etatLabel})${prixVente ? ` affiché à ${prixVente.toLocaleString("fr-FR")} FCFA` : ""}. Je souhaite discuter du prix.`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

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

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#25D366] bg-[#25D366]/10 py-3 text-sm font-semibold text-[#25D366] transition-all hover:bg-[#25D366]/20"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Négocier le prix sur WhatsApp
      </a>

      <div className="relative flex items-center gap-3 py-1">
        <div className="flex-1 border-t border-phoebe-anthracite/10" />
        <span className="text-xs text-phoebe-anthracite/40">ou</span>
        <div className="flex-1 border-t border-phoebe-anthracite/10" />
      </div>

      <form action={action} className="space-y-3">
        <input type="hidden" name="vehicule_id" value={vehiculeId} />
        <input type="hidden" name="marque" value={marque} />
        <input type="hidden" name="modele" value={modele} />
        <input type="hidden" name="categorie" value={categorie} />

        {state.error && (
          <p className="text-xs text-error">{state.error}</p>
        )}

        <div className="flex gap-2">
          <SubmitButton className="flex-1 rounded-xl bg-phoebe-gold py-3 text-sm font-semibold text-white shadow-sm hover:bg-phoebe-gold/90 hover:shadow-md">
            Acheter au prix affiché
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
