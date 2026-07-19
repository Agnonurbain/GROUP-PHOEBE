"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/20 bg-white px-3 py-2 text-sm transition-colors focus:border-phoebe-green focus:outline-none";

const chipBase =
  "rounded-full border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer select-none";
const chipActive =
  "border-phoebe-green bg-phoebe-green/10 text-phoebe-green-deep";
const chipInactive =
  "border-phoebe-anthracite/15 text-phoebe-anthracite/60 hover:border-phoebe-anthracite/30 hover:text-phoebe-anthracite";

export default function Filtres() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [showMore, setShowMore] = useState(false);

  const get = useCallback(
    (key: string) => searchParams.get(key) ?? "",
    [searchParams]
  );

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

  const toggle = useCallback(
    (key: string, value: string) => {
      update(key, get(key) === value ? "" : value);
    },
    [update, get]
  );

  const debouncedUpdate = useCallback(
    (key: string, value: string) => {
      if (timers.current[key]) clearTimeout(timers.current[key]);
      timers.current[key] = setTimeout(() => update(key, value), 350);
    },
    [update]
  );

  const hasFilters = searchParams.toString().length > 0;
  const activeCount = Array.from(searchParams.keys()).length;

  return (
    <div className="mb-6 space-y-4 rounded-xl border border-phoebe-pearl bg-white p-4">
      {/* Row 1: Search + Category */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <label htmlFor="f-recherche" className="sr-only">
            Recherche
          </label>
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-phoebe-anthracite/30"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="f-recherche"
              placeholder="Rechercher marque, modèle..."
              defaultValue={get("q")}
              onChange={(e) => debouncedUpdate("q", e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>
        <div>
          <label htmlFor="f-categorie" className="sr-only">
            Catégorie
          </label>
          <select
            id="f-categorie"
            value={get("categorie")}
            onChange={(e) => update("categorie", e.target.value)}
            className={inputClass}
          >
            <option value="">Toutes catégories</option>
            <option value="leger">Véhicule léger</option>
            <option value="car">Car</option>
            <option value="minibus">Minibus</option>
          </select>
        </div>
      </div>

      {/* Row 2: Quick chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => toggle("chauffeur", "oui")}
          className={`${chipBase} ${get("chauffeur") === "oui" ? chipActive : chipInactive}`}
        >
          Avec chauffeur
        </button>
        <button
          type="button"
          onClick={() => toggle("boite", "automatique")}
          className={`${chipBase} ${get("boite") === "automatique" ? chipActive : chipInactive}`}
        >
          Automatique
        </button>
        <button
          type="button"
          onClick={() => toggle("vente", "oui")}
          className={`${chipBase} ${get("vente") === "oui" ? "border-phoebe-gold bg-phoebe-gold/10 text-phoebe-gold" : chipInactive}`}
        >
          À vendre
        </button>
        <button
          type="button"
          onClick={() => setShowMore((s) => !s)}
          className={`${chipBase} border-dashed ${showMore ? "border-phoebe-green text-phoebe-green-deep" : "border-phoebe-anthracite/20 text-phoebe-anthracite/40"}`}
        >
          {showMore ? "Moins de filtres" : "Plus de filtres"}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`ml-1 inline-block transition-transform ${showMore ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Row 3: Advanced filters (collapsible) */}
      {showMore && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          <div>
            <label
              htmlFor="f-carburant"
              className="mb-1 block text-xs font-medium text-phoebe-anthracite/50"
            >
              Carburant
            </label>
            <select
              id="f-carburant"
              value={get("carburant")}
              onChange={(e) => update("carburant", e.target.value)}
              className={inputClass}
            >
              <option value="">Tous</option>
              <option value="essence">Essence</option>
              <option value="diesel">Diesel</option>
              <option value="hybride">Hybride</option>
              <option value="electrique">Électrique</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="f-boite"
              className="mb-1 block text-xs font-medium text-phoebe-anthracite/50"
            >
              Transmission
            </label>
            <select
              id="f-boite"
              value={get("boite")}
              onChange={(e) => update("boite", e.target.value)}
              className={inputClass}
            >
              <option value="">Toutes</option>
              <option value="automatique">Automatique</option>
              <option value="manuelle">Manuelle</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="f-places"
              className="mb-1 block text-xs font-medium text-phoebe-anthracite/50"
            >
              Places minimum
            </label>
            <select
              id="f-places"
              value={get("places_min")}
              onChange={(e) => update("places_min", e.target.value)}
              className={inputClass}
            >
              <option value="">Toutes</option>
              <option value="2">2+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
              <option value="7">7+</option>
              <option value="9">9+</option>
              <option value="15">15+</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="f-annee"
              className="mb-1 block text-xs font-medium text-phoebe-anthracite/50"
            >
              Année minimum
            </label>
            <input
              id="f-annee"
              type="number"
              placeholder="Ex : 2020"
              defaultValue={get("annee_min")}
              onChange={(e) => debouncedUpdate("annee_min", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Active filter count + Reset */}
      {hasFilters && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-phoebe-anthracite/40">
            {activeCount} filtre{activeCount > 1 ? "s" : ""} actif
            {activeCount > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={() => router.push("/catalogue")}
            className="cursor-pointer text-xs text-phoebe-anthracite/50 transition-colors hover:text-error"
          >
            Réinitialiser
          </button>
        </div>
      )}
    </div>
  );
}
