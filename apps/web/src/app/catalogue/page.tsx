import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  disponible: { label: "Disponible", color: "bg-phoebe-green/10 text-phoebe-green-deep" },
  reserve: { label: "Réservé", color: "bg-phoebe-gold/10 text-phoebe-gold" },
  loue: { label: "Loué", color: "bg-blue-50 text-blue-700" },
  vendu: { label: "Vendu", color: "bg-phoebe-anthracite/10 text-phoebe-anthracite" },
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

export default async function CataloguePage() {
  const supabase = await createClient();

  const { data: vehicules } = await supabase
    .from("vehicules")
    .select("*")
    .neq("statut", "indisponible")
    .order("created_at", { ascending: false });

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

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-phoebe-anthracite">
          Catalogue véhicules
        </h1>

        {vehicules && vehicules.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicules.map((v) => {
              const s = STATUT_LABELS[v.statut];
              const photo = firstPhoto.get(v.id);

              return (
                <div
                  key={v.id}
                  className="overflow-hidden rounded-xl border border-phoebe-pearl bg-white"
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt={`${v.marque} ${v.modele}`}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center bg-phoebe-pearl text-phoebe-anthracite/30">
                      Pas de photo
                    </div>
                  )}

                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="font-semibold text-phoebe-anthracite">
                          {v.marque} {v.modele}
                        </h2>
                        <p className="text-xs text-phoebe-anthracite/50">
                          {CAT_LABELS[v.categorie] ?? v.categorie}
                          {v.annee ? ` · ${v.annee}` : ""}
                          {v.nb_places ? ` · ${v.nb_places} places` : ""}
                        </p>
                      </div>
                      {s && (
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}
                        >
                          {s.label}
                        </span>
                      )}
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
        ) : (
          <p className="text-center text-phoebe-anthracite/50">
            Aucun véhicule disponible pour le moment.
          </p>
        )}
      </main>
    </>
  );
}
