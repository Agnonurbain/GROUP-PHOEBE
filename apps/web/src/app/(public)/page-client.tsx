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

/* Hallmark · Editorial index — hero biaisé bas-gauche, liste de services comme
   colonne vertébrale, preuve en bande fine, engagement asymétrique, process en
   ligne, close « statement ». Display serif (Fraunces) sur les titres, Inter au
   corps. Aucune grille de cartes identiques répétée. */

const services = [
  {
    title: "Transport",
    desc: "Vente et location de véhicules, avec ou sans chauffeur.",
    color: "#F97316",
    href: "/transport/catalogue",
    logo: "/logos/logo-trans-livr.png",
    logoAlt: "Transport",
  },
  {
    title: "Immobilier",
    desc: "Achat, vente et location de biens à Abidjan et au-delà.",
    color: "#059669",
    href: "/immobilier",
    logo: "/logos/logo-imm.png",
    logoAlt: "Immobilier",
  },
  {
    title: "Assistance Voyages",
    desc: "Visas, études et voyages internationaux, accompagnés de bout en bout.",
    color: "#2563EB",
    href: "/assistance",
    logo: "/logos/logo-assi-etud.png",
    logoAlt: "Assistance Voyages & Études",
  },
  {
    title: "Livraison",
    desc: "Colis pris en charge, suivis et livrés partout dans le pays.",
    color: "#C9A84C",
    href: "/livraison",
    logo: "/logos/logo_g-phoebe.png",
    logoAlt: "Livraison",
  },
]

