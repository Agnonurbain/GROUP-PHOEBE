"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Badge, Button, Card } from "@/components/ui"
import { AssistanceIcon } from "@/components/icons"

const destinations = [
  { name: "Chine", type: "Études", price: "150 000 FCFA", slug: "chine", flag: "🇨🇳" },
  { name: "Italie", type: "Études", price: "175 000 FCFA", slug: "italie", flag: "🇮🇹" },
  { name: "Grèce", type: "Tourisme", price: "85 000 FCFA", slug: "grece", flag: "🇬🇷" },
  { name: "Pologne", type: "Tourisme", price: "75 000 FCFA", slug: "pologne", flag: "🇵🇱" },
  { name: "Portugal", type: "Tourisme", price: "95 000 FCFA", slug: "portugal", flag: "🇵🇹" },
  { name: "Schengen", type: "Tourisme", price: "120 000 FCFA", slug: "schengen", flag: "🇪🇺" },
]

const etudesCountries = destinations.filter((d) => d.type === "Études")
const tourismeCountries = destinations.filter((d) => d.type === "Tourisme")

function InteractiveCard({
  title,
  desc,
  countries,
  color,
}: {
  title: string
  desc: string
  countries: typeof destinations
  color: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <Card
      className="relative transition-all duration-300 hover:border-accent-blue/30"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`transition-opacity duration-300 ${hovered ? "opacity-0" : "opacity-100"}`}>
        <h3 className="text-lg font-semibold text-public-text">{title}</h3>
        <p className="mt-2 text-sm text-public-text-muted">{desc}</p>
        <span className="mt-3 inline-block text-sm font-medium text-accent-blue">
          {countries.map((c) => c.name).join(" · ")}
        </span>
      </div>
      <div
        className={`absolute inset-0 flex flex-col justify-center gap-3 rounded-2xl p-6 transition-all duration-300 ${
          hovered ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{ backgroundColor: `${color}12`, border: `1px solid ${color}30` }}
      >
        <p className="text-sm font-semibold text-public-text">{title}</p>
        <div className="flex flex-wrap gap-2">
          {countries.map((c) => (
            <Link
              key={c.slug}
              href={`/assistance/pays/${c.slug}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-3 py-2 text-sm font-medium text-accent-blue transition-all hover:bg-accent-blue/20"
            >
              <span className="text-lg">{c.flag}</span>
              <span>{c.name}</span>
              <span className="ml-1 text-xs opacity-70">{c.price}</span>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default function Assistance() {
  return (
    <>
      <section className="flex flex-col items-center gap-6 px-6 py-16 text-center">
        <Image
          src="/logos/logo-assi-etud.png"
          alt="Assistance Voyages & Études"
          width={220}
          height={66}
          className="h-14 w-auto animate-glow-pulse"
          priority
        />
        <h1 className="text-4xl font-bold text-public-text md:text-5xl">Votre visa, notre expertise</h1>
        <p className="text-base text-public-text-muted md:text-lg">Chine, Italie, Europe — nous ouvrons les portes du monde</p>
      </section>

      <div className="grid gap-6 px-6 pb-16 md:grid-cols-2">
        <InteractiveCard
          title="Je veux étudier à l'étranger"
          desc="Nos programmes étudiants vous ouvrent les portes des meilleures universités."
          countries={etudesCountries}
          color="#2563EB"
        />
        <InteractiveCard
          title="Je veux voyager en Europe"
          desc="Explorez l'Europe avec nos forfaits touristiques sur mesure."
          countries={tourismeCountries}
          color="#2563EB"
        />
      </div>

      <section className="px-6 pb-20">
        <h2 className="text-3xl font-semibold text-public-text">Destinations phares</h2>
        <p className="mt-1 text-sm text-public-text-muted">Les pays qui vous attendent</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <Link key={d.name} href={`/assistance/pays/${d.slug}`} className="block group">
              <Card className="transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-accent-blue/30 hover:bg-public-bg-elevated hover:shadow-xl hover:shadow-black/20">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{d.flag}</span>
                  <Badge variant="blue">{d.type}</Badge>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-public-text">{d.name}</h3>
                <p className="mt-1 text-3xl font-bold text-accent-blue">À partir de {d.price}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent-blue transition-all group-hover:gap-2">Voir l&apos;offre →</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
