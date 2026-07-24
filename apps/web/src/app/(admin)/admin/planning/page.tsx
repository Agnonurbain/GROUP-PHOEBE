import type { Metadata } from "next"
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import { CalendrierMensuel, type EvenementCalendrier } from "../vehicules/[id]/disponibilites/calendrier";

export const metadata: Metadata = {
  title: "Planning — Administration",
  description: "Vue calendaire globale de tous les véhicules GROUP PHOEBE.",
}

function parsePeriodeRange(raw: string | null): { debut: string; fin: string } | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[\[\]()]/g, "");
  const [debut, fin] = cleaned.split(",");
  if (!debut || !fin) return null;
  return { debut: debut.trim(), fin: fin.trim() };
}

export default async function PlanningPage() {
  const supabase = await createClient();

  const { data: vehicules } = await supabase
    .from("vehicules")
    .select("id, marque, modele, categorie")
    .order("marque", { ascending: true });

  const vehiculeIds = vehicules?.map((v) => v.id) ?? [];

  const { data: allBlocages } = vehiculeIds.length > 0
    ? await supabase
        .from("disponibilites_vehicule")
        .select("*, vehicules!inner(marque, modele)")
        .in("vehicule_id", vehiculeIds)
        .order("periode", { ascending: true })
    : { data: [] };

  const evenementsParVehicule = new Map<string, EvenementCalendrier[]>();

  for (const b of allBlocages ?? []) {
    const parsed = parsePeriodeRange(b.periode);
    if (!parsed) continue;

    const v = b.vehicules as { marque: string; modele: string } | null;
    let titre = v ? `${v.marque} ${v.modele}` : "—";
    if (b.type === "reservation") titre += " (résa)";
    else if (b.type === "maintenance") titre += " (maintenance)";
    else titre += " (bloqué)";

    const evt: EvenementCalendrier = {
      id: b.id,
      debut: parsed.debut,
      fin: parsed.fin,
      type: b.type as "reservation" | "maintenance" | "bloque",
      titre,
    };

    const arr = evenementsParVehicule.get(b.vehicule_id) ?? [];
    arr.push(evt);
    evenementsParVehicule.set(b.vehicule_id, arr);
  }

  const allEvenements: EvenementCalendrier[] = [];
  for (const arr of evenementsParVehicule.values()) {
    allEvenements.push(...arr);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ScrollReveal variant="fade-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
              Planning
            </h1>
            <p className="mt-1 text-sm text-phoebe-anthracite/70">
              Vue calendaire globale — réservations, maintenances et blocages
            </p>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.1}>
        <CalendrierMensuel evenements={allEvenements} />
      </ScrollReveal>

      <div className="flex flex-wrap gap-4 text-xs text-phoebe-anthracite/70">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
          Réservation
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
          Maintenance
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-400" />
          Bloqué
        </span>
      </div>

      <ScrollReveal variant="fade-up" delay={0.2}>
        <div className="overflow-x-auto rounded-2xl border border-phoebe-pearl bg-white shadow-sm">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-phoebe-pearl bg-phoebe-pearl/30">
              <tr>
                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">
                  Véhicule
                </th>
                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">
                  Catégorie
                </th>
                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">
                  Événements
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-phoebe-pearl/70">
              {vehicules?.map((v) => {
                const evts = evenementsParVehicule.get(v.id) ?? [];
                return (
                  <tr key={v.id} className="transition-colors hover:bg-phoebe-pearl/40">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/vehicules/${v.id}/disponibilites`}
                        className="font-semibold text-phoebe-anthracite hover:text-phoebe-green"
                      >
                        {v.marque} {v.modele}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-phoebe-anthracite/70 capitalize">
                      {v.categorie}
                    </td>
                    <td className="px-5 py-3.5">
                      {evts.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {evts.slice(0, 5).map((e) => {
                            const colors: Record<string, string> = {
                              reservation: "bg-blue-50 text-blue-700 border-blue-200",
                              maintenance: "bg-amber-50 text-amber-700 border-amber-200",
                              bloque: "bg-gray-50 text-gray-600 border-gray-200",
                            };
                            return (
                              <span
                                key={e.id}
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${colors[e.type] ?? colors.bloque}`}
                              >
                                {new Date(e.debut).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                                {" → "}
                                {new Date(e.fin).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                              </span>
                            );
                          })}
                          {evts.length > 5 && (
                            <span className="text-[10px] text-phoebe-anthracite/70">
                              +{evts.length - 5}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-phoebe-anthracite/70">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ScrollReveal>
    </div>
  );
}
