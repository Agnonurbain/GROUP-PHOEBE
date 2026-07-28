import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import { SearchIcon, ChevronRightIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { groupVehicles } from "@/lib/vehicle-group"
import Filtres from "./filtres"
import { BackLink } from "@/components/public/back-link"
import { PageHero, SectionHead } from "@/components/public/section-head"
import {
  Badge,
  Card,
  CardContent,
  CardFooter,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui"
import { getZonesTarifaires } from "@/lib/public-cache"
import { serializeJsonLd } from "@/lib/json-ld"

const PAGE_SIZE = 12

const catalogueSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Catalogue de véhicules",
  description: "Flotte de véhicules premium à la location ou à l'achat à Abidjan et partout en Côte d'Ivoire",
}

export const metadata: Metadata = {
  title: "Location de véhicules — Catalogue",
  description: "Découvrez notre flotte de véhicules premium à la location ou à l'achat à Abidjan et partout en Côte d'Ivoire. SUV, berlines, minibus — réservez en ligne.",
  openGraph: {
    title: "Location de véhicules — Catalogue | GROUP PHOEBE",
    description: "Découvrez notre flotte de véhicules premium à la location ou à l'achat à Abidjan et partout en Côte d'Ivoire.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Location de véhicules — Catalogue",
    description: "Découvrez notre flotte de véhicules premium à la location ou à l'achat à Abidjan et partout en Côte d'Ivoire. SUV, berlines, minibus — réservez en ligne.",
  },
}

function GridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-public-border bg-public-bg-card p-4">
          <div className="mb-4 h-44 animate-pulse rounded-lg bg-public-bg-elevated" />
          <div className="mb-2 h-5 w-20 animate-pulse rounded-full bg-public-bg-elevated" />
          <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-public-bg-elevated" />
          <div className="flex flex-wrap gap-2">
            <div className="h-5 w-16 animate-pulse rounded-md bg-public-bg-elevated" />
            <div className="h-5 w-12 animate-pulse rounded-md bg-public-bg-elevated" />
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-public-border pt-4">
            <div className="h-5 w-32 animate-pulse rounded bg-public-bg-elevated" />
            <div className="h-5 w-20 animate-pulse rounded bg-public-bg-elevated" />
          </div>
        </div>
      ))}
    </div>
  )
}

