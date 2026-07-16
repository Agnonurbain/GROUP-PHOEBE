import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  disponible: { label: "Disponible", color: "bg-phoebe-green/10 text-phoebe-green-deep" },
  reserve: { label: "Réservé", color: "bg-phoebe-gold/10 text-phoebe-gold" },
  loue: { label: "Loué", color: "bg-blue-50 text-blue-700" },
  vendu: { label: "Vendu", color: "bg-phoebe-anthracite/10 text-phoebe-anthracite" },
  indisponible: { label: "Indisponible", color: "bg-gray-100 text-gray-500" },
};

const CAT_LABELS: Record<string, string> = {
  leger: "Léger",
  car: "Car",
  minibus: "Minibus",
};

export default async function VehiculesListPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user!.sub)
    .single();
  const isProprietaire = profile?.role === "proprietaire";

  const { data: vehicules } = await supabase
    .from("vehicules")
    .select("*")
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-phoebe-anthracite">
          Véhicules
        </h1>
        <Link
          href="/admin/vehicules/nouveau"
          className="rounded-lg bg-phoebe-green px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-phoebe-green-deep"
        >
          + Nouveau véhicule
        </Link>
      </div>

      {vehicules && vehicules.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-phoebe-pearl">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-phoebe-pearl/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-medium text-phoebe-anthracite/60">
                  Photo
                </th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-phoebe-anthracite/60">
                  Véhicule
                </th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-phoebe-anthracite/60">
                  Catégorie
                </th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-phoebe-anthracite/60">
                  Prix/jour
                </th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-phoebe-anthracite/60">
                  Statut
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-phoebe-pearl">
              {vehicules.map((v) => {
                const s = STATUT_LABELS[v.statut] ?? STATUT_LABELS.indisponible;
                return (
                  <tr key={v.id} className="hover:bg-phoebe-pearl/30">
                    <td className="px-4 py-3">
                      {firstPhoto.has(v.id) ? (
                        <div className="relative h-10 w-14 overflow-hidden rounded">
                          <Image
                            src={firstPhoto.get(v.id)!}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-14 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                          —
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-phoebe-anthracite">
                      {v.marque} {v.modele}
                      {v.annee ? ` (${v.annee})` : ""}
                    </td>
                    <td className="px-4 py-3 text-phoebe-anthracite/70">
                      {CAT_LABELS[v.categorie] ?? v.categorie}
                    </td>
                    <td className="px-4 py-3 text-phoebe-anthracite/70">
                      {v.prix_journalier
                        ? `${Number(v.prix_journalier).toLocaleString("fr-FR")} FCFA`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/vehicules/${v.id}`}
                        className="text-sm text-phoebe-green hover:text-phoebe-green-deep"
                      >
                        Modifier
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-phoebe-anthracite/50">
          Aucun véhicule enregistré.
        </p>
      )}
    </div>
  );
}
