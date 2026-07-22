import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { makeGroupKey } from "@/lib/vehicle-group"
import { CAT_LABELS } from "@/lib/constants"
import { Badge, Card } from "@/components/ui"
import { ClockIcon } from "@/components/icons"

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params
  const groupKey = decodeURIComponent(key)
  const parts = groupKey.split("---")
  const name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
  return {
    title: `${name} — Location ou Achat`,
    description: `Choisissez entre la location et l'achat pour le ${name}. Réservez en ligne avec GROUP PHOEBE.`,
    openGraph: {
      title: `${name} — Location ou Achat`,
      description: `Choisissez entre la location et l'achat pour le ${name}. Réservez en ligne avec GROUP PHOEBE.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — Location ou Achat`,
      description: `Choisissez entre la location et l'achat pour le ${name}. Réservez en ligne avec GROUP PHOEBE.`,
    },
  }
}

export default async function GroupeChoixPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const groupKey = decodeURIComponent(key)

  const supabase = await createClient()

  const { data: allVehicules } = await supabase
    .from("vehicules")
    .select("id, marque, modele, categorie, annee, nb_places, statut, prix_journalier, prix_mensuel, prix_vente, chauffeur_disponible, assurance_url")
    .neq("statut", "indisponible")
    .neq("statut", "reserve")

  const vehicules = (allVehicules ?? []).filter(
    (v) => makeGroupKey(v.marque, v.modele) === groupKey
  )

  if (vehicules.length === 0) notFound()

  const rep = vehicules[0]

  const { data: photos } = await supabase
    .from("vehicule_photos")
    .select("url, vehicule_id")
    .in("vehicule_id", vehicules.map((v) => v.id))
    .order("ordre", { ascending: true })
    .limit(1)

  const photo = photos?.[0]?.url

  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims

  const hasLocation = vehicules.some((v) => v.prix_journalier || v.prix_mensuel)
  const hasVente = vehicules.some((v) => v.prix_vente)

  if (!user) {
    redirect(`/inscription?redirect=/transport/catalogue/groupe/${encodeURIComponent(groupKey)}/choix`)
  }

  const disponibles = vehicules.filter((v) => v.statut === "disponible")

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/transport/catalogue"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-public-text-muted transition-colors hover:text-accent-gold"
      >
        ← Retour au catalogue
      </Link>

      <Card className="overflow-hidden p-0">
        {photo && (
          <div className="relative aspect-[16/7] w-full overflow-hidden">
            <Image loading="lazy"
              src={photo}
              alt={`${rep.marque} ${rep.modele}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div className="p-8">
          <h1 className="text-4xl font-bold text-public-text">
            {rep.marque} {rep.modele}
          </h1>
          <p className="mt-1.5 text-sm text-public-text-muted">
            {CAT_LABELS[rep.categorie] ?? rep.categorie}
            {rep.annee ? ` · ${rep.annee}` : ""}
            {rep.nb_places ? ` · ${rep.nb_places} places` : ""}
          </p>

          {disponibles.length > 1 && (
            <p className="mt-2.5 text-sm font-semibold text-accent-green">
              {disponibles.length} véhicules disponibles
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {vehicules.some((v) => v.assurance_url) && (
              <Badge variant="green">Véhicule assuré</Badge>
            )}
            {vehicules.some((v) => v.chauffeur_disponible) && (
              <Badge variant="orange">Chauffeur disponible</Badge>
            )}
          </div>

          <h2 className="text-3xl font-semibold text-public-text text-center mb-6 mt-10">
            Que souhaitez-vous faire ?
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            {hasLocation && (
              <Link
                href={`/transport/vehicule/${groupKey}?mode=location`}
                className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-accent-green/20 bg-accent-green/5 px-6 py-8 text-center transition-all hover:border-accent-green focus:outline-none"
              >
                <ClockIcon size={44} className="text-accent-green transition-transform group-hover:scale-110" />
                <span className="text-lg font-bold text-accent-green">Location</span>
                <span className="text-sm text-public-text-muted">Courte ou longue durée</span>
              </Link>
            )}

            {hasVente && (
              <Link
                href={`/transport/vehicule/${groupKey}?mode=achat`}
                className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-accent-gold/20 bg-accent-gold/5 px-6 py-8 text-center transition-all hover:border-accent-gold focus:outline-none"
              >
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-gold transition-transform group-hover:scale-110">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <span className="text-lg font-bold text-accent-gold">Achat</span>
                <span className="text-sm text-public-text-muted">Acheter ce véhicule</span>
              </Link>
            )}

            {!hasLocation && !hasVente && (
              <p className="col-span-2 text-center text-sm text-public-text-muted">
                Ce véhicule n&apos;est pas encore disponible à la location ou à la vente.
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
