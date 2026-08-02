"use client"

import Link from "next/link"
import Image from "next/image"
import { ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui"
import { BackLink } from "@/components/public/back-link"
import { PageHero, SectionHead } from "@/components/public/section-head"
import { BilletForm } from "@/components/public/billet-form"
import type { ParametresBillet } from "@/lib/billets"
import {
  PAYS_LIST,
  appliquerTarifsListe,
  prixApartir,
  type Pays,
  type TarifsAssistance,
} from "@/lib/assistance"

const categorieLabel = (c: Pays["categorie"]) => (c === "etudes" ? "Études" : "Voyage")

function ChoixBloc({
  titre,
  desc,
  countries,
}: {
  titre: string
  desc: string
  countries: Pays[]
}) {
  return (
    <div className="flex flex-col border-t border-public-border pt-8">
      <h3 className="font-display text-2xl font-medium text-public-text">{titre}</h3>
      <p className="mt-2 max-w-sm text-sm text-public-text-muted">{desc}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {countries.map((c) => (
          <Link
            key={c.slug}
            href={`/assistance/pays/${c.slug}`}
            className="inline-flex items-center gap-2 rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-3 py-2 text-sm font-medium text-accent-blue-on-dark transition-all hover:bg-accent-blue/20"
          >
            <span className="text-lg">{c.flag}</span>
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function Assistance({
  tarifs,
  isLoggedIn,
  userId,
  paramsBillet,
}: {
  tarifs: TarifsAssistance
  isLoggedIn: boolean
  userId: string
  paramsBillet: ParametresBillet
}) {
  const pays = appliquerTarifsListe(PAYS_LIST, tarifs)
  const etudesCountries = pays.filter((d) => d.categorie === "etudes")
  const voyageCountries = pays.filter((d) => d.categorie === "voyage")

  return (
    <>
      <div className="px-6 pt-6 sm:px-10">
        <BackLink href="/" label="Retour à l'accueil" />
      </div>

      <PageHero
        eyebrow="Assistance Voyages & Études"
        title="Votre visa, notre expertise"
        lede="Études en Chine, voyages en Europe — nous montons et suivons votre dossier de bout en bout."
        bgImage={{ src: "/images/hero-voyages.webp", alt: "Voyages et études" }}
        aside={
          <Image
            src="/logos/assistance.png"
            alt="Assistance Voyages & Études"
            width={423}
            height={429}
            sizes="(min-width: 640px) 208px, 160px"
            className="h-44 w-auto rounded-2xl bg-logo-plate-fixe object-contain p-3 animate-service-logo sm:h-56"
            priority
          />
        }
      />

      <section className="px-6 py-20 sm:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:gap-16">
          <ChoixBloc
            titre="Je veux étudier à l'étranger"
            desc="Bourses et admissions en Chine : nous négocions et montons votre dossier de A à Z."
            countries={etudesCountries}
          />
          <ChoixBloc
            titre="Je veux voyager en Europe"
            desc="Visa Schengen pour la Norvège, la France, l'Italie, le Portugal et la Grèce."
            countries={voyageCountries}
          />
        </div>
      </section>

      <section id="billet" className="border-t border-public-border px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            title="Billets d'avion"
            lede="Dites-nous où et quand vous voulez partir : nous cherchons le vol et vous envoyons un devis."
            className="border-b-0 pb-0"
          />
          <div className="mt-10">
            <BilletForm isLoggedIn={isLoggedIn} userId={userId} params={paramsBillet} />
          </div>
        </div>
      </section>

      <section className="border-t border-public-border bg-public-bg-card px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            title="Destinations"
            lede="Les pays que nous couvrons, avec le tarif de départ de notre accompagnement."
            className="border-b-0 pb-0"
          />
          <div className="mt-10">
            {PAYS_LIST.map((d, i) => (
              <Link
                key={d.slug}
                href={`/assistance/pays/${d.slug}`}
                className="group grid grid-cols-[2.5rem_1fr] items-center gap-5 border-b border-public-border py-6 transition-colors hover:bg-public-bg/60 first:border-t sm:grid-cols-[4rem_1fr_auto] sm:gap-10 sm:px-3"
              >
                <span className="font-display text-2xl font-medium leading-none text-public-text-faint transition-colors group-hover:text-accent-blue-on-dark">
                  0{i + 1}
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">{d.flag}</span>
                  <h3 className="font-display text-xl font-medium text-public-text sm:text-2xl">{d.name}</h3>
                  <Badge variant="blue">{categorieLabel(d.categorie)}</Badge>
                </div>
                <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:justify-end">
                  <span className="text-sm font-semibold text-accent-blue-on-dark">{prixApartir(d)}</span>
                  <ChevronRight size={16} className="text-public-text-faint transition-all group-hover:text-accent-blue-on-dark" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
