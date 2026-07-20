import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import { MarquerRembourse } from "./marquer-rembourse";

export default async function RemboursementsPage() {
  const supabase = await createClient();

  const { data: paiements } = await supabase
    .from("paiements")
    .select("*")
    .eq("statut", "remboursement_requis")
    .order("created_at", { ascending: false });

  const { data: traites } = await supabase
    .from("paiements")
    .select("*")
    .in("statut", ["rembourse", "remboursement_partiel"])
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
        <ScrollReveal variant="fade-up">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
              Remboursements à traiter
            </h1>
            <p className="mt-2 text-sm text-phoebe-anthracite/55">
              Remboursements en attente : paiements tardifs, refus, annulations,
              ou libération de caution (CinetPay). À traiter manuellement.
            </p>
          </div>
        </ScrollReveal>

        {paiements && paiements.filter((p) => (Date.now() - new Date(p.created_at).getTime()) > 72 * 3600 * 1000).length > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-error/20 bg-error/5 px-5 py-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-error">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-sm font-medium text-error">
              {paiements.filter((p) => (Date.now() - new Date(p.created_at).getTime()) > 72 * 3600 * 1000).length} remboursement(s) en attente depuis plus de 72h
            </p>
          </div>
        )}

        {!paiements || paiements.length === 0 ? (
          <ScrollReveal variant="fade-up" delay={0.1}>
            <div className="rounded-2xl border border-phoebe-pearl bg-white py-12 text-center shadow-sm">
              <p className="text-phoebe-anthracite/45">Aucun remboursement en attente.</p>
            </div>
          </ScrollReveal>
        ) : (
          <ScrollReveal variant="fade-up" delay={0.1}>
          <div className="overflow-x-auto rounded-2xl border border-phoebe-pearl bg-white shadow-sm">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-phoebe-pearl bg-phoebe-pearl/30">
                <tr className="text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">
                  <th scope="col" className="px-5 py-4">Date</th>
                  <th scope="col" className="px-5 py-4">Module</th>
                  <th scope="col" className="px-5 py-4">Méthode</th>
                  <th scope="col" className="px-5 py-4">Montant</th>
                  <th scope="col" className="px-5 py-4">Réf. paiement</th>
                  <th scope="col" className="px-5 py-4">Réf. demande</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-phoebe-pearl/70">
                {paiements.map((p) => {
                  const ageH = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60);
                  const isLate = ageH > 72;
                  return (
                  <tr key={p.id} className={`transition-colors hover:bg-phoebe-pearl/40 ${isLate ? "bg-error/5" : ""}`}>
                    <td className="px-5 py-3.5 whitespace-nowrap text-phoebe-anthracite/70">
                      <span>{new Date(p.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}</span>
                      {isLate && (
                        <span className="ml-2 rounded-full bg-error/10 px-2 py-0.5 text-[10px] font-semibold text-error">
                          +{Math.floor(ageH / 24)}j
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 capitalize text-phoebe-anthracite">
                      {p.module}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-phoebe-pearl px-2 py-0.5 text-xs font-medium text-phoebe-anthracite">
                        {p.methode === "cinetpay" ? "Mobile Money" : "Stripe"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-phoebe-anthracite">
                      {Number(p.montant).toLocaleString("fr-FR")} FCFA
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-phoebe-anthracite/50">
                      {p.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-phoebe-anthracite/50">
                      {p.reference_id.slice(0, 8)}
                    </td>
                    <td className="py-3">
                      <MarquerRembourse paiementId={p.id} />
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </ScrollReveal>
        )}

        {traites && traites.length > 0 && (
          <ScrollReveal variant="fade-up" delay={0.2}>
          <div>
            <h2 className="mb-4 text-lg font-semibold text-phoebe-anthracite">
              Récemment remboursés
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-phoebe-pearl bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b border-phoebe-pearl bg-phoebe-pearl/30">
                  <tr className="text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">
                    <th scope="col" className="px-5 py-4">Date</th>
                    <th scope="col" className="px-5 py-4">Méthode</th>
                    <th scope="col" className="px-5 py-4">Montant</th>
                    <th scope="col" className="px-5 py-4">Réf.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-phoebe-pearl/70">
                  {traites.map((p) => (
                    <tr key={p.id} className="text-phoebe-anthracite/50 transition-colors hover:bg-phoebe-pearl/40">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="px-5 py-3.5">{p.methode}</td>
                      <td className="px-5 py-3.5">
                        {Number(p.montant).toLocaleString("fr-FR")} FCFA
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs">
                        {p.id.slice(0, 8)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </ScrollReveal>
        )}
    </div>
  );
}
