"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Badge, Card } from "@/components/ui"

interface ZonePrice {
  nom: string
  prixMin: number
  prixMax: number
}

interface VehicleBookingProps {
  vehiculeId: string
  groupKey: string
  marque: string
  modele: string
  prixJournalier: number
  chauffeurDisponible: boolean
  zonePrices: ZonePrice[]
  defaultPrice: number
}

export function VehicleBooking({
  vehiculeId,
  groupKey,
  marque,
  modele,
  prixJournalier,
  chauffeurDisponible,
  zonePrices,
  defaultPrice,
}: VehicleBookingProps) {
  const router = useRouter()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handleSubmit = () => {
    const params = new URLSearchParams()
    params.set("vehicule_id", vehiculeId)
    params.set("group", groupKey)
    params.set("marque", marque)
    params.set("modele", modele)
    params.set("prix_journalier", String(prixJournalier))
    if (startDate) params.set("debut", startDate)
    if (endDate) params.set("fin", endDate)
    router.push(`/panier?${params.toString()}`)
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Card className="sticky top-24">
          <h3 className="text-base font-semibold text-public-text">Tarifs par zone</h3>
          <div className="mt-6 space-y-4">
            {zonePrices.length > 0 ? zonePrices.map((z) => {
              const isInterieur = z.nom.toLowerCase() === "intérieur" || z.nom.toLowerCase() === "interieur"
              return (
                <div
                  key={z.nom}
                  className={`rounded-xl border p-4 ${
                    isInterieur
                      ? "border-accent-orange/40 bg-[rgba(249,115,22,0.08)]"
                      : "border-public-border bg-public-bg-elevated"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-public-text">
                      {z.nom}
                      {isInterieur && (
                        <Badge variant="orange">Chauffeur obligatoire</Badge>
                      )}
                    </span>
                    <span className="text-3xl font-bold text-accent-orange">
                      {z.prixMin > 0
                        ? `${z.prixMin.toLocaleString()} - ${z.prixMax.toLocaleString()}`
                        : defaultPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-[#6B7280]">
                    <span>FCFA / jour</span>
                    <span>{chauffeurDisponible ? "Chauffeur: Inclus" : "Sans chauffeur"}</span>
                  </div>
                  {isInterieur && (
                    <p className="mt-2 text-xs text-accent-orange/80">
                      Supplément chauffeur obligatoire inclus dans le tarif
                    </p>
                  )}
                </div>
              )
            }) : (
              <div className="rounded-xl border border-public-border bg-public-bg-elevated p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-public-text">Prix standard</span>
                  <span className="text-3xl font-bold text-accent-orange">
                    {defaultPrice > 0 ? `${defaultPrice.toLocaleString()} FCFA/jour` : "Sur demande"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-public-text">Sélectionnez vos dates</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="booking-start" className="text-xs text-[#6B7280]">Début</label>
                <input
                  id="booking-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={today}
                  className="mt-1 w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm text-public-text transition-all focus:border-accent-orange focus:outline-none focus:ring-2 focus:ring-accent-orange/15 [color-scheme:dark]"
                />
              </div>
              <div>
                <label htmlFor="booking-end" className="text-xs text-[#6B7280]">Fin</label>
                <input
                  id="booking-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || today}
                  className="mt-1 w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm text-public-text transition-all focus:border-accent-orange focus:outline-none focus:ring-2 focus:ring-accent-orange/15 [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <Button variant="orange" size="lg" className="mt-8 w-full" onClick={handleSubmit}>
            Je réserve ce véhicule
          </Button>

          <p className="mt-3 text-center text-3xl font-bold text-[#6B7280]">
            {defaultPrice > 0 ? `À partir de ${defaultPrice.toLocaleString()} FCFA/jour` : "Contactez-nous pour un devis"}
          </p>
        </Card>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-public-border bg-public-bg/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-public-text-muted">À partir de</p>
            <p className="text-lg font-bold text-accent-orange">
              {defaultPrice > 0 ? `${defaultPrice.toLocaleString()} FCFA/jour` : "Sur demande"}
            </p>
          </div>
          <Button variant="orange" size="lg" className="shrink-0" onClick={handleSubmit}>
            Je réserve
          </Button>
        </div>
      </div>
    </>
  )
}
