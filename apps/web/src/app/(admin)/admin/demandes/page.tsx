import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { DemandeActions } from "./demande-actions";
import { expirerDemandesSansReponse, expirerNonPresentations } from "@/lib/payments/expiration-demandes";

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  en_attente_validation: { label: "En attente", color: "bg-phoebe-gold/10 text-phoebe-gold" },
  acceptee: { label: "Acceptée", color: "bg-phoebe-green/10 text-phoebe-green-deep" },
  en_cours: { label: "En cours", color: "bg-blue-50 text-blue-700" },
  refusee: { label: "Refusée", color: "bg-error/10 text-error" },
  annulee: { label: "Annulée", color: "bg-phoebe-anthracite/10 text-phoebe-anthracite" },
  terminee: { label: "Terminée", color: "bg-phoebe-pearl text-phoebe-anthracite" },
};

export default async function DemandesPage() {
  await Promise.all([expirerDemandesSansReponse(), expirerNonPresentations()]);

  const supabase = await createClient();

  const { data: demandes } = await supabase
    .from("demandes_transport")
    .select("*, vehicules(marque, modele), users!demandes_transport_client_id_fkey(nom, telephone)")
    .in("statut", ["en_attente_validation", "acceptee", "en_cours"])
    .order("created_at", { ascending: false });

  const { data: historique } = await supabase
    .from("demandes_transport")
    .select("*, vehicules(marque, modele), users!demandes_transport_client_id_fkey(nom, telephone)")
    .in("statut", ["terminee", "refusee", "annulee"])
    .order("updated_at", { ascending: false })
    .limit(20);

  return (
    <>
      <Header />
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-phoebe-anthracite">
          Demandes de transport
        </h1>

        {!demandes || demandes.length === 0 ? (
          <p className="text-sm text-phoebe-anthracite/50">
            Aucune demande en cours.
          </p>
        ) : (
          <div className="space-y-4">
            {demandes.map((d) => {
              const v = d.vehicules as unknown as { marque: string; modele: string } | null;
              const u = d.users as unknown as { nom: string; telephone: string } | null;
              const s = STATUT_LABELS[d.statut];
              const debut = d.periode
                ? new Date(d.periode.replace("[", "").split(",")[0])
                : null;
              const fin = d.periode
                ? new Date(d.periode.split(",")[1].replace(")", ""))
                : null;

              return (
                <div
                  key={d.id}
                  className="rounded-xl border border-phoebe-pearl bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-phoebe-anthracite">
                          {v ? `${v.marque} ${v.modele}` : "—"}
                        </h3>
                        {s && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
                            {s.label}
                          </span>
                        )}
                        {d.avec_chauffeur && (
                          <span className="rounded-full bg-phoebe-green/10 px-2 py-0.5 text-xs font-medium text-phoebe-green-deep">
                            Avec chauffeur
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-phoebe-anthracite/60">
                        Client : {u?.nom ?? "—"} · {u?.telephone ?? "—"}
                      </p>
                      <p className="text-sm text-phoebe-anthracite/60">
                        {debut && fin
                          ? `Du ${debut.toLocaleDateString("fr-FR")} au ${fin.toLocaleDateString("fr-FR")}`
                          : "Période non définie"}
                        {d.ville_depart && ` · ${d.ville_depart}`}
                        {d.destination && ` → ${d.destination}`}
                      </p>
                      <p className="text-sm font-medium text-phoebe-anthracite">
                        {d.montant ? `${Number(d.montant).toLocaleString("fr-FR")} FCFA` : "—"}
                        {d.caution ? ` + ${Number(d.caution).toLocaleString("fr-FR")} caution` : ""}
                      </p>
                    </div>

                    <DemandeActions demandeId={d.id} statut={d.statut} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {historique && historique.length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-phoebe-anthracite">
              Historique récent
            </h2>
            <div className="space-y-2">
              {historique.map((d) => {
                const v = d.vehicules as unknown as { marque: string; modele: string } | null;
                const s = STATUT_LABELS[d.statut];
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-lg bg-phoebe-pearl/50 px-4 py-2 text-sm"
                  >
                    <span className="text-phoebe-anthracite/70">
                      {v ? `${v.marque} ${v.modele}` : "—"} ·{" "}
                      {new Date(d.updated_at).toLocaleDateString("fr-FR")}
                    </span>
                    {s && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
                        {s.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
