import { metadonnees } from "@/lib/i18n/metadonnees"
import PaiementClient from "./page-client"
import { getParametresContact } from "@/lib/public-cache"

export const generateMetadata = () =>
  metadonnees((t) => ({
    titre: t.meta.paiementTitre,
    description: t.meta.paiementDescription,
  }))

export default async function PaiementPage() {
  const contact = await getParametresContact()
  return <PaiementClient whatsapp={contact.whatsapp} />
}
