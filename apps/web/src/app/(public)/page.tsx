import { metadonnees } from "@/lib/i18n/metadonnees"
import { createClient } from "@/lib/supabase/server"
import { serializeJsonLd, createOrganizationSchema, createWebSiteSchema } from "@/lib/json-ld"
import HomePageClient from "./page-client"
import { getParametresContact, getStatsAccueil } from "@/lib/public-cache"

export const generateMetadata = () =>
  metadonnees((t) => ({
    titre: t.meta.accueilTitre,
    description: t.meta.accueilDescription,
    partage: t.meta.accueilPartage,
  }))

export default async function HomePage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims

  let role: string | null = null
  if (user) {
    const { data } = await supabase.from("users").select("role").eq("id", user.sub).single()
    role = data?.role ?? null
  }

  // Chiffres réels (pas d'affirmations invérifiables), mis en cache : ils ne
  // changent qu'à l'ajout d'un véhicule.
  const { vehiculeCount, modeleCount } = await getStatsAccueil()

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