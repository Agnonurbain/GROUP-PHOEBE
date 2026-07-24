"use client"

import Link from "next/link"
import Image from "next/image"
import { useActionState, useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useCart } from "@/lib/cart-context"
import { createClient } from "@/lib/supabase/client"
import { PanierStepper } from "@/components/panier-stepper"
import { BackLink } from "@/components/public/back-link"
import { Button, Card, Badge } from "@/components/ui"
import { checkoutCart, type CheckoutState } from "@/app/actions/checkout"
import { trackBeginCheckout } from "@/lib/analytics"

type Commune = { id: string; nom: string; zone_id: string; zone_nom: string }
type Zone = { id: string; nom: string }

const ZONE_COLORS: Record<string, string> = {
  "Abidjan": "#F97316",
  "Grand Abidjan": "#C9A84C",
  "Intérieur du pays": "#059669",
}

function ZonePin({ zone }: { zone: string }) {
  const color = ZONE_COLORS[zone] || "#C9A84C"
  return (
    <div className="flex items-center gap-3">
      <svg width="32" height="40" viewBox="0 0 32 40" className="drop-shadow-lg">
        <path d="M16 0C7.2 0 0 6.4 0 14.4c0 10.4 16 25.6 16 25.6s16-15.2 16-25.6C32 6.4 24.8 0 16 0z" fill={color} opacity="0.9" />
        <circle cx="16" cy="14" r="6" fill="white" />
      </svg>
      <div>
        <p className="text-xs text-public-text-faint">Zone détectée</p>
        <p className="text-sm font-semibold text-public-text">{zone}</p>
      </div>
    </div>
  )
}

