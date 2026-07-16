import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Header } from "@/components/header";
import { FavoriButton } from "@/components/favori-button";
import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import Filtres from "./filtres";

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  disponible: {
    label: "Disponible",
    color: "bg-phoebe-green/10 text-phoebe-green-deep",
  },
  reserve: { label: "Réservé", color: "bg-phoebe-gold/10 text-phoebe-gold" },
  loue: { label: "Loué", color: "bg-blue-50 text-blue-700" },
  vendu: {
    label: "Vendu",
    color: "bg-phoebe-anthracite/10 text-phoebe-anthracite",
  },
};

const CAT_LABELS: Record<string, string> = {
  leger: "Véhicule léger",
  car: "Car",
  minibus: "Minibus",
};

function formatPrice(val: number | null): string | null {
  if (!val) return null;
  return `${Number(val).toLocaleString("fr-FR")} FCFA`;
}

function GridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-phoebe-pearl bg-white">
          <div className="aspect-[4/3] w-full animate-pulse bg-phoebe-pearl" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-3/4 animate-pulse rounded bg-phoebe-pearl" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-phoebe-pearl" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-phoebe-pearl" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function VehiculeGrid({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const sp = searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("vehicules")
    .select("*")
    .neq("statut", "indisponible")
    .order("created_at", { ascending: false });

  if (sp.categorie)
    query = query.eq("categorie", sp.categorie as "leger" | "car" | "minibus");
  if (sp.marque) query = query.ilike("marque", `%${sp.marque}%`);
  if (sp.modele) query = query.ilike("modele", `%${sp.modele}%`);
  if (sp.localisation)
    query = query.ilike("localisation", `%${sp.localisation}%`);
  if (sp.carburant) query = query.ilike("carburant", `%${sp.carburant}%`);
  if (sp.usage === "location")
    query = query.or("prix_journalier.gt.0,prix_mensuel.gt.0");
  if (sp.usage === "vente") query = query.gt("prix_vente", 0);
  if (sp.prix_max && sp.usage) {
    const max = Number(sp.prix_max);
    if (sp.usage === "vente") {
      query = query.lte("prix_vente", max);
    } else {
      query = query.lte("prix_journalier", max);
    }
  }
  if (sp.annee_min) query = query.gte("annee", Number(sp.annee_min));
  if (sp.statut)
    query = query.eq(
      "statut",
      sp.statut as "disponible" | "reserve" | "loue" | "vendu"
    );
  if (sp.chauffeur === "oui") query = query.eq("chauffeur_disponible", true);
  if (sp.chauffeur === "non") query = query.eq("chauffeur_disponible", false);

  const { data: vehicules } = await query;

  const ids = vehicules?.map((v) => v.id) ?? [];

  const { data: allPhotos } = ids.length
    ? await supabase
        .from("vehicule_photos")
        .select("vehicule_id, url")
        .in("vehicule_id", ids)
        .order("ordre", { ascending: true })
    : { data: [] };

  const firstPhoto = new Map<string, string>();
  for (const p of allPhotos ?? []) {
    if (!firstPhoto.has(p.vehicule_id)) firstPhoto.set(p.vehicule_id, p.url);
  }

  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  const favoriIds = new Set<string>();
  if (user) {
    const { data: favs } = await supabase
      .from("favoris")
      .select("vehicule_id")
      .eq("user_id", user.sub);
    for (const f of favs ?? []) favoriIds.add(f.vehicule_id);
  }

  if (!vehicules || vehicules.length === 0) {
    return (
      <p className="text-center text-phoebe-anthracite/50">
        Aucun véhicule ne correspond à vos critères.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {vehicules.map((v) => {
        const s = STATUT_LABELS[v.statut];
        const photo = firstPhoto.get(v.id);

        return (
          <div
            key={v.id}
            className="cursor-pointer overflow-hidden rounded-xl border border-phoebe-pearl bg-white transition-shadow hover:shadow-md"
          >
            <Link href={`/catalogue/${v.id}`} className="relative block aspect-[4/3]">
              {photo ? (
                <Image
                  src={photo}
                  alt={`${v.marque} ${v.modele}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-phoebe-pearl text-phoebe-anthracite/30">
                  Pas de photo
                </div>
              )}
            </Link>

            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/catalogue/${v.id}`} className="min-w-0">
                  <h2 className="font-semibold text-phoebe-anthracite hover:text-phoebe-green">
                    {v.marque} {v.modele}
                  </h2>
                  <p className="text-xs text-phoebe-anthracite/50">
                    {CAT_LABELS[v.categorie] ?? v.categorie}
                    {v.annee ? ` · ${v.annee}` : ""}
                    {v.nb_places ? ` · ${v.nb_places} places` : ""}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-1.5">
                  {s && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}
                    >
                      {s.label}
                    </span>
                  )}
                  {user && (
                    <FavoriButton
                      vehiculeId={v.id}
                      isFavori={favoriIds.has(v.id)}
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {v.prix_journalier && (
                  <span className="text-phoebe-anthracite">
                    <span className="font-semibold text-phoebe-green">
                      {formatPrice(v.prix_journalier)}
                    </span>
                    /jour
                  </span>
                )}
                {v.prix_mensuel && (
                  <span className="text-phoebe-anthracite/60">
                    {formatPrice(v.prix_mensuel)}/mois
                  </span>
                )}
                {v.prix_vente && (
                  <span className="text-phoebe-gold">
                    Vente : {formatPrice(v.prix_vente)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-phoebe-anthracite/50">
                {v.climatisation && (
                  <span className="rounded bg-phoebe-pearl px-2 py-0.5">
                    Climatisé
                  </span>
                )}
                {v.boite && (
                  <span className="rounded bg-phoebe-pearl px-2 py-0.5">
                    {v.boite === "automatique" ? "Auto" : "Manuelle"}
                  </span>
                )}
                {v.chauffeur_disponible && (
                  <span className="rounded bg-phoebe-pearl px-2 py-0.5">
                    Chauffeur dispo
                  </span>
                )}
                {v.localisation && (
                  <span className="rounded bg-phoebe-pearl px-2 py-0.5">
                    {v.localisation}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <BackLink href="/" label="Accueil" />
        <h1 className="mb-6 mt-2 text-2xl font-bold text-phoebe-anthracite">
          Catalogue véhicules
        </h1>

        <Suspense>
          <Filtres />
        </Suspense>

        <Suspense fallback={<GridSkeleton />}>
          <VehiculeGrid searchParams={sp} />
        </Suspense>
      </main>
    </>
  );
}
