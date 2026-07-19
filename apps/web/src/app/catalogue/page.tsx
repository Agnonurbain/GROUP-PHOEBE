import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Header } from "@/components/header";
import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { groupVehicles, type VehicleGroup } from "@/lib/vehicle-group";
import Filtres from "./filtres";
import { CAT_LABELS } from "@/lib/constants";


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
    .neq("statut", "reserve")
    .order("created_at", { ascending: false });

  if (sp.categorie)
    query = query.eq("categorie", sp.categorie as "leger" | "car" | "minibus");
  if (sp.q) {
    const q = `%${sp.q}%`;
    query = query.or(`marque.ilike.${q},modele.ilike.${q}`);
  }
  if (sp.carburant) query = query.ilike("carburant", `%${sp.carburant}%`);
  if (sp.boite) query = query.eq("boite", sp.boite);
  if (sp.annee_min) query = query.gte("annee", Number(sp.annee_min));
  if (sp.places_min) query = query.gte("nb_places", Number(sp.places_min));
  if (sp.chauffeur === "oui") query = query.eq("chauffeur_disponible", true);
  if (sp.chauffeur === "non") query = query.eq("chauffeur_disponible", false);
  if (sp.clim === "oui") query = query.eq("climatisation", true);
  if (sp.gps === "oui") query = query.eq("gps", true);
  if (sp.vente === "oui") query = query.gt("prix_vente", 0);
  if (sp.etat) query = query.eq("etat", sp.etat);

  const { data: vehicules } = await query;

  const ids = vehicules?.map((v) => v.id) ?? [];

  const { data: allPhotos } = ids.length
    ? await supabase
        .from("vehicule_photos")
        .select("vehicule_id, url")
        .in("vehicule_id", ids)
        .order("ordre", { ascending: true })
    : { data: [] };

  const photoMap = new Map<string, string>();
  for (const p of allPhotos ?? []) {
    if (!photoMap.has(p.vehicule_id)) photoMap.set(p.vehicule_id, p.url);
  }

  if (!vehicules || vehicules.length === 0) {
    return (
      <p className="text-center text-phoebe-anthracite/50">
        Aucun véhicule ne correspond à vos critères.
      </p>
    );
  }

  const groups = groupVehicles(
    vehicules as Parameters<typeof groupVehicles>[0],
    photoMap
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => (
        <div
          key={g.groupKey}
          className="cursor-pointer overflow-hidden rounded-xl border border-phoebe-pearl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        >
          <Link href={`/catalogue/groupe/${encodeURIComponent(g.groupKey)}/choix`} className="relative block aspect-[4/3]">
            {g.photoUrl ? (
              <Image
                src={g.photoUrl}
                alt={`${g.marque} ${g.modele}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-phoebe-pearl text-phoebe-anthracite/30">
                Pas de photo
              </div>
            )}
            {g.totalCount > 1 && (
              <span className="absolute right-2 top-2 rounded-full bg-phoebe-green px-2.5 py-0.5 text-xs font-semibold text-white shadow">
                {g.totalCount} dispo
              </span>
            )}
          </Link>

          <div className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/catalogue/groupe/${encodeURIComponent(g.groupKey)}/choix`} className="min-w-0">
                <h2 className="font-semibold text-phoebe-anthracite hover:text-phoebe-green">
                  {g.marque} {g.modele}
                </h2>
                <p className="text-xs text-phoebe-anthracite/50">
                  {CAT_LABELS[g.categorie] ?? g.categorie}
                  {g.annee && g.annee < 9999 ? ` · ${g.annee}` : ""}
                  {g.nbPlaces ? ` · ${g.nbPlaces} places` : ""}
                </p>
              </Link>
              <div className="flex shrink-0 items-center gap-1.5">
                {g.totalCount > 0 ? (
                  <span className="rounded-full bg-phoebe-green/10 px-2.5 py-0.5 text-xs font-medium text-phoebe-green-deep">
                    Disponible
                  </span>
                ) : (
                  <span className="rounded-full bg-phoebe-anthracite/10 px-2.5 py-0.5 text-xs font-medium text-phoebe-anthracite">
                    Indisponible actuellement
                  </span>
                )}
              </div>
            </div>

            {g.prixJournalier > 0 && (
              <p className="text-sm font-medium text-phoebe-green">
                à partir de {g.prixJournalier.toLocaleString("fr-FR")} FCFA/jour
              </p>
            )}
            {g.prixVente && (
              <p className="text-sm font-medium text-phoebe-gold">
                Achat : {g.prixVente.toLocaleString("fr-FR")} FCFA
              </p>
            )}

            <div className="flex flex-wrap gap-2 text-xs text-phoebe-anthracite/50">
              {g.climatisation && (
                <span className="rounded bg-phoebe-pearl px-2 py-0.5">Climatisé</span>
              )}
              {g.boite && (
                <span className="rounded bg-phoebe-pearl px-2 py-0.5">
                  {g.boite === "automatique" ? "Auto" : "Manuelle"}
                </span>
              )}
              {g.assurance && (
                <span className="rounded bg-phoebe-green/10 px-2 py-0.5 text-phoebe-green-deep">Assuré</span>
              )}
              {g.gps && (
                <span className="rounded bg-phoebe-pearl px-2 py-0.5">GPS</span>
              )}
              {g.chauffeurDisponible && (
                <span className="rounded bg-phoebe-pearl px-2 py-0.5">Chauffeur dispo</span>
              )}
            </div>
          </div>
        </div>
      ))}
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
