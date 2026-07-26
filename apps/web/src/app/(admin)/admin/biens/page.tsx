import type { Metadata } from "next"
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import {
  typeBienLabel,
  statutBienLabel,
  TRANSACTION_LABELS,
} from "@/lib/immobilier";

export const metadata: Metadata = {
  title: "Biens immobiliers — Administration",
  description: "Gérez le catalogue immobilier GROUP PHOEBE — ajout, modification, disponibilité.",
}

const STATUT_COLORS: Record<string, string> = {
  disponible: "bg-phoebe-green/10 text-phoebe-green-deep",
  reserve: "bg-phoebe-gold/10 text-phoebe-gold-dark",
  loue: "bg-blue-50 text-blue-700",
  vendu: "bg-phoebe-anthracite/10 text-phoebe-anthracite",
  indisponible: "bg-phoebe-anthracite/10 text-phoebe-anthracite/70",
};

export default async function BiensListPage() {
  const supabase = await createClient();

  const { data: biens } = await supabase
    .from("biens")
    .select("*")
    .order("created_at", { ascending: false });

  const ids = biens?.map((b) => b.id) ?? [];

  const { data: allPhotos } = ids.length
    ? await supabase
        .from("bien_medias")
        .select("bien_id, url")
        .in("bien_id", ids)
        .eq("type", "photo")
        .order("ordre", { ascending: true })
    : { data: [] };

  const firstPhoto = new Map<string, string>();
  for (const p of allPhotos ?? []) {
    if (!firstPhoto.has(p.bien_id)) firstPhoto.set(p.bien_id, p.url);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Biens immobiliers
        </h1>
        <Link
          href="/admin/biens/nouveau"
          className="rounded-xl bg-phoebe-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-md"
        >
          + Nouveau bien
        </Link>
      </div>

      {biens && biens.length > 0 ? (
        <ScrollReveal>
          <div className="overflow-x-auto rounded-2xl border border-phoebe-pearl bg-white shadow-sm">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-phoebe-pearl bg-phoebe-pearl/30">
                <tr>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Photo</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Bien</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Transaction</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Prix</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Localisation</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Statut</th>
                  <th scope="col" className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-phoebe-pearl/70">
                {biens.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-phoebe-pearl/40">
                    <td className="px-5 py-3.5">
                      {firstPhoto.has(b.id) ? (
                        <div className="group/img relative h-10 w-14 overflow-hidden rounded-lg ring-1 ring-black/5">
                          <Image
                            src={firstPhoto.get(b.id)!}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover transition-transform duration-500 group-hover/img:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-phoebe-pearl text-xs text-phoebe-anthracite/70">
                          —
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-phoebe-anthracite">
                        {typeBienLabel(b.type)}
                      </span>
                      <span className="block text-xs text-phoebe-anthracite/70">
                        {[
                          b.surface_m2 ? `${Number(b.surface_m2).toLocaleString("fr-FR")} m²` : null,
                          b.nb_chambres ? `${b.nb_chambres} ch.` : null,
                        ].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-phoebe-anthracite/70">
                      {TRANSACTION_LABELS[b.transaction] ?? b.transaction}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-phoebe-anthracite/70">
                      {Number(b.prix).toLocaleString("fr-FR")} FCFA
                    </td>
                    <td className="px-5 py-3.5 text-xs text-phoebe-anthracite/70">
                      {b.localisation}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUT_COLORS[b.statut] ?? STATUT_COLORS.indisponible}`}>
                        {statutBienLabel(b.statut)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/biens/${b.id}`}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-phoebe-green transition-all hover:bg-phoebe-green/10 hover:text-phoebe-green-deep"
                      >
                        Modifier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      ) : (
        <p className="text-sm text-phoebe-anthracite/70">
          Aucun bien enregistré. Cliquez sur « Nouveau bien » pour alimenter le catalogue.
        </p>
      )}
    </div>
  );
}
