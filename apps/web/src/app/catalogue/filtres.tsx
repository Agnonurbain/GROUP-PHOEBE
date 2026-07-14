"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors focus:border-phoebe-green";

export default function Filtres() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/catalogue?${params.toString()}`);
    },
    [router, searchParams]
  );

  const debouncedUpdate = useCallback(
    (key: string, value: string) => {
      if (timers.current[key]) clearTimeout(timers.current[key]);
      timers.current[key] = setTimeout(() => update(key, value), 350);
    },
    [update]
  );

  return (
    <div className="mb-6 space-y-4 rounded-xl border border-phoebe-pearl bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="f-marque" className="sr-only">Marque</label>
          <input
            id="f-marque"
            placeholder="Marque"
            defaultValue={searchParams.get("marque") ?? ""}
            onChange={(e) => debouncedUpdate("marque", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="f-modele" className="sr-only">Modèle</label>
          <input
            id="f-modele"
            placeholder="Modèle"
            defaultValue={searchParams.get("modele") ?? ""}
            onChange={(e) => debouncedUpdate("modele", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="f-localisation" className="sr-only">Ville / localisation</label>
          <input
            id="f-localisation"
            placeholder="Ville / localisation"
            defaultValue={searchParams.get("localisation") ?? ""}
            onChange={(e) => debouncedUpdate("localisation", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="f-carburant" className="sr-only">Carburant</label>
          <input
            id="f-carburant"
            placeholder="Carburant"
            defaultValue={searchParams.get("carburant") ?? ""}
            onChange={(e) => debouncedUpdate("carburant", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <label htmlFor="f-categorie" className="sr-only">Catégorie</label>
          <select
            id="f-categorie"
            defaultValue={searchParams.get("categorie") ?? ""}
            onChange={(e) => update("categorie", e.target.value)}
            className={inputClass}
          >
            <option value="">Toutes catégories</option>
            <option value="leger">Véhicule léger</option>
            <option value="car">Car</option>
            <option value="minibus">Minibus</option>
          </select>
        </div>

        <div>
          <label htmlFor="f-usage" className="sr-only">Type d&apos;usage</label>
          <select
            id="f-usage"
            defaultValue={searchParams.get("usage") ?? ""}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) {
                params.set("usage", e.target.value);
              } else {
                params.delete("usage");
              }
              params.delete("prix_max");
              router.push(`/catalogue?${params.toString()}`);
            }}
            className={inputClass}
          >
            <option value="">Location &amp; Vente</option>
            <option value="location">Location uniquement</option>
            <option value="vente">Vente uniquement</option>
          </select>
        </div>

        {searchParams.get("usage") && (
          <div>
            <label htmlFor="f-prix-max" className="sr-only">Prix maximum</label>
            <input
              id="f-prix-max"
              type="number"
              placeholder={
                searchParams.get("usage") === "vente"
                  ? "Prix max (vente)"
                  : "Prix max / jour"
              }
              defaultValue={searchParams.get("prix_max") ?? ""}
              onChange={(e) => debouncedUpdate("prix_max", e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label htmlFor="f-annee" className="sr-only">Année minimum</label>
          <input
            id="f-annee"
            type="number"
            placeholder="Année min"
            defaultValue={searchParams.get("annee_min") ?? ""}
            onChange={(e) => debouncedUpdate("annee_min", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="f-statut" className="sr-only">Statut</label>
          <select
            id="f-statut"
            defaultValue={searchParams.get("statut") ?? ""}
            onChange={(e) => update("statut", e.target.value)}
            className={inputClass}
          >
            <option value="">Tous statuts</option>
            <option value="disponible">Disponible</option>
            <option value="reserve">Réservé</option>
            <option value="loue">Loué</option>
            <option value="vendu">Vendu</option>
          </select>
        </div>

        <div>
          <label htmlFor="f-chauffeur" className="sr-only">Chauffeur</label>
          <select
            id="f-chauffeur"
            defaultValue={searchParams.get("chauffeur") ?? ""}
            onChange={(e) => update("chauffeur", e.target.value)}
            className={inputClass}
          >
            <option value="">Chauffeur : tous</option>
            <option value="oui">Avec chauffeur</option>
            <option value="non">Sans chauffeur</option>
          </select>
        </div>
      </div>

      {searchParams.toString() && (
        <button
          type="button"
          onClick={() => router.push("/catalogue")}
          className="cursor-pointer text-sm text-phoebe-anthracite/50 transition-colors hover:text-phoebe-green"
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}
