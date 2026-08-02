import type { Metadata } from "next"
import PanierClient from "./page-client"
import { getCommunes } from "@/lib/public-cache"
import { getParametresTransport, formaterDelai } from "@/lib/parametres-transport"

export const metadata: Metadata = {
  title: "Panier — Réservation",
  description: "Finalisez votre réservation de véhicule, bien immobilier ou service d'assistance GROUP PHOEBE en toute simplicité.",
  openGraph: {
    title: "Panier — Réservation",
    description: "Finalisez votre réservation de véhicule, bien immobilier ou service d'assistance GROUP PHOEBE en toute simplicité.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Panier — Réservation",
    description: "Finalisez votre réservation de véhicule, bien immobilier ou service d'assistance GROUP PHOEBE en toute simplicité.",
  },
}

export default async function PanierPage() {
  // Chargées côté serveur : le panier n'a pas à ouvrir sa propre connexion
  // Supabase pour une liste que le cache partagé sert déjà.
  const communes = (await getCommunes()).map((c) => ({ id: c.id, nom: c.nom }))
  const delai = formaterDelai((await getParametresTransport()).delai_negociation_heures)
  return <PanierClient communes={communes} delai={delai} />
}