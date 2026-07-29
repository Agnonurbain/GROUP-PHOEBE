import type { Metadata } from "next"
import Link from "next/link"
import { MapPin } from "lucide-react"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getBienById, getParametresImmobilier } from "@/lib/public-cache"
import { getFavorisBienIds } from "@/app/actions/favoris"
import { VehicleGallery } from "@/components/public/vehicle-gallery"
import { BienInteractionForm } from "@/components/public/bien-interaction-form"
import { GarantieDocuments } from "@/components/public/garantie-documents"
import { FavoriButton } from "@/components/favori-button"
import { BackLink } from "@/components/public/back-link"
import { Badge } from "@/components/ui"
import { serializeJsonLd } from "@/lib/json-ld"
import {
  statutBienLabel,
  statutBienBadgeVariant,
  typeBienLabel,
  TRANSACTION_LABELS,
} from "@/lib/immobilier"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const result = await getBienById(id)
  if (!result) return {}
  const { bien } = result
  const titre = `${typeBienLabel(bien.type)} à ${bien.localisation}`
  return {
    title: `${titre} — Immobilier`,
    description: bien.description || `${titre} — ${Number(bien.prix).toLocaleString("fr-FR")} FCFA. Découvrez ce bien avec GROUP PHOEBE.`,
    openGraph: {
      title: `${titre} — Immobilier`,
      description: bien.description || `${titre} — ${Number(bien.prix).toLocaleString("fr-FR")} FCFA.`,
    },
  }
}

export default async function BienDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getBienById(id)
  if (!result) notFound()

  const { bien, photos, offreCount } = result
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const isLoggedIn = !!claimsData?.claims

  // Annoncé dans le formulaire : demander une visite déclenche un paiement.
  const paramsImmo = await getParametresImmobilier()
  const favorisBiens = await getFavorisBienIds()
  const estFavori = favorisBiens.includes(bien.id)

  const disponible = bien.statut === "disponible"

  const specs: { label: string; value: string }[] = [
    { label: "Type", value: typeBienLabel(bien.type) },
    { label: "Transaction", value: TRANSACTION_LABELS[bien.transaction] ?? bien.transaction },
    { label: "Surface", value: bien.surface_m2 ? `${bien.surface_m2} m²` : "—" },
    { label: "Chambres", value: bien.nb_chambres ? String(bien.nb_chambres) : "—" },
    { label: "Localisation", value: bien.localisation },
    { label: "Statut", value: statutBienLabel(bien.statut) },
  ]

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${typeBienLabel(bien.type)} — ${bien.localisation}`,
    description: bien.description || `${typeBienLabel(bien.type)} à ${bien.localisation}`,
    image: photos.map((p) => p.url),
    sku: bien.id,
    offers: {
      "@type": "Offer",
      price: bien.prix,
      priceCurrency: "XOF",
      availability: bien.statut === "disponible" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "GROUP PHOEBE", url: baseUrl },
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(productSchema) }} />

      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-3 px-6 pt-6 text-sm text-public-text-faint">
        <BackLink href="/immobilier" label="Retour à l'immobilier" />
        <span aria-hidden="true">·</span>
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="transition-colors hover:text-accent-green">Accueil</Link></li>
          <li aria-hidden="true">›</li>
          <li><Link href="/immobilier" className="transition-colors hover:text-accent-green">Immobilier</Link></li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-public-text-muted">{typeBienLabel(bien.type)} — {bien.localisation}</li>
        </ol>
      </nav>

      <div className="grid gap-10 px-6 py-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {photos.length > 0 ? (
            <VehicleGallery photos={photos} alt={`${typeBienLabel(bien.type)} à ${bien.localisation}`} accentColor="green" />
          ) : (
            <div className="flex h-72 w-full items-center justify-center rounded-2xl bg-public-bg-elevated">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className="text-public-text-faint">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge variant={statutBienBadgeVariant(bien.statut)}>{statutBienLabel(bien.statut)}</Badge>
            <Badge variant="green">{typeBienLabel(bien.type)}</Badge>
            <Badge variant="blue">{TRANSACTION_LABELS[bien.transaction] ?? bien.transaction}</Badge>
          </div>

          <div className="mt-3 flex items-start justify-between gap-4">
            <h1 className="text-4xl font-bold text-public-text">{typeBienLabel(bien.type)} — {bien.localisation}</h1>
            {isLoggedIn && <FavoriButton bienId={bien.id} isFavori={estFavori} />}
          </div>
          <p className="mt-2 text-3xl font-bold text-accent-green">{Number(bien.prix).toLocaleString("fr-FR")} FCFA</p>

          {bien.description && (
            <p className="mt-6 text-sm leading-relaxed text-public-text-muted">{bien.description}</p>
          )}

          {bien.latitude != null && bien.longitude != null && (
            <a
              href={`https://www.openstreetmap.org/?mlat=${bien.latitude}&mlon=${bien.longitude}#map=17/${bien.latitude}/${bien.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent-green transition-colors hover:text-accent-green-hover"
            >
              <MapPin size={16} aria-hidden="true" />
              Situer le bien sur une carte
            </a>
          )}

          <div className="mt-10">
            <h2 className="text-lg font-semibold text-public-text">Caractéristiques</h2>
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3">
              {specs.map((s) => (
                <div key={s.label}>
                  <p className="text-xs text-public-text-faint">{s.label}</p>
                  <p className="text-sm font-medium text-public-text">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-public-border bg-public-bg-card p-6">
              <p className="text-sm text-public-text-muted">Prix</p>
              <p className="mt-1 text-2xl font-bold text-accent-green">{Number(bien.prix).toLocaleString("fr-FR")} FCFA</p>
              {offreCount > 0 && (
                <p className="mt-2 text-xs text-public-text-muted">
                  {offreCount} personne{offreCount > 1 ? "s" : ""} a/ont fait une offre sur ce bien
                </p>
              )}
            </div>
            {disponible ? (
              <BienInteractionForm bienId={bien.id} isLoggedIn={isLoggedIn} fraisVisite={paramsImmo.frais_visite} />
            ) : (
              /* Le formulaire échouait après soumission sur un bien non
                 disponible : autant le dire avant que le client ne le remplisse. */
              <div className="rounded-2xl border border-public-border bg-public-bg-card p-6">
                <p className="text-sm font-semibold text-public-text">
                  Ce bien n&apos;est plus disponible
                </p>
                <p className="mt-2 text-xs text-public-text-muted">
                  Il est actuellement {statutBienLabel(bien.statut).toLowerCase()}. Parcourez
                  les biens disponibles pour trouver une alternative.
                </p>
                <Link
                  href="/immobilier"
                  className="mt-4 inline-block text-xs font-semibold text-accent-green hover:text-accent-green-hover"
                >
                  Voir les biens disponibles
                </Link>
              </div>
            )}

            <GarantieDocuments />
          </div>
        </div>
      </div>
    </>
  )
}
