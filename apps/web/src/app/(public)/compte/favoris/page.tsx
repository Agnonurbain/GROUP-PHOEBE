import type { Metadata } from "next"
import { BackLink } from "@/components/public/back-link"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { FavoriButton } from "@/components/favori-button"
import { Card } from "@/components/ui"
import { makeGroupKey } from "@/lib/vehicle-group"
import { typeBienLabel, statutBienLabel } from "@/lib/immobilier"
import { getT } from "@/lib/i18n/server"

export const metadata: Metadata = {
  title: "Mes Favoris",
  description: "Retrouvez vos véhicules et biens immobiliers favoris GROUP PHOEBE en un coup d'œil.",
  openGraph: {
    title: "Mes Favoris",
    description: "Retrouvez vos véhicules et biens immobiliers favoris GROUP PHOEBE en un coup d'œil.",
  },
}

function formatPrice(val: number | null): string | null {
  if (!val) return null
  return `${Number(val).toLocaleString("fr-FR")} FCFA`
}

export default async function FavorisPage() {
  const t = await getT()
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims
  if (!user) return null

  const { data: favs } = await supabase
    .from("favoris")
    .select("vehicule_id, bien_id")
    .eq("user_id", user.sub)

  const vehiculeIds = (favs ?? []).map((f) => f.vehicule_id).filter(Boolean) as string[]
  const bienIds = (favs ?? []).map((f) => f.bien_id).filter(Boolean) as string[]

  const { data: vehicules } = vehiculeIds.length
    ? await supabase.from("vehicules").select("*").in("id", vehiculeIds)
    : { data: [] }

  // Biens favoris (depuis 00052 : une ligne cible un véhicule OU un bien).
  const { data: biens } = bienIds.length
    ? await supabase.from("biens").select("*").in("id", bienIds)
    : { data: [] }

  const { data: mediasBiens } = bienIds.length
    ? await supabase
        .from("bien_medias")
        .select("bien_id, url")
        .in("bien_id", bienIds)
        .eq("type", "photo")
        .order("ordre", { ascending: true })
    : { data: [] }

  const photoBien = new Map<string, string>()
  for (const m of mediasBiens ?? []) {
    if (!photoBien.has(m.bien_id)) photoBien.set(m.bien_id, m.url)
  }

  const { data: allPhotos } = vehiculeIds.length
    ? await supabase
        .from("vehicule_photos")
        .select("vehicule_id, url")
        .in("vehicule_id", vehiculeIds)
        .order("ordre", { ascending: true })
    : { data: [] }

  const firstPhoto = new Map<string, string>()
  for (const p of allPhotos ?? []) {
    if (!firstPhoto.has(p.vehicule_id)) firstPhoto.set(p.vehicule_id, p.url)
  }

  return (
    <div className="px-6 py-16">
      <div className="mb-6">
        <BackLink href="/compte/profil" label="Retour au profil" />
      </div>
      <h1 className="text-4xl font-bold text-public-text">Mes favoris</h1>

      {biens && biens.length > 0 && (
        <>
          <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest text-public-text-muted">
            Biens immobiliers
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {biens.map((b) => {
              const photo = photoBien.get(b.id)
              return (
                <Card key={b.id} className="group relative flex gap-4 p-4 transition-all hover:border-accent-green/30 hover:bg-public-bg-elevated">
                  <Link href={`/immobilier/${b.id}`} className="relative shrink-0">
                    {photo ? (
                      <div className="relative h-28 w-36 overflow-hidden rounded-xl">
                        <Image
                          loading="lazy"
                          src={photo}
                          alt={`${typeBienLabel(b.type)} à ${b.localisation}`}
                          fill
                          sizes="144px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex h-28 w-36 items-center justify-center rounded-xl bg-public-border text-sm text-public-text-faint">
                        {t.divers.pasDePhoto}
                      </div>
                    )}
                    {b.statut !== "disponible" && (
                      <span className="absolute left-1.5 top-1.5 rounded-md bg-[rgba(239,68,68,0.85)] px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                        {statutBienLabel(b.statut)}
                      </span>
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                    <div>
                      <Link href={`/immobilier/${b.id}`}>
                        <h3 className="text-2xl font-semibold text-public-text transition-colors hover:text-accent-green">
                          {typeBienLabel(b.type)}
                        </h3>
                      </Link>
                      <p className="mt-0.5 text-sm text-public-text-muted">{b.localisation}</p>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold text-accent-green">
                        {Number(b.prix).toLocaleString("fr-FR")} FCFA
                      </span>
                      <FavoriButton bienId={b.id} isFavori={true} />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {vehicules && vehicules.length > 0 && (
        <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest text-public-text-muted">
          {t.espaceClient.vehicules}
        </h2>
      )}

      {vehicules && vehicules.length > 0 ? (
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {vehicules.map((v) => {
            const photo = firstPhoto.get(v.id)
            return (
              <Card key={v.id} className="group relative flex gap-4 p-4 transition-all hover:border-accent-gold/30 hover:bg-public-bg-elevated">
                <a href={`/transport/vehicule/${makeGroupKey(v.marque ?? "", v.modele ?? "")}`} className="shrink-0 relative">
                  {photo ? (
                    <div className="relative h-28 w-36 overflow-hidden rounded-xl">
                      <Image loading="lazy"
                        src={photo}
                        alt={`${v.marque} ${v.modele}`}
                        fill
                        sizes="144px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-28 w-36 items-center justify-center rounded-xl bg-public-border text-sm text-public-text-faint">
                      {t.divers.pasDePhoto}
                    </div>
                  )}
                  {v.statut !== "disponible" && (
                    <span className="absolute left-1.5 top-1.5 rounded-md bg-[rgba(239,68,68,0.85)] px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                      Indisponible
                    </span>
                  )}
                </a>
                <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                  <div>
                    <a href={`/transport/vehicule/${makeGroupKey(v.marque ?? "", v.modele ?? "")}`}>
                      <h2 className="text-3xl font-semibold text-public-text transition-colors hover:text-accent-gold">
                        {v.marque} {v.modele}
                        {v.annee ? ` (${v.annee})` : ""}
                      </h2>
                    </a>
                    <p className="mt-0.5 text-sm text-public-text-muted">
                      {v.localisation ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold text-accent-gold">
                      {formatPrice(v.prix_journalier) ?? "—"}
                      <span className="font-normal text-public-text-muted">/jour</span>
                    </span>
                    <FavoriButton vehiculeId={v.id} isFavori={true} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : null}

      {(!vehicules || vehicules.length === 0) && (!biens || biens.length === 0) && (
        <Card className="mt-8 p-10 text-center">
          <p className="text-sm text-public-text-muted">
            {t.espaceClient.aucunFavori}{" "}
            <a href="/transport/catalogue" className="font-medium text-accent-gold hover:text-accent-gold-hover">
              {t.divers.parcourirVehicules}
            </a>
            {" ou "}
            <Link href="/immobilier" className="font-medium text-accent-green hover:text-accent-green-hover">
              {t.divers.lesBiensImmobiliers}
            </Link>
          </p>
        </Card>
      )}
    </div>
  )
}
