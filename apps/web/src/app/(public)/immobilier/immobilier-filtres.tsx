"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

export default function ImmobilierFiltres() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const get = useCallback((key: string) => searchParams.get(key) ?? "", [searchParams])

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      router.push(`/immobilier?${params.toString()}`)
    },
    [router, searchParams],
  )

  const hasFilters = searchParams.toString().length > 0

  return (
    <div className="space-y-4 rounded-xl border border-public-border bg-public-bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="fi-type" className="mb-1 block text-xs font-medium text-public-text-faint">Type</label>
          <select
            id="fi-type"
            value={get("type")}
            onChange={(e) => update("type", e.target.value)}
            className="w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm text-public-text transition-all focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/15"
          >
            <option value="">Tous types</option>
            <option value="Appartement">Appartement</option>
            <option value="Villa">Villa</option>
            <option value="Terrain">Terrain</option>
            <option value="Local commercial">Local commercial</option>
          </select>
        </div>
        <div>
          <label htmlFor="fi-surface-min" className="mb-1 block text-xs font-medium text-public-text-faint">Surface min (m²)</label>
          <input
            id="fi-surface-min"
            type="number"
            inputMode="numeric"
            placeholder="Ex: 50"
            defaultValue={get("surface_min")}
            onChange={(e) => update("surface_min", e.target.value)}
            className="w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm text-public-text transition-all focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/15"
          />
        </div>
        <div>
          <label htmlFor="fi-prix-min" className="mb-1 block text-xs font-medium text-public-text-faint">Prix min (FCFA)</label>
          <input
            id="fi-prix-min"
            type="number"
            inputMode="numeric"
            placeholder="Ex: 10 000 000"
            defaultValue={get("prix_min")}
            onChange={(e) => update("prix_min", e.target.value)}
            className="w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm text-public-text transition-all focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/15"
          />
        </div>
        <div>
          <label htmlFor="fi-prix-max" className="mb-1 block text-xs font-medium text-public-text-faint">Prix max (FCFA)</label>
          <input
            id="fi-prix-max"
            type="number"
            inputMode="numeric"
            placeholder="Ex: 100 000 000"
            defaultValue={get("prix_max")}
            onChange={(e) => update("prix_max", e.target.value)}
            className="w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm text-public-text transition-all focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/15"
          />
        </div>
        <div>
          <label htmlFor="fi-localisation" className="mb-1 block text-xs font-medium text-public-text-faint">Localisation</label>
          <input
            id="fi-localisation"
            type="text"
            placeholder="Abidjan, Cocody..."
            defaultValue={get("localisation")}
            onChange={(e) => update("localisation", e.target.value)}
            className="w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm text-public-text transition-all focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/15"
          />
        </div>
        <div>
          <label htmlFor="fi-pieces" className="mb-1 block text-xs font-medium text-public-text-faint">Pièces</label>
          <select
            id="fi-pieces"
            value={get("pieces")}
            onChange={(e) => update("pieces", e.target.value)}
            className="w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm text-public-text transition-all focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/15"
          >
            <option value="">Toutes</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </div>
        <div>
          <label htmlFor="fi-transaction" className="mb-1 block text-xs font-medium text-public-text-faint">Transaction</label>
          <select
            id="fi-transaction"
            value={get("transaction")}
            onChange={(e) => update("transaction", e.target.value)}
            className="w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm text-public-text transition-all focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/15"
          >
            <option value="">Toutes</option>
            <option value="vente">Vente</option>
            <option value="location">Location</option>
          </select>
        </div>
        <div className="flex items-end">
          {hasFilters && (
            <button
              type="button"
              onClick={() => router.push("/immobilier")}
              className="w-full rounded-lg border border-red-500/30 px-3 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
