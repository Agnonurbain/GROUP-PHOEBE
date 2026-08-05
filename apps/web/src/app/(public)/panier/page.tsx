import { metadonnees } from "@/lib/i18n/metadonnees"
import PanierClient from "./page-client"
import { getCommunes } from "@/lib/public-cache"
import { getParametresTransport, formaterDelai } from "@/lib/parametres-transport"

export const generateMetadata = () =>
  metadonnees((t) => ({
    titre: t.meta.panierTitre,
    description: t.meta.panierDescription,
  }))

export default async function PanierPage() {
  // Chargées côté serveur : le panier n'a pas à ouvrir sa propre connexion
  // Supabase pour une liste que le cache partagé sert déjà.
  const communes = (await getCommunes()).map((c) => ({ id: c.id, nom: c.nom }))
  const delai = formaterDelai((await getParametresTransport()).delai_negociation_heures)
  return <PanierClient communes={communes} delai={delai} />
}