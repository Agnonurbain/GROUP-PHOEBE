import type { Metadata } from "next"
import { getT } from "@/lib/i18n/server"
import { remplir } from "@/lib/i18n/format"
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
  chargeMaxFlotte,
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


export default async function Livraison({
  searchParams,
}: {
  searchParams: Promise<{ echec?: string }>
}) {
  const t = await getT()

  // Construits dans le composant : un tableau de constantes au niveau du
  // module est figé au chargement du fichier, donc dans une seule langue.
  const ETAPES = [
    { title: t.livraison.etapeCommandez, desc: t.livraison.etapeChoisissezDesc },
    { title: t.livraison.etapePayezTitre, desc: t.livraison.etapePayezDesc },
    { title: t.livraison.etapeCollecte, desc: t.livraison.etapeCollecteDesc },
    { title: t.livraison.etapeLivraison, desc: t.livraison.etapeLivraisonDesc },
  ]

  const TYPES_COLIS = [
    { title: t.livraison.petitsColis, desc: t.livraison.categorieDocuments },
    { title: t.livraison.colisMoyens, desc: t.livraison.categorieElectronique },
    { title: t.livraison.grosColis, desc: t.livraison.categorieVolumineux },
    { title: t.livraison.coursesCommissions, desc: t.livraison.categorieCourses },
  ]
  const { echec } = await searchParams
  const { moyens, grilleMoyens, coefficientsMode } = await getTarifsLivraison()
  const maxKg = chargeMaxFlotte(moyens)

  return (
    <>
      <div className="px-6 pt-6 sm:px-10">
        <BackLink href="/" label={t.commun.retourAccueil} />
      </div>

      <PageHero
        eyebrow={t.nav.livraison}
        title={t.livraison.heroTitre}
        lede={t.livraison.heroLede}
        bgImage={{ src: "/images/hero-livraison.webp", alt: t.livraison.heroAlt }}
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
              <Button variant="orange" size="lg">{t.livraison.commander}</Button>
            </Link>
            <Link
              href="/suivi"
              className="text-sm font-semibold text-accent-orange transition-colors hover:text-accent-orange-hover"
            >
              {t.livraison.suivreColis} <ChevronRight className="inline size-3.5" />
            </Link>
          </>
        }
      />

      {echec && (
        <div role="alert" className="mx-6 mt-8 max-w-2xl rounded-xl border border-error/30 bg-error/5 px-5 py-3 text-sm text-error sm:mx-10">
          <AlertTriangle className="mr-2 inline size-4" />
          {t.livraison.paiementAnnule}
        </div>
      )}

      <section className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            title={t.livraison.nosTarifs}
            lede={t.livraison.tarifsLede}
          />
          {/* La grille est désormais zone × MOYEN : le véhicule a remplacé le
              poids dans le prix (00084). Le délai s'y applique en coefficient,
              annoncé sous le tableau plutôt qu'en quatrième dimension. */}
          <div className="mt-8 overflow-x-auto rounded-xl border border-public-border bg-public-bg-card">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-public-border">
                  <th scope="col" className="py-4 pr-6 pl-4 text-xs font-medium uppercase tracking-[0.15em] text-public-text-muted">
                    Zone
                  </th>
                  {moyens.map((m) => (
                    <th key={m.cle} scope="col" className="py-4 pr-6 text-sm font-semibold text-public-text">
                      {m.label}
                      <span className="mt-1 block text-xs font-normal text-public-text-faint">
                        {remplir(t.livraison.jusquA, { n: m.chargeMaxKg })}
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
                    {moyens.map((m) => (
                      <td key={m.cle} className="py-5 pr-6 align-top">
                        <span className="font-display text-xl font-medium text-accent-orange">
                          {(grilleMoyens[zone]?.[m.cle] ?? 0).toLocaleString("fr-FR")}
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
            <p className="text-sm font-semibold text-public-text">{t.livraison.delaiSouhaite}</p>
            <p className="mt-1 text-xs text-public-text-muted">
              {t.livraison.delaiStandardCoefficient}
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {MODES_LIVRAISON.map((mode) => (
                <li key={mode} className="text-sm text-public-text-muted">
                  {MODE_LABELS[mode]}
                  <span className="ml-1.5 font-semibold text-accent-orange">
                    {(coefficientsMode[mode] ?? 1) === 1
                      ? "tarif de base"
                      : `×${coefficientsMode[mode]}`}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-public-text-faint">
              {remplir(t.livraison.poidsNeFaitPasLePrix, { max: maxKg })}
            </p>
          </div>
          <p className="mt-4 text-xs text-public-text-faint">
            {t.livraison.zoneAutomatique}
          </p>
        </div>
      </section>

      <section className="border-t border-public-border bg-public-bg-card px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHead title={t.livraison.commentCaMarche} className="border-b-0 pb-0" />
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
              title={t.livraison.ceQueNousTransportons}
              lede={t.livraison.transportonsLede}
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
            {t.livraison.colisAujourdhui} <em className="italic text-accent-orange">{t.livraison.aujourdhui}</em>&nbsp;?
          </h2>
          <div className="flex flex-wrap gap-4 lg:shrink-0">
            <Link href="/livraison/commander">
              <Button variant="orange" size="lg">{t.livraison.commander}</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
