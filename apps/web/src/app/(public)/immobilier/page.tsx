import { getT } from "@/lib/i18n/server"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import {
  Badge, Button, Card, CardContent, CardFooter,
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from "@/components/ui"
import ImmobilierFiltres from "./immobilier-filtres"
import { BackLink } from "@/components/public/back-link"
import { PageHero, SectionHead } from "@/components/public/section-head"
import { getBiensWithPhotos } from "@/lib/public-cache"
import { serializeJsonLd } from "@/lib/json-ld"
import { statutBienLabel, statutBienBadgeVariant, typeBienLabel } from "@/lib/immobilier"
import { GarantieDocuments } from "@/components/public/garantie-documents"
import { FavoriButton } from "@/components/favori-button"
import { getFavorisBienIds } from "@/app/actions/favoris"

export const metadata: Metadata = {
  title: "Immobilier — Achat, Vente & Location",
  description: "Trouvez le bien immobilier de vos rêves en Côte d'Ivoire : appartements, villas, terrains. Vente, location et estimation gratuite avec GROUP PHOEBE.",
  openGraph: {
    title: "Immobilier — Achat, Vente & Location",
    description: "Trouvez le bien immobilier de vos rêves en Côte d'Ivoire : appartements, villas, terrains. Vente, location et estimation gratuite avec GROUP PHOEBE.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Immobilier — Achat, Vente & Location",
    description: "Trouvez le bien immobilier de vos rêves en Côte d'Ivoire : appartements, villas, terrains. Vente, location et estimation gratuite avec GROUP PHOEBE.",
  },
}

export default async function Immobilier({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const t = await getT()
  const sp = await searchParams

  const filters = {
    type: sp.type,
    prix_min: sp.prix_min,
    prix_max: sp.prix_max,
    localisation: sp.localisation,
    surface_min: sp.surface_min,
    chambres_min: sp.pieces,
    transaction: sp.transaction,
    zone_id: sp.zone,
  }

  const { biens: tousLesBiens, photoMap, offreCountMap } = await getBiensWithPhotos(filters)
  const favorisBiens = await getFavorisBienIds()

  // Découpage en pages après l'exclusion des biens dont une visite est engagée :
  // paginer en SQL donnerait des pages incomplètes, l'exclusion se faisant en
  // aval de la requête. Le catalogue est déjà chargé et mis en cache.
  const PAR_PAGE = 12
  const total = tousLesBiens?.length ?? 0
  const nbPages = Math.max(1, Math.ceil(total / PAR_PAGE))
  const page = Math.min(Math.max(1, Number(sp.page) || 1), nbPages)
  const biens = (tousLesBiens ?? []).slice((page - 1) * PAR_PAGE, page * PAR_PAGE)

  const lienPage = (n: number) => {
    const params = new URLSearchParams()
    for (const [cle, valeur] of Object.entries(filters)) {
      if (valeur) params.set(cle === "chambres_min" ? "pieces" : cle, valeur)
    }
    if (n > 1) params.set("page", String(n))
    const q = params.toString()
    return q ? `/immobilier?${q}` : "/immobilier"
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const listingSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Biens immobiliers disponibles",
    description: "Biens immobiliers disponibles à la vente et à la location en Côte d'Ivoire",
    itemListElement: (biens ?? []).map((b, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: `${b.type} — ${b.localisation}`,
        description: b.description,
        image: b.id ? photoMap[b.id] ?? undefined : undefined,
        sku: b.id,
        offers: {
          "@type": "Offer",
          price: b.prix,
          priceCurrency: "XOF",
          availability: b.statut === "disponible" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            priceCurrency: "XOF",
            price: b.prix,
          },
          seller: {
            "@type": "Organization",
            name: "GROUP PHOEBE",
            url: baseUrl,
          },
        },
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(listingSchema) }}
      />
      <div className="px-6 pt-6 sm:px-10">
        <BackLink href="/" label="Retour à l'accueil" />
      </div>

      <PageHero
        eyebrow="Immobilier"
        title="Trouvez le bien de vos rêves"
        lede="Vente, location, estimation — nous vous accompagnons à chaque étape."
        bgImage={{ src: "/images/hero-immobilier.webp", alt: "Bien immobilier" }}
        aside={
          <Image
            src="/logos/immobilier.png"
            alt="Immobilier"
            width={407}
            height={424}
            sizes="(min-width: 640px) 208px, 160px"
            className="h-44 w-auto rounded-2xl bg-logo-plate-fixe object-contain p-3 animate-service-logo sm:h-56"
            priority
          />
        }
      />

      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        <ImmobilierFiltres />
      </div>

      <section className="mx-auto max-w-6xl px-6 pb-20 sm:px-10">
        <SectionHead
          title="Biens disponibles"
          lede="Nos offres du moment, mises à jour en continu."
          aside={
            total > 0 ? (
              <span className="text-sm text-public-text-muted">
                {total} bien{total > 1 ? "s" : ""}
                {nbPages > 1 ? ` · page ${page} sur ${nbPages}` : ""}
              </span>
            ) : null
          }
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {biens && biens.length > 0 ? biens.map((b) => {
            const photo = b.id ? photoMap[b.id] : null
            return (
              <Link key={b.id} href={`/immobilier/${b.id}`} className="group block">
              <Card className="h-full border-accent-green/0 hover:border-accent-green/30">
                {photo ? (
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={photo}
                      alt={`${b.type} – ${b.localisation}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-public-bg-elevated">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-public-text-faint">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
                <CardContent className="px-(--card-spacing) pt-(--card-spacing)">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant={statutBienBadgeVariant(b.statut)}>{statutBienLabel(b.statut)}</Badge>
                    <Badge variant="green">{typeBienLabel(b.type)}</Badge>
                    <span className="ml-auto">
                      <FavoriButton bienId={b.id} isFavori={favorisBiens.includes(b.id)} />
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-public-text">{typeBienLabel(b.type)} – {b.localisation}</h3>
                  <p className="font-display mt-1 text-3xl font-medium text-accent-green">{b.prix.toLocaleString("fr-FR")} <span className="text-base">FCFA</span></p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-public-text-muted">
                    {b.surface_m2 && <span>{b.surface_m2} m²</span>}
                    {b.nb_chambres && <span>{b.nb_chambres} {b.nb_chambres > 1 ? "chambres" : "chambre"}</span>}
                    <span>{b.localisation}</span>
                    {offreCountMap[b.id] > 0 && (
                      <span className="text-accent-green">{offreCountMap[b.id]} intéressé{offreCountMap[b.id] > 1 ? "s" : ""}</span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-green transition-all group-hover:gap-2">{t.immobilier.voirDetail} <ChevronRight size={12} /></span>
                  <GarantieDocuments variante="ligne" />
                </CardFooter>
              </Card>
              </Link>
            )
          }) : (
            <div className="col-span-2 flex flex-col items-center gap-4 rounded-xl border border-public-border bg-public-bg-card py-16 text-center">
              <p className="text-lg font-semibold text-public-text">{t.immobilier.aucunBien}</p>
              <p className="text-sm text-public-text-muted">{t.immobilier.elargirCriteres}</p>
            </div>
          )}
        </div>

        {nbPages > 1 && (
          <Pagination className="mt-12">
            <PaginationContent>
              {page > 1 && (
                <PaginationItem>
                  <PaginationPrevious href={lienPage(page - 1)} />
                </PaginationItem>
              )}
              {Array.from({ length: nbPages }, (_, i) => i + 1).map((n) => (
                <PaginationItem key={n}>
                  <PaginationLink href={lienPage(n)} isActive={n === page}>
                    {n}
                  </PaginationLink>
                </PaginationItem>
              ))}
              {page < nbPages && (
                <PaginationItem>
                  <PaginationNext href={lienPage(page + 1)} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        )}
      </section>

      <section className="border-t border-public-border bg-public-bg-card px-6 py-24 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-public-text sm:text-4xl">
              {t.immobilier.vendeurTitre} <em className="italic text-accent-green">{t.immobilier.vendeurTitreEmphase}</em>
            </h2>
            <p className="mt-4 text-base text-public-text-muted">
              {t.immobilier.vendeurTexte}
            </p>
          </div>
          <div className="lg:shrink-0">
            <Link href="/contact?sujet=estimation-bien">
              <Button variant="green" size="lg">
                Estimer mon bien
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
