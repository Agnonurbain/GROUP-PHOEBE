import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasMinimumAge } from "@/lib/auth";
import { BackLink } from "@/components/back-link";
import { VerificationForm } from "./verification-form";

export default async function VerificationPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("users")
    .select("date_naissance")
    .eq("id", user.sub)
    .single();

  if (!profile?.date_naissance) {
    return (
      <div className="space-y-6">
        <div>
          <BackLink href="/profil" label="Mon profil" />
          <h1 className="mt-2 text-2xl font-bold text-phoebe-anthracite">
            Vérification d&apos;identité
          </h1>
        </div>
        <div className="rounded-xl border border-phoebe-gold/30 bg-phoebe-gold/10 p-6">
          <p className="text-sm text-phoebe-anthracite">
            Vous devez renseigner votre <strong>date de naissance</strong>
            {" "}avant de soumettre vos documents. L&apos;âge minimum requis
            est de 21 ans.
          </p>
          <Link
            href="/profil"
            className="mt-4 inline-block rounded-lg bg-phoebe-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-phoebe-green-deep"
          >
            Compléter mon profil
          </Link>
        </div>
      </div>
    );
  }

  if (!hasMinimumAge(profile.date_naissance, 21)) {
    return (
      <div className="space-y-6">
        <div>
          <BackLink href="/profil" label="Mon profil" />
          <h1 className="mt-2 text-2xl font-bold text-phoebe-anthracite">
            Vérification d&apos;identité
          </h1>
        </div>
        <div className="rounded-xl border border-error/30 bg-error/10 p-6">
          <p className="text-sm text-error">
            Vous devez avoir au moins <strong>21 ans</strong> pour soumettre vos
            documents et effectuer une réservation.
          </p>
        </div>
      </div>
    );
  }

  return <VerificationForm />;
}
