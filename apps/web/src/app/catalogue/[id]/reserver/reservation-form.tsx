"use client";

import { useActionState, useState } from "react";
import { creerReservation, type ReservationState } from "@/app/actions/reservation";
import { SubmitButton } from "@/components/submit-button";

const inputClass =
  "w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/15";

type Zone = {
  id: string;
  nom: string;
};

type Commune = {
  id: string;
  nom: string;
  zone_id: string;
};

type IntervallePrix = {
  id: string;
  zone_id: string;
  prix_min: number;
  prix_max: number;
};

export default function ReservationForm({
  vehiculeId,
  prixJournalier,
  tauxCaution,
  chauffeurDisponible,
  verifie,
  communes,
  zones,
  intervalles,
}: {
  vehiculeId: string;
  prixJournalier: number;
  tauxCaution: number;
  chauffeurDisponible: boolean;
  verifie: boolean;
  communes: Commune[];
  zones: Zone[];
  intervalles: IntervallePrix[];
}) {
  const [state, formAction] = useActionState<ReservationState, FormData>(
    creerReservation,
    {}
  );
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [avecChauffeur, setAvecChauffeur] = useState(false);
  const [showConducteur, setShowConducteur] = useState(false);
  const [communeDepart, setCommuneDepart] = useState("");
  const [communeDest, setCommuneDest] = useState("");
  const [autreDepartNom, setAutreDepartNom] = useState("");
  const [autreDestNom, setAutreDestNom] = useState("");

  const selectedDestCommune = communes.find((c) => c.id === communeDest);
  const destZoneId = selectedDestCommune?.zone_id;
  const intervalle = intervalles.find((ip) => ip.zone_id === destZoneId);

  const nbJours =
    debut && fin
      ? Math.max(
          1,
          Math.ceil(
            (new Date(fin).getTime() - new Date(debut).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const montant = prixJournalier * nbJours;
  const caution = Math.round(montant * tauxCaution);
  const total = montant + caution;

  const today = new Date().toISOString().slice(0, 10);

  const communesByZone = zones.map((z) => ({
    ...z,
    communes: communes.filter((c) => c.zone_id === z.id),
  }));

  return (
    <>
      {state.error && (
        <div className="animate-fade-in rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="vehicule_id" value={vehiculeId} />

        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-phoebe-anthracite">
            Période de location
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="res-debut" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
                Date de début *
              </label>
              <input
                id="res-debut"
                type="date"
                name="debut"
                required
                min={today}
                value={debut}
                onChange={(e) => setDebut(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="res-fin" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
                Date de fin *
              </label>
              <input
                id="res-fin"
                type="date"
                name="fin"
                required
                min={debut || today}
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-phoebe-anthracite">
            Trajet
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="res-commune-depart" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
                Commune de départ *
              </label>
              <select
                id="res-commune-depart"
                name="commune_depart_id"
                required
                value={communeDepart}
                onChange={(e) => setCommuneDepart(e.target.value)}
                className={inputClass}
              >
                <option value="">Sélectionner une commune</option>
                {communesByZone.map((z) => (
                  <optgroup key={z.id} label={z.nom}>
                    {z.communes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </optgroup>
                ))}
                <option value="autre">Autre commune...</option>
              </select>
              {communeDepart === "autre" && (
                <input
                  name="commune_depart_autre"
                  placeholder="Nom de votre commune"
                  required
                  value={autreDepartNom}
                  onChange={(e) => setAutreDepartNom(e.target.value)}
                  className={`mt-2 ${inputClass}`}
                />
              )}
            </div>
            <div>
              <label htmlFor="res-commune-dest" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
                Commune de destination *
              </label>
              <select
                id="res-commune-dest"
                name="commune_destination_id"
                required
                value={communeDest}
                onChange={(e) => setCommuneDest(e.target.value)}
                className={inputClass}
              >
                <option value="">Sélectionner une commune</option>
                {communesByZone.map((z) => (
                  <optgroup key={z.id} label={z.nom}>
                    {z.communes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </optgroup>
                ))}
                <option value="autre">Autre commune...</option>
              </select>
              {communeDest === "autre" && (
                <input
                  name="commune_destination_autre"
                  placeholder="Nom de votre commune"
                  required
                  value={autreDestNom}
                  onChange={(e) => setAutreDestNom(e.target.value)}
                  className={`mt-2 ${inputClass}`}
                />
              )}
            </div>
          </div>

          {intervalle && communeDest !== "autre" && (
            <div className="rounded-lg bg-phoebe-green/5 px-4 py-3">
              <p className="text-sm text-phoebe-anthracite/60">
                Estimation tarifaire pour la zone{" "}
                <span className="font-medium text-phoebe-green-deep">
                  {zones.find((z) => z.id === destZoneId)?.nom}
                </span>
              </p>
              <p className="text-lg font-semibold text-phoebe-green">
                {Number(intervalle.prix_min).toLocaleString("fr-FR")} — {Number(intervalle.prix_max).toLocaleString("fr-FR")} FCFA
                <span className="text-xs font-normal text-phoebe-anthracite/50"> /jour</span>
              </p>
            </div>
          )}
        </fieldset>

        {chauffeurDisponible && (
          <label className="flex items-center gap-2 text-sm text-phoebe-anthracite">
            <input
              type="checkbox"
              name="avec_chauffeur"
              checked={avecChauffeur}
              onChange={(e) => {
                setAvecChauffeur(e.target.checked);
                if (e.target.checked) setShowConducteur(false);
              }}
              className="rounded border-phoebe-anthracite/30 text-phoebe-green focus:ring-phoebe-green"
            />
            Avec chauffeur
          </label>
        )}

        {!avecChauffeur && (
          <fieldset className="space-y-3">
            <div className="flex items-center justify-between">
              <legend className="text-lg font-semibold text-phoebe-anthracite">
                Conducteur secondaire
              </legend>
              <button
                type="button"
                onClick={() => setShowConducteur(!showConducteur)}
                className="text-sm text-phoebe-green hover:underline"
              >
                {showConducteur ? "Masquer" : "Déclarer un conducteur"}
              </button>
            </div>

            {showConducteur && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="res-cond-nom" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
                    Nom complet
                  </label>
                  <input
                    id="res-cond-nom"
                    name="conducteur_secondaire_nom"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="res-cond-permis" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
                    Permis de conduire
                  </label>
                  <input
                    id="res-cond-permis"
                    type="file"
                    name="conducteur_secondaire_permis"
                    accept="image/*,.pdf"
                    className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-phoebe-pearl file:px-3 file:py-2 file:text-sm file:text-phoebe-anthracite"
                  />
                </div>
              </div>
            )}
          </fieldset>
        )}

        {nbJours > 0 && (
          <div className="rounded-xl bg-phoebe-pearl p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
              Récapitulatif
            </h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-phoebe-anthracite/60">
                  Location ({nbJours} jour{nbJours > 1 ? "s" : ""})
                </dt>
                <dd className="font-medium text-phoebe-anthracite">
                  {montant.toLocaleString("fr-FR")} FCFA
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-phoebe-anthracite/60">
                  Caution ({Math.round(tauxCaution * 100)}%)
                </dt>
                <dd className="font-medium text-phoebe-anthracite">
                  {caution.toLocaleString("fr-FR")} FCFA
                </dd>
              </div>
              <div className="flex justify-between border-t border-phoebe-anthracite/10 pt-1">
                <dt className="font-semibold text-phoebe-anthracite">Total</dt>
                <dd className="font-bold text-phoebe-green">
                  {total.toLocaleString("fr-FR")} FCFA
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-phoebe-anthracite/40">
              Le tarif final peut varier selon la négociation. La caution de {Math.round(tauxCaution * 100)}% est restituée au retour du véhicule.
            </p>
          </div>
        )}

        <fieldset className="space-y-3">
          <legend className="text-lg font-semibold text-phoebe-anthracite">
            Moyen de paiement *
          </legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-phoebe-anthracite">
              <input
                type="radio"
                name="methode_paiement"
                value="cinetpay"
                defaultChecked
                className="text-phoebe-green focus:ring-phoebe-green"
              />
              Mobile Money (CinetPay)
            </label>
            <label className="flex items-center gap-2 text-sm text-phoebe-anthracite">
              <input
                type="radio"
                name="methode_paiement"
                value="stripe"
                className="text-phoebe-green focus:ring-phoebe-green"
              />
              Carte bancaire (Stripe)
            </label>
          </div>
        </fieldset>

        {!verifie ? (
          <div className="rounded-lg bg-phoebe-gold/10 px-4 py-3 text-sm text-phoebe-gold">
            Votre identité n&apos;est pas encore vérifiée. Vous devez soumettre vos
            documents depuis votre profil avant de pouvoir réserver.
          </div>
        ) : (
          <SubmitButton>Procéder au paiement</SubmitButton>
        )}
      </form>
    </>
  );
}
