import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VerificationBadge } from "@/components/verification-badge";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { BackLink } from "@/components/back-link";
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

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/" label="Accueil" />
        <h1 className="mt-2 text-2xl font-bold text-phoebe-anthracite">Mon profil</h1>
      </div>

      <ProfileEditForm
        nom={profile.nom}
        telephone={profile.telephone}
        dateNaissance={profile.date_naissance}
        email={profile.email ?? null}
        role={profile.role}
      />

      <div className="rounded-xl border border-phoebe-pearl bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-phoebe-anthracite">
              Vérification d&apos;identité
            </h2>
            <div className="mt-1">
              <VerificationBadge statut={statut} />
            </div>
          </div>
          {statut === "non_verifie" && (
            <Link
              href="/profil/verification"
              className="rounded-lg bg-phoebe-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-phoebe-green-deep"
            >
              Soumettre mes documents
            </Link>
          )}
          {statut === "rejete" && (
            <Link
              href="/profil/verification"
              className="rounded-lg bg-phoebe-gold px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-phoebe-gold/80"
            >
              Soumettre à nouveau
            </Link>
          )}
        </div>

        {statut === "non_verifie" && (
          <p className="mt-3 text-sm text-phoebe-anthracite/60">
            Vous devez soumettre une pièce d&apos;identité et un permis de conduire
            pour pouvoir effectuer une réservation.
          </p>
        )}
        {statut === "documents_soumis" && (
          <p className="mt-3 text-sm text-phoebe-anthracite/60">
            Vos documents sont en cours de vérification par notre équipe.
          </p>
        )}
        {statut === "rejete" && (
          <p className="mt-3 text-sm text-error/80">
            Vos documents ont été rejetés. Veuillez les soumettre à nouveau avec
            des documents lisibles et valides.
          </p>
        )}
        {statut === "verifie" && (
          <p className="mt-3 text-sm text-phoebe-green-deep">
            Votre identité est vérifiée. Vous pouvez effectuer des réservations.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-phoebe-pearl bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-phoebe-anthracite">
            Favoris
          </h2>
          <Link
            href="/profil/favoris"
            className="text-sm text-phoebe-green hover:text-phoebe-green-deep"
          >
            Voir mes favoris →
          </Link>
        </div>
      </div>
    </div>
  );
}
