import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Header } from "@/components/header";
import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { groupVehicles, type VehicleGroup } from "@/lib/vehicle-group";
import Filtres from "./filtres";
import { CAT_LABELS } from "@/lib/constants";
import { ScrollReveal, SparkleHero } from "@/components/effects";


function GridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-phoebe-pearl bg-white shadow-sm">
          <div className="aspect-[4/3] w-full animate-pulse bg-gradient-to-br from-phoebe-pearl to-phoebe-pearl-warm" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-3/4 animate-pulse rounded-lg bg-phoebe-pearl" />
            <div className="h-4 w-1/2 animate-pulse rounded-lg bg-phoebe-pearl/70" />
            <div className="h-4 w-1/3 animate-pulse rounded-lg bg-phoebe-pearl/50" />
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

  const { data: zones } = await supabase
    .from("zones_tarifaires")
    .select("id, nom, ordre")
    .order("ordre", { ascending: true });

  const selectedZone = sp.zone
    ? (zones ?? []).find((z) => z.id === sp.zone)
    : null;
  const coeffZone = selectedZone
    ? Number((selectedZone as unknown as Record<string, unknown>).coefficient_majoration) || 1
    : null;

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
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-phoebe-pearl bg-white py-16 text-center shadow-sm animate-fade-in">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-phoebe-anthracite/15">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
        <p className="text-lg text-phoebe-anthracite/45">
          Aucun véhicule ne correspond à vos critères.
        </p>
        <p className="text-sm text-phoebe-anthracite/30">
          Essayez de modifier vos filtres pour voir plus de résultats.
        </p>
      </div>
    );
  }

  const groups = groupVehicles(
    vehicules as unknown as Parameters<typeof groupVehicles>[0],
    photoMap
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g, i) => (
        <ScrollReveal key={g.groupKey} variant="fade-up" delay={i * 0.08}>
        <div
          className="group/card relative cursor-pointer overflow-hidden rounded-2xl border border-phoebe-pearl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-phoebe-green/8 hover:border-phoebe-gold/20"
        >
          <div className="absolute inset-x-0 top-0 z-10 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-phoebe-gold-light via-phoebe-gold to-phoebe-gold-dark transition-transform duration-300 group-hover/card:scale-x-100" />
          <Link href={`/catalogue/groupe/${encodeURIComponent(g.groupKey)}/choix`} className="relative block aspect-[4/3] overflow-hidden">
            {g.photoUrl ? (
              <Image
                src={g.photoUrl}
                alt={`${g.marque} ${g.modele}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover/card:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-phoebe-pearl text-phoebe-anthracite/30">
                Pas de photo
              </div>
            )}
            {g.totalCount > 1 && (
              <span className="absolute right-3 top-3 rounded-full bg-phoebe-green/90 px-2.5 py-0.5 text-xs font-semibold text-white shadow-md backdrop-blur-sm">
                {g.totalCount} dispo
              </span>
            )}
          </Link>

          <div className="space-y-2.5 p-5">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/catalogue/groupe/${encodeURIComponent(g.groupKey)}/choix`} className="min-w-0">
                <h2 className="font-bold text-phoebe-anthracite transition-colors group-hover/card:text-phoebe-green">
                  {g.marque} {g.modele}
                </h2>
                <p className="text-xs text-phoebe-anthracite/45">
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
                    Indisponible
                  </span>
                )}
              </div>
            </div>

            {g.prixJournalier > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-phoebe-green">
                  à partir de {g.prixJournalier.toLocaleString("fr-FR")} FCFA<span className="font-normal text-phoebe-anthracite/40">/jour</span>
                </p>
                {selectedZone && coeffZone && (
                  <p className="text-xs font-medium text-phoebe-gold">
                    {selectedZone.nom} : {Math.round(g.prixJournalier * coeffZone).toLocaleString("fr-FR")} FCFA/jour
                  </p>
                )}
              </div>
            )}
            {g.prixVente && (
              <p className="text-sm font-semibold text-phoebe-gold">
                Achat : {g.prixVente.toLocaleString("fr-FR")} FCFA
              </p>
            )}

            <div className="flex flex-wrap gap-2 text-xs text-phoebe-anthracite/50">
              {g.prixVente && g.etat && (
                <span className={`rounded px-2 py-0.5 font-medium ${g.etat === "neuf" ? "bg-blue-50 text-blue-700" : "bg-phoebe-gold/10 text-phoebe-gold"}`}>
                  {g.etat === "neuf" ? "Neuf" : "Occasion"}
                </span>
              )}
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
        </ScrollReveal>
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
  const supabase = await createClient();

  const { data: zones } = await supabase
    .from("zones_tarifaires")
    .select("id, nom, ordre")
    .order("ordre", { ascending: true });

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero bandeau catalogue */}
        <SparkleHero>
        <section className="relative overflow-hidden border-b border-phoebe-pearl bg-gradient-to-br from-phoebe-green-darkest via-phoebe-green-darker to-phoebe-green-deep">
          <div className="absolute inset-0 bg-[url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M30 5 L52 17.5 L52 42.5 L30 55 L8 42.5 L8 17.5 Z' fill='none' stroke='%23D38C37' stroke-width='0.4' opacity='0.1'/%3E%3C/svg%3E&quot;)] bg-[length:60px_60px] opacity-60" />
          <div className="absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full bg-phoebe-green/10 blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-phoebe-gold/5 blur-[80px]" />

          <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16">
            <BackLink href="/" label="Accueil" />
            <ScrollReveal variant="fade-up">
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Notre catalogue
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/50">
              Location et vente de véhicules premium — trouvez le véhicule idéal pour vos besoins.
            </p>
            </ScrollReveal>
          </div>
        </section>
        </SparkleHero>

        <div className="mx-auto max-w-6xl px-4 py-8">
          <Suspense>
            <Filtres zones={zones ?? []} />
          </Suspense>

          <Suspense fallback={<GridSkeleton />}>
            <VehiculeGrid searchParams={sp} />
          </Suspense>
        </div>
      </main>
    </>
  );
}