function MobileMoneyLogo({ name }: { name: string }) {
  const logos: Record<string, string> = {
    "Orange Money": "OM",
    "MTN MoMo": "MM",
    "Wave": "WV",
    "Carte Bancaire": "CB",
  }
  const colors: Record<string, string> = {
    "Orange Money": "text-orange-500 bg-orange-500/10",
    "MTN MoMo": "text-yellow-500 bg-yellow-500/10",
    "Wave": "text-blue-400 bg-blue-400/10",
    "Carte Bancaire": "text-accent-gold bg-accent-gold/10",
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border border-current/20 px-2.5 py-1 text-xs font-bold ${colors[name] || "text-public-text-muted"}`}>
      {logos[name] || "?"}
    </span>
  )
}

export default function PaiementPage() {
  const { items, count } = useCart()
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(checkoutCart, {})

  const [communes, setCommunes] = useState<Commune[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [destination, setDestination] = useState("")
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manualZone, setManualZone] = useState("")
  const [debut, setDebut] = useState("")
  const [fin, setFin] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase
      .from("communes")
      .select("id, nom, zone_id")
      .then(async ({ data: communesData }) => {
        if (!communesData) return
        const { data: zonesData } = await supabase.from("zones_tarifaires").select("id, nom")
        if (!zonesData) return
        setZones(zonesData)
        const zoneMap = new Map(zonesData.map((z) => [z.id, z.nom]))
        setCommunes(
          communesData.map((c) => ({
            ...c,
            zone_nom: zoneMap.get(c.zone_id) || "Inconnue",
          })),
        )
      })
  }, [supabase])

  const suggestions = useMemo(() => {
    if (!destination.trim() || selectedCommune) return []
    const q = destination.toLowerCase()
    return communes.filter((c) => c.nom.toLowerCase().includes(q)).slice(0, 8)
  }, [destination, communes, selectedCommune])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  useEffect(() => {
    if (state?.error) window.scrollTo({ top: 0, behavior: "smooth" })
  }, [state?.error])

  const selectCommune = useCallback((c: Commune) => {
    setSelectedCommune(c)
    setDestination(c.nom)
    setShowSuggestions(false)
    setManualZone("")
  }, [])

  const handleDestinationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDestination(e.target.value)
    setSelectedCommune(null)
    setShowSuggestions(true)
    setShowManual(false)
  }, [])

  const detectedZone = selectedCommune?.zone_nom || (showManual ? manualZone : "")
  const zoneColor = ZONE_COLORS[detectedZone] || "#C9A84C"

  // Track begin_checkout when page loads with cart items
  useEffect(() => {
    if (count > 0) {
      const checkoutItems = items.map((i) => ({
        item_id: i.groupKey,
        item_name: `${i.marque} ${i.modele}`,
        item_category: i.categorie,
        price: i.prixJournalier,
        currency: "XOF",
        quantity: i.quantite,
        item_brand: i.marque,
      }))
      const value = items.reduce(
        (sum, i) => sum + i.prixJournalier * i.quantite + i.cautionBaseFcfa * i.quantite,
        0,
      )
      trackBeginCheckout(checkoutItems, value, "XOF")
    }
  }, [items, count])

  const total = items.reduce(
    (sum, i) => sum + i.prixJournalier * i.quantite + i.cautionBaseFcfa * i.quantite,
    0,
  )

  const nbJours =
    debut && fin
      ? Math.max(1, Math.round((new Date(fin).getTime() - new Date(debut).getTime()) / (1000 * 60 * 60 * 24)))
      : 0

  const totalAvecDuree = nbJours > 0
    ? items.reduce((sum, i) => sum + i.prixJournalier * i.quantite * nbJours + i.cautionBaseFcfa * i.quantite, 0)
    : total

  if (count === 0) {
    return (
      <>
        <PanierStepper current={1} />
        <div className="flex flex-col items-center gap-6 px-6 py-20">
          <h2 className="text-3xl font-semibold text-public-text">Votre panier est vide</h2>
          <Link
            href="/transport/catalogue"
            className="rounded-lg bg-accent-orange px-6 py-3 text-sm font-semibold text-white hover:bg-accent-orange-hover transition-colors"
          >
            Voir le catalogue
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <PanierStepper current={1} />

      <div className="px-6 pt-6">
        <BackLink href="/panier" label="Retour au panier" />
      </div>

      <div className="px-6 py-8">
        <h1 className="text-4xl font-bold text-public-text">Paiement</h1>
        <p className="mt-2 text-sm text-public-text-muted">
          Choisissez vos dates, votre destination et votre moyen de paiement pour finaliser la réservation.
        </p>
      </div>

      {state?.error && (
        <div className="mx-6 mb-6 rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] px-5 py-3 text-sm text-[#EF4444]">
          {state.error}
        </div>
      )}

      <form action={formAction} className="grid gap-12 px-6 pb-20 lg:grid-cols-5">
        <input type="hidden" name="items" value={JSON.stringify(items.map((i) => ({
          groupKey: i.groupKey,
          marque: i.marque,
          modele: i.modele,
          prixJournalier: i.prixJournalier,
          cautionBaseFcfa: i.cautionBaseFcfa,
          quantite: i.quantite,
          avecChauffeur: i.avecChauffeur,
          categorie: i.categorie,
        })))} />
        <input type="hidden" name="zone" value={detectedZone} />

        <div className="space-y-6 lg:col-span-3">
          {/* Vehicle summary */}
          <Card>
            <h2 className="text-base font-semibold text-public-text mb-4">Véhicule</h2>
            {items.map((i) => (
              <div key={i.groupKey} className="flex items-center gap-4 border-b border-public-border pb-4 last:border-0 last:pb-0 mb-4 last:mb-0">
                {i.photoUrl ? (
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-public-bg-elevated">
                    <Image src={i.photoUrl} alt={`${i.marque} ${i.modele}`} fill sizes="96px" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-public-bg-elevated">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-public-text-faint">
                      <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-public-text truncate">{i.marque} {i.modele}</p>
                  <p className="text-xs text-public-text-muted">{i.categorie} &times; {i.quantite}</p>
                  <p className="text-sm font-bold text-accent-orange mt-0.5">{i.prixJournalier.toLocaleString()} FCFA/jour</p>
                </div>
              </div>
            ))}
          </Card>

          {/* Step 1 — Dates */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-orange text-xs font-bold text-white">1</span>
              <h2 className="text-base font-semibold text-public-text">Dates de location</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="debut" className="block text-sm font-medium text-public-text-muted mb-1.5">Début</label>
                <input
                  id="debut" name="debut" type="date" required
                  value={debut}
                  onChange={(e) => setDebut(e.target.value)}
                  className="w-full rounded-xl border border-public-border bg-[#0A0A0A] px-4 py-2.5 text-sm text-public-text focus:border-accent-orange focus:outline-none focus:ring-1 focus:ring-accent-orange/30 [color-scheme:dark]"
                />
              </div>
              <div>
                <label htmlFor="fin" className="block text-sm font-medium text-public-text-muted mb-1.5">Fin</label>
                <input
                  id="fin" name="fin" type="date" required
                  value={fin}
                  onChange={(e) => setFin(e.target.value)}
                  min={debut || undefined}
                  className="w-full rounded-xl border border-public-border bg-[#0A0A0A] px-4 py-2.5 text-sm text-public-text focus:border-accent-orange focus:outline-none focus:ring-1 focus:ring-accent-orange/30 [color-scheme:dark]"
                />
              </div>
            </div>
            {nbJours > 0 && (
              <p className="mt-3 text-xs text-public-text-muted">
                {nbJours} jour{nbJours > 1 ? "s" : ""} de location
              </p>
            )}
          </Card>

          {/* Step 2 — Destination + Zone */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-orange text-xs font-bold text-white">2</span>
              <h2 className="text-base font-semibold text-public-text">Destination</h2>
            </div>
            <div className="relative">
              <label htmlFor="destination" className="block text-sm font-medium text-public-text-muted mb-1.5">
                Ville de livraison
              </label>
              <input
                ref={inputRef}
                id="destination"
                name="destination"
                type="text"
                required
                placeholder="ex: Yamoussoukro"
                value={destination}
                onChange={handleDestinationChange}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                autoComplete="off"
                className="w-full rounded-xl border border-public-border bg-[#0A0A0A] px-4 py-2.5 text-sm text-public-text placeholder:text-public-text-muted focus:border-accent-orange focus:outline-none focus:ring-1 focus:ring-accent-orange/30"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-20 mt-1 w-full rounded-xl border border-public-border bg-public-bg-card shadow-xl"
                >
                  {suggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCommune(c)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-public-text transition-colors hover:bg-public-bg-elevated first:rounded-t-xl last:rounded-b-xl"
                    >
                      <span>{c.nom}</span>
                      <Badge variant="orange" className="text-[10px]">{c.zone_nom}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedCommune && (
              <div className="mt-5 rounded-xl border bg-public-bg-elevated/50 p-4 transition-all duration-300" style={{ borderColor: `${zoneColor}40` }}>
                <ZonePin zone={detectedZone} />
              </div>
            )}

            {!selectedCommune && destination.trim().length > 0 && suggestions.length === 0 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowManual(true)}
                  className="text-xs text-accent-orange underline underline-offset-2 hover:text-accent-orange-hover"
                >
                  Ville introuvable ? Sélectionnez manuellement votre zone
                </button>
                {showManual && (
                  <div className="mt-3 animate-fade-in">
                    <label htmlFor="zone-manuelle" className="block text-xs font-medium text-public-text-faint mb-1.5">Zone tarifaire</label>
                    <select
                      id="zone-manuelle"
                      value={manualZone}
                      onChange={(e) => setManualZone(e.target.value)}
                      className="w-full rounded-xl border border-public-border bg-[#0A0A0A] px-4 py-2.5 text-sm text-public-text focus:border-accent-orange focus:outline-none focus:ring-1 focus:ring-accent-orange/30"
                    >
                      <option value="">Sélectionnez une zone</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.nom}>{z.nom}</option>
                      ))}
                    </select>
                    <input type="hidden" name="ville_manuelle" value={destination} />
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Step 3 — Paiement */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-orange text-xs font-bold text-white">3</span>
              <h2 className="text-base font-semibold text-public-text">Moyen de paiement</h2>
            </div>
            <div className="space-y-3">
              {[
                { name: "Orange Money", value: "cinetpay" },
                { name: "MTN MoMo", value: "cinetpay" },
                { name: "Wave", value: "cinetpay" },
                { name: "Carte Bancaire (Visa/Mastercard)", value: "stripe" },
              ].map((m) => (
                <label
                  key={m.name}
                  className="flex cursor-pointer items-center gap-4 rounded-xl border border-public-border bg-[#0A0A0A] p-4 transition-all hover:border-accent-orange/30 has-[:checked]:border-accent-orange has-[:checked]:bg-[rgba(249,115,22,0.05)]"
                >
                  <input
                    type="radio"
                    name="methode_paiement"
                    value={m.value}
                    className="h-4 w-4 accent-accent-orange"
                    defaultChecked={m.name === "Orange Money"}
                    required
                  />
                  <MobileMoneyLogo name={m.name} />
                  <span className="text-sm font-medium text-public-text">{m.name}</span>
                </label>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar — Recap */}
        <div className="lg:col-span-2">
          <Card className="sticky top-24">
            <h2 className="text-base font-semibold text-public-text mb-4">Récapitulatif</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.groupKey} className="flex items-center justify-between border-b border-public-border pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-sm font-medium text-public-text truncate">{item.marque} {item.modele}</p>
                    <p className="text-xs text-public-text-muted">
                      &times;{item.quantite} &middot; {item.prixJournalier.toLocaleString()} FCFA/jour
                      {nbJours > 0 && ` &middot; ${nbJours}j`}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-public-text whitespace-nowrap">
                    {nbJours > 0
                      ? (item.prixJournalier * item.quantite * nbJours).toLocaleString()
                      : (item.prixJournalier * item.quantite).toLocaleString()} FCFA
                  </span>
                </div>
              ))}
            </div>
            <hr className="my-4 border-public-border" />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-public-text-muted">Location</span>
                <span className="font-medium text-public-text">
                  {nbJours > 0
                    ? items.reduce((s, i) => s + i.prixJournalier * i.quantite * nbJours, 0).toLocaleString()
                    : items.reduce((s, i) => s + i.prixJournalier * i.quantite, 0).toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-public-text-muted">Caution (remboursable)</span>
                <span className="font-medium text-public-text">
                  {items.reduce((s, i) => s + i.cautionBaseFcfa * i.quantite, 0).toLocaleString()} FCFA
                </span>
              </div>
            </div>
            <hr className="my-4 border-public-border" />
            <div className="flex justify-between">
              <span className="text-sm font-bold text-public-text">Total à payer</span>
              <span className="text-xl font-bold text-accent-orange">
                {nbJours > 0
                  ? (items.reduce((s, i) => s + i.prixJournalier * i.quantite * nbJours + i.cautionBaseFcfa * i.quantite, 0)).toLocaleString()
                  : total.toLocaleString()} FCFA
              </span>
            </div>
            {detectedZone && (
              <div className="mt-3 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: `${zoneColor}40`, backgroundColor: `${zoneColor}08` }}>
                <p className="text-public-text-muted">Zone appliquée</p>
                <p className="font-semibold text-public-text" style={{ color: zoneColor }}>{detectedZone}</p>
              </div>
            )}

            {/* Reassurance badges */}
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-public-text-muted">
              <span className="flex items-center gap-1 rounded-md bg-public-bg-elevated px-2 py-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Paiement sécurisé
              </span>
              <span className="flex items-center gap-1 rounded-md bg-public-bg-elevated px-2 py-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                Annulation gratuite
              </span>
              <span className="flex items-center gap-1 rounded-md bg-public-bg-elevated px-2 py-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Support 24/7
              </span>
            </div>

            {/* Payment logos */}
            <div className="mt-4">
              <p className="text-xs text-public-text-faint mb-2">Moyens de paiement acceptés</p>
              <div className="flex flex-wrap gap-2">
                <MobileMoneyLogo name="Orange Money" />
                <MobileMoneyLogo name="MTN MoMo" />
                <MobileMoneyLogo name="Wave" />
                <MobileMoneyLogo name="Carte Bancaire" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/panier"
                className="flex w-full items-center justify-center rounded-lg border border-[#2A2A2A] py-3 text-sm font-semibold text-public-text hover:bg-[#1A1A1A] transition-colors"
              >
                Retour au panier
              </Link>
              <Button
                type="submit"
                disabled={pending}
                className="min-h-[56px] w-full text-sm font-bold"
                variant="orange"
                size="lg"
              >
                {pending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                    </svg>
                    Traitement en cours...
                  </>
                ) : (
                  <>Confirmer et payer {totalAvecDuree.toLocaleString()} FCFA</>
                )}
              </Button>
            </div>

            <div className="mt-4 text-center">
              <a
                href={`https://wa.me/2250707000000?text=${encodeURIComponent("Bonjour, je souhaite négocier ma réservation chez GROUP PHOEBE.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-public-text-muted transition-colors hover:text-accent-green"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Négocier sur WhatsApp
              </a>
            </div>
          </Card>
        </div>
      </form>
    </>
  )
}
