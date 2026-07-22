import type { Metadata } from "next"
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

export default function HomePage() {
  return <HomePageClient />
}