import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";

const CAT_LABELS: Record<string, string> = {
  leger: "Véhicule léger",
  car: "Car",
  minibus: "Minibus",
};

export default async function ChoixPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: v } = await supabase
    .from("vehicules")
    .select("id, marque, modele, categorie, annee, nb_places, statut, prix_journalier, prix_mensuel, prix_vente, chauffeur_disponible, assurance_url")
    .eq("id", id)
    .single();

  if (!v || v.statut === "indisponible" || v.statut === "reserve") notFound();

  const { data: photos } = await supabase
    .from("vehicule_photos")
    .select("url")
    .eq("vehicule_id", id)
    .order("ordre", { ascending: true })
    .limit(1);

  const photo = photos?.[0]?.url;

  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  const hasLocation = !!(v.prix_journalier || v.prix_mensuel);
  const hasVente = !!v.prix_vente;

  if (!user) {
    redirect(`/inscription?redirect=/catalogue/${id}/choix`);
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/catalogue"
          className="mb-6 inline-block text-sm text-phoebe-anthracite/60 hover:text-phoebe-green"
        >
          ← Retour au catalogue
        </Link>

        <div className="overflow-hidden rounded-xl border border-phoebe-pearl bg-white shadow-sm">
          {photo && (
            <div className="relative aspect-[16/7] w-full">
              <Image
                src={photo}
                alt={`${v.marque} ${v.modele}`}
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="p-6">
            <h1 className="text-xl font-bold text-phoebe-anthracite">
              {v.marque} {v.modele}
            </h1>
            <p className="mt-1 text-sm text-phoebe-anthracite/50">
              {CAT_LABELS[v.categorie] ?? v.categorie}
              {v.annee ? ` · ${v.annee}` : ""}
              {v.nb_places ? ` · ${v.nb_places} places` : ""}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {v.assurance_url && (
                <span className="rounded bg-phoebe-green/10 px-2 py-0.5 text-xs text-phoebe-green-deep">
                  Véhicule assuré
                </span>
              )}
              {v.chauffeur_disponible && (
                <span className="rounded bg-phoebe-pearl px-2 py-0.5 text-xs text-phoebe-anthracite/50">
                  Chauffeur disponible
                </span>
              )}
            </div>

            <h2 className="mb-4 mt-6 text-center text-lg font-semibold text-phoebe-anthracite">
              Que souhaitez-vous faire ?
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {hasLocation && (
                <Link
                  href={`/catalogue/${v.id}?mode=location`}
                  className="flex flex-col items-center gap-3 rounded-xl border-2 border-phoebe-green/20 bg-phoebe-green/5 px-6 py-6 text-center transition-all hover:border-phoebe-green hover:bg-phoebe-green/10 hover:shadow-md"
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-phoebe-green">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span className="text-lg font-semibold text-phoebe-green-deep">
                    Location
                  </span>
                  <span className="text-xs text-phoebe-anthracite/50">
                    Location courte ou longue durée
                  </span>
                </Link>
              )}

              {hasVente && (
                <Link
                  href={`/catalogue/${v.id}?mode=achat`}
                  className="flex flex-col items-center gap-3 rounded-xl border-2 border-phoebe-gold/20 bg-phoebe-gold/5 px-6 py-6 text-center transition-all hover:border-phoebe-gold hover:bg-phoebe-gold/10 hover:shadow-md"
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-phoebe-gold">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                  <span className="text-lg font-semibold text-phoebe-gold">
                    Achat
                  </span>
                  <span className="text-xs text-phoebe-anthracite/50">
                    Acheter ce véhicule
                  </span>
                </Link>
              )}

              {!hasLocation && !hasVente && (
                <p className="col-span-2 text-center text-sm text-phoebe-anthracite/50">
                  Ce véhicule n&apos;est pas encore disponible à la location ou à la vente.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
