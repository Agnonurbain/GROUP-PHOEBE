"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { trackPurchase } from "@/lib/analytics"

export default function ConfirmationClient() {
  const searchParams = useSearchParams()
  const demandeId = searchParams.get("demande")

  useEffect(() => {
    if (!demandeId) return

    const fetchOrderData = async () => {
      const supabase = createClient()

      const { data: demande } = await supabase
        .from("demandes_transport")
        .select(
          `
          id,
          montant,
          caution,
          vehicules!inner (
            marque,
            modele,
            id
          ),
          paiements!inner (
            id,
            montant,
            methode,
            statut
          )
        `
        )
        .eq("id", demandeId)
        .single()

      if (!demande) return

      const vehicle = demande.vehicules as { marque: string; modele: string; id: string } | null
      const payment = Array.isArray(demande.paiements) ? demande.paiements[0] : null

      const transactionId = `DEM_${demande.id}`
      const value = Number(demande.montant) + Number(demande.caution)
      const currency = "XOF"

      trackPurchase({
        transaction_id: transactionId,
        value,
        currency,
        items: vehicle
          ? [
              {
                item_id: vehicle.id,
                item_name: `${vehicle.marque} ${vehicle.modele}`,
                item_category: "vehicle",
                price: Number(demande.montant),
                quantity: 1,
                item_brand: vehicle.marque,
              },
            ]
          : [],
        payment_type: payment?.methode || "unknown",
      })
    }

    fetchOrderData()
  }, [demandeId])

  return null
}