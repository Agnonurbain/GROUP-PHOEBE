"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useRef, useState } from "react"
import { Chip, Input } from "@/components/ui"
import { UserIcon } from "@/components/icons"
import { useT, useLangue } from "@/lib/langue-context"
import { pluriel } from "@/lib/i18n/format"

const inputClass =
  "w-full rounded-xl border border-public-border bg-public-bg px-4 py-2.5 text-sm text-public-text transition-all duration-200 focus:border-accent-orange focus:bg-public-bg-card focus:outline-none focus:ring-2 focus:ring-accent-orange/15"

type Zone = { id: string; nom: string; ordre: number }

export default function Filtres({ zones }: { zones: Zone[] }) {
  const t = useT()
  const { langue } = useLangue()
  const router = useRouter()
  const searchParams = useSearchParams()
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const [showMore, setShowMore] = useState(false)

  const get = useCallback(
    (key: string) => searchParams.get(key) ?? "",
    [searchParams]
  )

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      router.push(`/transport/catalogue?${params.toString()}`)
    },
    [router, searchParams]
  )

  const toggle = useCallback(
    (key: string, value: string) => {
      update(key, get(key) === value ? "" : value)
    },
    [update, get]
  )

  const debouncedUpdate = useCallback(
    (key: string, value: string) => {
      if (timers.current[key]) clearTimeout(timers.current[key])
      timers.current[key] = setTimeout(() => update(key, value), 350)
    },
    [update]
  )

  // `page` n'est pas un filtre : on l'exclut du décompte et de l'état « actif ».
  const filterKeys = Array.from(searchParams.keys()).filter((k) => k !== "page")
  const hasFilters = filterKeys.length > 0
  const activeCount = filterKeys.length

  return (
    <div className="mb-8 space-y-5 rounded-2xl border border-public-border bg-public-bg-card p-5 shadow-sm">
      {/* Row 1: Search + Category */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <label htmlFor="f-recherche" className="sr-only">{t.commun.rechercher}</label>
          <div className="relative">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-public-text-faint">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <Input
              id="f-recherche"
              variant="public"
              placeholder={t.transport.rechercher}
              defaultValue={get("q")}
              onChange={(e) => debouncedUpdate("q", e.target.value)}
              className="pl-11"
            />
          </div>
        </div>
        <div>
          <label htmlFor="f-categorie" className="sr-only">{t.transport.categorie}</label>
          <select
            id="f-categorie"
            value={get("categorie")}
            onChange={(e) => update("categorie", e.target.value)}
            className={inputClass}
          >
            <option value="">{t.transport.toutesCategories}</option>
            <option value="leger">{t.transport.vehiculeLeger}</option>
            <option value="car">{t.transport.car}</option>
            <option value="minibus">{t.transport.minibus}</option>
          </select>
        </div>
      </div>

      {/* Row 2: Quick chips */}
      <div className="flex flex-wrap gap-2">
        <Chip label={t.transport.avecChauffeur} chipVariant="orange" active={get("chauffeur") === "oui"} onClick={() => toggle("chauffeur", "oui")}
          startIcon={<UserIcon size={14} />} />
        <Chip label={t.transport.climatise} chipVariant="orange" active={get("clim") === "oui"} onClick={() => toggle("clim", "oui")}
          startIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M6 6l12 12M18 6L6 18M2 12h20" /></svg>} />
        <Chip label={t.transport.automatique} chipVariant="orange" active={get("boite") === "automatique"} onClick={() => toggle("boite", "automatique")}
          startIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M1 12h2M21 12h2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>} />
        <Chip label="GPS" chipVariant="orange" active={get("gps") === "oui"} onClick={() => toggle("gps", "oui")}
          startIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3" /><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" /></svg>} />
        <Chip label={t.transport.aVendre} chipVariant="gold" active={get("vente") === "oui"} onClick={() => toggle("vente", "oui")}
          startIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>} />
        {zones.map((z) => (
          <Chip key={z.id} label={z.nom} chipVariant="gold" active={get("zone") === z.id} onClick={() => toggle("zone", z.id)} />
        ))}
        <button type="button" onClick={() => setShowMore((s) => !s)}
          aria-expanded={showMore}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer select-none border-dashed ${showMore ? "border-accent-orange text-accent-orange" : "border-public-border text-public-text-faint"}`}>
          {showMore ? t.transport.moinsFiltres : t.transport.plusFiltres}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`ml-1 inline-block transition-transform ${showMore ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Row 3: Advanced filters (collapsible) */}
      {showMore && (
        <div className="grid gap-4 rounded-xl border border-public-border bg-public-bg p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="f-carburant" className="mb-1 block text-xs font-medium text-public-text-muted">{t.transport.carburant}</label>
            <select id="f-carburant" value={get("carburant")} onChange={(e) => update("carburant", e.target.value)} className={inputClass}>
              <option value="">{t.transport.tous}</option>
              <option value="essence">{t.transport.essence}</option>
              <option value="diesel">{t.transport.diesel}</option>
              <option value="hybride">{t.transport.hybride}</option>
              <option value="electrique">{t.transport.electrique}</option>
            </select>
          </div>
          <div>
            <label htmlFor="f-boite" className="mb-1 block text-xs font-medium text-public-text-muted">{t.transport.transmission}</label>
            <select id="f-boite" value={get("boite")} onChange={(e) => update("boite", e.target.value)} className={inputClass}>
              <option value="">{t.transport.toutes}</option>
              <option value="automatique">{t.transport.automatique}</option>
              <option value="manuelle">{t.transport.manuelle}</option>
            </select>
          </div>
          <div>
            <label htmlFor="f-places" className="mb-1 block text-xs font-medium text-public-text-muted">{t.transport.placesMinimum}</label>
            <select id="f-places" value={get("places_min")} onChange={(e) => update("places_min", e.target.value)} className={inputClass}>
              <option value="">{t.transport.toutes}</option>
              <option value="2">2+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
              <option value="7">7+</option>
              <option value="9">9+</option>
              <option value="15">15+</option>
            </select>
          </div>
          <div>
            <label htmlFor="f-annee" className="mb-1 block text-xs font-medium text-public-text-muted">{t.transport.anneeMinimum}</label>
            <input id="f-annee" type="number" inputMode="numeric" placeholder={t.transport.exempleAnnee} defaultValue={get("annee_min")}
              onChange={(e) => debouncedUpdate("annee_min", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="f-etat" className="mb-1 block text-xs font-medium text-public-text-muted">{t.transport.etat}</label>
            <select id="f-etat" value={get("etat")} onChange={(e) => update("etat", e.target.value)} className={inputClass}>
              <option value="">{t.transport.tous}</option>
              <option value="neuf">{t.transport.neuf}</option>
              <option value="occasion">{t.transport.occasion}</option>
            </select>
          </div>
          <div>
            <label htmlFor="f-prix-min" className="mb-1 block text-xs font-medium text-public-text-muted">{t.transport.prixMin}</label>
            <input id="f-prix-min" type="number" inputMode="numeric" placeholder={t.transport.exemplePrixMin} defaultValue={get("prix_min")}
              onChange={(e) => debouncedUpdate("prix_min", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="f-prix-max" className="mb-1 block text-xs font-medium text-public-text-muted">{t.transport.prixMax}</label>
            <input id="f-prix-max" type="number" inputMode="numeric" placeholder={t.transport.exemplePrixMax} defaultValue={get("prix_max")}
              onChange={(e) => debouncedUpdate("prix_max", e.target.value)} className={inputClass} />
          </div>
        </div>
      )}

      {/* Active filter count + Reset */}
      {hasFilters && (
        <div className="flex items-center gap-3 border-t border-public-border pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-orange">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-orange/10 text-[10px] font-bold text-accent-orange">
              {activeCount}
            </span>
            {pluriel(langue, { un: t.transport.filtreActif_un, autre: t.transport.filtreActif_pluriel }, activeCount).replace(String(activeCount), "").trim()}
          </span>
          <button type="button" onClick={() => router.push("/transport/catalogue")}
            className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium text-public-text-muted transition-all hover:bg-error/10 hover:text-error">
            {t.commun.reinitialiser}
          </button>
        </div>
      )}
    </div>
  )
}