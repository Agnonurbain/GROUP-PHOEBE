import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal, AnimatedCounter } from "@/components/effects";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
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

  const { periode: rawPeriode } = await searchParams;
  const periodeJours = rawPeriode === "7" ? 7 : rawPeriode === "90" ? 90 : 30;

  const now = new Date();
  const ilXj = new Date(now.getTime() - periodeJours * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalDemandes30j },
    { count: acceptees30j },
    { count: refusees30j },
    { count: annulees30j },
    { count: terminees30j },
    { count: totalClients },
    { count: clientsVerifies },
    { data: demandes30j },
    { count: enAttenteCount },
    { data: demandesCA },
    { count: propositionsEnAttente },
    { count: remboursementsEnAttente },
  ] = await Promise.all([
    supabase
      .from("demandes_transport")
      .select("id", { count: "exact", head: true })
      .gte("created_at", ilXj),
    supabase
      .from("demandes_transport")
      .select("id", { count: "exact", head: true })
      .eq("statut", "acceptee")
      .gte("created_at", ilXj),
    supabase
      .from("demandes_transport")
      .select("id", { count: "exact", head: true })
      .eq("statut", "refusee")
      .gte("created_at", ilXj),
    supabase
      .from("demandes_transport")
      .select("id", { count: "exact", head: true })
      .eq("statut", "annulee")
      .gte("created_at", ilXj),
    supabase
      .from("demandes_transport")
      .select("id", { count: "exact", head: true })
      .eq("statut", "terminee")
      .gte("created_at", ilXj),
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
      .gte("created_at", ilXj),
    supabase
      .from("demandes_transport")
      .select("id", { count: "exact", head: true })
      .eq("statut", "en_attente_validation"),
    supabase
      .from("demandes_transport")
      .select("montant")
      .in("statut", ["acceptee", "en_cours", "terminee"])
      .gte("created_at", ilXj),
    supabase
      .from("propositions_prix")
      .select("id", { count: "exact", head: true })
      .eq("statut", "en_attente"),
    supabase
      .from("paiements")
      .select("id", { count: "exact", head: true })
      .eq("statut", "remboursement_requis"),
  ]);

  const caBrut30j = (demandesCA ?? []).reduce(
    (sum, d) => sum + (Number(d.montant) || 0),
    0
  );
  const alertEnAttente = enAttenteCount ?? 0;

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

  const PERIODE_LABELS: Record<number, string> = { 7: "7 jours", 30: "30 jours", 90: "90 jours" };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Tableau de bord — Transport
        </h1>
        <div className="flex gap-1.5">
          {[7, 30, 90].map((p) => (
            <a
              key={p}
              href={`/admin?periode=${p}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                periodeJours === p
                  ? "bg-phoebe-green text-white shadow-sm"
                  : "border border-phoebe-pearl text-phoebe-anthracite/60 hover:bg-phoebe-pearl"
              }`}
            >
              {PERIODE_LABELS[p]}
            </a>
          ))}
        </div>
      </div>

      {(alertEnAttente > 0 || (propositionsEnAttente ?? 0) > 0 || (remboursementsEnAttente ?? 0) > 0) && (
        <div className="space-y-3">
          {alertEnAttente > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-phoebe-gold/30 bg-phoebe-gold/5 px-5 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-phoebe-gold">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="text-sm font-medium text-phoebe-gold">
                {alertEnAttente} demande{alertEnAttente > 1 ? "s" : ""} en attente de validation
              </p>
              <a href="/admin/demandes" className="ml-auto text-xs font-semibold text-phoebe-gold hover:underline">
                Voir
              </a>
            </div>
          )}
          {(propositionsEnAttente ?? 0) > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-phoebe-green/30 bg-phoebe-green/5 px-5 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-phoebe-green">
                <polyline points="20 12 12 4 4 12"/><line x1="12" y1="4" x2="12" y2="20"/>
              </svg>
              <p className="text-sm font-medium text-phoebe-green-deep">
                {propositionsEnAttente} proposition{(propositionsEnAttente ?? 0) > 1 ? "s" : ""} de prix à valider
              </p>
              <a href="/admin/propositions" className="ml-auto text-xs font-semibold text-phoebe-green-deep hover:underline">
                Voir
              </a>
            </div>
          )}
          {(remboursementsEnAttente ?? 0) > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-error/20 bg-error/5 px-5 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-error">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm font-medium text-error">
                {remboursementsEnAttente} remboursement{(remboursementsEnAttente ?? 0) > 1 ? "s" : ""} en attente
              </p>
              <a href="/admin/remboursements" className="ml-auto text-xs font-semibold text-error hover:underline">
                Voir
              </a>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <ScrollReveal delay={0}>
          <StatCard label="CA brut (30j)" value={`${(caBrut30j / 1000).toFixed(0)}k`} sub={`${caBrut30j.toLocaleString("fr-FR")} FCFA`} accent="gold" />
        </ScrollReveal>
        <ScrollReveal delay={0.05}>
          <StatCard label="Demandes (30j)" value={<AnimatedCounter target={total} />} accent="green" />
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <StatCard label="Taux de conversion" value={<AnimatedCounter target={tauxConversion} suffix="%" />} sub="demandes acceptees ou terminees" accent="green" />
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <StatCard label="Delai moyen traitement" value={`${delaiMoyenH}h`} sub="creation a premiere action" accent="gold" />
        </ScrollReveal>
        <ScrollReveal delay={0.3}>
          <StatCard label="Taux d'acceptation" value={<AnimatedCounter target={tauxAcceptation} suffix="%" />} accent="green" />
        </ScrollReveal>
        <ScrollReveal delay={0.4}>
          <StatCard label="Taux d'annulation" value={<AnimatedCounter target={tauxAnnulation} suffix="%" />} accent="gold" />
        </ScrollReveal>
        <ScrollReveal delay={0.5}>
          <StatCard label="Verification d'identite" value={<AnimatedCounter target={tauxVerification} suffix="%" />} sub={`${clientsVerifies ?? 0} / ${totalClients ?? 0} clients`} accent="gold" />
        </ScrollReveal>
      </div>

      {topVehicules.length > 0 && (
        <ScrollReveal delay={0.2}>
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-phoebe-anthracite">
            Top vehicules ({PERIODE_LABELS[periodeJours]})
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
        </ScrollReveal>
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
  value: React.ReactNode;
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
