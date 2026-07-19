import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
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
      <ScrollReveal variant="fade-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
            Propositions de prix
          </h1>
          <p className="mt-2 text-sm text-phoebe-anthracite/55">
            Modifications de prix proposées par les opérateurs, en attente de votre validation.
          </p>
        </div>
      </ScrollReveal>

      {!enAttente || enAttente.length === 0 ? (
        <ScrollReveal variant="fade-up" delay={0.1}>
          <div className="rounded-2xl border border-phoebe-pearl bg-white py-12 text-center shadow-sm">
            <p className="text-phoebe-anthracite/45">Aucune proposition en attente.</p>
          </div>
        </ScrollReveal>
      ) : (
        <ScrollReveal variant="fade-up" delay={0.1}>
        <div className="space-y-4">
          {enAttente.map((p) => {
            const v = p.vehicules;
            const op = p.users;
            return (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-phoebe-gold/20"
              >
                <span className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-phoebe-gold-light via-phoebe-gold to-phoebe-gold-dark transition-transform duration-300 group-hover:scale-x-100" />
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
        </ScrollReveal>
      )}

      {historique && historique.length > 0 && (
        <ScrollReveal variant="fade-up" delay={0.2}>
        <div>
          <h2 className="mb-4 text-lg font-semibold text-phoebe-anthracite">
            Historique
          </h2>
          <div className="space-y-2">
            {historique.map((p) => {
              const v = p.vehicules;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-phoebe-pearl/40 px-5 py-3 text-sm transition-colors hover:bg-phoebe-pearl/70"
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
        </ScrollReveal>
      )}
    </div>
  );
}
