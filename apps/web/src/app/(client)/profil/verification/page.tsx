import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasMinimumAge } from "@/lib/auth";
import { BackLink } from "@/components/back-link";
import { ScrollReveal } from "@/components/effects";
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
      <div className="space-y-8 animate-fade-in">
        <ScrollReveal variant="fade-up">
        <div>
          <BackLink href="/profil" label="Mon profil" />
          <h1 className="mt-3 text-3xl font-bold text-phoebe-anthracite">
            Vérification d&apos;identité
          </h1>
        </div>
        </ScrollReveal>
        <ScrollReveal variant="fade-up" delay={0.15}>
        <div className="rounded-2xl border border-phoebe-gold/30 bg-gradient-to-br from-phoebe-gold/5 to-phoebe-gold/10 p-7 shadow-sm">
          <p className="text-sm text-phoebe-anthracite leading-relaxed">
            Vous devez renseigner votre <strong>date de naissance</strong>
            {" "}avant de soumettre vos documents. L&apos;âge minimum requis
            est de 21 ans.
          </p>
          <Link
            href="/profil"
            className="relative mt-5 inline-block overflow-hidden rounded-2xl bg-phoebe-green px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-lg"
          >
            <span className="relative z-10">Compléter mon profil</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 hover:translate-x-full" />
          </Link>
        </div>
        </ScrollReveal>
      </div>
    );
  }

  if (!hasMinimumAge(profile.date_naissance, 21)) {
    return (
      <div className="space-y-8 animate-fade-in">
        <ScrollReveal variant="fade-up">
        <div>
          <BackLink href="/profil" label="Mon profil" />
          <h1 className="mt-3 text-3xl font-bold text-phoebe-anthracite">
            Vérification d&apos;identité
          </h1>
        </div>
        </ScrollReveal>
        <ScrollReveal variant="fade-up" delay={0.15}>
        <div className="rounded-2xl border border-error/20 bg-gradient-to-br from-error/5 to-error/10 p-7 shadow-sm">
          <p className="text-sm text-error leading-relaxed">
            Vous devez avoir au moins <strong>21 ans</strong> pour soumettre vos
            documents et effectuer une réservation.
          </p>
        </div>
        </ScrollReveal>
      </div>
    );
  }

  return <VerificationForm />;
}
