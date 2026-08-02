import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { AlertTriangle, ChevronRight } from "lucide-react"
import { BackLink } from "@/components/public/back-link"
import { Button } from "@/components/ui"
import { PageHero, SectionHead } from "@/components/public/section-head"
import {
  ZONES_LIVRAISON,
  MODES_LIVRAISON,
  ZONE_LABELS,
  ZONE_DESCRIPTIONS,
  MODE_LABELS,
  MODE_DESCRIPTIONS,
  poidsMax,
} from "@/lib/livraison"
import { getTarifsLivraison } from "@/lib/public-cache"

export const metadata: Metadata = {
  title: "Livraison de colis — Transport & Coursier",
  description: "Service de livraison de colis et coursier à Abidjan et partout en Côte d'Ivoire. Envois rapides, livraison porte-à-porte avec GROUP PHOEBE.",
  openGraph: {
    title: "Livraison de colis — Transport & Coursier",
    description: "Service de livraison de colis et coursier à Abidjan et partout en Côte d'Ivoire. Envois rapides, livraison porte-à-porte avec GROUP PHOEBE.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Livraison de colis — Transport & Coursier",
    description: "Service de livraison de colis et coursier à Abidjan et partout en Côte d'Ivoire.",
  },
}

const ETAPES = [
  { title: "Commandez", desc: "Choisissez votre mode et remplissez les détails de livraison en ligne." },
  { title: "Payez", desc: "Réglez en ligne par carte ou Mobile Money, en toute sécurité." },
  { title: "Nous collectons", desc: "Un coursier récupère votre colis à l'adresse de collecte." },
  { title: "Livraison", desc: "Votre colis est livré au destinataire, rapidement et en sécurité." },
]

const TYPES_COLIS = [
  { title: "Petits colis", desc: "Documents, vêtements, accessoires — jusqu'à 5 kg" },
  { title: "Colis moyens", desc: "Équipements électroniques, livres, cadeaux — jusqu'à 15 kg" },
  { title: "Gros colis", desc: "Cartons, meubles, équipements — jusqu'à 50 kg" },
  { title: "Courses & commissions", desc: "Achats en magasin, retrait de documents, courses diverses" },
]

