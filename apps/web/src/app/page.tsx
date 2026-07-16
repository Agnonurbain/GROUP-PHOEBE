import Link from "next/link";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";

const services = [
  {
    title: "Transport",
    description:
      "Véhicules avec chauffeur pour vos déplacements professionnels et personnels à Abidjan et en Côte d'Ivoire.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    title: "Assistance Voyages & Études",
    description:
      "Organisation de voyages et accompagnement des étudiants pour les études à l'étranger.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
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
        <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center md:py-28">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-phoebe-anthracite md:text-5xl lg:text-6xl">
            Vos services professionnels en{" "}
            <span className="text-phoebe-green">Côte d&apos;Ivoire</span>
          </h1>
          <p className="max-w-xl text-lg text-phoebe-anthracite/70">
            Transport avec chauffeur, livraison, immobilier et assistance
            voyages — tout en une seule plateforme.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/catalogue"
              className="rounded-lg bg-phoebe-green px-6 py-3 font-medium text-white transition-colors hover:bg-phoebe-green-deep"
            >
              Voir le catalogue
            </Link>
            {user ? (
              <Link
                href="/profil"
                className="rounded-lg border border-phoebe-anthracite/20 px-6 py-3 font-medium text-phoebe-anthracite transition-colors hover:border-phoebe-green hover:text-phoebe-green"
              >
                Mon profil
              </Link>
            ) : (
              <Link
                href="/inscription"
                className="rounded-lg border border-phoebe-anthracite/20 px-6 py-3 font-medium text-phoebe-anthracite transition-colors hover:border-phoebe-green hover:text-phoebe-green"
              >
                Créer un compte
              </Link>
            )}
          </div>
        </section>

        <section className="border-t border-phoebe-pearl bg-phoebe-pearl/50 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-10 text-center text-2xl font-bold text-phoebe-anthracite md:text-3xl">
              Nos services
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((s) => (
                <div
                  key={s.title}
                  className="rounded-xl border border-phoebe-pearl bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-phoebe-green/10 text-phoebe-green">
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

        {!user && (
          <section className="mx-auto max-w-6xl px-4 py-16 text-center md:py-20">
            <h2 className="mb-4 text-2xl font-bold text-phoebe-anthracite md:text-3xl">
              Prêt à commencer ?
            </h2>
            <p className="mb-6 text-phoebe-anthracite/60">
              Inscrivez-vous gratuitement et réservez votre premier trajet en
              quelques minutes.
            </p>
            <Link
              href="/inscription"
              className="inline-block rounded-lg bg-phoebe-green px-8 py-3 font-medium text-white transition-colors hover:bg-phoebe-green-deep"
            >
              S&apos;inscrire maintenant
            </Link>
          </section>
        )}
      </main>

      <footer className="border-t border-phoebe-pearl py-8 text-center text-sm text-phoebe-anthracite/40">
        © {new Date().getFullYear()} GROUP PHOEBE. Tous droits réservés.
      </footer>
    </>
  );
}
