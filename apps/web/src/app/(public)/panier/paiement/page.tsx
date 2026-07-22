import type { Metadata } from "next"
import PaiementClient from "./page-client"

export const metadata: Metadata = {
  title: "Paiement — Finaliser la réservation",
  description: "Choisissez votre moyen de paiement et finalisez votre réservation GROUP PHOEBE en toute sécurité.",
  openGraph: {
    title: "Paiement — Finaliser la réservation",
    description: "Choisissez votre moyen de paiement et finalisez votre réservation GROUP PHOEBE en toute sécurité.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paiement — Finaliser la réservation",
    description: "Choisissez votre moyen de paiement et finalisez votre réservation GROUP PHOEBE en toute sécurité.",
  },
}

export default function PaiementPage() {
  return <PaiementClient />
}
