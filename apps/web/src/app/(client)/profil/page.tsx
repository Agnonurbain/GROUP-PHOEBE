import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VerificationBadge } from "@/components/verification-badge";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { BackLink } from "@/components/back-link";
import { getSignedDocUrl } from "@/lib/storage";
import { ScrollReveal } from "@/components/effects";
import type { StatutVerification } from "@/lib/auth";

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.sub)
    .single();

  if (!profile) redirect("/connexion");

  const statut = profile.statut_verification as StatutVerification;
  const isClient = profile.role === "client";

  const [pieceUrl, permisUrl] = isClient
    ? await Promise.all([
        getSignedDocUrl(supabase, profile.piece_identite_url),
        getSignedDocUrl(supabase, profile.permis_conduire_url),
      ])
    : [null, null];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header banner */}
      <ScrollReveal variant="fade-up">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-phoebe-green-deep via-phoebe-green to-phoebe-green-deep p-7 shadow-lg">
          <div className="absolute inset-0 bg-hex-pattern opacity-10" />
          <div className="relative">
            <BackLink href="/" label="Accueil" />
            <h1 className="mt-3 text-3xl font-bold text-white">Mon profil</h1>
            <p className="mt-1 text-sm text-white/60">{profile.nom}</p>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.1}>
      <ProfileEditForm
        nom={profile.nom}
        telephone={profile.telephone}
        dateNaissance={profile.date_naissance}
        email={profile.email ?? null}
        role={profile.role}
      />
      </ScrollReveal>

      {isClient && <ScrollReveal variant="fade-up" delay={0.2}><div className="rounded-2xl border border-phoebe-pearl bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-phoebe-anthracite">
              Vérification d&apos;identité
            </h2>
            <div className="mt-1.5">
              <VerificationBadge statut={statut} />
            </div>
          </div>
          {statut === "non_verifie" && (
            <Link
              href="/profil/verification"
              className="relative overflow-hidden rounded-2xl bg-phoebe-green px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-lg"
            >
              <span className="relative z-10">Soumettre mes documents</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 hover:translate-x-full" />
            </Link>
          )}
          {statut === "rejete" && (
            <Link
              href="/profil/verification"
              className="relative overflow-hidden rounded-2xl bg-phoebe-gold px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-gold-dark hover:shadow-lg"
            >
              <span className="relative z-10">Soumettre à nouveau</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 hover:translate-x-full" />
            </Link>
          )}
        </div>

        {statut === "non_verifie" && (
          <p className="mt-4 text-sm text-phoebe-anthracite/55">
            Vous devez soumettre une pièce d&apos;identité et un permis de conduire
            pour pouvoir effectuer une réservation.
          </p>
        )}
        {statut === "documents_soumis" && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-phoebe-anthracite/55">
              Vos documents sont en cours de vérification par notre équipe.
            </p>
            {(pieceUrl || permisUrl) && (
              <div className="flex gap-4 text-xs">
                {pieceUrl && (
                  <a
                    href={pieceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-phoebe-green underline decoration-phoebe-green/30 underline-offset-2 hover:text-phoebe-green-deep hover:decoration-phoebe-green-deep/50"
                  >
                    Pièce d&apos;identité
                  </a>
                )}
                {permisUrl && (
                  <a
                    href={permisUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-phoebe-green underline decoration-phoebe-green/30 underline-offset-2 hover:text-phoebe-green-deep hover:decoration-phoebe-green-deep/50"
                  >
                    Permis de conduire
                  </a>
                )}
              </div>
            )}
          </div>
        )}
        {statut === "rejete" && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-error/80">
              Vos documents ont été rejetés. Veuillez les soumettre à nouveau.
            </p>
            {profile.motif_rejet && (
              <p className="text-sm text-phoebe-anthracite/70">
                <strong>Motif :</strong> {profile.motif_rejet}
              </p>
            )}
            {(pieceUrl || permisUrl) && (
              <div className="flex gap-4 text-xs">
                {pieceUrl && (
                  <a
                    href={pieceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-phoebe-anthracite/60 underline decoration-phoebe-anthracite/20 underline-offset-2 hover:text-phoebe-green"
                  >
                    Pièce d&apos;identité soumise
                  </a>
                )}
                {permisUrl && (
                  <a
                    href={permisUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-phoebe-anthracite/60 underline decoration-phoebe-anthracite/20 underline-offset-2 hover:text-phoebe-green"
                  >
                    Permis soumis
                  </a>
                )}
              </div>
            )}
          </div>
        )}
        {statut === "verifie" && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-phoebe-green-deep">
              Votre identité est vérifiée. Vous pouvez effectuer des réservations.
            </p>
            {(pieceUrl || permisUrl) && (
              <div className="flex gap-4 text-xs">
                {pieceUrl && (
                  <a
                    href={pieceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-phoebe-green underline decoration-phoebe-green/30 underline-offset-2 hover:text-phoebe-green-deep hover:decoration-phoebe-green-deep/50"
                  >
                    Pièce d&apos;identité
                  </a>
                )}
                {permisUrl && (
                  <a
                    href={permisUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-phoebe-green underline decoration-phoebe-green/30 underline-offset-2 hover:text-phoebe-green-deep hover:decoration-phoebe-green-deep/50"
                  >
                    Permis de conduire
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div></ScrollReveal>}

      {isClient && <ScrollReveal variant="fade-up" delay={0.3}><div className="group rounded-2xl border border-phoebe-pearl bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-phoebe-gold/30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-phoebe-anthracite">
            Favoris
          </h2>
          <Link
            href="/profil/favoris"
            className="text-sm font-medium text-gradient-gold transition-opacity hover:opacity-80"
          >
            Voir mes favoris →
          </Link>
        </div>
      </div></ScrollReveal>}
    </div>
  );
}
