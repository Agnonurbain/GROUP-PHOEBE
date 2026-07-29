"use client";

import { useActionState } from "react";
import { modifierParametresBillet, type BilletState } from "@/app/actions/billets";
import { libelleDelai, type ParametresBillet } from "@/lib/billets";
import { SubmitButton } from "@/components/submit-button";

const inputClass =
  "w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-phoebe-pearl focus:outline-none focus:ring-2 focus:ring-phoebe-green/15";
const labelClass = "mb-1 block text-sm font-medium text-phoebe-anthracite";
const aide = "mt-1.5 text-xs text-phoebe-anthracite/60";

/**
 * Paramètres des billets d'avion. Tout ce qui était figé dans le code : frais de
 * service, validité de passeport exigée, plafond de voyageurs, délai annoncé.
 * `frais_service` étant un montant facturé, l'écriture est réservée au
 * propriétaire (garde côté action + policy `is_proprietaire()`).
 */
export function BilletsParamsForm({ params }: { params: ParametresBillet }) {
  const [state, action] = useActionState<BilletState, FormData>(modifierParametresBillet, {});

  return (
    <div className="max-w-2xl space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg bg-error/10 px-4 py-2.5 text-sm text-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-lg bg-phoebe-green/10 px-4 py-2.5 text-sm text-phoebe-green-deep">
          Paramètres mis à jour. La page publique les reprend immédiatement.
        </p>
      )}

      <form action={action} className="space-y-6 rounded-xl border border-phoebe-pearl bg-white p-6">
        <div>
          <label htmlFor="frais_service" className={labelClass}>
            Frais de service (FCFA par billet)
          </label>
          <input
            id="frais_service"
            name="frais_service"
            type="number"
            min={0}
            step={500}
            defaultValue={params.frais_service}
            className={inputClass}
            required
          />
          <p className={aide}>
            S&apos;ajoutent au prix du vol. Annoncés au client sur le formulaire avant
            qu&apos;il n&apos;envoie sa demande, puis <strong>figés</strong> sur celle-ci :
            un changement de barème ne réécrit pas les demandes déjà reçues. Mettez 0
            pour ne rien facturer — le bloc disparaît alors du formulaire.
          </p>
        </div>

        <div>
          <label htmlFor="mois_validite_passeport" className={labelClass}>
            Validité de passeport exigée après le départ (mois)
          </label>
          <input
            id="mois_validite_passeport"
            name="mois_validite_passeport"
            type="number"
            min={0}
            max={24}
            step={1}
            defaultValue={params.mois_validite_passeport}
            className={inputClass}
            required
          />
          <p className={aide}>
            Six mois est la règle la plus répandue, mais elle varie selon la
            destination. La validité est calculée <strong>à partir de la date de
            départ</strong>, pas de la date de la demande. Mettez 0 pour ne pas
            l&apos;exiger — un passeport déjà expiré reste refusé dans tous les cas.
          </p>
        </div>

        <div>
          <label htmlFor="max_voyageurs" className={labelClass}>
            Nombre maximum de voyageurs par demande
          </label>
          <input
            id="max_voyageurs"
            name="max_voyageurs"
            type="number"
            min={1}
            max={50}
            step={1}
            defaultValue={params.max_voyageurs}
            className={inputClass}
            required
          />
          <p className={aide}>
            Au-delà, le client est invité à vous contacter pour un tarif groupe.
          </p>
        </div>

        <div>
          <label htmlFor="delai_reponse_heures" className={labelClass}>
            Délai de réponse annoncé (heures)
          </label>
          <input
            id="delai_reponse_heures"
            name="delai_reponse_heures"
            type="number"
            min={1}
            max={720}
            step={1}
            defaultValue={params.delai_reponse_heures}
            className={inputClass}
            required
          />
          <p className={aide}>
            Affiché tel quel au client : « nous vous répondons{" "}
            {libelleDelai(params.delai_reponse_heures)} avec un devis ». C&apos;est un
            engagement — ne l&apos;annoncez pas plus court que ce que vous tenez.
          </p>
        </div>

        <SubmitButton>Enregistrer</SubmitButton>
      </form>
    </div>
  );
}
