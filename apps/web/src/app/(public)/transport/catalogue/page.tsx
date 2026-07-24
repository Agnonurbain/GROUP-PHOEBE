import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { groupVehicles } from "@/lib/vehicle-group"
import Filtres from "./filtres"
import { Badge, Card } from "@/components/ui"
import { SearchIcon, ChevronRightIcon } from "@/components/icons"
import { getZonesTarifaires } from "@/lib/public-cache"

const PAGE_SIZE = 12

const catalogueSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Catalogue de véhicules",
  description: "Flotte de véhicules premium à la location ou à l'achat à Abidjan et partout en Côte d'Ivoire",
  itemListElement: [],
  numberOfItems: 0,
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
        <div key={i} className="rounded-2xl border border-public-border bg-public-bg-card p-6">
          <div className="mb-4 h-5 w-20 animate-pulse rounded-full bg-public-bg-elevated" />
          <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-public-bg-elevated" />
          <div className="flex flex-wrap gap-2">
            <div className="h-5 w-16 animate-pulse rounded-md bg-public-bg-elevated" />
            <div className="h-5 w-12 animate-pulse rounded-md bg-public-bg-elevated" />
            <div className="h-5 w-14 animate-pulse rounded-md bg-public-bg-elevated" />
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-public-border pt-4">
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
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-public-border bg-public-bg-card py-16 text-center">
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
        {paged.map((g) => (
          <Link
            key={g.groupKey}
            href={`/transport/vehicule/${g.groupKey}`}
            className="group"
          >
            <Card className="transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-accent-orange/30 hover:bg-public-bg-elevated hover:shadow-xl hover:shadow-black/20">
              {g.photoUrl ? (
                <div className="relative mb-4 h-44 w-full overflow-hidden rounded-xl bg-public-bg-elevated">
                  <Image
                    src={g.photoUrl}
                    alt={`${g.marque} ${g.modele}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              ) : (
                <div className="mb-4 flex h-44 w-full items-center justify-center rounded-xl bg-public-bg-elevated">
                  <SearchIcon size={32} className="text-public-text-faint" />
                </div>
              )}
              <div className="mb-3">
                <Badge variant={g.totalCount > 0 ? "green" : "gold"}>
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
              <div className="mt-5 flex items-center justify-between border-t border-public-border pt-4">
                {g.prixJournalier > 0 ? (
                  <span
                    className="relative inline-block bg-accent-orange px-4 py-1.5 text-sm font-bold text-[#0A0A0A]"
                    style={{
                      clipPath: "polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%)",
                    }}
                  >
                    {g.prixJournalier.toLocaleString()} FCFA/j
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-public-text-muted">Prix sur demande</span>
                )}
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-orange transition-all duration-300 group-hover:gap-2">
                  Réserver <ChevronRightIcon size={14} />
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-3" aria-label="Pagination">
          {page > 1 ? (
            <Link
              href={pageUrl(page - 1)}
              className="flex items-center gap-1 rounded-lg border border-public-border bg-public-bg-card px-4 py-2 text-sm font-medium text-public-text transition-colors hover:bg-public-bg-elevated"
            >
              <ChevronRightIcon size={16} className="rotate-180" /> Précédent
            </Link>
          ) : (
            <span className="flex items-center gap-1 rounded-lg border border-public-border bg-public-bg-card px-4 py-2 text-sm font-medium text-public-text-faint opacity-50">
              <ChevronRightIcon size={16} className="rotate-180" /> Précédent
            </span>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={pageUrl(p)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                p === page
                  ? "bg-accent-orange text-[#0A0A0A]"
                  : "border border-public-border bg-public-bg-card text-public-text-muted hover:bg-public-bg-elevated hover:text-public-text"
              }`}
            >
              {p}
            </Link>
          ))}
          {page < totalPages ? (
            <Link
              href={pageUrl(page + 1)}
              className="flex items-center gap-1 rounded-lg border border-public-border bg-public-bg-card px-4 py-2 text-sm font-medium text-public-text transition-colors hover:bg-public-bg-elevated"
            >
              Suivant <ChevronRightIcon size={16} />
            </Link>
          ) : (
            <span className="flex items-center gap-1 rounded-lg border border-public-border bg-public-bg-card px-4 py-2 text-sm font-medium text-public-text-faint opacity-50">
              Suivant <ChevronRightIcon size={16} />
            </span>
          )}
        </nav>
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogueSchema) }}
      />
      <section className="px-6 py-16">
        <h1 className="text-4xl font-bold text-public-text md:text-5xl">Notre Flotte</h1>
        <p className="mt-3 text-base text-public-text-muted md:text-lg">Découvrez nos véhicules d&apos;exception pour vos déplacements</p>
      </section>

      <div className="px-6">
        <Suspense>
          <Filtres zones={zones ?? []} />
        </Suspense>
      </div>

      <div className="flex items-center justify-between px-6 pb-6">
        <h2 className="text-3xl font-semibold text-public-text">Véhicules disponibles</h2>
      </div>

      <div className="px-6 pb-20">
        <Suspense fallback={<GridSkeleton />}>
          <VehiculeGrid searchParams={sp} />
        </Suspense>
      </div>
    </>
  )
}
