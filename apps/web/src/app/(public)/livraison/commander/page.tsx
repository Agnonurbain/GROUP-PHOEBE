import { metadonnees } from "@/lib/i18n/metadonnees"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCommunes, getTarifsLivraison } from "@/lib/public-cache"
import CommanderClient from "./commander-client"
import { getParametresIndemnisation } from "@/lib/legal"
import { libelleIndemnisation } from "@/lib/indemnisation"

export const generateMetadata = () =>
  metadonnees((t) => ({
    titre: t.meta.livraisonCommanderTitre,
    description: t.meta.livraisonCommanderDescription,
  }))

export default async function CommanderLivraisonPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims

  if (!user) {
    redirect("/connexion?redirect=/livraison/commander")
  }

  const [{ data: profile }, communesData, tarifs] = await Promise.all([
    supabase.from("users").select("nom, telephone").eq("id", user.sub).single(),
    getCommunes(),
    getTarifsLivraison(),
  ])

  const communes = (communesData ?? []).map((c) => ({
    id: c.id,
    nom: c.nom,
    zoneId: c.zone_id ?? null,
  }))

  return (
    <CommanderClient
      defaultNom={profile?.nom ?? ""}
      defaultContact={profile?.telephone ?? ""}
      communes={communes}
      moyens={tarifs.moyens}
      coefficientsMode={tarifs.coefficientsMode}
      grilleMoyens={tarifs.grilleMoyens}
      texteIndemnisation={libelleIndemnisation(await getParametresIndemnisation())}
    />
  )
}
