"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";

const inputClass =
  "w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/30 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/15";

const chipBase =
  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer select-none";
const chipActive =
  "border-phoebe-green bg-phoebe-green/10 text-phoebe-green-deep shadow-sm shadow-phoebe-green/10";
const chipInactive =
  "border-phoebe-anthracite/12 text-phoebe-anthracite/55 hover:border-phoebe-green/30 hover:bg-phoebe-green/5 hover:text-phoebe-green-deep";

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
    <div className="mb-8 space-y-5 rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Row 1: Search + Category */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <label htmlFor="f-recherche" className="sr-only">
            Recherche
          </label>
          <div className="relative">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-phoebe-anthracite/25"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="f-recherche"
              placeholder="Rechercher marque, modèle..."
              defaultValue={get("q")}
              onChange={(e) => debouncedUpdate("q", e.target.value)}
              className={`${inputClass} pl-11`}
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
          onClick={() => toggle("clim", "oui")}
          className={`${chipBase} ${get("clim") === "oui" ? chipActive : chipInactive}`}
        >
          Climatisé
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
          onClick={() => toggle("gps", "oui")}
          className={`${chipBase} ${get("gps") === "oui" ? chipActive : chipInactive}`}
        >
          GPS
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
        <div className="grid gap-4 rounded-xl border border-phoebe-pearl/60 bg-phoebe-pearl/20 p-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
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
          <div>
            <label
              htmlFor="f-etat"
              className="mb-1 block text-xs font-medium text-phoebe-anthracite/50"
            >
              État
            </label>
            <select
              id="f-etat"
              value={get("etat")}
              onChange={(e) => update("etat", e.target.value)}
              className={inputClass}
            >
              <option value="">Tous</option>
              <option value="neuf">Neuf</option>
              <option value="occasion">Occasion</option>
            </select>
          </div>
        </div>
      )}

      {/* Active filter count + Reset */}
      {hasFilters && (
        <div className="flex items-center gap-3 border-t border-phoebe-pearl pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-phoebe-green-deep">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-phoebe-green/10 text-[10px] font-bold text-phoebe-green">
              {activeCount}
            </span>
            filtre{activeCount > 1 ? "s" : ""} actif{activeCount > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={() => router.push("/catalogue")}
            className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium text-phoebe-anthracite/50 transition-all hover:bg-error/5 hover:text-error"
          >
            Réinitialiser
          </button>
        </div>
      )}
    </div>
  );
}
