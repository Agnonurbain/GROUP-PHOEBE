import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { makeGroupKey } from "@/lib/vehicle-group"
import { serializeJsonLd, createOrganizationSchema, createWebSiteSchema } from "@/lib/json-ld"
import HomePageClient from "./page-client"
import { getParametresContact } from "@/lib/public-cache"

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

  // Chiffres réels (pas d'affirmations invérifiables) : taille de la flotte et
  // nombre de modèles distincts, dérivés de la base.
  const { data: vehiculesData, count } = await supabase
    .from("vehicules")
    .select("marque, modele", { count: "exact" })
    .neq("statut", "indisponible")

  const vehiculeCount = count ?? vehiculesData?.length ?? 0
  const modeleCount = new Set(
    (vehiculesData ?? []).map((v) => makeGroupKey(v.marque, v.modele))
  ).size

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  // Coordonnées et réseaux pilotés depuis /admin/tarifs : le balisage suit ce
  // que le propriétaire a réellement saisi.
  const contact = await getParametresContact()
  const organizationSchema = createOrganizationSchema({ baseUrl, contact })
  const websiteSchema = createWebSiteSchema(baseUrl)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteSchema) }}
      />
      <HomePageClient role={role} vehiculeCount={vehiculeCount} modeleCount={modeleCount} />
    </>
  )
}