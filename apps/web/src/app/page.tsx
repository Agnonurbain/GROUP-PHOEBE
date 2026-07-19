import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";

const services = [
  {
    title: "Transport",
    description:
      "Véhicules avec chauffeur pour vos déplacements professionnels et personnels à Abidjan et en Côte d'Ivoire.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M5 17h14M5 17a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v1m-12 9h1m12 0h1m0 0a2 2 0 002-2v-4a2 2 0 00-2-2h-3l-2-3H9" />
        <circle cx="7.5" cy="17" r="1.5" />
        <circle cx="16.5" cy="17" r="1.5" />
      </svg>
    ),
  },
  {
    title: "Livraison",
    description:
      "Service de livraison de colis rapide et fiable dans toute la ville.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
      </svg>
    ),
  },
  {
    title: "Immobilier",
    description:
      "Accompagnement dans vos projets immobiliers : location, achat et gestion de biens.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    title: "Assistance Voyages",
    description:
      "Organisation de voyages et accompagnement des étudiants pour les études à l'étranger.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero — motif hexagonal signature */}
        <section className="bg-hex-pattern relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
          <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-phoebe-green/8 blur-[100px]" />
          <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-phoebe-gold/6 blur-[80px]" />

          <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-24 text-center md:py-32 lg:py-40">
            <span className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-phoebe-gold/40 bg-phoebe-gold/10 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-phoebe-gold-light">
              <span className="h-1.5 w-1.5 rounded-full bg-phoebe-gold animate-pulse-gold" />
              Services premium en Cote d&apos;Ivoire
            </span>

            <h1 className="animate-slide-up max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
              Vos services professionnels de{" "}
              <span className="animate-shimmer">
                confiance
              </span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-white/60">
              Transport avec chauffeur, livraison, immobilier et assistance
              voyages — tout en une seule plateforme.
            </p>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/catalogue"
                className="group relative overflow-hidden rounded-xl bg-phoebe-green px-8 py-4 font-semibold text-white shadow-lg shadow-phoebe-green/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-phoebe-green/35"
              >
                <span className="relative z-10">Voir le catalogue</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </Link>
              {user ? (
                <Link
                  href="/profil"
                  className="rounded-xl border border-phoebe-gold/30 px-8 py-4 font-semibold text-phoebe-gold-light transition-all hover:border-phoebe-gold/60 hover:bg-phoebe-gold/5 hover:shadow-lg hover:shadow-phoebe-gold/10"
                >
                  Mon profil
                </Link>
              ) : (
                <Link
                  href="/inscription"
                  className="rounded-xl border border-phoebe-gold/30 px-8 py-4 font-semibold text-phoebe-gold-light transition-all hover:border-phoebe-gold/60 hover:bg-phoebe-gold/5 hover:shadow-lg hover:shadow-phoebe-gold/10"
                >
                  Creer un compte
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="bg-white py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-14 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-phoebe-gold">
                Nos services
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-phoebe-anthracite md:text-4xl">
                Une solution pour chaque besoin
              </h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((s) => (
                <div
                  key={s.title}
                  className="group relative overflow-hidden rounded-2xl border border-phoebe-pearl bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-phoebe-green/8"
                >
                  <div className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-phoebe-gold-light via-phoebe-gold to-phoebe-gold-dark transition-transform duration-300 group-hover:scale-x-100" />
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-phoebe-green/8 text-phoebe-green transition-all duration-300 group-hover:bg-phoebe-green group-hover:text-white group-hover:shadow-lg group-hover:shadow-phoebe-green/20">
                    {s.icon}
                  </div>
                  <h3 className="mb-2 font-bold text-phoebe-anthracite">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-phoebe-anthracite/55">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        {!user && (
          <section className="mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
            <div className="bg-hex-dark overflow-hidden rounded-3xl px-8 py-16 md:px-16">
              <div className="relative z-10">
                <h2 className="mb-5 text-3xl font-bold tracking-tight text-white md:text-4xl">
                  Prêt à commencer ?
                </h2>
                <p className="mb-8 text-lg text-white/50">
                  Inscrivez-vous gratuitement et réservez votre premier trajet en
                  quelques minutes.
                </p>
                <Link
                  href="/inscription"
                  className="group relative inline-block overflow-hidden rounded-xl bg-phoebe-green px-10 py-4 font-semibold text-white shadow-lg shadow-phoebe-green/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-phoebe-green/40"
                >
                  <span className="relative z-10">S&apos;inscrire maintenant</span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-phoebe-pearl bg-white py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Image
              src="/logo.png"
              alt="Group PHOEBE"
              width={120}
              height={48}
              className="h-10 w-auto object-contain"
            />
            <p className="text-xs text-phoebe-anthracite/40">
              &copy; {new Date().getFullYear()} GROUP PHOEBE. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
