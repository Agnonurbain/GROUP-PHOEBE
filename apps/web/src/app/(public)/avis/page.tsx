import type { Metadata } from "next"
import { getAvisPublies } from "@/lib/avis"
import { AvisPageClient } from "./page-client"

export const metadata: Metadata = {
  title: "Avis clients — GROUP PHOEBE",
  description:
    "Découvrez ce que nos clients disent de GROUP PHOEBE : transport, immobilier, assistance voyages et livraison en Côte d'Ivoire.",
  openGraph: {
    title: "Avis clients — GROUP PHOEBE",
    description:
      "Avis authentiques de nos clients sur nos services en Côte d'Ivoire.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Avis clients — GROUP PHOEBE",
    description:
      "Avis authentiques de nos clients sur nos services en Côte d'Ivoire.",
  },
}

export default async function AvisPage() {
  const avis = await getAvisPublies()
  return <AvisPageClient avis={avis} />
}
