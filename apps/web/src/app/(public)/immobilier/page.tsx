import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Badge, Button, Card } from "@/components/ui"
import ImmobilierFiltres from "./immobilier-filtres"
import { getBiensWithPhotos } from "@/lib/public-cache"
import { serializeJsonLd } from "@/lib/json-ld"

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

function statutBadgeVariant(statut: string): "green" | "gold" | "blue" {
  if (statut === "disponible") return "green"
  if (statut === "vendu") return "gold"
  return "blue"
}

function statutLabel(statut: string): string {
  if (statut === "disponible") return "Disponible"
  if (statut === "vendu") return "Vendu"
  if (statut === "loué") return "Loué"
  return statut
}

export default async function Immobilier({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams

  const filters = {
    type: sp.type,
    prix_min: sp.prix_min,
    prix_max: sp.prix_max,
    localisation: sp.localisation,
    pieces: sp.pieces,
    transaction: sp.transaction,
    zone_id: sp.zone,
  }

  const { biens, photoMap } = await getBiensWithPhotos(filters)

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
        image: b.id ? photoMap.get(b.id) ?? undefined : undefined,
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
      <section className="flex flex-col items-center gap-6 px-6 py-16 text-center">
        <Image
          src="/logos/logo-imm.png"
          alt="Immobilier"
          width={308}
          height={278}
          className="h-28 w-auto animate-glow-pulse"
          priority
        />
        <h1 className="text-4xl font-bold text-public-text md:text-5xl">Trouvez le bien de vos rêves</h1>
        <p className="text-base text-public-text-muted md:text-lg">Vente, location, estimation — nous vous accompagnons à chaque étape</p>
      </section>

      <div className="px-6 pb-12">
        <ImmobilierFiltres />
      </div>

      <section className="px-6 pb-20">
        <div className="mb-10">
          <h2 className="text-3xl font-semibold text-public-text">Biens à la une</h2>
          <p className="mt-1 text-sm text-public-text-muted">Découvrez nos meilleures offres du moment</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {biens && biens.length > 0 ? biens.map((b) => {
            const photo = b.id ? photoMap.get(b.id) : null
            return (
              <Card key={b.id} className="transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-accent-green/30 hover:bg-public-bg-elevated hover:shadow-xl hover:shadow-black/20">
                {photo ? (
                  <div className="relative mb-4 h-48 w-full overflow-hidden rounded-xl bg-public-bg-elevated">
                    <Image
                      src={photo}
                      alt={`${b.type} – ${b.localisation}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                ) : (
                  <div className="mb-4 flex h-48 w-full items-center justify-center rounded-xl bg-public-bg-elevated">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-public-text-faint">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant={statutBadgeVariant(b.statut)}>{statutLabel(b.statut)}</Badge>
                  <Badge variant="green">{b.type}</Badge>
                </div>
                <h3 className="text-lg font-semibold text-public-text">{b.type} – {b.localisation}</h3>
                <p className="mt-1 text-3xl font-bold text-accent-green">{b.prix.toLocaleString()} FCFA</p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-public-text-muted">
                  {b.surface_m2 && <span>{b.surface_m2} m²</span>}
                  {b.nb_chambres && <span>{b.nb_chambres} {b.nb_chambres > 1 ? "pièces" : "pièce"}</span>}
                  <span>{b.localisation}</span>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent-green transition-all group-hover:gap-2">Voir le détail →</span>
              </Card>
            )
          }) : (
            <div className="col-span-2 flex flex-col items-center gap-4 rounded-2xl border border-public-border bg-public-bg-card py-16 text-center">
              <p className="text-lg font-semibold text-public-text">Aucun bien trouvé</p>
              <p className="text-sm text-public-text-muted">Essayez d&apos;élargir vos critères de recherche.</p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-6 mb-20 flex flex-col items-center gap-6 rounded-2xl border border-accent-green/20 bg-public-bg-card px-6 py-16 text-center">
        <h2 className="text-3xl font-semibold text-public-text">Estimation gratuite</h2>
        <p className="max-w-md text-sm text-public-text-muted">Estimez votre bien en 2 minutes. Notre expertise au service de votre patrimoine.</p>
        <Link href="/contact?sujet=estimation-bien">
          <Button variant="default" className="bg-accent-green text-white hover:bg-accent-green-hover">
            Estimer mon bien
          </Button>
        </Link>
      </section>
    </>
  )
}