export default async function Livraison({
  searchParams,
}: {
  searchParams: Promise<{ echec?: string }>
}) {
  const { echec } = await searchParams
  const { grille, paliers } = await getTarifsLivraison()
  const maxKg = poidsMax(paliers)

  return (
    <>
      <div className="px-6 pt-6 sm:px-10">
        <BackLink href="/" label="Retour à l'accueil" />
      </div>

      <PageHero
        eyebrow="Livraison"
        title={<>Livraison de colis &amp; Coursier</>}
        lede="Envois rapides et sécurisés à Abidjan et partout en Côte d'Ivoire, livrés porte-à-porte."
        bgImage={{ src: "/images/hero-livraison.webp", alt: "Livraison de colis" }}
        aside={
          <Image
            src="/logos/livraison.png"
            alt="Livraison"
            width={411}
            height={424}
            sizes="(min-width: 640px) 208px, 160px"
            className="h-44 w-auto rounded-2xl bg-logo-plate-fixe object-contain p-3 animate-service-logo sm:h-56"
            priority
          />
        }
        actions={
          <>
            <Link href="/livraison/commander">
              <Button variant="orange" size="lg">Commander une livraison</Button>
            </Link>
            <Link
              href="/suivi"
              className="text-sm font-semibold text-accent-orange transition-colors hover:text-accent-orange-hover"
            >
              Suivre un colis <ChevronRight className="inline size-3.5" />
            </Link>
          </>
        }
      />

      {echec && (
        <div role="alert" className="mx-6 mt-8 max-w-2xl rounded-xl border border-error/30 bg-error/5 px-5 py-3 text-sm text-error sm:mx-10">
          <AlertTriangle className="mr-2 inline size-4" />
          Le paiement a été annulé. Vous pouvez relancer votre commande à tout moment.
        </div>
      )}

      <section className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            title="Nos tarifs"
            lede="Le prix dépend de la distance entre la collecte et la livraison, du mode d'envoi et du poids du colis."
          />
          <div className="mt-8 overflow-x-auto rounded-xl border border-public-border bg-public-bg-card">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-public-border">
                  <th scope="col" className="py-4 pr-6 pl-4 text-xs font-medium uppercase tracking-[0.15em] text-public-text-muted">
                    Zone
                  </th>
                  {MODES_LIVRAISON.map((mode) => (
                    <th key={mode} scope="col" className="py-4 pr-6 text-sm font-semibold text-public-text">
                      {MODE_LABELS[mode]}
                      <span className="mt-1 block text-xs font-normal text-public-text-faint">
                        {MODE_DESCRIPTIONS[mode]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ZONES_LIVRAISON.map((zone) => (
                  <tr key={zone} className="border-b border-public-border transition-colors hover:bg-public-bg-elevated/40">
                    <th scope="row" className="py-5 pr-6 pl-4 align-top">
                      <span className="block text-sm font-semibold text-public-text">{ZONE_LABELS[zone]}</span>
                      <span className="mt-1 block max-w-[14rem] text-xs font-normal text-public-text-muted">
                        {ZONE_DESCRIPTIONS[zone]}
                      </span>
                    </th>
                    {MODES_LIVRAISON.map((mode) => (
                      <td key={mode} className="py-5 pr-6 align-top">
                        <span className="font-display text-xl font-medium text-accent-orange">
                          {grille[zone][mode].toLocaleString("fr-FR")}
                        </span>
                        <span className="ml-1 text-xs text-public-text-muted">FCFA</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 rounded-xl border border-public-border bg-public-bg-card p-5">
            <p className="text-sm font-semibold text-public-text">Poids du colis</p>
            <p className="mt-1 text-xs text-public-text-muted">
              Les tarifs ci-dessus valent pour le premier palier. Au-delà, un coefficient s&apos;applique :
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {paliers.map((p) => (
                <li key={p.label} className="text-sm text-public-text-muted">
                  {p.label}
                  <span className="ml-1.5 font-semibold text-accent-orange">
                    {p.multiplicateur === 1 ? "tarif de base" : `×${p.multiplicateur}`}
                  </span>
                </li>
              ))}
              <li className="text-sm text-public-text-muted">
                Au-delà de {maxKg} kg
                <span className="ml-1.5 font-semibold text-accent-orange">sur devis</span>
              </li>
            </ul>
          </div>
          <p className="mt-4 text-xs text-public-text-faint">
            La zone est déterminée automatiquement à partir des adresses de collecte et de livraison.
          </p>
        </div>
      </section>

      <section className="border-t border-public-border bg-public-bg-card px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHead title="Comment ça marche" className="border-b-0 pb-0" />
          <div className="mt-12 grid gap-y-10 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:gap-x-8">
            {ETAPES.map((s, i) => (
              <div key={s.title}>
                <span className="font-display block text-5xl font-medium leading-none text-accent-orange/25">
                  0{i + 1}
                </span>
                <div className="mt-4 border-t border-public-border pt-4">
                  <h3 className="text-base font-semibold text-public-text">{s.title}</h3>
                  <p className="mt-2 text-sm text-public-text-muted">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHead
              title="Ce que nous transportons"
              lede="Du pli administratif au gros colis, avec la même attention."
              className="border-b-0 pb-0"
            />
          </div>
          <div className="flex flex-col">
            {TYPES_COLIS.map((c) => (
              <div key={c.title} className="flex items-baseline justify-between gap-6 border-t border-public-border py-6 first:border-t-0 first:pt-0">
                <h3 className="text-lg font-semibold text-public-text">{c.title}</h3>
                <p className="max-w-sm text-right text-sm text-public-text-muted">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-public-border bg-public-bg-card px-6 py-24 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="font-display max-w-2xl text-3xl font-medium leading-[1.15] tracking-tight text-public-text sm:text-4xl">
            Un colis à envoyer <em className="italic text-accent-orange">aujourd&apos;hui</em> ?
          </h2>
          <div className="flex flex-wrap gap-4 lg:shrink-0">
            <Link href="/livraison/commander">
              <Button variant="orange" size="lg">Commander une livraison</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
