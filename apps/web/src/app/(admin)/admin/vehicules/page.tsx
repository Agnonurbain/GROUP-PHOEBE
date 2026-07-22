import type { Metadata } from "next"
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { CAT_LABELS } from "@/lib/constants";
import { ScrollReveal } from "@/components/effects";

export const metadata: Metadata = {
  title: "Véhicules — Administration",
  description: "Gérez la flotte de véhicules GROUP PHOEBE — ajout, modification, disponibilité.",
}

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  disponible: { label: "Disponible", color: "bg-phoebe-green/10 text-phoebe-green-deep" },
  reserve: { label: "Réservé", color: "bg-phoebe-gold/10 text-phoebe-gold" },
  loue: { label: "Loué", color: "bg-blue-50 text-blue-700" },
  vendu: { label: "Vendu", color: "bg-phoebe-anthracite/10 text-phoebe-anthracite" },
  indisponible: { label: "Indisponible", color: "bg-phoebe-anthracite/10 text-phoebe-anthracite/50" },
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Vehicules
        </h1>
        <Link
          href="/admin/vehicules/nouveau"
          className="rounded-xl bg-phoebe-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-md"
        >
          + Nouveau vehicule
        </Link>
      </div>

      {vehicules && vehicules.length > 0 ? (
        <ScrollReveal>
        <div className="overflow-x-auto rounded-2xl border border-phoebe-pearl bg-white shadow-sm">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b border-phoebe-pearl bg-phoebe-pearl/30">
              <tr>
                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">
                  Photo
                </th>
                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">
                  Vehicule
                </th>
                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">
                  Categorie
                </th>
                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">
                  Prix/jour
                </th>
                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">
                  Localisation
                </th>
                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">
                  Statut
                </th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-phoebe-pearl/70">
              {vehicules.map((v) => {
                const s = STATUT_LABELS[v.statut] ?? STATUT_LABELS.indisponible;
                return (
                  <tr key={v.id} className="transition-colors hover:bg-phoebe-pearl/40">
                    <td className="px-5 py-3.5">
                      {firstPhoto.has(v.id) ? (
                        <div className="group/img relative h-10 w-14 overflow-hidden rounded-lg ring-1 ring-black/5">
                          <Image
                            src={firstPhoto.get(v.id)!}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover transition-transform duration-500 group-hover/img:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-phoebe-pearl text-xs text-phoebe-anthracite/30">
                          —
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-phoebe-anthracite">
                        {v.marque} {v.modele}
                        {v.annee ? ` (${v.annee})` : ""}
                      </span>
                      <span className="block text-xs text-phoebe-anthracite/40">
                        {[
                          v.etat === "neuf" ? "Neuf" : "Occasion",
                          v.carburant,
                          v.kilometrage ? `${Number(v.kilometrage).toLocaleString("fr-FR")} km` : null,
                          v.nb_places ? `${v.nb_places} pl.` : null,
                        ].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-phoebe-anthracite/70">
                      {CAT_LABELS[v.categorie] ?? v.categorie}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-phoebe-anthracite/70">
                      {v.prix_journalier
                        ? `${Number(v.prix_journalier).toLocaleString("fr-FR")} FCFA`
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-phoebe-anthracite/50">
                      {v.localisation ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.color}`}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/vehicules/${v.id}`}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-phoebe-green transition-all hover:bg-phoebe-green/10 hover:text-phoebe-green-deep"
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
        </ScrollReveal>
      ) : (
        <p className="text-sm text-phoebe-anthracite/50">
          Aucun vehicule enregistre.
        </p>
      )}
    </div>
  );
}
