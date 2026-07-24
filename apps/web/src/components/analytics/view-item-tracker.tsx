"use client"

import { useEffect } from "react"
import { trackViewItem } from "@/lib/analytics"

export function ViewItemTracker({
  item,
}: {
  item: {
    item_id: string
    item_name: string
    item_category?: string
    price: number
    currency: string
    item_brand?: string
    item_variant?: string
  }
}) {
  const { item_id, item_name, item_category, price, currency, item_brand, item_variant } = item

  useEffect(() => {
    trackViewItem({ item_id, item_name, item_category, price, currency, item_brand, item_variant })
  }, [item_id, item_name, item_category, price, currency, item_brand, item_variant])

  return null
}
