'use client'

import Link from "next/link"
import Image from "next/image"
import {
  ScrollReveal,
  StaggerContainer,
  ServiceCard,
  AnimatedCounter,
  GoldTrail,
  HeroSlideshow,
} from "@/components/effects"

const services = [
  {
    title: "Transport",
    desc: "Vente et location de véhicules.",
    color: "#F97316",
    href: "/transport/catalogue",
    logo: "/logos/logo-trans-livr.png",
    logoAlt: "Transport",
  },
  {
    title: "Immobilier",
    desc: "Achat, vente et location de biens.",
    color: "#059669",
    href: "/immobilier",
    logo: "/logos/logo-imm.png",
    logoAlt: "Immobilier",
  },
  {
    title: "Assistance Voyages",
    desc: "Visas, études et voyages internationaux.",
    color: "#2563EB",
    href: "/assistance",
    logo: "/logos/logo-assi-etud.png",
    logoAlt: "Assistance Voyages & Études",
  },
  {
    title: "Livraison",
    desc: "Services de livraison rapide et fiable.",
    color: "#C9A84C",
    href: "/livraison",
    logo: "/logos/logo_g-phoebe.png",
    logoAlt: "Livraison",
  },
]

export default function HomePage({
  role = null,
  vehiculeCount = 0,
  modeleCount = 0,
}: {
  role?: string | null
  vehiculeCount?: number
  modeleCount?: number
}) {
  const isGuest = role === null
  const isStaff = role === "operateur" || role === "proprietaire"

  const stats = [
    { target: vehiculeCount, suffix: "", label: "Véhicules" },
    { target: modeleCount, suffix: "", label: "Modèles" },
    { target: 4, suffix: "", label: "Services" },
  ]
  return (
    <GoldTrail>
      {/* Hero */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center gap-6 overflow-hidden px-6 py-32 text-center md:py-40">
        <HeroSlideshow />

        {/* Panneau verre fumé : garantit la lisibilité quelle que soit l'image derrière */}
        <div className="relative z-10 flex max-w-3xl flex-col items-center gap-8 rounded-3xl bg-black/40 px-8 py-12 ring-1 ring-white/10 backdrop-blur-md sm:px-14">
          <ScrollReveal variant="fade-up">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl [text-shadow:0_2px_16px_rgba(0,0,0,0.9)]">
              L&apos;excellence à chaque étape de votre vie
            </h1>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={0.2}>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="#services"
                className="btn-premium [--btn-glow:rgba(201,168,76,0.45)] block rounded-lg bg-accent-gold px-6 py-3 text-sm font-semibold text-[#0A0A0A] hover:bg-accent-gold-hover"
              >
                Découvrir nos services
              </Link>
              <Link
                href="/contact"
                className="btn-premium [--btn-glow:rgba(255,255,255,0.15)] block rounded-lg border border-white/40 bg-black/40 px-6 py-3 text-sm font-semibold text-white hover:bg-black/60"
              >
                Contactez-nous
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* Scroll indicator */}
        <ScrollReveal variant="fade-up" delay={0.6}>
          <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </div>
        </ScrollReveal>
      </section>

      {/* Stats — chiffres réels issus de la base */}
      <section className="border-y border-public-border bg-public-bg-card px-6 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-8 text-center">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} variant="fade-up" delay={i * 0.1}>
              <div>
                <p className="text-3xl font-bold text-accent-gold md:text-4xl">
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                </p>
                <p className="mt-1 text-sm text-public-text-muted">{stat.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="flex flex-col items-center gap-12 px-6 py-28">
        <ScrollReveal variant="fade-up">
          <h2 className="text-3xl font-semibold tracking-tight text-public-text md:text-4xl">Nos 4 Services</h2>
        </ScrollReveal>
        <ScrollReveal variant="fade-up" delay={0.1}>
          <p className="text-base text-public-text-muted md:text-lg">Quatre services complémentaires sous une même signature de qualité</p>
        </ScrollReveal>
        <StaggerContainer className="mt-8 grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <ServiceCard key={s.title} index={i}>
              <Link href={s.href} className="btn-premium [--btn-glow:rgba(201,168,76,0.3)] group flex h-full flex-col justify-between rounded-2xl border border-public-border bg-public-bg-card p-8 hover:border-accent-gold/30 hover:bg-public-bg-elevated">
                <div>
                  <div className="relative mb-6 flex h-28 w-full items-center justify-center">
                    <Image
                      src={s.logo}
                      alt={s.logoAlt}
                      width={429}
                      height={346}
                      className="h-24 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-public-text">{s.title}</h3>
                  <p className="mt-2 text-sm text-public-text-muted">{s.desc}</p>
                </div>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-accent-gold transition-all duration-300 group-hover:gap-2">
                  Explorer →
                </span>
              </Link>
            </ServiceCard>
          ))}
        </StaggerContainer>
      </section>

      {/* Pourquoi nous choisir */}
      <section className="border-t border-public-border bg-public-bg-card px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal variant="fade-up">
            <h2 className="text-center text-3xl font-semibold tracking-tight text-public-text md:text-4xl">Pourquoi nous choisir</h2>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={0.1}>
            <p className="mx-auto mt-3 max-w-2xl text-center text-base text-public-text-muted md:text-lg">
              Un service pensé pour votre tranquillité, du premier clic à la prestation.
            </p>
          </ScrollReveal>
          <StaggerContainer className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Paiement sécurisé",
                desc: "Carte bancaire et Mobile Money (Orange, MTN, Wave), transactions chiffrées.",
                icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
              },
              {
                title: "Couverture nationale",
                desc: "Abidjan et tout l'intérieur de la Côte d'Ivoire.",
                icon: <><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" /><circle cx="12" cy="10" r="3" /></>,
              },
              {
                title: "Chauffeurs professionnels",
                desc: "Option chauffeur expérimenté pour des trajets sereins.",
                icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></>,
              },
              {
                title: "Assistance dédiée",
                desc: "Une équipe à votre écoute pour chaque réservation.",
                icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>,
              },
            ].map((f) => (
              <ServiceCard key={f.title} index={0}>
                <div className="flex h-full flex-col rounded-2xl border border-public-border bg-public-bg p-8">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-gold/10 text-accent-gold">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      {f.icon}
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-public-text">{f.title}</h3>
                  <p className="mt-2 text-sm text-public-text-muted">{f.desc}</p>
                </div>
              </ServiceCard>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal variant="fade-up">
            <h2 className="text-center text-3xl font-semibold tracking-tight text-public-text md:text-4xl">Comment ça marche</h2>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={0.1}>
            <p className="mx-auto mt-3 max-w-2xl text-center text-base text-public-text-muted md:text-lg">
              Réserver n&apos;a jamais été aussi simple — en quatre étapes.
            </p>
          </ScrollReveal>
          <StaggerContainer className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Choisissez", desc: "Parcourez nos services et trouvez ce qu'il vous faut." },
              { title: "Réservez", desc: "Ajoutez au panier, indiquez vos dates et votre destination." },
              { title: "Payez en sécurité", desc: "Réglez par carte ou Mobile Money en toute confiance." },
              { title: "Profitez", desc: "Nous nous occupons du reste. Bonne route !" },
            ].map((step, i) => (
              <ServiceCard key={step.title} index={i}>
                <div className="flex h-full flex-col rounded-2xl border border-public-border bg-public-bg-card p-8">
                  <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-accent-gold text-lg font-bold text-[#0A0A0A]">
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-public-text">{step.title}</h3>
                  <p className="mt-2 text-sm text-public-text-muted">{step.desc}</p>
                </div>
              </ServiceCard>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA — masque pour le staff (operateur/proprietaire) : sans objet pour eux */}
      {!isStaff && (
        <ScrollReveal variant="scale-in">
          <section className="flex flex-col items-center gap-6 border-t border-public-border bg-public-bg-card px-6 py-28 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-public-text md:text-4xl">Prêt à commencer ?</h2>
            <p className="text-base text-public-text-muted md:text-lg">
              {isGuest
                ? "Rejoignez GROUP PHOEBE et bénéficiez de services d'exception."
                : "Une question ? Notre équipe est à votre écoute."}
            </p>
            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
              {isGuest && (
                <Link
                  href="/inscription"
                  className="btn-premium [--btn-glow:rgba(201,168,76,0.45)] block rounded-lg bg-accent-gold px-8 py-3.5 text-sm font-semibold text-[#0A0A0A] hover:bg-accent-gold-hover"
                >
                  S&apos;inscrire
                </Link>
              )}
              <Link
                href="/contact"
                className="btn-premium [--btn-glow:rgba(201,168,76,0.25)] block rounded-lg border border-public-border px-8 py-3.5 text-sm font-semibold text-public-text hover:bg-public-bg-elevated"
              >
                Nous contacter
              </Link>
            </div>
          </section>
        </ScrollReveal>
      )}
    </GoldTrail>
  )
}