"use client"

import { useT } from "@/lib/langue-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"

const DEBOUNCE_MS = 350

export default function ImmobilierFiltres() {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const get = useCallback((key: string) => searchParams.get(key) ?? "", [searchParams])

  // `replace` et non `push` : chaque frappe créait une entrée d'historique, si
  // bien que revenir en arrière obligeait à défiler tout ce qui avait été tapé.
  // Le debounce évite en plus un rendu serveur par caractère.
  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      // Tout changement de filtre ramène à la première page.
      params.delete("page")

      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        router.replace(`/immobilier?${params.toString()}`, { scroll: false })
      }, DEBOUNCE_MS)
    },
    [router, searchParams],
  )

  const hasFilters = searchParams.toString().length > 0

  return (
    <div className="space-y-4 rounded-xl border border-public-border bg-public-bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="fi-type" className="mb-1 block text-xs font-medium text-public-text-faint">{t.immobilier.type}</label>
          <select
            id="fi-type"
            value={get("type")}
            onChange={(e) => update("type", e.target.value)}
            className="w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm text-public-text transition-all focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/15"
          >
            <option value="">{t.immobilier.tousTypes}</option>
            <option value="appartement">{t.immobilier.typeAppartement}</option>
            <option value="maison">{t.immobilier.typeMaison}</option>
            <option value="terrain">{t.immobilier.typeTerrain}</option>
            <option value="bureau">{t.immobilier.typeBureau}</option>
          </select>
        </div>
        <div>
          <label htmlFor="fi-surface-min" className="mb-1 block text-xs font-medium text-public-text-faint">{t.immobilier.surfaceMin}</label>
          <input
            id="fi-surface-min"
            type="number"
            inputMode="numeric"
            placeholder={t.immobilier.exSurface}
            defaultValue={get("surface_min")}
            onChange={(e) => update("surface_min", e.target.value)}
            className="w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm text-public-text transition-all focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/15"
          />
        </div>
        <div>
          <label htmlFor="fi-prix-min" className="mb-1 block text-xs font-medium text-public-text-faint">{t.immobilier.prixMin}</label>
          <input
            id="fi-prix-min"
            type="number"
            inputMode="numeric"
            placeholder={t.immobilier.exPrixMin}
            defaultValue={get("prix_min")}
            onChange={(e) => update("prix_min", e.target.value)}
            className="w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm text-public-text transition-all focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/15"
          />
        </div>
        <div>
          <label htmlFor="fi-prix-max" className="mb-1 block text-xs font-medium text-public-text-faint">{t.immobilier.prixMax}</label>
          <input
            id="fi-prix-max"
            type="number"
            inputMode="numeric"
            placeholder={t.immobilier.exPrixMax}
            defaultValue={get("prix_max")}
            onChange={(e) => update("prix_max", e.target.value)}
            className="w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm text-public-text transition-all focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/15"
          />
        </div>
        <div>
          <label htmlFor="fi-localisation" className="mb-1 block text-xs font-medium text-public-text-faint">{t.immobilier.localisation}</label>
          <input
            id="fi-localisation"
            type="text"
            placeholder={t.immobilier.exLocalisation}
            defaultValue={get("localisation")}
            onChange={(e) => update("localisation", e.target.value)}
            className="w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm text-public-text transition-all focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/15"
          />
        </div>
        <div>
          <label htmlFor="fi-pieces" className="mb-1 block text-xs font-medium text-public-text-faint">{t.immobilier.pieces}</label>
          <select
            id="fi-pieces"
            value={get("pieces")}
            onChange={(e) => update("pieces", e.target.value)}
            className="w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm text-public-text transition-all focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/15"
          >
            <option value="">{t.immobilier.toutes}</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </div>
        <div>
          <label htmlFor="fi-transaction" className="mb-1 block text-xs font-medium text-public-text-faint">{t.immobilier.transaction}</label>
          <select
            id="fi-transaction"
            value={get("transaction")}
            onChange={(e) => update("transaction", e.target.value)}
            className="w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm text-public-text transition-all focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/15"
          >
            <option value="">{t.immobilier.toutes}</option>
            <option value="vente">{t.immobilier.vente}</option>
            <option value="location">{t.immobilier.location}</option>
          </select>
        </div>
        <div className="flex items-end">
          {hasFilters && (
            <button
              type="button"
              onClick={() => router.push("/immobilier")}
              className="w-full rounded-lg border border-red-500/30 px-3 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10"
            >
              {t.commun.reinitialiser}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
