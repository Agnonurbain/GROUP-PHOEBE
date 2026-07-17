import Link from "next/link";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";

const services = [
  {
    title: "Transport",
    description:
      "Vehicules avec chauffeur pour vos deplacements professionnels et personnels a Abidjan et en Cote d'Ivoire.",
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
      "Organisation de voyages et accompagnement des etudiants pour les etudes a l'etranger.",
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
        {/* Hero */}
        <section className="relative overflow-hidden bg-phoebe-anthracite">
          <div className="absolute inset-0 bg-gradient-to-br from-phoebe-green-deep/30 via-transparent to-phoebe-gold/10" />
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-phoebe-green/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-phoebe-gold/5 blur-3xl" />

          <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center md:py-28 lg:py-32">
            <span className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-phoebe-green/30 bg-phoebe-green/10 px-4 py-1.5 text-xs font-medium text-phoebe-green">
              <span className="h-1.5 w-1.5 rounded-full bg-phoebe-green" />
              Services premium en Cote d&apos;Ivoire
            </span>

            <h1 className="animate-slide-up max-w-3xl text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
              Vos services professionnels de{" "}
              <span className="bg-gradient-to-r from-phoebe-green to-phoebe-gold bg-clip-text text-transparent">
                confiance
              </span>
            </h1>

            <p className="max-w-xl text-lg text-white/70">
              Transport avec chauffeur, livraison, immobilier et assistance
              voyages — tout en une seule plateforme.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/catalogue"
                className="rounded-xl bg-phoebe-green px-7 py-3.5 font-medium text-white shadow-lg shadow-phoebe-green/25 transition-all hover:bg-phoebe-green-deep hover:shadow-xl hover:shadow-phoebe-green/30"
              >
                Voir le catalogue
              </Link>
              {user ? (
                <Link
                  href="/profil"
                  className="rounded-xl border border-white/20 px-7 py-3.5 font-medium text-white transition-all hover:border-white/40 hover:bg-white/5"
                >
                  Mon profil
                </Link>
              ) : (
                <Link
                  href="/inscription"
                  className="rounded-xl border border-white/20 px-7 py-3.5 font-medium text-white transition-all hover:border-white/40 hover:bg-white/5"
                >
                  Creer un compte
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="border-t border-phoebe-pearl bg-phoebe-pearl/30 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-phoebe-gold">
                Nos services
              </p>
              <h2 className="text-2xl font-bold text-phoebe-anthracite md:text-3xl">
                Une solution pour chaque besoin
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((s) => (
                <div
                  key={s.title}
                  className="group rounded-xl border border-phoebe-pearl bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-phoebe-green/10 text-phoebe-green transition-colors group-hover:bg-phoebe-green group-hover:text-white">
                    {s.icon}
                  </div>
                  <h3 className="mb-2 font-semibold text-phoebe-anthracite">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-phoebe-anthracite/60">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        {!user && (
          <section className="mx-auto max-w-6xl px-4 py-16 text-center md:py-20">
            <div className="rounded-2xl bg-gradient-to-br from-phoebe-anthracite to-phoebe-anthracite/90 px-6 py-12 md:px-12">
              <h2 className="mb-4 text-2xl font-bold text-white md:text-3xl">
                Pret a commencer ?
              </h2>
              <p className="mb-6 text-white/60">
                Inscrivez-vous gratuitement et reservez votre premier trajet en
                quelques minutes.
              </p>
              <Link
                href="/inscription"
                className="inline-block rounded-xl bg-phoebe-green px-8 py-3.5 font-medium text-white shadow-lg shadow-phoebe-green/25 transition-all hover:bg-phoebe-green-deep hover:shadow-xl"
              >
                S&apos;inscrire maintenant
              </Link>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-phoebe-pearl bg-phoebe-pearl/30 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-phoebe-anthracite">
                GROUP <span className="text-phoebe-green">PHOEBE</span>
              </span>
              <span className="text-[9px] font-medium tracking-wider text-phoebe-gold">
                LEADER &middot; EXCELLENCE &middot; EFFICACITE
              </span>
            </div>
            <p className="text-xs text-phoebe-anthracite/40">
              &copy; {new Date().getFullYear()} GROUP PHOEBE. Tous droits reserves.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
