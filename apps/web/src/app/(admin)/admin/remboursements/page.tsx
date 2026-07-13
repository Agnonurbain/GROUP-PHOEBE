import { createClient } from "@/lib/supabase/server";
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
        <div>
          <h1 className="text-2xl font-bold text-phoebe-anthracite">
            Remboursements à traiter
          </h1>
          <p className="mt-1 text-sm text-phoebe-anthracite/60">
            Remboursements en attente : paiements tardifs, refus, annulations,
            ou libération de caution (CinetPay). À traiter manuellement.
          </p>
        </div>

        {!paiements || paiements.length === 0 ? (
          <p className="text-sm text-phoebe-anthracite/50">
            Aucun remboursement en attente.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-phoebe-pearl text-left text-xs uppercase tracking-wider text-phoebe-anthracite/40">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Module</th>
                  <th className="pb-2 pr-4">Méthode</th>
                  <th className="pb-2 pr-4">Montant</th>
                  <th className="pb-2 pr-4">Réf. paiement</th>
                  <th className="pb-2 pr-4">Réf. demande</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-phoebe-pearl">
                {paiements.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pr-4 whitespace-nowrap text-phoebe-anthracite/70">
                      {new Date(p.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 pr-4 capitalize text-phoebe-anthracite">
                      {p.module}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-phoebe-pearl px-2 py-0.5 text-xs font-medium text-phoebe-anthracite">
                        {p.methode === "cinetpay" ? "Mobile Money" : "Stripe"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-phoebe-anthracite">
                      {Number(p.montant).toLocaleString("fr-FR")} FCFA
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-phoebe-anthracite/50">
                      {p.id.slice(0, 8)}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-phoebe-anthracite/50">
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
        )}

        {traites && traites.length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-phoebe-anthracite">
              Récemment remboursés
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-phoebe-pearl text-left text-xs uppercase tracking-wider text-phoebe-anthracite/40">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Méthode</th>
                    <th className="pb-2 pr-4">Montant</th>
                    <th className="pb-2 pr-4">Réf.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-phoebe-pearl">
                  {traites.map((p) => (
                    <tr key={p.id} className="text-phoebe-anthracite/50">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="py-2 pr-4">{p.methode}</td>
                      <td className="py-2 pr-4">
                        {Number(p.montant).toLocaleString("fr-FR")} FCFA
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs">
                        {p.id.slice(0, 8)}
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
