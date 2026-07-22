import type { Metadata } from "next"
import AssistanceClient from "./page-client"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Assistance Voyages & Formalites",
  description: "GROUP PHOEBE vous accompagne dans vos demarches de visa, etudes a l'etranger et formalites administratives depuis la Cote d'Ivoire.",
  provider: {
    "@type": "Organization",
    name: "GROUP PHOEBE",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
  },
  areaServed: "CI",
  serviceType: "Visa & Immigration Services",
  offers: {
    "@type": "Offer",
    priceCurrency: "XOF",
    price: "85000",
    availability: "https://schema.org/InStock",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Services d'assistance",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Visa Etudiant",
          description: "Accompagnement complet pour visa etudiant (Chine, Italie, etc.)",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Visa Tourisme",
          description: "Visa Schengen, Chine, et autres destinations touristiques",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Accompagnement Etudes",
          description: "Recherche d'universites, dossiers d'admission, bourses",
        },
      },
    ],
  },
}

export const metadata: Metadata = {
  title: "Assistance Voyages - Visas, Etudes & Formalites",
  description: "GROUP PHOEBE vous accompagne dans vos demarches de visa, etudes a l'etranger et formalites administratives depuis la Cote d'Ivoire.",
  openGraph: {
    title: "Assistance Voyages - Visas, Etudes & Formalites",
    description: "GROUP PHOEBE vous accompagne dans vos demarches de visa, etudes a l'etranger et formalites administratives depuis la Cote d'Ivoire.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Assistance Voyages - Visas, Etudes & Formalites",
    description: "GROUP PHOEBE vous accompagne dans vos demarches de visa, etudes a l'etranger et formalites administratives depuis la Cote d'Ivoire.",
  },
}

export default function AssistancePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <AssistanceClient />
    </>
  )
}