const engagements = [
  {
    title: "Paiement sécurisé",
    desc: "Carte bancaire et Mobile Money (Orange, MTN, Wave) — transactions chiffrées.",
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
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
]

const etapes = [
  { title: "Choisissez", desc: "Parcourez nos services et trouvez ce qu'il vous faut." },
  { title: "Réservez", desc: "Indiquez vos dates, votre destination et vos préférences." },
  { title: "Payez en sécurité", desc: "Réglez par carte ou Mobile Money en toute confiance." },
  { title: "Profitez", desc: "Nous nous occupons du reste. Bonne route !" },
]

function ArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

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
    { target: 4, suffix: "", label: "Métiers" },
  ]

  return (
    <GoldTrail>
      {/* Hero — contenu ancré en bas à gauche (pas de bloc centré plein écran) */}
      <section className="relative flex min-h-[85vh] items-end overflow-hidden px-6 pb-24 pt-32 sm:px-10">
        <HeroSlideshow />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <ScrollReveal variant="fade-up">
              <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.25em] text-accent-gold">
                <span aria-hidden="true" className="h-px w-8 bg-accent-gold" />
                GROUP PHOEBE — Côte d&apos;Ivoire
              </p>
            </ScrollReveal>
            <ScrollReveal variant="fade-up" delay={0.1}>
              <h1 className="font-display mt-6 text-balance text-5xl font-medium leading-[1.03] tracking-tight text-white sm:text-6xl md:text-7xl [text-shadow:0_2px_24px_rgba(0,0,0,0.85)]">
                L&apos;excellence à chaque étape de votre vie
              </h1>
            </ScrollReveal>
            <ScrollReveal variant="fade-up" delay={0.2}>
              <p className="mt-6 max-w-xl text-lg text-white/85 [text-shadow:0_1px_12px_rgba(0,0,0,0.85)]">
                Transport, immobilier, assistance voyages et livraison — quatre métiers, une même exigence, partout en Côte d&apos;Ivoire.
              </p>
            </ScrollReveal>
            <ScrollReveal variant="fade-up" delay={0.3}>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="#services"
                  className="btn-premium [--btn-glow:rgba(201,168,76,0.45)] inline-flex items-center justify-center gap-2 rounded-lg bg-accent-gold px-7 py-3.5 text-sm font-semibold text-[#0A0A0A] hover:bg-accent-gold-hover"
                >
                  Découvrir nos services
                  <ArrowRight />
                </Link>
                <Link
                  href="/contact"
                  className="btn-premium [--btn-glow:rgba(255,255,255,0.15)] inline-flex items-center justify-center rounded-lg border border-white/40 bg-black/40 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-black/60"
                >
                  Contactez-nous
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Preuve — bande fine, chiffres réels, alignés à gauche (pas de compteurs centrés) */}
      <section className="border-y border-public-border bg-public-bg-card">
        <div className="mx-auto flex max-w-6xl flex-col divide-y divide-public-border px-6 sm:flex-row sm:divide-x sm:divide-y-0 sm:px-10">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} variant="fade-up" delay={i * 0.1} className="flex-1">
              <div className="flex items-baseline gap-4 py-6 sm:flex-col sm:items-start sm:gap-2 sm:px-10 sm:py-9 sm:first:pl-0">
                <p className="font-display text-4xl font-medium leading-none text-accent-gold md:text-5xl">
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-public-text-muted">{stat.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Services — pièce maîtresse : liste éditoriale pleine largeur */}
      <section id="services" className="scroll-mt-24 px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal variant="fade-up">
            <div className="flex flex-col gap-4 border-b border-public-border pb-8 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-display text-4xl font-medium tracking-tight text-public-text md:text-5xl">Nos services</h2>
              <p className="max-w-xs text-sm text-public-text-muted sm:text-right">
                Quatre métiers complémentaires, une même signature de qualité.
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer>
            {services.map((s, i) => (
              <ServiceCard key={s.title} index={i}>
                <Link
                  href={s.href}
                  className="group grid grid-cols-[3rem_1fr] items-center gap-5 border-b border-public-border py-8 transition-colors hover:bg-public-bg-card/60 sm:grid-cols-[6rem_1fr_auto] sm:gap-10 sm:px-4"
                >
                  <span className="font-display text-3xl font-medium leading-none text-public-text-faint transition-colors group-hover:text-accent-gold sm:text-4xl">
                    0{i + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-3">
                      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
                      <h3 className="font-display text-2xl font-medium text-public-text sm:text-3xl">{s.title}</h3>
                    </div>
                    <p className="mt-2 max-w-md text-sm text-public-text-muted sm:text-base">{s.desc}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-gold transition-all group-hover:gap-3">
                      Explorer <ArrowRight />
                    </span>
                  </div>
                  <div className="hidden h-20 w-32 shrink-0 items-center justify-end sm:flex">
                    <Image
                      src={s.logo}
                      alt={s.logoAlt}
                      width={429}
                      height={346}
                      className="h-16 w-auto object-contain opacity-80 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"
                    />
                  </div>
                </Link>
              </ServiceCard>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Engagement — layout asymétrique, icônes inline (pas de tuiles au-dessus) */}
      <section className="border-t border-public-border bg-public-bg-card px-6 py-24 sm:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <ScrollReveal variant="slide-right">
            <div className="lg:sticky lg:top-28">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent-gold">Notre engagement</p>
              <h2 className="font-display mt-4 text-4xl font-medium tracking-tight text-public-text md:text-5xl">
                Pourquoi nous choisir
              </h2>
              <p className="mt-5 max-w-sm text-base text-public-text-muted">
                Un service pensé pour votre tranquillité, du premier clic à la prestation.
              </p>
            </div>
          </ScrollReveal>

          <div className="flex flex-col">
            {engagements.map((f, i) => (
              <ScrollReveal key={f.title} variant="fade-up" delay={i * 0.08}>
                <div className="flex gap-5 border-t border-public-border py-7 first:border-t-0 first:pt-0">
                  <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent-gold/30 text-accent-gold">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      {f.icon}
                    </svg>
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-public-text">{f.title}</h3>
                    <p className="mt-1.5 text-sm text-public-text-muted">{f.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche — process en ligne (grands numéros serif, filet continu) */}
      <section className="px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal variant="fade-up">
            <h2 className="font-display text-4xl font-medium tracking-tight text-public-text md:text-5xl">Comment ça marche</h2>
            <p className="mt-4 max-w-xl text-base text-public-text-muted">
              Réserver n&apos;a jamais été aussi simple — en quatre étapes.
            </p>
          </ScrollReveal>

          <StaggerContainer className="mt-12 grid gap-y-10 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:gap-x-8">
            {etapes.map((step, i) => (
              <ServiceCard key={step.title} index={i}>
                <div>
                  <span className="font-display block text-6xl font-medium leading-none text-accent-gold/25">
                    0{i + 1}
                  </span>
                  <div className="mt-5 border-t border-public-border pt-5">
                    <h3 className="text-lg font-semibold text-public-text">{step.title}</h3>
                    <p className="mt-2 text-sm text-public-text-muted">{step.desc}</p>
                  </div>
                </div>
              </ServiceCard>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Close — statement biaisé (pas de bande CTA centrée) — masqué pour le staff */}
      {!isStaff && (
        <ScrollReveal variant="fade-up">
          <section className="border-t border-public-border bg-public-bg-card px-6 py-28 sm:px-10">
            <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="font-display max-w-2xl text-3xl font-medium leading-[1.15] tracking-tight text-public-text sm:text-4xl md:text-5xl">
                {isGuest ? (
                  <>Commencez par le service <em className="italic text-accent-gold">qui vous ressemble.</em></>
                ) : (
                  <>Une question ? Notre équipe <em className="italic text-accent-gold">est à votre écoute.</em></>
                )}
              </h2>
              <div className="flex flex-col gap-4 sm:flex-row lg:shrink-0">
                <Link
                  href="#services"
                  className="btn-premium [--btn-glow:rgba(201,168,76,0.45)] inline-flex items-center justify-center gap-2 rounded-lg bg-accent-gold px-8 py-3.5 text-sm font-semibold text-[#0A0A0A] hover:bg-accent-gold-hover"
                >
                  Découvrir nos services
                  <ArrowRight />
                </Link>
                <Link
                  href={isGuest ? "/inscription" : "/contact"}
                  className="btn-premium [--btn-glow:rgba(201,168,76,0.25)] inline-flex items-center justify-center rounded-lg border border-public-border px-8 py-3.5 text-sm font-semibold text-public-text hover:bg-public-bg-elevated"
                >
                  {isGuest ? "S'inscrire" : "Nous contacter"}
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}
    </GoldTrail>
  )
}
