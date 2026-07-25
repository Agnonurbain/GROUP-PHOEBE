import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import HomePageClient from "./page-client"

export const metadata: Metadata = {
  title: "GROUP PHOEBE — Transport, Immobilier & Assistance",
  description:
    "GROUP PHOEBE : transport et livraison, immobilier et assistance voyages à Abidjan et partout en Côte d'Ivoire. Location de véhicules, vente de biens, visas et études.",
  openGraph: {
    title: "GROUP PHOEBE — Transport, Immobilier & Assistance",
    description:
      "Location de véhicules, vente immobilière et assistance voyages en Côte d'Ivoire.",
  },
  twitter: {
    card: "summary_large_image",
    title: "GROUP PHOEBE",
    description:
      "Location de véhicules, vente immobilière et assistance voyages en Côte d'Ivoire.",
  },
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims

  let role: string | null = null
  if (user) {
    const { data } = await supabase.from("users").select("role").eq("id", user.sub).single()
    role = data?.role ?? null
  }

  return <HomePageClient role={role} />
}