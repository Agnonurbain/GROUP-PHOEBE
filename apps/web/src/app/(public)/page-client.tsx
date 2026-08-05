'use client'

import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui"
import {
  ScrollReveal,
  StaggerContainer,
  ServiceCard,
  AnimatedCounter,
  GoldTrail,
  HeroSlideshow,
} from "@/components/effects"
import { useT } from "@/lib/langue-context"

const services = [
  {
    cle: "transport" as const,
    color: "#F97316",
    href: "/transport/catalogue",
    logo: "/logos/transport.png",
    logoAlt: "Transport",
    logoW: 374,
    logoH: 395,
  },
  {
    cle: "immobilier" as const,
    color: "#059669",
    href: "/immobilier",
    logo: "/logos/immobilier.png",
    logoAlt: "Immobilier",
    logoW: 407,
    logoH: 424,
  },
  {
    cle: "assistance" as const,
    color: "#2563EB",
    href: "/assistance",
    logo: "/logos/assistance.png",
    logoAlt: "Assistance Voyages & Études",
    logoW: 423,
    logoH: 429,
  },
  {
    cle: "livraison" as const,
    color: "#C9A84C",
    href: "/livraison",
    logo: "/logos/livraison.png",
    logoAlt: "Livraison",
    logoW: 411,
    logoH: 424,
  },
  {
    cle: "textile" as const,
    // Bordeaux : les quatre autres tiennent l'orange, le vert, le bleu et l'or.
    color: "#9F1239",
    href: "/textile",
    logo: "/logos/textile.png",
    logoAlt: "Textile",
    logoW: 478,
    logoH: 473,
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
  const t = useT()

  // Construits ici et non au niveau du module : un tableau de constantes est
  // figé au chargement du fichier, donc dans une seule langue.
  const engagements = [
    {
      title: t.divers.paiementSecuriseTitre,
      desc: t.divers.paiementSecuriseDesc,
      icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    },
    {
      title: t.divers.couvertureNationale,
      desc: t.divers.couvertureNationaleDesc,
      icon: <><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" /><circle cx="12" cy="10" r="3" /></>,
    },
    {
      title: t.divers.chauffeursPro,
      desc: t.divers.chauffeursProDesc,
      icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></>,
    },
    {
      title: t.divers.assistanceDediee,
      desc: t.divers.assistanceDedieeDesc,
      icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    },
  ]

  const etapes = [
    { title: t.divers.etapeChoisissez, desc: t.divers.etapeChoisissezDesc },
    { title: t.divers.etapeReservez, desc: t.divers.etapeReservezDesc },
    { title: t.divers.etapePayez, desc: t.divers.etapePayezDesc },
    { title: t.divers.etapeProfitez, desc: t.divers.etapeProfitezDesc },
  ]

  const isGuest = role === null
  const isStaff = role === "operateur" || role === "proprietaire"

  const stats = [
    { target: vehiculeCount, suffix: "", label: t.espaceClient.vehicules },
    { target: modeleCount, suffix: "", label: t.divers.modeles },
    { target: 5, suffix: "", label: t.divers.metiers },
  ]

  return (
    <GoldTrail>
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-6 py-28 sm:px-10">
        <HeroSlideshow />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <ScrollReveal variant="fade-up">
              <p className="flex items-center justify-center gap-3 text-xs font-medium uppercase tracking-[0.25em] text-accent-gold">
                <span aria-hidden="true" className="h-px w-8 bg-accent-gold" />
                {t.divers.groupPhoebeCoteIvoire}
                <span aria-hidden="true" className="h-px w-8 bg-accent-gold" />
              </p>
            </ScrollReveal>
            <ScrollReveal variant="fade-up" delay={0.1}>
              <h1 className="font-display mt-6 text-balance text-5xl font-medium leading-[1.03] tracking-tight text-white sm:text-6xl md:text-7xl [text-shadow:0_2px_24px_rgba(0,0,0,0.85)]">
                {t.divers.excellenceChaqueEtape}
              </h1>
            </ScrollReveal>
            <ScrollReveal variant="fade-up" delay={0.2}>
              <p className="mx-auto mt-6 max-w-xl text-lg text-white/85 [text-shadow:0_1px_12px_rgba(0,0,0,0.85)]">
                {t.divers.cinqMetiersExigence}
              </p>
            </ScrollReveal>
            <ScrollReveal variant="fade-up" delay={0.3}>
              <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="#services">
                  <Button size="lg" className="px-8 py-4 text-base">
                    {t.accueil.decouvrir}
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline-white" size="lg" className="px-8 py-4 text-base">
                    {t.divers.contactezNous}
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="border-y border-public-border bg-public-bg-card">
        <div className="mx-auto flex max-w-6xl flex-col divide-y divide-public-border px-6 sm:flex-row sm:divide-x sm:divide-y-0 sm:px-10">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} variant="fade-up" delay={i * 0.1} className="flex-1 sm:px-10 sm:first:pl-0">
              <div className="flex items-baseline gap-4 py-6 sm:flex-col sm:items-start sm:gap-2 sm:py-9">
                <p className="font-display text-4xl font-medium leading-none text-accent-gold md:text-5xl">
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-public-text-muted">{stat.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section id="services" className="scroll-mt-24 px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal variant="fade-up">
            <div className="flex flex-col gap-4 border-b border-public-border pb-8 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-display text-4xl font-medium tracking-tight text-public-text md:text-5xl">{t.verticales.nosServices}</h2>
              <p className="max-w-xs text-sm text-public-text-muted sm:text-right">
                {t.divers.cinqMetiers}
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer>
            {services.map((s, i) => (
              <ServiceCard key={s.cle} index={i} tilt={false}>
                <Link
                  href={s.href}
                  className="group relative grid grid-cols-[3rem_1fr] items-center gap-5 overflow-hidden border-b border-public-border py-8 transition-colors duration-300 hover:bg-public-bg-card/60 sm:grid-cols-[6rem_1fr_auto] sm:gap-10 sm:px-4"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-px origin-top scale-y-0 transition-transform duration-500 ease-out group-hover:scale-y-100"
                    style={{ background: s.color }}
                  />
                  <span className="font-display text-3xl font-medium leading-none text-public-text-faint transition-colors duration-300 group-hover:text-accent-gold sm:text-4xl">
                    0{i + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-3">
                      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
                      <h3 className="font-display text-2xl font-medium text-public-text sm:text-3xl">{t.verticales[`${s.cle}Titre`]}</h3>
                    </div>
                    <p className="mt-2 max-w-md text-sm text-public-text-muted sm:text-base">{t.verticales[`${s.cle}Desc`]}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-gold transition-all group-hover:gap-3">
                      {t.verticales.explorer} <ArrowRight className="size-4" />
                    </span>
                  </div>
                  {/* Hauteur laissée libre : à cette taille le logo dépasse le
                      bloc de texte, c'est donc lui qui porte la hauteur de la
                      ligne — 257 px au lieu des 193 px dictés par le texte.
                      Le choix est assumé : réduire pour tenir dans 193 px
                      ramènerait le sigle sous sa taille précédente une fois le
                      rembourrage de la plaque déduit. */}
                  <div className="hidden w-52 shrink-0 items-center justify-end sm:flex lg:w-60">
                    <Image
                      src={s.logo}
                      alt={s.logoAlt}
                      width={s.logoW}
                      height={s.logoH}
                      sizes="(min-width: 1024px) 192px, 176px"
                      /* `h-*` couvre le rembourrage : à p-3, le sigle visible
                         mesure 24 px de moins que la valeur affichée ici.
                         La plaque n'existe qu'en sombre — en clair le jeton
                         vaut `transparent` et l'image reste posée sur le fond. */
                      className="h-44 w-auto rounded-2xl bg-logo-plate object-contain p-3 opacity-90 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100 lg:h-48"
                    />
                  </div>
                </Link>
              </ServiceCard>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section className="border-t border-public-border bg-public-bg-card px-6 py-24 sm:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <ScrollReveal variant="slide-right">
            <div className="lg:sticky lg:top-28">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent-gold">{t.verticales.notreEngagement}</p>
              <h2 className="font-display mt-4 text-4xl font-medium tracking-tight text-public-text md:text-5xl">
                {t.divers.pourquoiNous}
              </h2>
              <p className="mt-5 max-w-sm text-base text-public-text-muted">
                {t.divers.pourquoiNousLede}
              </p>
            </div>
          </ScrollReveal>

          <div className="flex flex-col">
            {engagements.map((f, i) => (
              <ScrollReveal key={f.title} variant="fade-up" delay={i * 0.08} className="border-t border-public-border first:border-t-0">
                <div className="flex gap-5 py-7">
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

      <section className="px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal variant="fade-up">
            <h2 className="font-display text-4xl font-medium tracking-tight text-public-text md:text-5xl">{t.verticales.commentCaMarche}</h2>
            <p className="mt-4 max-w-xl text-base text-public-text-muted">
              {t.divers.reserverSimple}
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

      {!isStaff && (
        <ScrollReveal variant="fade-up">
          <section className="border-t border-public-border bg-public-bg-card px-6 py-28 sm:px-10">
            <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="font-display max-w-2xl text-3xl font-medium leading-[1.15] tracking-tight text-public-text sm:text-4xl md:text-5xl">
                {isGuest ? (
                  <>{t.verticales.commencezPar}<em className="italic text-accent-gold">{t.verticales.quiVousRessemble}</em></>
                ) : (
                  <>{t.verticales.uneQuestion}<em className="italic text-accent-gold">{t.verticales.aVotreEcoute}</em></>
                )}
              </h2>
              <div className="flex flex-col gap-4 sm:flex-row lg:shrink-0">
                <Link href="#services">
                  <Button size="lg" className="px-8 py-4 text-base">
                    {t.accueil.decouvrir}
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href={isGuest ? "/inscription" : "/contact"}>
                  <Button variant="outline" size="lg" className="px-8 py-4 text-base">
                    {isGuest ? "S'inscrire" : "Nous contacter"}
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}
    </GoldTrail>
  )
}