async function VehiculeGrid({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const sp = searchParams
  const supabase = await createClient()

  let query = supabase
    .from("vehicules")
    .select("*")
    .neq("statut", "indisponible")
    .neq("statut", "reserve")
    .order("created_at", { ascending: false })

  if (sp.categorie)
    query = query.eq("categorie", sp.categorie as "leger" | "car" | "minibus")
  if (sp.q) {
    const q = `%${sp.q}%`
    query = query.or(`marque.ilike.${q},modele.ilike.${q}`)
  }
  if (sp.carburant) query = query.ilike("carburant", `%${sp.carburant}%`)
  if (sp.boite) query = query.eq("boite", sp.boite)
  if (sp.annee_min) query = query.gte("annee", Number(sp.annee_min))
  if (sp.places_min) query = query.gte("nb_places", Number(sp.places_min))
  if (sp.chauffeur === "oui") query = query.eq("chauffeur_disponible", true)
  if (sp.chauffeur === "non") query = query.eq("chauffeur_disponible", false)
  if (sp.clim === "oui") query = query.eq("climatisation", true)
  if (sp.gps === "oui") query = query.eq("gps", true)
  if (sp.vente === "oui") query = query.gt("prix_vente", 0)
  if (sp.prix_min) query = query.gte("prix_journalier", Number(sp.prix_min))
  if (sp.prix_max) query = query.lte("prix_journalier", Number(sp.prix_max))
  if (sp.etat) query = query.eq("etat", sp.etat)
  if (sp.zone) {
    const { data: zoneCategories } = await supabase
      .from("intervalles_prix")
      .select("categorie_vehicule")
      .eq("zone_id", sp.zone)
      .eq("type", "location")

    if (zoneCategories && zoneCategories.length > 0) {
      const cats = [...new Set(zoneCategories.map((z) => z.categorie_vehicule))]
      query = query.in("categorie", cats)
    }
  }

  const { data: vehicules } = await query

  const ids = vehicules?.map((v) => v.id) ?? []

  const { data: allPhotos } = ids.length
    ? await supabase
        .from("vehicule_photos")
        .select("vehicule_id, url")
        .in("vehicule_id", ids)
        .order("ordre", { ascending: true })
    : { data: [] }

  const photoMap = new Map<string, string>()
  for (const p of allPhotos ?? []) {
    if (!photoMap.has(p.vehicule_id)) photoMap.set(p.vehicule_id, p.url)
  }

  if (!vehicules || vehicules.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-public-border bg-public-bg-card py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-public-bg-elevated">
          <SearchIcon size={32} className="text-public-text-faint" />
        </div>
        <p className="text-lg font-semibold text-public-text">Aucun résultat pour ces filtres</p>
        <p className="text-sm text-public-text-muted">Essayez d&apos;élargir vos critères ou de réinitialiser les filtres.</p>
      </div>
    )
  }

  const groups = groupVehicles(vehicules, photoMap)
  const totalGroups = groups.length
  const page = Math.max(1, Number(sp.page) || 1)
  const totalPages = Math.ceil(totalGroups / PAGE_SIZE)
  const paged = groups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function pageUrl(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) {
      if (v && k !== "page") params.set(k, v)
    }
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return `/transport/catalogue${qs ? `?${qs}` : ""}`
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paged.map((g) => {
          const hasLoc = g.prixJournalier > 0
          const hasVente = !!g.prixVente && g.prixVente > 0
          const href =
            hasLoc && hasVente
              ? `/transport/catalogue/groupe/${encodeURIComponent(g.groupKey)}/choix`
              : hasVente
                ? `/transport/vehicule/${g.groupKey}?mode=achat`
                : `/transport/vehicule/${g.groupKey}`
          return (
          <Link
            key={g.groupKey}
            href={href}
            className="group block"
          >
            <Card className="h-full border-accent-orange/0 hover:border-accent-orange/30">
              {g.photoUrl ? (
                <div className="relative h-44 w-full overflow-hidden">
                  <Image
                    src={g.photoUrl}
                    alt={`${g.marque} ${g.modele}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              ) : (
                <div className="flex h-44 w-full items-center justify-center bg-public-bg-elevated">
                  <SearchIcon size={32} className="text-public-text-faint" />
                </div>
              )}
              <CardContent className="px-(--card-spacing) pt-(--card-spacing)">
                <div className="mb-3">
                  <Badge variant={g.totalCount > 0 ? "green" : "default"}>
                    {g.totalCount > 0 ? "Disponible" : "Sur demande"}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-public-text">{g.marque} {g.modele}</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[g.categorie, g.boite, g.climatisation && "Clim", g.gps && "GPS", g.chauffeurDisponible && "Chauffeur"]
                    .filter((f): f is string => !!f)
                    .map((f) => (
                      <span key={f} className="rounded-md bg-public-bg-elevated px-2 py-0.5 text-[11px] text-public-text-muted">{f}</span>
                    ))}
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-3">
                {hasLoc ? (
                  <span className="inline-block rounded-md bg-accent-orange px-3 py-1.5 text-sm font-bold text-[#0A0A0A]">
                    {g.prixJournalier.toLocaleString("fr-FR")} FCFA/j
                  </span>
                ) : hasVente ? (
                  <span className="inline-block rounded-md bg-accent-gold px-3 py-1.5 text-sm font-bold text-[#0A0A0A]">
                    {g.prixVente!.toLocaleString("fr-FR")} FCFA
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-public-text-muted">Prix sur demande</span>
                )}
                <span className={`inline-flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2 ${!hasLoc && hasVente ? "text-accent-gold" : "text-accent-orange"}`}>
                  {!hasLoc && hasVente ? "Acheter" : "Réserver"} <ChevronRightIcon size={14} />
                </span>
              </CardFooter>
            </Card>
          </Link>
          )
        })}
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-12">
          <PaginationContent>
            <PaginationItem>
              {page > 1 ? (
                <PaginationPrevious href={pageUrl(page - 1)} text="Précédent" />
              ) : (
                <span className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm text-public-text-faint opacity-50">
                  <ChevronRightIcon size={16} className="rotate-180" />
                  <span className="hidden sm:block">Précédent</span>
                </span>
              )}
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                {p === page ? (
                  <PaginationLink href={pageUrl(p)} isActive>
                    {p}
                  </PaginationLink>
                ) : Math.abs(p - page) <= 2 || p === 1 || p === totalPages ? (
                  <PaginationLink href={pageUrl(p)}>
                    {p}
                  </PaginationLink>
                ) : (
                  <PaginationEllipsis />
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              {page < totalPages ? (
                <PaginationNext href={pageUrl(page + 1)} text="Suivant" />
              ) : (
                <span className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm text-public-text-faint opacity-50">
                  <span className="hidden sm:block">Suivant</span>
                  <ChevronRightIcon size={16} />
                </span>
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  )
}

export default async function TransportCatalogue({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams

  const zones = await getZonesTarifaires()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(catalogueSchema) }}
      />
      <div className="px-6 pt-6 sm:px-10">
        <BackLink href="/" label="Retour à l'accueil" />
      </div>

      <PageHero
        eyebrow="Transport"
        title="Notre Flotte"
        lede="Découvrez nos véhicules d'exception pour vos déplacements."
      />

      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        <Suspense>
          <Filtres zones={zones ?? []} />
        </Suspense>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-20 sm:px-10">
        <SectionHead
          title="Véhicules disponibles"
          lede="Cliquez sur un véhicule pour le réserver ou faire une demande d'achat."
        />
        <div className="mt-10">
          <Suspense fallback={<GridSkeleton />}>
            <VehiculeGrid searchParams={sp} />
          </Suspense>
        </div>
      </div>
    </>
  )
}
