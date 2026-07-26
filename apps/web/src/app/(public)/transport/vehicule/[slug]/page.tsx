import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { parseGroupKey, makeGroupKey } from "@/lib/vehicle-group"
import { Badge } from "@/components/ui"
import { VehicleGallery } from "@/components/public/vehicle-gallery"
import { VehicleBooking } from "@/components/public/vehicle-booking"
import { VehiclePurchase } from "@/components/public/vehicle-purchase"
import Link from "next/link"
import { ViewItemTracker } from "@/components/analytics/view-item-tracker"
import { BackLink } from "@/components/public/back-link"
import { serializeJsonLd } from "@/lib/json-ld"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const parsed = parseGroupKey(slug)
  if (!parsed) return {}
  const supabase = await createClient()
  // marque/modele sont stockés en clair : on retrouve le groupe en recalculant
  // la clé sur chaque ligne (comme la page « choix »), pas via un eq sur le slug.
  const { data: all } = await supabase.from("vehicules").select("marque, modele, description").eq("statut", "disponible")
  const v = (all ?? []).find((x) => makeGroupKey(x.marque, x.modele) === slug)
  if (!v) return {}
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

export default async function VehicleDetail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const { slug } = await params
  const { mode } = await searchParams
  const supabase = await createClient()
  const parsed = parseGroupKey(slug)
  if (!parsed) notFound()

  // On retrouve le groupe en recalculant makeGroupKey sur chaque véhicule
  // disponible (marque/modele en clair) plutôt qu'un eq sur le slug.
  const { data: allV } = await supabase
    .from("vehicules")
    .select("*")
    .eq("statut", "disponible")

  const vehicules = (allV ?? []).filter((v) => makeGroupKey(v.marque, v.modele) === slug)

  if (vehicules.length === 0) notFound()

  const rep = vehicules[0]

  // Le groupe peut proposer la location, l'achat, ou les deux. Le mode choisi
  // (via ?mode=, issu de la page « Location ou Achat ») pilote l'encart affiché.
  const hasVente = vehicules.some((v) => Number(v.prix_vente) > 0)
  const hasLocation = vehicules.some(
    (v) => Number(v.prix_journalier) > 0 || Number(v.prix_mensuel) > 0
  )
  const venteRep = vehicules.find((v) => Number(v.prix_vente) > 0) ?? rep
  const modeAchat = mode === "achat" && hasVente

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
    { label: "Kilométrage", value: rep.kilometrage ? `${Number(rep.kilometrage).toLocaleString("fr-FR")} km` : "—" },
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
      // Server Component : évalué à chaque requête, jamais re-rendu côté client
      // eslint-disable-next-line react-hooks/purity
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
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Transport", item: `${baseUrl}/transport/catalogue` },
      { "@type": "ListItem", position: 3, name: `${rep.marque} ${rep.modele}`, item: currentUrl },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
      />
      <ViewItemTracker
        item={{
          item_id: rep.id,
          item_name: `${rep.marque} ${rep.modele}`,
          item_category: rep.categorie ?? "vehicle",
          price: rep.prix_journalier ?? 0,
          currency: "XOF",
          item_brand: rep.marque,
          item_variant: rep.modele,
        }}
      />
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-3 px-6 pt-6 text-sm text-public-text-faint">
        <BackLink href="/transport/catalogue" label="Retour au catalogue" />
        <span aria-hidden="true">·</span>
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="transition-colors hover:text-accent-orange">Accueil</Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href="/transport/catalogue" className="transition-colors hover:text-accent-orange">Transport</Link>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-public-text-muted">{rep.marque} {rep.modele}</li>
        </ol>
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
          {/* Bascule entre les deux modes lorsque le véhicule est à la fois
              louable et à vendre. */}
          {hasLocation && hasVente && (
            <div className="mb-4">
              {modeAchat ? (
                <Link
                  href={`/transport/vehicule/${slug}?mode=location`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-orange transition-colors hover:text-accent-orange-hover"
                >
                  ← Plutôt le louer ?
                </Link>
              ) : (
                <Link
                  href={`/transport/vehicule/${slug}?mode=achat`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-gold transition-colors hover:text-accent-gold-hover"
                >
                  Vous préférez l&apos;acheter ? →
                </Link>
              )}
            </div>
          )}

          {modeAchat ? (
            <VehiclePurchase
              vehiculeId={venteRep.id}
              marque={venteRep.marque}
              modele={venteRep.modele}
              categorie={venteRep.categorie}
              prixVente={Number(venteRep.prix_vente) || 0}
            />
          ) : (
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
          )}
        </div>
      </div>
    </>
  )
}
