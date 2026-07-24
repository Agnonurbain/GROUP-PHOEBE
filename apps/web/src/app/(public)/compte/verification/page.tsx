import type { Metadata } from "next"
import { BackLink } from "@/components/public/back-link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { hasMinimumAge } from "@/lib/auth"
import { VerificationForm } from "./verification-form"
import { Button, Card } from "@/components/ui"

export const metadata: Metadata = {
  title: "Vérification d'identité",
  description: "Soumettez vos documents d'identité et permis de conduire pour vérifier votre compte GROUP PHOEBE.",
  openGraph: {
    title: "Vérification d'identité",
    description: "Soumettez vos documents d'identité et permis de conduire pour vérifier votre compte GROUP PHOEBE.",
  },
}

export default async function VerificationPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims
  if (!user) redirect("/connexion")

  const { data: profile } = await supabase
    .from("users")
    .select("date_naissance, statut_verification, motif_rejet")
    .eq("id", user.sub)
    .single()

  if (!profile?.date_naissance) {
    return (
      <div className="px-6 py-16">
        <h1 className="text-4xl font-bold text-public-text">Vérification d&apos;identité</h1>
        <Card className="mt-6 border-accent-gold/30">
          <p className="text-sm text-public-text-muted leading-relaxed">
            Vous devez renseigner votre <strong className="text-public-text">date de naissance</strong> avant de soumettre vos documents. L&apos;âge minimum requis est de 21 ans.
          </p>
          <a href="/compte/profil">
            <Button variant="default" className="mt-4">Compléter mon profil</Button>
          </a>
        </Card>
      </div>
    )
  }

  if (!hasMinimumAge(profile.date_naissance, 21)) {
    return (
      <div className="px-6 py-16">
        <h1 className="text-4xl font-bold text-public-text">Vérification d&apos;identité</h1>
        <div className="mt-6 rounded-2xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.05)] p-6">
          <p className="text-sm text-[#EF4444] leading-relaxed">
            Vous devez avoir au moins <strong>21 ans</strong> pour soumettre vos
            documents et effectuer une réservation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="px-6 pt-6">
        <BackLink href="/compte/profil" label="Retour au profil" />
      </div>
      <VerificationForm statut={profile.statut_verification ?? undefined} motifRejet={profile.motif_rejet} />
    </>
  )
}
