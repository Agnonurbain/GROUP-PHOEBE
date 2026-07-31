import type { Metadata } from "next"
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import { AVIS_STATUT_LABELS, AVIS_STATUT_COLORS, libelleReference } from "@/lib/avis";

export const metadata: Metadata = {
  title: "Avis clients — Administration",
  description: "Modérez les avis clients sur GROUP PHOEBE.",
}

function Etoiles({ note }: { note: number }) {
  return (
    <span className="text-phoebe-gold-dark" aria-label={`${note} sur 5`}>
      {"★".repeat(note)}{"☆".repeat(5 - note)}
    </span>
  );
}

export default async function AvisListPage() {
  const supabase = await createClient();

  const { data: avis } = await supabase
    .from("avis")
    .select("id, client_id, reference_table, note, titre, statut, created_at")
    .order("created_at", { ascending: false });

  const clientIds = [...new Set((avis ?? []).map((a) => a.client_id))];
  const { data: users } = clientIds.length
    ? await supabase.from("users").select("id, nom").in("id", clientIds)
    : { data: [] };
  const clientNoms = new Map((users ?? []).map((u) => [u.id, u.nom ?? "—"]));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Avis clients
        </h1>
      </div>

      {avis && avis.length > 0 ? (
        <ScrollReveal>
          <div className="overflow-x-auto rounded-2xl border border-phoebe-pearl bg-white shadow-sm">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-phoebe-pearl bg-phoebe-pearl/30">
                <tr>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Client</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Service</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Note</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Titre</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Statut</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Date</th>
                  <th scope="col" className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-phoebe-pearl/70">
                {avis.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-phoebe-pearl/40">
                    <td className="px-5 py-3.5 font-medium text-phoebe-anthracite">
                      {clientNoms.get(a.client_id) ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-phoebe-anthracite/70">
                      {libelleReference(a.reference_table)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Etoiles note={a.note} />
                    </td>
                    <td className="px-5 py-3.5 text-phoebe-anthracite/70">
                      {a.titre ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${AVIS_STATUT_COLORS[a.statut as keyof typeof AVIS_STATUT_COLORS] ?? ""}`}>
                        {AVIS_STATUT_LABELS[a.statut as keyof typeof AVIS_STATUT_LABELS]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-phoebe-anthracite/70">
                      {new Date(a.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/avis/${a.id}`}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-phoebe-green transition-all hover:bg-phoebe-green/10 hover:text-phoebe-green-deep"
                      >
                        Modérer
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
          Aucun avis pour le moment.
        </p>
      )}
    </div>
  );
}
