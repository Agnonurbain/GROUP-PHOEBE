import { metadonnees } from "@/lib/i18n/metadonnees"
import { getAvisPublies } from "@/lib/avis"
import { AvisPageClient } from "./page-client"

export const generateMetadata = () =>
  metadonnees((t) => ({
    titre: t.meta.avisTitre,
    description: t.meta.avisDescription,
  }))

export default async function AvisPage() {
  const avis = await getAvisPublies()
  return <AvisPageClient avis={avis} />
}
