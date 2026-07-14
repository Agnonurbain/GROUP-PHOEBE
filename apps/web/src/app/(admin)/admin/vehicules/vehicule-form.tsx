"use client";

import { useActionState } from "react";
import type { Tables } from "@group-phoebe/database/types";
import type { VehiculeState } from "@/app/actions/vehicules";
import { SubmitButton } from "@/components/submit-button";

type Chauffeur = { id: string; nom: string };

type Props = {
  vehicule?: Tables<"vehicules">;
  action: (prev: VehiculeState, formData: FormData) => Promise<VehiculeState>;
  documentUrls?: { carteGrise: string | null; certificat: string | null };
  chauffeurs?: Chauffeur[];
  chauffeurIds?: string[];
};

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors focus:border-phoebe-green";
const labelClass = "mb-1 block text-sm font-medium text-phoebe-anthracite";

export default function VehiculeForm({
  vehicule,
  action,
  documentUrls,
  chauffeurs = [],
  chauffeurIds = [],
}: Props) {
  const [state, formAction] = useActionState<VehiculeState, FormData>(
    action,
    {}
  );

  return (
    <>
      {state.error && (
        <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="mb-4 rounded-lg bg-phoebe-green/10 px-4 py-3 text-sm text-phoebe-green-deep">
          Véhicule enregistré.
        </div>
      )}

      <form action={formAction} className="space-y-8">
        {vehicule && <input type="hidden" name="id" value={vehicule.id} />}

        {/* Identification */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-phoebe-anthracite">
            Identification
          </legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="categorie" className={labelClass}>
                Catégorie *
              </label>
              <select
                id="categorie"
                name="categorie"
                required
                defaultValue={vehicule?.categorie ?? "leger"}
                className={inputClass}
              >
                <option value="leger">Véhicule léger</option>
                <option value="car">Car</option>
                <option value="minibus">Minibus</option>
              </select>
            </div>
            <div>
              <label htmlFor="marque" className={labelClass}>
                Marque *
              </label>
              <input
                id="marque"
                name="marque"
                required
                defaultValue={vehicule?.marque ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="modele" className={labelClass}>
                Modèle *
              </label>
              <input
                id="modele"
                name="modele"
                required
                defaultValue={vehicule?.modele ?? ""}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="annee" className={labelClass}>
                Année
              </label>
              <input
                id="annee"
                name="annee"
                type="number"
                min={1990}
                max={2030}
                defaultValue={vehicule?.annee ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="nb_places" className={labelClass}>
                Places
              </label>
              <input
                id="nb_places"
                name="nb_places"
                type="number"
                min={1}
                defaultValue={vehicule?.nb_places ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="boite" className={labelClass}>
                Boîte
              </label>
              <select
                id="boite"
                name="boite"
                defaultValue={vehicule?.boite ?? ""}
                className={inputClass}
              >
                <option value="">—</option>
                <option value="automatique">Automatique</option>
                <option value="manuelle">Manuelle</option>
              </select>
            </div>
            <div>
              <label htmlFor="carburant" className={labelClass}>
                Carburant
              </label>
              <input
                id="carburant"
                name="carburant"
                defaultValue={vehicule?.carburant ?? ""}
                className={inputClass}
                placeholder="Essence, Diesel…"
              />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-phoebe-anthracite">
              <input
                type="checkbox"
                name="climatisation"
                defaultChecked={vehicule?.climatisation ?? false}
                className="rounded border-gray-300 text-phoebe-green focus:ring-phoebe-green"
              />
              Climatisation
            </label>
            <label className="flex items-center gap-2 text-sm text-phoebe-anthracite">
              <input
                type="checkbox"
                name="chauffeur_disponible"
                defaultChecked={vehicule?.chauffeur_disponible ?? false}
                className="rounded border-gray-300 text-phoebe-green focus:ring-phoebe-green"
              />
              Chauffeur disponible
            </label>
          </div>

          {chauffeurs.length > 0 && (
            <div>
              <span className={labelClass}>Chauffeurs affectés</span>
              <div className="mt-1 space-y-1.5">
                {chauffeurs.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 text-sm text-phoebe-anthracite"
                  >
                    <input
                      type="checkbox"
                      name="chauffeur_ids"
                      value={c.id}
                      defaultChecked={chauffeurIds.includes(c.id)}
                      className="rounded border-gray-300 text-phoebe-green focus:ring-phoebe-green"
                    />
                    {c.nom}
                  </label>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        {/* Détails */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-phoebe-anthracite">
            Détails
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="kilometrage" className={labelClass}>
                Kilométrage
              </label>
              <input
                id="kilometrage"
                name="kilometrage"
                type="number"
                min={0}
                defaultValue={vehicule?.kilometrage ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="localisation" className={labelClass}>
                Localisation
              </label>
              <input
                id="localisation"
                name="localisation"
                defaultValue={vehicule?.localisation ?? ""}
                className={inputClass}
                placeholder="Abidjan, Cocody"
              />
            </div>
          </div>
          <div>
            <label htmlFor="description" className={labelClass}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={vehicule?.description ?? ""}
              className={inputClass}
            />
          </div>
        </fieldset>

        {/* Tarification */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-phoebe-anthracite">
            Tarification (FCFA)
          </legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="prix_journalier" className={labelClass}>
                Prix journalier
              </label>
              <input
                id="prix_journalier"
                name="prix_journalier"
                type="number"
                min={0}
                step="1"
                defaultValue={vehicule?.prix_journalier ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="prix_mensuel" className={labelClass}>
                Prix mensuel
              </label>
              <input
                id="prix_mensuel"
                name="prix_mensuel"
                type="number"
                min={0}
                step="1"
                defaultValue={vehicule?.prix_mensuel ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="prix_vente" className={labelClass}>
                Prix de vente
              </label>
              <input
                id="prix_vente"
                name="prix_vente"
                type="number"
                min={0}
                step="1"
                defaultValue={vehicule?.prix_vente ?? ""}
                className={inputClass}
              />
            </div>
          </div>
          <div className="max-w-xs">
            <label htmlFor="taux_caution" className={labelClass}>
              Taux de caution (%)
            </label>
            <input
              id="taux_caution"
              name="taux_caution"
              type="number"
              min={1}
              max={99}
              step="1"
              defaultValue={vehicule?.taux_caution ? Math.round(Number(vehicule.taux_caution) * 100) : ""}
              placeholder="30"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-phoebe-anthracite/50">
              Laisser vide pour utiliser le défaut (30%)
            </p>
          </div>
        </fieldset>

        {/* Documents de vente */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-phoebe-anthracite">
            Documents de vente
          </legend>
          <p className="text-sm text-phoebe-anthracite/60">
            Obligatoires pour publier une annonce avec prix de vente.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="carte_grise" className={labelClass}>
                Carte grise
              </label>
              {documentUrls?.carteGrise && (
                <a
                  href={documentUrls.carteGrise}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-1 block text-xs text-phoebe-green underline"
                >
                  Voir le fichier actuel
                </a>
              )}
              <input
                id="carte_grise"
                name="carte_grise"
                type="file"
                accept="image/*,.pdf"
                className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-phoebe-pearl file:px-3 file:py-2 file:text-sm file:text-phoebe-anthracite"
              />
            </div>
            <div>
              <label htmlFor="certificat_non_gage" className={labelClass}>
                Certificat de non-gage
              </label>
              {documentUrls?.certificat && (
                <a
                  href={documentUrls.certificat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-1 block text-xs text-phoebe-green underline"
                >
                  Voir le fichier actuel
                </a>
              )}
              <input
                id="certificat_non_gage"
                name="certificat_non_gage"
                type="file"
                accept="image/*,.pdf"
                className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-phoebe-pearl file:px-3 file:py-2 file:text-sm file:text-phoebe-anthracite"
              />
            </div>
          </div>
        </fieldset>

        {/* Statut (edit only) */}
        {vehicule && (
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-phoebe-anthracite">
              Statut
            </legend>
            <select
              name="statut"
              defaultValue={vehicule.statut}
              className={inputClass + " max-w-xs"}
            >
              <option value="disponible">Disponible</option>
              <option value="reserve">Réservé</option>
              <option value="loue">Loué</option>
              <option value="vendu">Vendu</option>
              <option value="indisponible">Indisponible</option>
            </select>
          </fieldset>
        )}

        <SubmitButton>
          {vehicule ? "Enregistrer les modifications" : "Créer le véhicule"}
        </SubmitButton>
      </form>
    </>
  );
}
