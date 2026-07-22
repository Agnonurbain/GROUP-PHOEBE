import type { Metadata } from "next"
import PanierClient from "./page-client"

export const metadata: Metadata = {
  title: "Panier — Réservation",
  description: "Finalisez votre réservation de véhicule, bien immobilier ou service d'assistance GROUP PHOEBE en toute simplicité.",
  openGraph: {
    title: "Panier — Réservation",
    description: "Finalisez votre réservation de véhicule, bien immobilier ou service d'assistance GROUP PHOEBE en toute simplicité.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Panier — Réservation",
    description: "Finalisez votre réservation de véhicule, bien immobilier ou service d'assistance GROUP PHOEBE en toute simplicité.",
  },
}

export default function PanierPage() {
  return <PanierClient />
}