import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import {
  HeroEffects,
  HeroSlideshow,
  ServiceCard,
  ScrollReveal,
  MagneticButton,
  AnimatedCounter,
  ParallaxImage,
  TiltCard,
} from "@/components/effects";

const services = [
  {
    title: "Transport",
    description:
      "Véhicules avec chauffeur pour vos déplacements professionnels et personnels à Abidjan et en Côte d'Ivoire.",
    image: "/images/transport.jpg",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
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
    image: "/images/livraison.jpg",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
      </svg>
    ),
  },
  {
    title: "Immobilier",
    description:
      "Accompagnement dans vos projets immobiliers : location, achat et gestion de biens.",
    image: "/images/immobilier.jpg",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    title: "Assistance Voyages",
    description:
      "Organisation de voyages et accompagnement des étudiants pour les études à l'étranger.",
    image: "/images/voyages.jpg",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
];

const stats = [
  { value: 500, suffix: "+", label: "Clients satisfaits" },
  { value: 50, suffix: "+", label: "Véhicules disponibles" },
  { value: 15, suffix: "+", label: "Communes desservies" },
  { value: 98, suffix: "%", label: "Taux de satisfaction" },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero — motif hexagonal + sparkles + gold trail */}
        <HeroEffects>
          <section className="relative overflow-hidden bg-black">
            {/* Slideshow d'images en fond — slow motion Ken Burns */}
            <HeroSlideshow />

            {/* Floating gold orbs par-dessus */}
            <div className="gold-orb z-[3] h-3 w-3 left-[10%] top-[25%] opacity-60" style={{ animationDelay: "0s" }} />
            <div className="gold-orb z-[3] h-2 w-2 right-[15%] top-[30%] opacity-40" style={{ animationDelay: "2s" }} />
            <div className="gold-orb z-[3] h-4 w-4 left-[70%] bottom-[20%] opacity-50" style={{ animationDelay: "4s" }} />
            <div className="gold-orb z-[3] h-2.5 w-2.5 left-[30%] bottom-[30%] opacity-45" style={{ animationDelay: "1.5s" }} />
            <div className="gold-orb z-[3] h-1.5 w-1.5 right-[25%] top-[60%] opacity-55" style={{ animationDelay: "3s" }} />

            <div className="relative z-[3] mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-24 text-center md:py-32 lg:py-40">
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
                <MagneticButton>
                  <Link
                    href="/catalogue"
                    className="group relative block overflow-hidden rounded-xl bg-phoebe-green px-8 py-4 font-semibold text-white shadow-lg shadow-phoebe-green/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-phoebe-green/35"
                  >
                    <span className="relative z-10">Voir le catalogue</span>
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  {user ? (
                    <Link
                      href="/profil"
                      className="block rounded-xl border border-phoebe-gold/30 px-8 py-4 font-semibold text-phoebe-gold-light transition-all hover:border-phoebe-gold/60 hover:bg-phoebe-gold/5 hover:shadow-lg hover:shadow-phoebe-gold/10"
                    >
                      Mon profil
                    </Link>
                  ) : (
                    <Link
                      href="/inscription"
                      className="block rounded-xl border border-phoebe-gold/30 px-8 py-4 font-semibold text-phoebe-gold-light transition-all hover:border-phoebe-gold/60 hover:bg-phoebe-gold/5 hover:shadow-lg hover:shadow-phoebe-gold/10"
                    >
                      Creer un compte
                    </Link>
                  )}
                </MagneticButton>
              </div>
            </div>
          </section>
        </HeroEffects>

        {/* Stats — animated counters */}
        <section className="relative -mt-10 z-20 mx-auto max-w-5xl px-4">
          <ScrollReveal variant="scale-in">
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-phoebe-pearl bg-white p-6 shadow-xl shadow-phoebe-green/5 md:grid-cols-4 md:gap-8 md:p-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-phoebe-green md:text-3xl">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} duration={2500} />
                  </div>
                  <p className="mt-1 text-xs font-medium text-phoebe-anthracite/50 md:text-sm">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* Services — cards avec images interactives */}
        <section className="bg-white py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <ScrollReveal>
              <div className="mb-14 text-center">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-phoebe-gold">
                  Nos services
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-phoebe-anthracite md:text-4xl">
                  Une solution pour chaque besoin
                </h2>
              </div>
            </ScrollReveal>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((s, i) => (
                <ServiceCard key={s.title} index={i}>
                  <div className="group relative h-full cursor-pointer overflow-hidden rounded-2xl border border-phoebe-pearl bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-phoebe-green/8">
                    <div className="absolute inset-x-0 top-0 z-10 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-phoebe-gold-light via-phoebe-gold to-phoebe-gold-dark transition-transform duration-300 group-hover:scale-x-100" />
                    {/* Image avec zoom au hover */}
                    <div className="relative h-44 overflow-hidden">
                      <Image
                        src={s.image}
                        alt={s.title}
                        width={400}
                        height={250}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-phoebe-green shadow-sm backdrop-blur-sm">
                        {s.icon}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="mb-2 font-bold text-phoebe-anthracite">
                        {s.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-phoebe-anthracite/55">
                        {s.description}
                      </p>
                    </div>
                  </div>
                </ServiceCard>
              ))}
            </div>
          </div>
        </section>

        {/* Galerie véhicules — images interactives parallaxe */}
        <section className="bg-phoebe-pearl/30 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <ScrollReveal>
              <div className="mb-14 text-center">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-phoebe-gold">
                  Notre flotte
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-phoebe-anthracite md:text-4xl">
                  Des véhicules d&apos;exception
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Grande image principale */}
              <ScrollReveal variant="slide-left" className="lg:col-span-2 lg:row-span-2">
                <TiltCard className="h-full">
                  <div className="group relative h-full min-h-[300px] cursor-pointer overflow-hidden rounded-2xl shadow-lg md:min-h-[400px]">
                    <ParallaxImage
                      src="/images/hero-car.jpg"
                      alt="Porsche Panamera — flotte premium"
                      width={1400}
                      height={900}
                      className="h-full rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <span className="mb-2 inline-block rounded-full bg-phoebe-gold/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                        Premium
                      </span>
                      <h3 className="text-xl font-bold text-white md:text-2xl">
                        Flotte haut de gamme
                      </h3>
                      <p className="mt-1 text-sm text-white/70">
                        Des véhicules premium pour tous vos déplacements
                      </p>
                    </div>
                  </div>
                </TiltCard>
              </ScrollReveal>

              {/* Image transport */}
              <ScrollReveal variant="slide-right" delay={0.15}>
                <TiltCard>
                  <div className="group relative h-[250px] cursor-pointer overflow-hidden rounded-2xl shadow-lg">
                    <ParallaxImage
                      src="/images/transport.jpg"
                      alt="Mercedes AMG — transport premium"
                      width={800}
                      height={500}
                      className="h-full rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="font-bold text-white">Transport VIP</h3>
                      <p className="text-xs text-white/60">Avec chauffeur professionnel</p>
                    </div>
                  </div>
                </TiltCard>
              </ScrollReveal>

              {/* Image voyages */}
              <ScrollReveal variant="slide-right" delay={0.3}>
                <TiltCard>
                  <div className="group relative h-[250px] cursor-pointer overflow-hidden rounded-2xl shadow-lg">
                    <ParallaxImage
                      src="/images/voyages.jpg"
                      alt="Assistance voyages"
                      width={800}
                      height={500}
                      className="h-full rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="font-bold text-white">Assistance Voyages</h3>
                      <p className="text-xs text-white/60">Accompagnement personnalisé</p>
                    </div>
                  </div>
                </TiltCard>
              </ScrollReveal>
            </div>

            <ScrollReveal>
              <div className="mt-10 text-center">
                <MagneticButton>
                  <Link
                    href="/catalogue"
                    className="group relative inline-block overflow-hidden rounded-xl bg-gradient-to-r from-phoebe-gold to-phoebe-gold-dark px-8 py-4 font-semibold text-white shadow-lg shadow-phoebe-gold/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-phoebe-gold/30"
                  >
                    <span className="relative z-10">Découvrir tous nos véhicules</span>
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </Link>
                </MagneticButton>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* CTA */}
        {!user && (
          <ScrollReveal variant="scale-in">
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
                  <MagneticButton>
                    <Link
                      href="/inscription"
                      className="group relative inline-block overflow-hidden rounded-xl bg-phoebe-green px-10 py-4 font-semibold text-white shadow-lg shadow-phoebe-green/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-phoebe-green/40"
                    >
                      <span className="relative z-10">S&apos;inscrire maintenant</span>
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    </Link>
                  </MagneticButton>
                </div>
              </div>
            </section>
          </ScrollReveal>
        )}
      </main>

      <footer className="border-t border-phoebe-pearl bg-white py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Image
              src="/logo.png"
              alt="Group PHOEBE"
              width={220}
              height={88}
              className="h-[4.5rem] w-auto object-contain"
              quality={95}
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
