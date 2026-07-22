import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { parseGroupKey } from "@/lib/vehicle-group"
import { Badge } from "@/components/ui"
import { VehicleGallery } from "@/components/public/vehicle-gallery"
import { VehicleBooking } from "@/components/public/vehicle-booking"
import { renderJsonLd, createVehicleSchema } from "@/lib/json-ld"
import { trackViewItem } from "@/lib/analytics"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const parsed = parseGroupKey(slug)
  if (!parsed) return {}
  const supabase = await createClient()
  const { data: vehicules } = await supabase.from("vehicules").select("marque, modele, description").eq("marque", parsed.marque).eq("modele", parsed.modele).eq("statut", "disponible").limit(1)
  if (!vehicules || vehicules.length === 0) return {}
  const v = vehicules[0]
  return {
    title: `${v.marque} ${v.modele} — Location & Achat`,
    description: v.description || `Réservez un ${v.marque} ${v.modele} à Abidjan, Côte d'Ivoire. Location courte durée, longue durée ou achat. Prix compétitifs, livraison partout.`,
    openGraph: {
      title: `${v.marque} ${v.modele} — Location & Achat`,
      description: v.description || `Réservez un ${v.marque} ${v.modele} à Abidjan, Côte d'Ivoire. Location courte durée, longue durée ou achat. Prix compétitifs, livraison partout.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${v.marque} ${v.modele} — Location & Achat`,
      description: v.description || `Réservez un ${v.marque} ${v.modele} à Abidjan, Côte d'Ivoire. Location courte durée, longue durée ou achat. Prix compétitifs, livraison partout.`,
    },
  }
}

