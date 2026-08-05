import { metadonnees } from "@/lib/i18n/metadonnees"
import { BackLink } from "@/components/public/back-link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { hasMinimumAge } from "@/lib/auth"
import { VerificationForm } from "./verification-form"
import { Button, Card } from "@/components/ui"
import { getT } from "@/lib/i18n/server"
import { remplir } from "@/lib/i18n/format"

export const generateMetadata = () =>
  metadonnees((t) => ({
    titre: t.meta.verificationTitre,
    description: t.meta.verificationDescription,
  }))

export default async function VerificationPage() {
  const t = await getT()
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
        <h1 className="text-4xl font-bold text-public-text">{t.espaceClient.verificationIdentite}</h1>
        <Card className="mt-6 border-accent-gold/30">
          <p className="text-sm text-public-text-muted leading-relaxed">
            {remplir(t.espaceClient.renseignerNaissance, { age: 21 })}
          </p>
          <a href="/compte/profil">
            <Button variant="default" className="mt-4">{t.espaceClient.completerProfil}</Button>
          </a>
        </Card>
      </div>
    )
  }

  if (!hasMinimumAge(profile.date_naissance, 21)) {
    return (
      <div className="px-6 py-16">
        <h1 className="text-4xl font-bold text-public-text">{t.espaceClient.verificationIdentite}</h1>
        <div className="mt-6 rounded-2xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.05)] p-6">
          <p className="text-sm text-[#EF4444] leading-relaxed">
            {remplir(t.espaceClient.ageMinimum, { age: 21 })}
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
