import type { Metadata } from "next"
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import { PropositionActions } from "./proposition-actions";
import { PropositionZoneActions } from "./proposition-zone-actions";

export const metadata: Metadata = {
  title: "Propositions — Administration",
  description: "Gérez les propositions des clients pour les véhicules GROUP PHOEBE.",
}

const CHAMP_LABELS: Record<string, string> = {
  prix_journalier: "Prix journalier",
  prix_mensuel: "Prix mensuel",
  prix_vente: "Prix de vente",
};

const ZONE_CHAMP_LABELS: Record<string, string> = {
  coefficient_majoration: "Coefficient de majoration",
  caution_multiplicateur: "Multiplicateur de caution",
  km_inclus_par_jour: "Km inclus par jour",
  supplement_km_fcfa: "Supplément km (FCFA)",
  tarif_chauffeur_journalier: "Tarif chauffeur journalier (FCFA)",
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

  const { data: enAttentePrix } = await supabase
    .from("propositions_prix")
    .select("*, vehicules(marque, modele), users!propositions_prix_operateur_id_fkey(nom)")
    .eq("statut", "en_attente")
    .order("created_at", { ascending: false });

  const { data: historiquePrix } = await supabase
    .from("propositions_prix")
    .select("*, vehicules(marque, modele), users!propositions_prix_operateur_id_fkey(nom)")
    .in("statut", ["acceptee", "refusee"])
    .order("updated_at", { ascending: false })
    .limit(20);

  const enAttenteZoneRaw = await supabase
    .from("propositions_zones_tarifaires" as never)
    .select("*")
    .eq("statut", "en_attente")
    .order("created_at", { ascending: false }) as never;

  const historiqueZoneRaw = await supabase
    .from("propositions_zones_tarifaires" as never)
    .select("*")
    .in("statut", ["acceptee", "refusee"] as never)
    .order("updated_at", { ascending: false })
    .limit(20) as never;

  type ZoneProp = {
    id: string; zone_id: string; operateur_id: string; champ: string;
    valeur_actuelle: string | null; valeur_proposee: string; statut: string;
    commentaire: string | null; created_at: string; updated_at: string;
  };

  const enAttenteZoneRows: ZoneProp[] = (enAttenteZoneRaw as { data: ZoneProp[] }).data ?? [];
  const historiqueZoneRows: ZoneProp[] = (historiqueZoneRaw as { data: ZoneProp[] }).data ?? [];

  const allZoneUserIds = [...new Set(enAttenteZoneRows.concat(historiqueZoneRows).map((z) => z.operateur_id))];
  const allZoneIds = [...new Set(enAttenteZoneRows.concat(historiqueZoneRows).map((z) => z.zone_id))];

  const { data: zoneNames } = allZoneIds.length > 0
    ? await supabase.from("zones_tarifaires").select("id, nom").in("id", allZoneIds)
    : { data: [] };
  const zoneNameMap = new Map((zoneNames ?? []).map((z: { id: string; nom: string }) => [z.id, z.nom]));

  const { data: zoneUserNames } = allZoneUserIds.length > 0
    ? await supabase.from("users").select("id, nom").in("id", allZoneUserIds)
    : { data: [] };
  const zoneUserNameMap = new Map((zoneUserNames ?? []).map((u: { id: string; nom: string }) => [u.id, u.nom]));

  type EnAttenteZoneItem = ZoneProp & { zoneNom: string; operateurNom: string };
  type HistoriqueZoneItem = ZoneProp & { zoneNom: string; operateurNom: string };

  const enAttenteZoneList: EnAttenteZoneItem[] = enAttenteZoneRows.map((z) => ({
    ...z,
    zoneNom: zoneNameMap.get(z.zone_id) ?? "—",
    operateurNom: zoneUserNameMap.get(z.operateur_id) ?? "—",
  }));
  const historiqueZoneList: HistoriqueZoneItem[] = historiqueZoneRows.map((z) => ({
    ...z,
    zoneNom: zoneNameMap.get(z.zone_id) ?? "—",
    operateurNom: zoneUserNameMap.get(z.operateur_id) ?? "—",
  }));

  const enAttente = enAttentePrix ?? [];
  const historique = historiquePrix ?? [];

  return (
    <div className="space-y-8">
      <ScrollReveal variant="fade-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
            Propositions
          </h1>
          <p className="mt-2 text-sm text-phoebe-anthracite/70">
            Modifications proposées par les opérateurs, en attente de votre validation.
          </p>
        </div>
      </ScrollReveal>

      {/* Prix — En attente */}
      {enAttente.length > 0 && (
        <ScrollReveal variant="fade-up" delay={0.1}>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-phoebe-gold-dark">Prix — En attente ({enAttente.length})</h2>
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
                        <p className="text-sm text-phoebe-anthracite/70">
                          {CHAMP_LABELS[p.champ] ?? p.champ} :{" "}
                          <span className="line-through text-phoebe-anthracite/70">
                            {p.valeur_actuelle
                              ? `${Number(p.valeur_actuelle).toLocaleString("fr-FR")} FCFA`
                              : "non défini"}
                          </span>
                          {" → "}
                          <span className="font-semibold text-phoebe-green">
                            {Number(p.valeur_proposee).toLocaleString("fr-FR")} FCFA
                          </span>
                        </p>
                        <p className="text-xs text-phoebe-anthracite/70">
                          Par {op?.nom ?? "—"} · {new Date(p.created_at).toLocaleDateString("fr-FR")}
                        </p>
                        {p.commentaire && (
                          <p className="text-xs text-phoebe-anthracite/70 italic">
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
          </section>
        </ScrollReveal>
      )}

      {/* Zones — En attente */}
      {enAttenteZoneList.length > 0 && (
        <ScrollReveal variant="fade-up" delay={0.12}>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-phoebe-gold-dark">Zones — En attente ({enAttenteZoneList.length})</h2>
            <div className="space-y-4">
              {enAttenteZoneList.map((p) => (
                <div
                  key={p.id}
                  className="group relative overflow-hidden rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-phoebe-gold/20"
                >
                  <span className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-blue-300 via-blue-500 to-blue-700 transition-transform duration-300 group-hover:scale-x-100" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-phoebe-anthracite">
                        {p.zoneNom}
                      </h3>
                      <p className="text-sm text-phoebe-anthracite/70">
                        {ZONE_CHAMP_LABELS[p.champ] ?? p.champ} :{" "}
                        <span className="line-through text-phoebe-anthracite/70">
                          {p.valeur_actuelle ?? "non défini"}
                        </span>
                        {" → "}
                        <span className="font-semibold text-phoebe-green">
                          {p.valeur_proposee}
                        </span>
                      </p>
                      <p className="text-xs text-phoebe-anthracite/70">
                        Par {p.operateurNom} · {new Date(p.created_at).toLocaleDateString("fr-FR")}
                      </p>
                      {p.commentaire && (
                        <p className="text-xs text-phoebe-anthracite/70 italic">
                          « {p.commentaire} »
                        </p>
                      )}
                    </div>
                    <PropositionZoneActions propositionId={p.id} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {enAttente.length === 0 && enAttenteZoneList.length === 0 && (
        <ScrollReveal variant="fade-up" delay={0.1}>
          <div className="rounded-2xl border border-phoebe-pearl bg-white py-12 text-center shadow-sm">
            <p className="text-phoebe-anthracite/70">Aucune proposition en attente.</p>
          </div>
        </ScrollReveal>
      )}

      {/* Historique prix */}
      {historique.length > 0 && (
        <ScrollReveal variant="fade-up" delay={0.2}>
        <section>
          <h2 className="mb-4 text-lg font-semibold text-phoebe-anthracite">
            Historique — Prix
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
        </section>
        </ScrollReveal>
      )}

      {/* Historique zones */}
      {historiqueZoneList.length > 0 && (
        <ScrollReveal variant="fade-up" delay={0.22}>
        <section>
          <h2 className="mb-4 text-lg font-semibold text-phoebe-anthracite">
            Historique — Zones
          </h2>
          <div className="space-y-2">
            {historiqueZoneList.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl bg-phoebe-pearl/40 px-5 py-3 text-sm transition-colors hover:bg-phoebe-pearl/70"
              >
                <span className="text-phoebe-anthracite/70">
                  {p.zoneNom} · {ZONE_CHAMP_LABELS[p.champ] ?? p.champ} · {p.valeur_proposee}
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
            ))}
          </div>
        </section>
        </ScrollReveal>
      )}
    </div>
  );
}
