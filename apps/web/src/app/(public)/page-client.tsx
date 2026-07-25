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

export default function HomePage({ role = null }: { role?: string | null }) {
  const isGuest = role === null
  const isStaff = role === "operateur" || role === "proprietaire"
  return (
    <GoldTrail>
      {/* Hero */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center gap-6 overflow-hidden px-6 py-32 text-center md:py-40">
        <HeroSlideshow />

        {/* Panneau verre fumé : garantit la lisibilité quelle que soit l'image derrière */}
        <div className="relative z-10 flex max-w-3xl flex-col items-center gap-8 rounded-3xl bg-black/55 px-8 py-12 ring-1 ring-white/10 backdrop-blur-md sm:px-14">
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

      {/* Stats */}
      <section className="border-y border-public-border bg-public-bg-card px-6 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 text-center md:grid-cols-4">
          {[
            { target: 150, suffix: "+", label: "Véhicules" },
            { target: 500, suffix: "+", label: "Clients servis" },
            { target: 8, suffix: " ans", label: "D'expérience" },
            { target: 4, suffix: "", label: "Services" },
          ].map((stat, i) => (
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