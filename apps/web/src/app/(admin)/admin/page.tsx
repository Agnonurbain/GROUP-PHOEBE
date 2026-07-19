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
    <div className="space-y-10">
      <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
        Tableau de bord — Transport
      </h1>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Demandes (30j)" value={total} accent="green" />
        <StatCard label="Taux de conversion" value={`${tauxConversion}%`} sub="demandes acceptees ou terminees" accent="green" />
        <StatCard label="Delai moyen traitement" value={`${delaiMoyenH}h`} sub="creation a premiere action" accent="gold" />
        <StatCard label="Taux d'acceptation" value={`${tauxAcceptation}%`} accent="green" />
        <StatCard label="Taux d'annulation" value={`${tauxAnnulation}%`} accent="gold" />
        <StatCard label="Verification d'identite" value={`${tauxVerification}%`} sub={`${clientsVerifies ?? 0} / ${totalClients ?? 0} clients`} accent="gold" />
      </div>

      {topVehicules.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-phoebe-anthracite">
            Top vehicules (30 derniers jours)
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-phoebe-pearl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-phoebe-pearl text-left text-xs uppercase tracking-widest text-phoebe-anthracite/40">
                  <th scope="col" className="px-5 py-3.5">Vehicule</th>
                  <th scope="col" className="px-5 py-3.5">Demandes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-phoebe-pearl/70">
                {topVehicules.map((v) => (
                  <tr key={v.id} className="transition-colors hover:bg-phoebe-pearl/40">
                    <td className="px-5 py-3 text-phoebe-anthracite">
                      {v.marque} {v.modele}
                    </td>
                    <td className="px-5 py-3 font-bold text-phoebe-anthracite">
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
  accent = "green",
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "green" | "gold";
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-1 ${accent === "green" ? "before:bg-phoebe-green" : "before:bg-phoebe-gold"}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/40">
        {label}
      </p>
      <p className="mt-1.5 text-3xl font-bold text-phoebe-anthracite">{value}</p>
      {sub && (
        <p className="mt-1 text-xs text-phoebe-anthracite/50">{sub}</p>
      )}
    </div>
  );
}
