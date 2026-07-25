import type { Metadata } from "next"
import CountryDetailClient from "./page-client"
import { getPays } from "@/lib/assistance"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const name = getPays(slug)?.name || slug.charAt(0).toUpperCase() + slug.slice(1)
  return {
    title: `Étudier en ${name} — Visa & Assistance`,
    description: `Préparez votre dossier d'études en ${name} avec GROUP PHOEBE. Visa étudiant, accompagnement personnalisé, suivi prioritaire depuis la Côte d'Ivoire.`,
    openGraph: {
      title: `Étudier en ${name} — Visa & Assistance`,
      description: `Préparez votre dossier d'études en ${name} avec GROUP PHOEBE. Visa étudiant, accompagnement personnalisé, suivi prioritaire depuis la Côte d'Ivoire.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Étudier en ${name} — Visa & Assistance`,
      description: `Préparez votre dossier d'études en ${name} avec GROUP PHOEBE. Visa étudiant, accompagnement personnalisé, suivi prioritaire depuis la Côte d'Ivoire.`,
    },
  }
}

export default function CountryDetailWrapper() {
  return <CountryDetailClient />
}