export default async function VehicleDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const parsed = parseGroupKey(slug)
  if (!parsed) notFound()

  const { data: vehicules } = await supabase
    .from("vehicules")
    .select("*")
    .eq("marque", parsed.marque)
    .eq("modele", parsed.modele)
    .eq("statut", "disponible")

  if (!vehicules || vehicules.length === 0) notFound()

  const rep = vehicules[0]

  const { data: photos } = await supabase
    .from("vehicule_photos")
    .select("url")
    .eq("vehicule_id", rep.id)
    .order("ordre")

  const { data: zones } = await supabase
    .from("zones_tarifaires")
    .select("id, nom, description, ordre")
    .order("ordre")

  let zonePrices: { nom: string; prixMin: number; prixMax: number }[] = []
  if (zones && zones.length > 0) {
    const { data: prices } = await supabase
      .from("intervalles_prix")
      .select("zone_id, prix_min, prix_max")
      .eq("categorie_vehicule", rep.categorie)
      .eq("type", "location")

    if (prices) {
      const priceMap = new Map(prices.map((p) => [p.zone_id, p]))
      zonePrices = zones.map((z) => ({
        nom: z.nom,
        prixMin: priceMap.get(z.id)?.prix_min ?? 0,
        prixMax: priceMap.get(z.id)?.prix_max ?? 0,
      }))
    }
  }

  const serviceBadges: { label: string; active: boolean; variant: "green" | "orange" | "blue" | "gold" }[] = [
    { label: "Assuré", active: !!rep.assurance_url, variant: "green" },
    { label: "GPS", active: !!rep.gps, variant: "blue" },
    { label: "Climatisation", active: !!rep.climatisation, variant: "orange" },
    { label: "Chauffeur", active: !!rep.chauffeur_disponible, variant: "gold" },
  ]

  const specs: { label: string; value: string }[] = [
    { label: "Catégorie", value: rep.categorie ?? "—" },
    { label: "Année", value: rep.annee ? String(rep.annee) : "—" },
    { label: "Places", value: rep.nb_places ? String(rep.nb_places) : "—" },
    { label: "Boîte", value: rep.boite ? `Boîte ${rep.boite}` : "—" },
    { label: "Carburant", value: rep.carburant ?? "—" },
    { label: "Kilométrage", value: rep.kilometrage ? `${Number(rep.kilometrage).toLocaleString()} km` : "—" },
    { label: "Localisation", value: rep.localisation ?? "—" },
    { label: "État", value: rep.etat ?? "—" },
  ]

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  const currentUrl = `${baseUrl}/transport/vehicule/${slug}`

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${rep.marque} ${rep.modele}`,
    description: rep.description || `Réservez un ${rep.marque} ${rep.modele} à Abidjan, Côte d'Ivoire.`,
    image: photos?.map((p) => p.url) ?? [],
    brand: {
      "@type": "Brand",
      name: rep.marque,
    },
    category: rep.categorie ?? "vehicle",
    sku: rep.id,
    offers: {
      "@type": "Offer",
      url: currentUrl,
      priceCurrency: "XOF",
      price: rep.prix_journalier ?? 0,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      availability: rep.statut === "disponible"
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "GROUP PHOEBE",
        url: baseUrl,
      },
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        priceCurrency: "XOF",
        price: rep.prix_journalier ?? 0,
        unitText: "jour",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: "12",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/javascript"
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'view_item', {
                currency: 'XOF',
                value: ${rep.prix_journalier ?? 0},
                items: [{
                  item_id: '${rep.id}',
                  item_name: '${rep.marque} ${rep.modele}',
                  item_category: '${rep.categorie ?? "vehicle"}',
                  price: ${rep.prix_journalier ?? 0},
                  currency: 'XOF',
                  item_brand: '${rep.marque}',
                  item_variant: '${rep.modele}'
                }]
              });
            }
          `}}
      />
      <nav className="px-6 pt-6 text-sm text-public-text-faint">
        Accueil &gt; Transport &gt; {rep.marque} {rep.modele}
      </nav>

      <div className="grid gap-12 px-6 py-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <VehicleGallery photos={photos ?? []} alt={`${rep.marque} ${rep.modele}`} />

          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <Badge variant={rep.statut === "disponible" ? "green" : "gold"}>
                {rep.statut === "disponible" ? "Disponible" : "Sur demande"}
              </Badge>
              <h1 className="mt-3 text-4xl font-bold text-public-text">{rep.marque} {rep.modele}</h1>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[rep.categorie, rep.annee, rep.nb_places ? `${rep.nb_places} places` : null, rep.carburant]
              .filter(Boolean)
              .map((t) => (
                <span key={String(t)} className="rounded-md bg-public-bg-elevated px-3 py-1 text-xs font-medium text-public-text-muted">
                  {t}
                </span>
              ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {serviceBadges.filter((b) => b.active).map((b) => (
              <Badge key={b.label} variant={b.variant}>{b.label}</Badge>
            ))}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-public-text-muted">
            {rep.description || `Le ${rep.marque} ${rep.modele} est le véhicule idéal pour vos déplacements. Alliant confort, puissance et fiabilité, il vous offre une expérience de conduite inégalée sur toutes les routes de Côte d'Ivoire.`}
          </p>

          <div className="mt-10">
            <h3 className="text-lg font-semibold text-public-text">Caractéristiques techniques</h3>
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
              {specs.map((s) => (
                <div key={s.label}>
                  <p className="text-xs text-public-text-faint">{s.label}</p>
                  <p className="text-sm font-medium text-public-text">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-semibold text-public-text">Équipements</h3>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                rep.climatisation ? "Climatisation" : null,
                rep.gps ? "GPS Intégré" : null,
                rep.boite ? `Boîte ${rep.boite}` : null,
                rep.chauffeur_disponible ? "Chauffeur disponible" : null,
                rep.assurance_url ? "Assurance incluse" : null,
              ].filter(Boolean).map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-public-text-muted">
                  <svg className="h-4 w-4 shrink-0 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <VehicleBooking
            vehiculeId={rep.id}
            groupKey={slug}
            marque={rep.marque}
            modele={rep.modele}
            prixJournalier={rep.prix_journalier ?? 0}
            chauffeurDisponible={rep.chauffeur_disponible}
            zonePrices={zonePrices}
            defaultPrice={rep.prix_journalier ?? 0}
          />
        </div>
      </div>
    </>
  )
}
