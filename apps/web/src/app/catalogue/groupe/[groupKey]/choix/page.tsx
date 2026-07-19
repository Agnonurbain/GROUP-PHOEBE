import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { makeGroupKey } from "@/lib/vehicle-group";
import { CAT_LABELS } from "@/lib/constants";


export default async function GroupeChoixPage({
  params,
}: {
  params: Promise<{ groupKey: string }>;
}) {
  const { groupKey: rawKey } = await params;
  const groupKey = decodeURIComponent(rawKey);

  const supabase = await createClient();

  const { data: allVehicules } = await supabase
    .from("vehicules")
    .select("id, marque, modele, categorie, annee, nb_places, statut, prix_journalier, prix_mensuel, prix_vente, chauffeur_disponible, assurance_url")
    .neq("statut", "indisponible")
    .neq("statut", "reserve");

  const vehicules = (allVehicules ?? []).filter(
    (v) => makeGroupKey(v.marque, v.modele) === groupKey
  );

  if (vehicules.length === 0) notFound();

  const rep = vehicules[0];

  const { data: photos } = await supabase
    .from("vehicule_photos")
    .select("url, vehicule_id")
    .in("vehicule_id", vehicules.map((v) => v.id))
    .order("ordre", { ascending: true })
    .limit(1);

  const photo = photos?.[0]?.url;

  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  const hasLocation = vehicules.some((v) => v.prix_journalier || v.prix_mensuel);
  const hasVente = vehicules.some((v) => v.prix_vente);

  if (!user) {
    redirect(`/inscription?redirect=/catalogue/groupe/${encodeURIComponent(groupKey)}/choix`);
  }

  const disponibles = vehicules.filter((v) => v.statut === "disponible");

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:py-12">
        <Link
          href="/catalogue"
          className="group mb-6 inline-flex items-center gap-1.5 text-sm text-phoebe-anthracite/50 transition-colors hover:text-phoebe-green"
        >
          <span className="inline-block transition-transform group-hover:-translate-x-1">&larr;</span>
          Retour au catalogue
        </Link>

        <div className="overflow-hidden rounded-2xl border border-phoebe-pearl bg-white shadow-lg ring-1 ring-black/5">
          {photo && (
            <div className="relative aspect-[16/7] w-full">
              <Image
                src={photo}
                alt={`${rep.marque} ${rep.modele}`}
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="p-7 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-phoebe-anthracite">
              {rep.marque} {rep.modele}
            </h1>
            <p className="mt-1.5 text-sm text-phoebe-anthracite/50">
              {CAT_LABELS[rep.categorie] ?? rep.categorie}
              {rep.annee ? ` · ${rep.annee}` : ""}
              {rep.nb_places ? ` · ${rep.nb_places} places` : ""}
            </p>

            {disponibles.length > 1 && (
              <p className="mt-2.5 text-sm font-semibold text-phoebe-green">
                {disponibles.length} vehicules disponibles
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {vehicules.some((v) => v.assurance_url) && (
                <span className="rounded-full bg-phoebe-green/10 px-3 py-1 text-xs font-medium text-phoebe-green-deep">
                  Vehicule assure
                </span>
              )}
              {vehicules.some((v) => v.chauffeur_disponible) && (
                <span className="rounded-full bg-phoebe-pearl px-3 py-1 text-xs font-medium text-phoebe-anthracite/60">
                  Chauffeur disponible
                </span>
              )}
            </div>

            <h2 className="mb-5 mt-8 text-center text-lg font-semibold tracking-tight text-phoebe-anthracite">
              Que souhaitez-vous faire ?
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              {hasLocation && (
                <Link
                  href={`/catalogue/groupe/${encodeURIComponent(groupKey)}?mode=location`}
                  className="group relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl border-2 border-phoebe-green/15 bg-phoebe-green/5 px-6 py-8 text-center transition-all hover:border-phoebe-green hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-phoebe-green/40"
                >
                  <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-phoebe-green transition-transform duration-300 group-hover:scale-x-100" />
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-phoebe-green transition-transform group-hover:scale-110">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span className="text-lg font-bold text-phoebe-green-deep">
                    Location
                  </span>
                  <span className="text-xs text-phoebe-anthracite/50">
                    Location courte ou longue duree
                  </span>
                </Link>
              )}

              {hasVente && (
                <Link
                  href={`/catalogue/groupe/${encodeURIComponent(groupKey)}?mode=achat`}
                  className="group relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl border-2 border-phoebe-gold/15 bg-phoebe-gold/5 px-6 py-8 text-center transition-all hover:border-phoebe-gold hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-phoebe-gold/40"
                >
                  <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-phoebe-gold transition-transform duration-300 group-hover:scale-x-100" />
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-phoebe-gold transition-transform group-hover:scale-110">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                  <span className="text-lg font-bold text-phoebe-gold">
                    Achat
                  </span>
                  <span className="text-xs text-phoebe-anthracite/50">
                    Acheter ce vehicule
                  </span>
                </Link>
              )}

              {!hasLocation && !hasVente && (
                <p className="col-span-2 text-center text-sm text-phoebe-anthracite/50">
                  Ce vehicule n&apos;est pas encore disponible a la location ou a la vente.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
