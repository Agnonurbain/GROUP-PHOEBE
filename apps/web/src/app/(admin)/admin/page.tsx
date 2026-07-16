import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();

  if (profile?.role !== "proprietaire") redirect("/admin/demandes");

  const now = new Date();
  const il30j = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalDemandes30j },
    { count: acceptees30j },
    { count: refusees30j },
    { count: annulees30j },
    { count: terminees30j },
    { count: totalClients },
    { count: clientsVerifies },
    { data: demandes30j },
  ] = await Promise.all([
    supabase
      .from("demandes_transport")
      .select("id", { count: "exact", head: true })
      .gte("created_at", il30j),
    supabase
      .from("demandes_transport")
      .select("id", { count: "exact", head: true })
      .eq("statut", "acceptee")
      .gte("created_at", il30j),
    supabase
      .from("demandes_transport")
      .select("id", { count: "exact", head: true })
      .eq("statut", "refusee")
      .gte("created_at", il30j),
    supabase
      .from("demandes_transport")
      .select("id", { count: "exact", head: true })
      .eq("statut", "annulee")
      .gte("created_at", il30j),
    supabase
      .from("demandes_transport")
      .select("id", { count: "exact", head: true })
      .eq("statut", "terminee")
      .gte("created_at", il30j),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "client"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "client")
      .eq("statut_verification", "verifie"),
    supabase
      .from("demandes_transport")
      .select("created_at, updated_at, statut, vehicule_id")
      .in("statut", ["acceptee", "en_cours", "terminee"])
      .gte("created_at", il30j),
  ]);

  const total = totalDemandes30j ?? 0;
  const convertis = (acceptees30j ?? 0) + (terminees30j ?? 0);
  const tauxConversion = total > 0 ? Math.round((convertis / total) * 100) : 0;
  const tauxAcceptation = total > 0
    ? Math.round(((acceptees30j ?? 0) + (terminees30j ?? 0)) / total * 100)
    : 0;
  const tauxAnnulation = total > 0
    ? Math.round(((annulees30j ?? 0) / total) * 100)
    : 0;
  const tauxVerification =
    (totalClients ?? 0) > 0
      ? Math.round(((clientsVerifies ?? 0) / (totalClients ?? 1)) * 100)
      : 0;

  let delaiMoyenH = 0;
  if (demandes30j && demandes30j.length > 0) {
    const delais = demandes30j.map(
      (d) => (new Date(d.updated_at).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60)
    );
    delaiMoyenH = Math.round((delais.reduce((a, b) => a + b, 0) / delais.length) * 10) / 10;
  }

  const vehiculeCounts: Record<string, number> = {};
  if (demandes30j) {
    for (const d of demandes30j) {
      if (d.vehicule_id) {
        vehiculeCounts[d.vehicule_id] = (vehiculeCounts[d.vehicule_id] ?? 0) + 1;
      }
    }
  }
  const topVehiculeIds = Object.entries(vehiculeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  let topVehicules: { id: string; marque: string; modele: string; count: number }[] = [];
  if (topVehiculeIds.length > 0) {
    const { data: vehiculesData } = await supabase
      .from("vehicules")
      .select("id, marque, modele")
      .in("id", topVehiculeIds.map(([id]) => id));

    if (vehiculesData) {
      topVehicules = topVehiculeIds.map(([id, count]) => {
        const v = vehiculesData.find((veh) => veh.id === id);
        return {
          id,
          marque: v?.marque ?? "—",
          modele: v?.modele ?? "",
          count,
        };
      });
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-phoebe-anthracite">
        Tableau de bord — Transport
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Demandes (30j)" value={total} />
        <StatCard label="Taux de conversion" value={`${tauxConversion}%`} sub="demandes → acceptées ou terminées" />
        <StatCard label="Délai moyen traitement" value={`${delaiMoyenH}h`} sub="création → première action" />
        <StatCard label="Taux d'acceptation" value={`${tauxAcceptation}%`} />
        <StatCard label="Taux d'annulation" value={`${tauxAnnulation}%`} />
        <StatCard label="Vérification d'identité" value={`${tauxVerification}%`} sub={`${clientsVerifies ?? 0} / ${totalClients ?? 0} clients`} />
      </div>

      {topVehicules.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-phoebe-anthracite">
            Top véhicules (30 derniers jours)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-phoebe-pearl text-left text-xs uppercase tracking-wider text-phoebe-anthracite/40">
                  <th scope="col" className="pb-2 pr-4">Véhicule</th>
                  <th scope="col" className="pb-2 pr-4">Demandes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-phoebe-pearl">
                {topVehicules.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2 pr-4 text-phoebe-anthracite">
                      {v.marque} {v.modele}
                    </td>
                    <td className="py-2 pr-4 font-semibold text-phoebe-anthracite">
                      {v.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-phoebe-pearl bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-phoebe-anthracite/40">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-phoebe-anthracite">{value}</p>
      {sub && (
        <p className="mt-0.5 text-xs text-phoebe-anthracite/50">{sub}</p>
      )}
    </div>
  );
}
