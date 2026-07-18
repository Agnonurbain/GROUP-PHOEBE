"use client";

import { useActionState, useState } from "react";
import {
  creerReservationPourClient,
  type ReservationOperateurState,
} from "@/app/actions/reservation-operateur";
import { SubmitButton } from "@/components/submit-button";

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/20 px-3 py-2 text-sm transition-colors focus:border-phoebe-green focus:outline-none";

type Client = { id: string; nom: string; telephone: string | null; email: string | null };
type Vehicule = {
  id: string;
  marque: string;
  modele: string;
  categorie: string;
  prix_journalier: number | null;
  taux_caution: number | null;
  chauffeur_disponible: boolean;
  statut: string;
};
type Zone = { id: string; nom: string };
type Commune = { id: string; nom: string; zone_id: string };

export function ReservationPourClientForm({
  clients,
  vehicules,
  zones,
  communes,
}: {
  clients: Client[];
  vehicules: Vehicule[];
  zones: Zone[];
  communes: Commune[];
}) {
  const [state, formAction] = useActionState<ReservationOperateurState, FormData>(
    creerReservationPourClient,
    {}
  );

  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVehicules, setSelectedVehicules] = useState<
    { vehicule: Vehicule; avecChauffeur: boolean }[]
  >([]);
  const [vehiculeSearch, setVehiculeSearch] = useState("");
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [communeDepart, setCommuneDepart] = useState("");
  const [communeDest, setCommuneDest] = useState("");
  const [autreDepartNom, setAutreDepartNom] = useState("");
  const [autreDestNom, setAutreDestNom] = useState("");
  const [prixManuel, setPrixManuel] = useState("");
  const [copied, setCopied] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const filteredClients = clientSearch.length >= 2
    ? clients.filter(
        (c) =>
          c.nom.toLowerCase().includes(clientSearch.toLowerCase()) ||
          (c.telephone && c.telephone.includes(clientSearch)) ||
          (c.email && c.email.toLowerCase().includes(clientSearch.toLowerCase()))
      )
    : [];

  const filteredVehicules = vehiculeSearch.length >= 1
    ? vehicules.filter(
        (v) =>
          !selectedVehicules.some((sv) => sv.vehicule.id === v.id) &&
          (`${v.marque} ${v.modele}`.toLowerCase().includes(vehiculeSearch.toLowerCase()) ||
            v.categorie.toLowerCase().includes(vehiculeSearch.toLowerCase()))
      )
    : [];

  function addVehicule(v: Vehicule) {
    if (selectedVehicules.some((sv) => sv.vehicule.id === v.id)) return;
    setSelectedVehicules((prev) => [...prev, { vehicule: v, avecChauffeur: false }]);
    setVehiculeSearch("");
  }

  function removeVehicule(id: string) {
    setSelectedVehicules((prev) => prev.filter((sv) => sv.vehicule.id !== id));
  }

  function toggleChauffeur(id: string) {
    setSelectedVehicules((prev) =>
      prev.map((sv) =>
        sv.vehicule.id === id
          ? { ...sv, avecChauffeur: !sv.avecChauffeur }
          : sv
      )
    );
  }

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

  const lignesCalc = selectedVehicules.map((sv) => {
    const pj = Number(sv.vehicule.prix_journalier) || 0;
    const montant = pj * nbJours;
    const tc = sv.vehicule.taux_caution ? Number(sv.vehicule.taux_caution) : 0.3;
    const caution = Math.round(montant * tc);
    return { ...sv, montant, caution };
  });

  const totalMontant = lignesCalc.reduce((s, l) => s + l.montant, 0);
  const totalCaution = lignesCalc.reduce((s, l) => s + l.caution, 0);

  const communesByZone = zones.map((z) => ({
    ...z,
    communes: communes.filter((c) => c.zone_id === z.id),
  }));

  const lignesJson = JSON.stringify(
    selectedVehicules.map((sv) => ({
      vehiculeId: sv.vehicule.id,
      avecChauffeur: sv.avecChauffeur,
    }))
  );

  async function handleCopyLink() {
    if (state.lienClient) {
      await navigator.clipboard.writeText(state.lienClient);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (state.success) {
    return (
      <div className="space-y-6 rounded-xl border border-phoebe-green/30 bg-phoebe-green/5 p-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-phoebe-green/10">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-phoebe-green"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-phoebe-anthracite">
          Réservation créée
        </h2>
        <p className="text-sm text-phoebe-anthracite/60">
          La réservation a été créée et le client a été notifié.
          Partagez ce lien avec le client pour qu&apos;il consulte sa
          réservation :
        </p>
        <div className="flex items-center gap-2 rounded-lg bg-white border border-phoebe-pearl px-4 py-3">
          <span className="flex-1 truncate text-sm text-phoebe-anthracite font-mono">
            {state.lienClient}
          </span>
          <button
            type="button"
            onClick={handleCopyLink}
            className="shrink-0 rounded-lg bg-phoebe-green px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-phoebe-green-deep hover:shadow-md transition-all"
          >
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
        <div className="flex justify-center gap-3">
          <a
            href="/admin/demandes"
            className="rounded-lg bg-phoebe-pearl px-4 py-2 text-sm font-medium text-phoebe-anthracite shadow-sm hover:bg-phoebe-pearl/80 hover:shadow-md transition-all"
          >
            Voir les demandes
          </a>
          <a
            href="/admin/reserver-pour-client"
            className="rounded-lg border border-phoebe-green/20 px-4 py-2 text-sm font-medium text-phoebe-green shadow-sm hover:bg-phoebe-green/5 hover:shadow-md transition-all"
          >
            Nouvelle réservation
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {state.error && (
        <div className="animate-fade-in rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-8">
        <input type="hidden" name="lignes" value={lignesJson} />
        {selectedClient && (
          <input type="hidden" name="client_id" value={selectedClient.id} />
        )}

        {/* 1. Client */}
        <fieldset className="space-y-3">
          <legend className="text-lg font-semibold text-phoebe-anthracite">
            1. Client
          </legend>

          {selectedClient ? (
            <div className="flex items-center justify-between rounded-xl border border-phoebe-green/30 bg-phoebe-green/5 px-4 py-3">
              <div>
                <p className="font-medium text-phoebe-anthracite">
                  {selectedClient.nom}
                </p>
                <p className="text-xs text-phoebe-anthracite/50">
                  {selectedClient.telephone || selectedClient.email || "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedClient(null);
                  setClientSearch("");
                }}
                className="text-xs text-error hover:underline"
              >
                Changer
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un client (nom, téléphone, email)..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className={inputClass}
                autoComplete="off"
              />
              {filteredClients.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-phoebe-pearl bg-white shadow-lg">
                  {filteredClients.slice(0, 10).map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClient(c);
                          setClientSearch("");
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-phoebe-pearl/50 transition-colors"
                      >
                        <span className="font-medium text-phoebe-anthracite">
                          {c.nom}
                        </span>
                        <span className="text-xs text-phoebe-anthracite/40">
                          {c.telephone || c.email || ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {clientSearch.length >= 2 && filteredClients.length === 0 && (
                <p className="mt-1 text-xs text-phoebe-anthracite/40">
                  Aucun client trouvé. Le client doit d&apos;abord créer un compte.
                </p>
              )}
            </div>
          )}
        </fieldset>

        {/* 2. Véhicules */}
        <fieldset className="space-y-3">
          <legend className="text-lg font-semibold text-phoebe-anthracite">
            2. Véhicules
          </legend>

          {selectedVehicules.length > 0 && (
            <div className="space-y-2">
              {selectedVehicules.map((sv) => (
                <div
                  key={sv.vehicule.id}
                  className="flex items-center justify-between rounded-xl border border-phoebe-pearl bg-white px-4 py-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-phoebe-anthracite">
                      {sv.vehicule.marque} {sv.vehicule.modele}
                    </p>
                    <p className="text-xs text-phoebe-anthracite/50">
                      {sv.vehicule.categorie} ·{" "}
                      {sv.vehicule.prix_journalier
                        ? `${Number(sv.vehicule.prix_journalier).toLocaleString("fr-FR")} FCFA/j`
                        : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {sv.vehicule.chauffeur_disponible && (
                      <label className="flex items-center gap-1.5 text-xs text-phoebe-anthracite">
                        <input
                          type="checkbox"
                          checked={sv.avecChauffeur}
                          onChange={() => toggleChauffeur(sv.vehicule.id)}
                          className="rounded border-phoebe-anthracite/20 text-phoebe-green focus:ring-phoebe-green"
                        />
                        Chauffeur
                      </label>
                    )}
                    <button
                      type="button"
                      onClick={() => removeVehicule(sv.vehicule.id)}
                      className="text-xs text-error hover:underline"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              placeholder="Ajouter un véhicule (marque, modèle, catégorie)..."
              value={vehiculeSearch}
              onChange={(e) => setVehiculeSearch(e.target.value)}
              className={inputClass}
              autoComplete="off"
            />
            {filteredVehicules.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-phoebe-pearl bg-white shadow-lg">
                {filteredVehicules.slice(0, 10).map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => addVehicule(v)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-phoebe-pearl/50 transition-colors"
                    >
                      <span className="font-medium text-phoebe-anthracite">
                        {v.marque} {v.modele}
                      </span>
                      <span className="text-xs text-phoebe-anthracite/40">
                        {v.categorie} ·{" "}
                        {v.prix_journalier
                          ? `${Number(v.prix_journalier).toLocaleString("fr-FR")} FCFA/j`
                          : "—"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </fieldset>

        {/* 3. Période */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-phoebe-anthracite">
            3. Période de location
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="op-debut"
                className="mb-1 block text-sm font-medium text-phoebe-anthracite"
              >
                Date de début *
              </label>
              <input
                id="op-debut"
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
              <label
                htmlFor="op-fin"
                className="mb-1 block text-sm font-medium text-phoebe-anthracite"
              >
                Date de fin *
              </label>
              <input
                id="op-fin"
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

        {/* 4. Trajet */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-phoebe-anthracite">
            4. Trajet
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="op-commune-depart"
                className="mb-1 block text-sm font-medium text-phoebe-anthracite"
              >
                Commune de départ
              </label>
              <select
                id="op-commune-depart"
                name="ville_depart"
                value={communeDepart}
                onChange={(e) => setCommuneDepart(e.target.value)}
                className={inputClass}
              >
                <option value="">Sélectionner une commune</option>
                {communesByZone.map((z) => (
                  <optgroup key={z.id} label={z.nom}>
                    {z.communes.map((c) => (
                      <option key={c.id} value={c.nom}>
                        {c.nom}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value="autre">Autre commune...</option>
              </select>
              {communeDepart === "autre" && (
                <input
                  name="ville_depart_autre"
                  placeholder="Nom de la commune"
                  value={autreDepartNom}
                  onChange={(e) => setAutreDepartNom(e.target.value)}
                  className={`mt-2 ${inputClass}`}
                />
              )}
            </div>
            <div>
              <label
                htmlFor="op-commune-dest"
                className="mb-1 block text-sm font-medium text-phoebe-anthracite"
              >
                Commune de destination
              </label>
              <select
                id="op-commune-dest"
                name="destination"
                value={communeDest}
                onChange={(e) => setCommuneDest(e.target.value)}
                className={inputClass}
              >
                <option value="">Sélectionner une commune</option>
                {communesByZone.map((z) => (
                  <optgroup key={z.id} label={z.nom}>
                    {z.communes.map((c) => (
                      <option key={c.id} value={c.nom}>
                        {c.nom}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value="autre">Autre commune...</option>
              </select>
              {communeDest === "autre" && (
                <input
                  name="destination_autre"
                  placeholder="Nom de la commune"
                  value={autreDestNom}
                  onChange={(e) => setAutreDestNom(e.target.value)}
                  className={`mt-2 ${inputClass}`}
                />
              )}
            </div>
          </div>
        </fieldset>

        {/* 5. Prix et récap */}
        {selectedVehicules.length > 0 && nbJours > 0 && (
          <div className="space-y-4">
            <div className="rounded-xl bg-phoebe-pearl p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
                Récapitulatif
              </h3>
              <dl className="space-y-1 text-sm">
                {lignesCalc.map((l) => (
                  <div key={l.vehicule.id} className="flex justify-between">
                    <dt className="text-phoebe-anthracite/60">
                      {l.vehicule.marque} {l.vehicule.modele} ({nbJours}j)
                      {l.avecChauffeur && " + chauffeur"}
                    </dt>
                    <dd className="font-medium text-phoebe-anthracite">
                      {l.montant.toLocaleString("fr-FR")} FCFA
                    </dd>
                  </div>
                ))}
                <div className="flex justify-between border-t border-phoebe-anthracite/10 pt-1">
                  <dt className="text-phoebe-anthracite/60">Sous-total location</dt>
                  <dd className="font-medium text-phoebe-anthracite">
                    {totalMontant.toLocaleString("fr-FR")} FCFA
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-phoebe-anthracite/60">Caution</dt>
                  <dd className="font-medium text-phoebe-anthracite">
                    {totalCaution.toLocaleString("fr-FR")} FCFA
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <label
                htmlFor="op-prix-manuel"
                className="mb-1 block text-sm font-medium text-phoebe-anthracite"
              >
                Prix personnalisé (optionnel)
              </label>
              <p className="mb-2 text-xs text-phoebe-anthracite/50">
                Laissez vide pour utiliser le prix calculé ({totalMontant.toLocaleString("fr-FR")} FCFA).
              </p>
              <input
                id="op-prix-manuel"
                type="number"
                name="prix_manuel"
                min={0}
                step={500}
                value={prixManuel}
                onChange={(e) => setPrixManuel(e.target.value)}
                placeholder={totalMontant.toLocaleString("fr-FR")}
                className={`max-w-xs ${inputClass}`}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        {!selectedClient || selectedVehicules.length === 0 ? (
          <p className="rounded-xl bg-phoebe-pearl px-4 py-3 text-center text-sm text-phoebe-anthracite/40">
            Sélectionnez un client et au moins un véhicule pour continuer.
          </p>
        ) : (
          <SubmitButton className="w-full rounded-xl bg-phoebe-green py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-md disabled:opacity-50">
            Créer la réservation pour {selectedClient.nom}
          </SubmitButton>
        )}
      </form>
    </>
  );
}
