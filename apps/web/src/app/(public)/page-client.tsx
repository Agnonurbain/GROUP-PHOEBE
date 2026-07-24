'use client'

import Link from "next/link"
import Image from "next/image"
import {
  ScrollReveal,
  StaggerContainer,
  ServiceCard,
  AnimatedCounter,
  GoldTrail,
  MagneticButton,
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

export default function HomePage() {
  return (
    <GoldTrail>
      {/* Hero */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center gap-6 overflow-hidden px-6 py-32 text-center md:py-40">
        <HeroSlideshow />

        {/* Panneau verre fumé : garantit la lisibilité quelle que soit l'image derrière */}
        <div className="relative z-10 flex flex-col items-center gap-6 rounded-3xl bg-black/55 px-8 py-10 ring-1 ring-white/10 backdrop-blur-md sm:px-14">
          <ScrollReveal variant="fade-up">
            <Image
              src="/logos/logo_g-phoebe.png"
              alt="GROUP PHOEBE"
              width={334}
              height={303}
              priority
              className="h-auto w-[240px] md:w-[300px] animate-glow-pulse"
            />
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={0.2}>
            <p className="text-lg font-medium text-white md:text-xl [text-shadow:0_2px_12px_rgba(0,0,0,0.9)]">
              L&apos;excellence à chaque étape de votre vie
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={0.35}>
            <div className="flex flex-col gap-4 sm:flex-row">
              <MagneticButton>
                <Link
                  href="#services"
                  className="block rounded-lg bg-accent-gold px-6 py-3 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-accent-gold-hover"
                >
                  Découvrir nos services
                </Link>
              </MagneticButton>
              <Link
                href="/contact"
                className="block rounded-lg border border-white/40 bg-black/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/60"
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
              <Link href={s.href} className="group flex h-full flex-col justify-between rounded-2xl border border-public-border bg-public-bg-card p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/20 hover:border-accent-gold/30 hover:bg-public-bg-elevated">
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

      {/* CTA */}
      <ScrollReveal variant="scale-in">
        <section className="flex flex-col items-center gap-6 border-t border-public-border bg-public-bg-card px-6 py-28 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-public-text md:text-4xl">Prêt à commencer ?</h2>
          <p className="text-base text-public-text-muted md:text-lg">Rejoignez GROUP PHOEBE et bénéficiez de services d&apos;exception.</p>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
            <MagneticButton>
              <Link
                href="/inscription"
                className="block rounded-lg bg-accent-gold px-8 py-3.5 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-accent-gold-hover"
              >
                S&apos;inscrire
              </Link>
            </MagneticButton>
            <MagneticButton>
              <Link
                href="/contact"
                className="block rounded-lg border border-public-border px-8 py-3.5 text-sm font-semibold text-public-text transition-colors hover:bg-public-bg-elevated"
              >
                Nous contacter
              </Link>
            </MagneticButton>
          </div>
        </section>
      </ScrollReveal>
    </GoldTrail>
  )
}