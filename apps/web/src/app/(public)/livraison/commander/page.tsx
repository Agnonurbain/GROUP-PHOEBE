import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import CommanderClient from "./commander-client"

export const metadata: Metadata = {
  title: "Commander une livraison",
  description: "Commandez une livraison de colis à Abidjan et partout en Côte d'Ivoire avec GROUP PHOEBE.",
}

export default async function CommanderLivraisonPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims

  if (!user) {
    redirect("/connexion?redirect=/livraison/commander")
  }

  const { data: profile } = await supabase
    .from("users")
    .select("nom, telephone")
    .eq("id", user.sub)
    .single()

  return (
    <CommanderClient
      defaultNom={profile?.nom ?? ""}
      defaultContact={profile?.telephone ?? ""}
    />
  )
}
