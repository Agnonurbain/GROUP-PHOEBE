import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { FavoriButton } from "@/components/favori-button";
import { createClient } from "@/lib/supabase/server";

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

export default async function VehiculeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: v } = await supabase
    .from("vehicules")
    .select("*")
    .eq("id", id)
    .single();

  if (!v || v.statut === "indisponible") notFound();

  const { data: photos } = await supabase
    .from("vehicule_photos")
    .select("*")
    .eq("vehicule_id", id)
    .order("ordre", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isFavori = false;
  if (user) {
    const { data } = await supabase
      .from("favoris")
      .select("id")
      .eq("user_id", user.id)
      .eq("vehicule_id", id)
      .maybeSingle();
    isFavori = !!data;
  }

  const s = STATUT_LABELS[v.statut];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/catalogue"
          className="mb-4 inline-block text-sm text-phoebe-anthracite/60 hover:text-phoebe-green"
        >
          ← Retour au catalogue
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Photos */}
          <div className="space-y-3">
            {photos && photos.length > 0 ? (
              <>
                <img
                  src={photos[0].url}
                  alt={`${v.marque} ${v.modele}`}
                  className="w-full rounded-xl object-cover"
                />
                {photos.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {photos.slice(1).map((p) => (
                      <img
                        key={p.id}
                        src={p.url}
                        alt=""
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-phoebe-pearl text-phoebe-anthracite/30">
                Pas de photo
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold text-phoebe-anthracite">
                  {v.marque} {v.modele}
                </h1>
                <div className="flex items-center gap-2">
                  {s && (
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${s.color}`}
                    >
                      {s.label}
                    </span>
                  )}
                  {user && (
                    <FavoriButton vehiculeId={v.id} isFavori={isFavori} />
                  )}
                </div>
              </div>
              <p className="mt-1 text-sm text-phoebe-anthracite/50">
                {CAT_LABELS[v.categorie] ?? v.categorie}
                {v.annee ? ` · ${v.annee}` : ""}
              </p>
            </div>

            {/* Tarifs */}
            <div className="rounded-xl bg-phoebe-pearl p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
                Tarifs
              </h2>
              <div className="space-y-2">
                {v.prix_journalier && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-phoebe-anthracite/70">
                      Location journalière
                    </span>
                    <span className="text-lg font-bold text-phoebe-green">
                      {formatPrice(v.prix_journalier)}
                    </span>
                  </div>
                )}
                {v.prix_mensuel && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-phoebe-anthracite/70">
                      Location mensuelle
                    </span>
                    <span className="font-semibold text-phoebe-anthracite">
                      {formatPrice(v.prix_mensuel)}
                    </span>
                  </div>
                )}
                {v.prix_vente && (
                  <div className="flex items-baseline justify-between border-t border-phoebe-anthracite/10 pt-2">
                    <span className="text-sm text-phoebe-anthracite/70">
                      Prix de vente
                    </span>
                    <span className="font-semibold text-phoebe-gold">
                      {formatPrice(v.prix_vente)}
                    </span>
                  </div>
                )}
              </div>
              {v.chauffeur_disponible && (
                <p className="mt-3 rounded-lg bg-phoebe-green/10 px-3 py-2 text-sm text-phoebe-green-deep">
                  Option chauffeur disponible — supplément tarifaire applicable
                  au moment de la réservation.
                </p>
              )}
            </div>

            {/* Caractéristiques */}
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
                Caractéristiques
              </h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {v.nb_places && (
                  <>
                    <dt className="text-phoebe-anthracite/60">Places</dt>
                    <dd className="font-medium text-phoebe-anthracite">
                      {v.nb_places}
                    </dd>
                  </>
                )}
                {v.boite && (
                  <>
                    <dt className="text-phoebe-anthracite/60">Boîte</dt>
                    <dd className="font-medium text-phoebe-anthracite">
                      {v.boite === "automatique" ? "Automatique" : "Manuelle"}
                    </dd>
                  </>
                )}
                {v.carburant && (
                  <>
                    <dt className="text-phoebe-anthracite/60">Carburant</dt>
                    <dd className="font-medium text-phoebe-anthracite">
                      {v.carburant}
                    </dd>
                  </>
                )}
                {v.kilometrage != null && (
                  <>
                    <dt className="text-phoebe-anthracite/60">Kilométrage</dt>
                    <dd className="font-medium text-phoebe-anthracite">
                      {Number(v.kilometrage).toLocaleString("fr-FR")} km
                    </dd>
                  </>
                )}
                <dt className="text-phoebe-anthracite/60">Climatisation</dt>
                <dd className="font-medium text-phoebe-anthracite">
                  {v.climatisation ? "Oui" : "Non"}
                </dd>
                {v.localisation && (
                  <>
                    <dt className="text-phoebe-anthracite/60">Localisation</dt>
                    <dd className="font-medium text-phoebe-anthracite">
                      {v.localisation}
                    </dd>
                  </>
                )}
              </dl>
            </div>

            {/* Description */}
            {v.description && (
              <div>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
                  Description
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-phoebe-anthracite/80">
                  {v.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
