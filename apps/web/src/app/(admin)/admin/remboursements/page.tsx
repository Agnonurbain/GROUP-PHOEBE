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
                {paiements.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-phoebe-pearl/40">
                    <td className="px-5 py-3.5 whitespace-nowrap text-phoebe-anthracite/70">
                      {new Date(p.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
                ))}
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
