"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-phoebe-green";

export default function Filtres() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  return (
    <div className="mb-6 space-y-4 rounded-xl border border-phoebe-pearl bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          placeholder="Marque"
          defaultValue={searchParams.get("marque") ?? ""}
          onChange={(e) => update("marque", e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Modèle"
          defaultValue={searchParams.get("modele") ?? ""}
          onChange={(e) => update("modele", e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Ville / localisation"
          defaultValue={searchParams.get("localisation") ?? ""}
          onChange={(e) => update("localisation", e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Carburant"
          defaultValue={searchParams.get("carburant") ?? ""}
          onChange={(e) => update("carburant", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <select
          defaultValue={searchParams.get("categorie") ?? ""}
          onChange={(e) => update("categorie", e.target.value)}
          className={inputClass}
        >
          <option value="">Toutes catégories</option>
          <option value="leger">Véhicule léger</option>
          <option value="car">Car</option>
          <option value="minibus">Minibus</option>
        </select>

        <select
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
          <option value="">Location & Vente</option>
          <option value="location">Location uniquement</option>
          <option value="vente">Vente uniquement</option>
        </select>

        {searchParams.get("usage") && (
          <input
            type="number"
            placeholder={
              searchParams.get("usage") === "vente"
                ? "Prix max (vente)"
                : "Prix max / jour"
            }
            defaultValue={searchParams.get("prix_max") ?? ""}
            onChange={(e) => update("prix_max", e.target.value)}
            className={inputClass}
          />
        )}

        <input
          type="number"
          placeholder="Année min"
          defaultValue={searchParams.get("annee_min") ?? ""}
          onChange={(e) => update("annee_min", e.target.value)}
          className={inputClass}
        />

        <select
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

        <select
          defaultValue={searchParams.get("chauffeur") ?? ""}
          onChange={(e) => update("chauffeur", e.target.value)}
          className={inputClass}
        >
          <option value="">Chauffeur : tous</option>
          <option value="oui">Avec chauffeur</option>
          <option value="non">Sans chauffeur</option>
        </select>
      </div>

      {searchParams.toString() && (
        <button
          type="button"
          onClick={() => router.push("/catalogue")}
          className="text-sm text-phoebe-anthracite/50 hover:text-phoebe-green"
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}
