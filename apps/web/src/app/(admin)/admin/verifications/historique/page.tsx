import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import { BackLink } from "@/components/back-link";

export default async function HistoriqueVerificationsPage() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const currentUser = claimsData?.claims;
  if (!currentUser) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", currentUser.sub)
    .single();

  if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
    return null;
  }

  const isProprietaire = profile.role === "proprietaire";

  let query = supabase
    .from("users")
    .select("id, nom, email, telephone, statut_verification, verifie_par, motif_rejet, updated_at")
    .eq("role", "client")
    .in("statut_verification", ["verifie", "rejete"]);

  if (!isProprietaire) {
    query = query.eq("verifie_par", currentUser.sub);
  }

  const { data: verifications } = await query.order("updated_at", { ascending: false });
  const items = verifications ?? [];

  const staffIds = [
    ...new Set(items.map((u) => u.verifie_par).filter(Boolean) as string[]),
  ];

  const staffMap: Record<string, { nom: string; role: string }> = {};
  if (staffIds.length > 0) {
    const { data: staffList } = await supabase
      .from("users")
      .select("id, nom, role")
      .in("id", staffIds);
    for (const s of staffList ?? []) {
      staffMap[s.id] = { nom: s.nom ?? "—", role: s.role };
    }
  }

  const totalVerified = items.filter((u) => u.statut_verification === "verifie").length;
  const totalRejected = items.filter((u) => u.statut_verification === "rejete").length;
  const total = items.length;

  const verifiedPct = total > 0 ? Math.round((totalVerified / total) * 100) : 0;
  const rejectedPct = total > 0 ? Math.round((totalRejected / total) * 100) : 0;

  const byStaff: Record<string, { nom: string; role: string; verified: number; rejected: number }> = {};
  for (const item of items) {
    const sid = item.verifie_par;
    if (!sid) continue;
    if (!byStaff[sid]) {
      const info = staffMap[sid];
      byStaff[sid] = {
        nom: sid === currentUser.sub ? "Moi" : (info?.nom ?? "—"),
        role: info?.role ?? "—",
        verified: 0,
        rejected: 0,
      };
    }
    if (item.statut_verification === "verifie") byStaff[sid].verified++;
    else byStaff[sid].rejected++;
  }

  const staffStats = Object.entries(byStaff).sort(
    ([, a], [, b]) => (b.verified + b.rejected) - (a.verified + a.rejected)
  );

  const maxStaffTotal = Math.max(...staffStats.map(([, s]) => s.verified + s.rejected), 1);

  const last7Months = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (6 - i));
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const monthlyData = last7Months.map(({ year, month }) => {
    const monthItems = items.filter((item) => {
      if (!item.updated_at) return false;
      const d = new Date(item.updated_at);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return {
      label: new Date(year, month).toLocaleDateString("fr-FR", { month: "short" }),
      verified: monthItems.filter((u) => u.statut_verification === "verifie").length,
      rejected: monthItems.filter((u) => u.statut_verification === "rejete").length,
    };
  });

  const maxMonthly = Math.max(...monthlyData.map((m) => m.verified + m.rejected), 1);

  return (
    <div className="space-y-8">
      <ScrollReveal variant="fade-up">
        <div>
          <BackLink href="/admin/verifications" label="Vérifications" />
          <h1 className="mt-2 text-2xl font-bold text-phoebe-anthracite">
            Historique des vérifications
          </h1>
          <p className="mt-1 text-sm text-phoebe-anthracite/60">
            {isProprietaire
              ? "Vue d'ensemble de toutes les vérifications traitées par l'équipe."
              : "Historique de vos vérifications traitées."}
          </p>
        </div>
      </ScrollReveal>

      {/* Stats cards */}
      <ScrollReveal variant="fade-up" delay={0.1}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm border-l-4 border-l-phoebe-anthracite/30">
          <p className="text-xs font-semibold uppercase tracking-wider text-phoebe-anthracite/50">Total traitées</p>
          <p className="mt-2 text-3xl font-bold text-phoebe-anthracite">{total}</p>
        </div>
        <div className="rounded-2xl border border-phoebe-green/20 bg-phoebe-green/5 p-5 shadow-sm border-l-4 border-l-phoebe-green">
          <p className="text-xs font-semibold uppercase tracking-wider text-phoebe-green-deep">Validées</p>
          <p className="mt-2 text-3xl font-bold text-phoebe-green">{totalVerified}</p>
          <p className="mt-1 text-xs text-phoebe-anthracite/50">{verifiedPct}%</p>
        </div>
        <div className="rounded-2xl border border-error/20 bg-error/5 p-5 shadow-sm border-l-4 border-l-error">
          <p className="text-xs font-semibold uppercase tracking-wider text-error">Rejetées</p>
          <p className="mt-2 text-3xl font-bold text-error">{totalRejected}</p>
          <p className="mt-1 text-xs text-phoebe-anthracite/50">{rejectedPct}%</p>
        </div>
      </div>
      </ScrollReveal>

      {/* Donut chart */}
      {total > 0 && (
        <ScrollReveal variant="fade-up" delay={0.15}>
        <div className="rounded-2xl border border-phoebe-pearl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-phoebe-anthracite">
            Répartition
          </h2>
          <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:gap-10">
            <div
              className="relative flex h-32 w-32 items-center justify-center rounded-full md:h-40 md:w-40"
              style={{
                background: `conic-gradient(
                  var(--color-phoebe-green) 0% ${verifiedPct}%,
                  var(--color-error) ${verifiedPct}% 100%
                )`,
              }}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white md:h-24 md:w-24">
                <span className="text-2xl font-bold text-phoebe-anthracite">{total}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-phoebe-green" />
                <span className="text-sm text-phoebe-anthracite">
                  Validées — {totalVerified} ({verifiedPct}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-error" />
                <span className="text-sm text-phoebe-anthracite">
                  Rejetées — {totalRejected} ({rejectedPct}%)
                </span>
              </div>
            </div>
          </div>
        </div>
        </ScrollReveal>
      )}

      {/* Monthly bar chart */}
      <ScrollReveal variant="fade-up" delay={0.2}>
      <div className="rounded-2xl border border-phoebe-pearl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-phoebe-anthracite">
          Activité mensuelle
        </h2>
        <div className="flex items-end gap-2 sm:gap-3" style={{ height: "clamp(140px, 25vw, 180px)" }}>
          {monthlyData.map((m, i) => {
            const barH = ((m.verified + m.rejected) / maxMonthly) * 140;
            const verH = barH > 0 ? (m.verified / (m.verified + m.rejected)) * barH : 0;
            const rejH = barH - verH;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-medium text-phoebe-anthracite/60">
                  {m.verified + m.rejected || ""}
                </span>
                <div className="flex w-full flex-col items-center">
                  {rejH > 0 && (
                    <div
                      className="w-full max-w-8 rounded-t bg-error/80"
                      style={{ height: rejH }}
                    />
                  )}
                  {verH > 0 && (
                    <div
                      className={`w-full max-w-8 bg-phoebe-green ${rejH > 0 ? "" : "rounded-t"} rounded-b`}
                      style={{ height: verH }}
                    />
                  )}
                  {barH === 0 && (
                    <div className="w-full max-w-8 rounded bg-phoebe-pearl" style={{ height: 4 }} />
                  )}
                </div>
                <span className="text-xs text-phoebe-anthracite/50">{m.label}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-phoebe-anthracite/60">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-phoebe-green" /> Validées
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-error/80" /> Rejetées
          </span>
        </div>
      </div>
      </ScrollReveal>

      {/* Per-staff breakdown (proprietaire only) */}
      {isProprietaire && staffStats.length > 0 && (
        <ScrollReveal variant="fade-up" delay={0.25}>
        <div className="rounded-2xl border border-phoebe-pearl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-phoebe-anthracite">
            Par membre du staff
          </h2>
          <div className="space-y-4">
            {staffStats.map(([id, s]) => {
              const staffTotal = s.verified + s.rejected;
              const verWidth = (s.verified / maxStaffTotal) * 100;
              const rejWidth = (s.rejected / maxStaffTotal) * 100;
              const roleLabel = s.role === "proprietaire" ? "Propriétaire" : "Opérateur";
              return (
                <div key={id}>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-phoebe-anthracite">
                        {s.nom}
                      </span>
                      <span className="rounded-full bg-phoebe-pearl px-2 py-0.5 text-xs text-phoebe-anthracite/60">
                        {roleLabel}
                      </span>
                    </div>
                    <span className="text-sm text-phoebe-anthracite/60">
                      {staffTotal} ({s.verified}V / {s.rejected}R)
                    </span>
                  </div>
                  <div className="flex h-5 overflow-hidden rounded-full bg-phoebe-pearl">
                    {verWidth > 0 && (
                      <div
                        className="h-full bg-phoebe-green transition-all"
                        style={{ width: `${verWidth}%` }}
                      />
                    )}
                    {rejWidth > 0 && (
                      <div
                        className="h-full bg-error/80 transition-all"
                        style={{ width: `${rejWidth}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </ScrollReveal>
      )}

      {/* Recent history table */}
      {items.length > 0 && (
        <ScrollReveal variant="fade-up" delay={0.3}>
        <div className="rounded-2xl border border-phoebe-pearl bg-white shadow-sm">
          <div className="border-b border-phoebe-pearl px-6 py-4">
            <h2 className="text-lg font-semibold text-phoebe-anthracite">
              Détail des vérifications
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="border-b border-phoebe-pearl bg-phoebe-pearl/30">
                <tr>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">Client</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">Contact</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">Statut</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">Traité par</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">Date</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">Motif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-phoebe-pearl/70">
                {items.map((item) => {
                  const staffId = item.verifie_par;
                  const staffInfo = staffId ? staffMap[staffId] : null;
                  const staffLabel = staffId
                    ? staffId === currentUser.sub
                      ? "Moi"
                      : staffInfo
                        ? `${staffInfo.nom} (${staffInfo.role === "proprietaire" ? "Propriétaire" : "Opérateur"})`
                        : "—"
                    : "—";

                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-phoebe-anthracite">{item.nom}</td>
                      <td className="px-4 py-3 text-phoebe-anthracite/70">
                        {[item.telephone, item.email].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {item.statut_verification === "verifie" ? (
                          <span className="inline-flex items-center rounded-full bg-phoebe-green/10 px-2 py-0.5 text-xs font-semibold text-phoebe-green">
                            Validée
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-error/10 px-2 py-0.5 text-xs font-semibold text-error">
                            Rejetée
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-phoebe-anthracite/70">{staffLabel}</td>
                      <td className="px-4 py-3 text-phoebe-anthracite/70">
                        {item.updated_at
                          ? new Date(item.updated_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-phoebe-anthracite/70">
                        {item.motif_rejet ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </ScrollReveal>
      )}

      {items.length === 0 && (
        <ScrollReveal variant="fade-up" delay={0.15}>
          <div className="rounded-xl border border-phoebe-pearl bg-white p-8 text-center">
            <p className="text-phoebe-anthracite/50">Aucune vérification traitée pour le moment.</p>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
