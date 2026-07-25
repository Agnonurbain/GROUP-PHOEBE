import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { VerificationBadge } from "@/components/verification-badge"
import { ProfileEditForm } from "@/components/profile-edit-form"
import { ChangePasswordForm } from "@/components/change-password-form"
import { getSignedDocUrl } from "@/lib/storage"
import type { StatutVerification } from "@/lib/auth"
import { DeleteAccountButton } from "@/components/delete-account-button"
import { LogoutButton } from "@/components/logout-button"
import { Button, Card } from "@/components/ui"
import { BackLink } from "@/components/public/back-link"

export const metadata: Metadata = {
  title: "Mon Profil",
  description: "Gérez vos informations personnelles, vos documents d'identité et préférences sur votre compte GROUP PHOEBE.",
  openGraph: {
    title: "Mon Profil",
    description: "Gérez vos informations personnelles, vos documents d'identité et préférences sur votre compte GROUP PHOEBE.",
  },
}

export default async function CompteProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ mdp?: string }>
}) {
  const { mdp } = await searchParams
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims

  if (!user) {
    return (
      <div className="px-6 py-20 text-center">
        <h1 className="text-4xl font-bold text-public-text">Mon Profil</h1>
        <p className="mt-4 text-sm text-public-text-muted">Connectez-vous pour accéder à votre profil.</p>
        <Link href="/connexion">
          <Button variant="default" className="mt-6">Se connecter</Button>
        </Link>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.sub)
    .single()

  if (!profile) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="text-sm text-public-text-muted">Profil introuvable.</p>
      </div>
    )
  }

  const statut = profile.statut_verification as StatutVerification
  const isClient = profile.role === "client"

  // Un compte a un mot de passe s'il s'est inscrit par email ou telephone.
  // Les comptes Google seuls (providers = ["google"]) n'en ont pas.
  const providers = (user.app_metadata?.providers as string[] | undefined) ?? []
  const hasPassword = providers.includes("email") || providers.includes("phone")

  const [pieceUrl, permisUrl] = isClient
    ? await Promise.all([
        getSignedDocUrl(supabase, profile.piece_identite_url),
        getSignedDocUrl(supabase, profile.permis_conduire_url),
      ])
    : [null, null]

  return (
    <div className="px-6 py-10">
      <div className="mb-6">
        <BackLink href="/" label="Retour à l'accueil" />
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-public-text">Mon Profil</h1>
          <p className="mt-1 text-sm text-public-text-muted">{profile.nom}</p>
        </div>
        <LogoutButton
          label="Se déconnecter"
          className="inline-flex items-center gap-2 rounded-lg border border-public-border px-4 py-2 text-sm font-medium text-public-text-muted transition-colors hover:bg-public-bg-elevated hover:text-public-text max-sm:min-h-11"
        />
      </div>

      <div className="mt-8 space-y-6">
        <ProfileEditForm
          nom={profile.nom}
          telephone={profile.telephone}
          dateNaissance={profile.date_naissance}
          email={profile.email ?? null}
          role={profile.role}
        />

        {mdp === "ok" && (
          <p role="status" className="rounded-2xl border border-accent-green/20 bg-accent-green/5 px-5 py-3.5 text-sm font-medium text-accent-green">
            Votre mot de passe a été modifié avec succès.
          </p>
        )}

        {hasPassword && <ChangePasswordForm />}

        {isClient && (
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-semibold text-public-text">Mes réservations</h2>
              <a href="/compte/reservations" className="text-sm font-medium text-accent-gold hover:text-accent-gold-hover transition-colors">
                Voir mes réservations →
              </a>
            </div>
          </Card>
        )}

        {isClient && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-semibold text-public-text">Vérification d&apos;identité</h2>
                <div className="mt-1.5">
                  <VerificationBadge statut={statut} />
                </div>
              </div>
            </div>

            {statut === "non_verifie" && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-public-text-muted">
                  Vous devez soumettre une pièce d&apos;identité et un permis de conduire
                  pour pouvoir effectuer une réservation.
                </p>
                <a href="/compte/verification">
                  <Button variant="default">Soumettre mes documents</Button>
                </a>
              </div>
            )}
            {statut === "documents_soumis" && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-public-text-muted">
                  Vos documents sont en cours de vérification par notre équipe.
                </p>
                {(pieceUrl || permisUrl) && (
                  <div className="flex gap-4 text-sm">
                    {pieceUrl && (
                      <a href={pieceUrl} target="_blank" rel="noopener noreferrer"
                        className="font-medium text-accent-gold underline underline-offset-2 hover:text-accent-gold-hover">
                        Pièce d&apos;identité
                      </a>
                    )}
                    {permisUrl && (
                      <a href={permisUrl} target="_blank" rel="noopener noreferrer"
                        className="font-medium text-accent-gold underline underline-offset-2 hover:text-accent-gold-hover">
                        Permis de conduire
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
            {statut === "rejete" && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-[#EF4444]">
                  Vos documents ont été rejetés. Veuillez les soumettre à nouveau.
                </p>
                <a href="/compte/verification">
                  <Button variant="default" className="bg-accent-orange text-white hover:bg-accent-orange-hover">Soumettre à nouveau</Button>
                </a>
                {profile.motif_rejet && (
                  <p className="text-sm text-public-text-muted">
                    <strong>Motif :</strong> {profile.motif_rejet}
                  </p>
                )}
                {(pieceUrl || permisUrl) && (
                  <div className="flex gap-4 text-sm">
                    {pieceUrl && (
                      <a href={pieceUrl} target="_blank" rel="noopener noreferrer"
                        className="font-medium text-public-text-muted underline underline-offset-2 hover:text-public-text">
                        Pièce d&apos;identité soumise
                      </a>
                    )}
                    {permisUrl && (
                      <a href={permisUrl} target="_blank" rel="noopener noreferrer"
                        className="font-medium text-public-text-muted underline underline-offset-2 hover:text-public-text">
                        Permis soumis
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
            {statut === "verifie" && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-accent-green">
                  Votre identité est vérifiée. Vous pouvez effectuer des réservations.
                </p>
                {(pieceUrl || permisUrl) && (
                  <div className="flex gap-4 text-sm">
                    {pieceUrl && (
                      <a href={pieceUrl} target="_blank" rel="noopener noreferrer"
                        className="font-medium text-accent-gold underline underline-offset-2 hover:text-accent-gold-hover">
                        Pièce d&apos;identité
                      </a>
                    )}
                    {permisUrl && (
                      <a href={permisUrl} target="_blank" rel="noopener noreferrer"
                        className="font-medium text-accent-gold underline underline-offset-2 hover:text-accent-gold-hover">
                        Permis de conduire
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {isClient && (
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-semibold text-public-text">Favoris</h2>
              <a href="/compte/favoris" className="text-sm font-medium text-accent-gold hover:text-accent-gold-hover transition-colors">
                Voir mes favoris →
              </a>
            </div>
          </Card>
        )}

        <div className="rounded-2xl border border-[rgba(239,68,68,0.15)] bg-[rgba(239,68,68,0.05)] p-6">
          <h2 className="text-3xl font-semibold text-[#EF4444]">Supprimer mon compte</h2>
          <p className="mt-2 text-sm text-public-text-muted">
            Cette action est irréversible. Toutes vos données personnelles seront définitivement effacées
            conformément au RGPD.
          </p>
          <div className="mt-4">
            <DeleteAccountButton />
          </div>
        </div>
      </div>
    </div>
  )
}
