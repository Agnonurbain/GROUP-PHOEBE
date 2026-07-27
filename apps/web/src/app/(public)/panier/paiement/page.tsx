import type { Metadata } from "next"
import PaiementClient from "./page-client"
import { getParametresContact } from "@/lib/public-cache"

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

export default async function PaiementPage() {
  const contact = await getParametresContact()
  return <PaiementClient whatsapp={contact.whatsapp} />
}
