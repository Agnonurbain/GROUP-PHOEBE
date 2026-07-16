import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PropositionActions } from "./proposition-actions";

const CHAMP_LABELS: Record<string, string> = {
  prix_journalier: "Prix journalier",
  prix_mensuel: "Prix mensuel",
  prix_vente: "Prix de vente",
};

export default async function PropositionsPage() {
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

  const { data: enAttente } = await supabase
    .from("propositions_prix")
    .select("*, vehicules(marque, modele), users!propositions_prix_operateur_id_fkey(nom)")
    .eq("statut", "en_attente")
    .order("created_at", { ascending: false });

  const { data: historique } = await supabase
    .from("propositions_prix")
    .select("*, vehicules(marque, modele), users!propositions_prix_operateur_id_fkey(nom)")
    .in("statut", ["acceptee", "refusee"])
    .order("updated_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-phoebe-anthracite">
          Propositions de prix
        </h1>
        <p className="mt-1 text-sm text-phoebe-anthracite/60">
          Modifications de prix proposées par les opérateurs, en attente de votre validation.
        </p>
      </div>

      {!enAttente || enAttente.length === 0 ? (
        <p className="text-sm text-phoebe-anthracite/50">
          Aucune proposition en attente.
        </p>
      ) : (
        <div className="space-y-4">
          {enAttente.map((p) => {
            const v = p.vehicules;
            const op = p.users;
            return (
              <div
                key={p.id}
                className="rounded-xl border border-phoebe-pearl bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-phoebe-anthracite">
                      {v ? `${v.marque} ${v.modele}` : "—"}
                    </h3>
                    <p className="text-sm text-phoebe-anthracite/60">
                      {CHAMP_LABELS[p.champ] ?? p.champ} :{" "}
                      <span className="line-through text-phoebe-anthracite/40">
                        {p.valeur_actuelle
                          ? `${Number(p.valeur_actuelle).toLocaleString("fr-FR")} FCFA`
                          : "non défini"}
                      </span>
                      {" → "}
                      <span className="font-semibold text-phoebe-green">
                        {Number(p.valeur_proposee).toLocaleString("fr-FR")} FCFA
                      </span>
                    </p>
                    <p className="text-xs text-phoebe-anthracite/40">
                      Par {op?.nom ?? "—"} · {new Date(p.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    {p.commentaire && (
                      <p className="text-xs text-phoebe-anthracite/60 italic">
                        « {p.commentaire} »
                      </p>
                    )}
                  </div>
                  <PropositionActions propositionId={p.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {historique && historique.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-phoebe-anthracite">
            Historique
          </h2>
          <div className="space-y-2">
            {historique.map((p) => {
              const v = p.vehicules;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-phoebe-pearl/50 px-4 py-2 text-sm"
                >
                  <span className="text-phoebe-anthracite/70">
                    {v ? `${v.marque} ${v.modele}` : "—"} · {CHAMP_LABELS[p.champ] ?? p.champ} ·{" "}
                    {Number(p.valeur_proposee).toLocaleString("fr-FR")} FCFA
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.statut === "acceptee"
                        ? "bg-phoebe-green/10 text-phoebe-green-deep"
                        : "bg-error/10 text-error"
                    }`}
                  >
                    {p.statut === "acceptee" ? "Acceptée" : "Refusée"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
