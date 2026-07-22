import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server";
import { DemandeActions } from "./demande-actions";
import { ExportCsvButton } from "./export-csv-button";
import { NegotiationTimer } from "./negotiation-timer";
import { expirerDemandesSansReponse, expirerNonPresentations } from "@/lib/payments/expiration-demandes";
import { DELAI_NEGOCIATION_MS } from "@/lib/constants";
import { ScrollReveal } from "@/components/effects";

export const metadata: Metadata = {
  title: "Demandes — Administration",
  description: "Consultez et gérez les demandes de réservation et devis GROUP PHOEBE.",
}

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  en_attente_validation: { label: "En attente", color: "bg-phoebe-gold/10 text-phoebe-gold" },
  en_negociation: { label: "En négociation", color: "bg-phoebe-gold/10 text-phoebe-gold" },
  en_attente_paiement: { label: "Att. paiement", color: "bg-blue-50 text-blue-700" },
  acceptee: { label: "Acceptée", color: "bg-phoebe-green/10 text-phoebe-green-deep" },
  en_cours: { label: "En cours", color: "bg-blue-50 text-blue-700" },
  retour_en_inspection: { label: "Inspection", color: "bg-purple-50 text-purple-700" },
  refusee: { label: "Refusée", color: "bg-error/10 text-error" },
  annulee: { label: "Annulée", color: "bg-phoebe-anthracite/10 text-phoebe-anthracite" },
  terminee: { label: "Terminée", color: "bg-phoebe-pearl text-phoebe-anthracite" },
}

const STATUTS_ACTIFS = ["en_attente_paiement", "en_attente_validation", "en_negociation", "acceptee", "en_cours", "retour_en_inspection"]
const STATUTS_HISTORIQUE = ["terminee", "refusee", "annulee"]
const TOUS_STATUTS = [...STATUTS_ACTIFS, ...STATUTS_HISTORIQUE]

const TYPES = ["reservation_directe", "achat"]

const DELAI_NEGOCIATION_MINUTES = DELAI_NEGOCIATION_MS / (1000 * 60);

export default async function DemandesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  await Promise.all([expirerDemandesSansReponse(), expirerNonPresentations()]);

  const sp = await searchParams
  const filtreStatut = sp.statut ?? "actives"
  const filtreType = sp.type ?? "all"
  const filtreDateDebut = sp.date_debut ?? ""
  const filtreDateFin = sp.date_fin ?? ""

  const supabase = await createClient();

  const { data: communes } = await supabase
    .from("communes")
    .select("nom, zones_tarifaires!inner(nom)")
    .order("nom");

  const communeZoneMap = new Map<string, string>();
  for (const c of communes ?? []) {
    const zn = (c.zones_tarifaires as { nom: string } | null)?.nom;
    if (zn) communeZoneMap.set(c.nom, zn);
  }

  let statutsCibles = TOUS_STATUTS
  if (filtreStatut === "actives") statutsCibles = STATUTS_ACTIFS
  else if (filtreStatut === "historique") statutsCibles = STATUTS_HISTORIQUE
  else if (filtreStatut !== "all") statutsCibles = [filtreStatut]

  let query = supabase
    .from("demandes_transport")
    .select("*, vehicules(marque, modele), users!demandes_transport_client_id_fkey(nom, telephone), lignes_demande(id, vehicules(marque, modele), avec_chauffeur)")
    .in("statut", statutsCibles)
    .order("created_at", { ascending: false })

  if (filtreType !== "all") {
    query = query.eq("type", filtreType)
  }
  if (filtreDateDebut) {
    query = query.gte("created_at", new Date(filtreDateDebut).toISOString())
  }
  if (filtreDateFin) {
    query = query.lte("created_at", new Date(new Date(filtreDateFin).getTime() + 86400000).toISOString())
  }

  let limitHistorique: number | undefined
  const afficheHistorique = filtreStatut === "actives" || filtreStatut === "all"
  if (afficheHistorique && !filtreDateDebut && !filtreDateFin && filtreType === "all") {
    limitHistorique = 20
  }

  const { data: demandes } = await query;

  let historique: typeof demandes = []
  if (afficheHistorique && limitHistorique) {
    const { data: hData } = await supabase
      .from("demandes_transport")
      .select("*, vehicules(marque, modele), users!demandes_transport_client_id_fkey(nom, telephone), lignes_demande(id, vehicules(marque, modele), avec_chauffeur)")
      .in("statut", STATUTS_HISTORIQUE)
      .order("updated_at", { ascending: false })
      .limit(limitHistorique)
    historique = hData ?? []
  }

  const filteredCount = demandes?.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Demandes de transport
        </h1>
        <ExportCsvButton
          demandes={[...(demandes ?? []), ...historique].map((d) => {
            const v = d.vehicules;
            const u = d.users;
            const hLignes = (d as Record<string, unknown>).lignes_demande as { id: string; vehicules: { marque: string; modele: string } | null }[] | undefined;
            return {
              id: d.id,
              statut: d.statut,
              type: d.type,
              montant: d.montant ? Number(d.montant) : null,
              caution: d.caution ? Number(d.caution) : null,
              caution_retenue: Number(d.caution_retenue ?? 0),
              destination: d.destination,
              ville_depart: d.ville_depart,
              created_at: d.created_at,
              client: (u as { nom: string } | null)?.nom ?? "",
              vehicule: hLignes && hLignes.length > 1
                ? `${hLignes.length} vehicules`
                : v ? `${v.marque} ${v.modele}` : "",
            };
          })}
        />
      </div>

      <form method="GET" action="/admin/demandes" className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-phoebe-anthracite/50">Statut</label>
          <select name="statut" defaultValue={filtreStatut}
            className="rounded-lg border border-phoebe-pearl bg-white px-3 py-2 text-sm text-phoebe-anthracite">
            <option value="actives">Actives</option>
            <option value="historique">Historique</option>
            <option value="all">Tous</option>
            {TOUS_STATUTS.map((s) => (
              <option key={s} value={s}>{STATUT_LABELS[s]?.label ?? s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-phoebe-anthracite/50">Type</label>
          <select name="type" defaultValue={filtreType}
            className="rounded-lg border border-phoebe-pearl bg-white px-3 py-2 text-sm text-phoebe-anthracite">
            <option value="all">Tous</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t === "reservation_directe" ? "Location" : "Achat"}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-phoebe-anthracite/50">Du</label>
          <input type="date" name="date_debut" defaultValue={filtreDateDebut}
            className="rounded-lg border border-phoebe-pearl bg-white px-3 py-2 text-sm text-phoebe-anthracite" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-phoebe-anthracite/50">Au</label>
          <input type="date" name="date_fin" defaultValue={filtreDateFin}
            className="rounded-lg border border-phoebe-pearl bg-white px-3 py-2 text-sm text-phoebe-anthracite" />
        </div>

        <button type="submit"
          className="rounded-lg bg-phoebe-green px-4 py-2 text-sm font-medium text-white hover:bg-phoebe-green-deep transition-colors">
          Filtrer
        </button>

        {(filtreStatut !== "actives" || filtreType !== "all" || filtreDateDebut || filtreDateFin) && (
          <a href="/admin/demandes"
            className="rounded-lg border border-phoebe-anthracite/20 px-3 py-2 text-xs text-phoebe-anthracite/60 hover:bg-phoebe-pearl transition-colors">
            Réinitialiser
          </a>
        )}
      </form>

      <p className="text-sm text-phoebe-anthracite/50">{filteredCount} résultat{filteredCount > 1 ? "s" : ""}</p>

      {(!demandes || demandes.length === 0) && (!historique || historique.length === 0) ? (
        <p className="text-sm text-phoebe-anthracite/50">
          Aucune demande trouvée.
        </p>
      ) : (
        <>
          {demandes && demandes.length > 0 && (
            <div className="space-y-5">
              {demandes.map((d, idx) => {
                const v = d.vehicules;
                const u = d.users;
                const s = STATUT_LABELS[d.statut];
                const lignes = (d as Record<string, unknown>).lignes_demande as { id: string; vehicules: { marque: string; modele: string } | null; avec_chauffeur: boolean }[] | undefined;
                const p = d.periode as string | null;
                const debut = p ? new Date(p.replace("[", "").split(",")[0]) : null;
                const fin = p ? new Date(p.split(",")[1].replace(")", "")) : null;

                const vehiculeLabel = lignes && lignes.length > 1
                  ? `${lignes.length} véhicules`
                  : lignes && lignes.length === 1
                    ? `${lignes[0].vehicules?.marque ?? ""} ${lignes[0].vehicules?.modele ?? ""}`
                    : v ? `${v.marque} ${v.modele}` : "—";

                return (
                  <ScrollReveal key={d.id} delay={Math.min(idx * 0.1, 0.5)}>
                  <div className="group relative overflow-hidden rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-phoebe-gold transition-transform duration-300 group-hover:scale-x-100" />
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-phoebe-anthracite">{vehiculeLabel}</h3>
                          {s && (
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.color}`}>{s.label}</span>
                          )}
                          {d.statut === "en_negociation" && (
                            <NegotiationTimer updatedAt={d.updated_at} delaiMinutes={DELAI_NEGOCIATION_MINUTES} />
                          )}
                          {d.type === "achat" && (
                            <span className="rounded-full bg-phoebe-gold/10 px-2.5 py-0.5 text-xs font-semibold text-phoebe-gold">Achat</span>
                          )}
                          {d.avec_chauffeur && (
                            <span className="rounded-full bg-phoebe-green/10 px-2.5 py-0.5 text-xs font-semibold text-phoebe-green-deep">Avec chauffeur</span>
                          )}
                        </div>
                        <p className="text-sm text-phoebe-anthracite/60">
                          Client : {u?.nom ?? "—"} · {u?.telephone ?? "—"}
                        </p>
                        <p className="text-sm text-phoebe-anthracite/60">
                          {d.type === "achat"
                            ? "Demande d'achat"
                            : debut && fin
                              ? `Du ${debut.toLocaleDateString("fr-FR")} au ${fin.toLocaleDateString("fr-FR")}`
                              : "Période non définie"}
                          {d.ville_depart && ` · ${d.ville_depart}`}
                          {d.destination && ` → ${d.destination}`}
                        </p>
                        {d.destination && communeZoneMap.get(d.destination) && (
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            communeZoneMap.get(d.destination)!.toLowerCase().includes("intérieur") || communeZoneMap.get(d.destination)!.toLowerCase().includes("interieur")
                              ? "bg-error/10 text-error"
                              : communeZoneMap.get(d.destination)!.toLowerCase().includes("grand")
                                ? "bg-phoebe-gold/10 text-phoebe-gold"
                                : "bg-phoebe-green/10 text-phoebe-green-deep"
                          }`}>Zone : {communeZoneMap.get(d.destination)}</span>
                        )}
                        {d.type === "achat" && (
                          <p className="text-xs text-phoebe-anthracite/40">Négociation via WhatsApp</p>
                        )}
                        {lignes && lignes.length > 1 && (
                          <ul className="space-y-0.5 pt-1">
                            {lignes.map((l) => (
                              <li key={l.id} className="text-xs text-phoebe-anthracite/50">
                                {l.vehicules?.marque} {l.vehicules?.modele}{l.avec_chauffeur && " · chauffeur"}
                              </li>
                            ))}
                          </ul>
                        )}
                        <p className="pt-1 text-sm font-bold text-phoebe-anthracite">
                          {d.montant ? `${Number(d.montant).toLocaleString("fr-FR")} FCFA` : "—"}
                          {d.caution ? ` + ${Number(d.caution).toLocaleString("fr-FR")} caution` : ""}
                        </p>
                      </div>
                      <DemandeActions
                        demandeId={d.id}
                        statut={d.statut}
                        type={d.type}
                        negociationNote={(d as Record<string, unknown>).negociation_note as string | null}
                        montantEstime={d.montant ? Number(d.montant) : null}
                        clientTelephone={(u as { nom: string; telephone: string | null } | null)?.telephone ?? null}
                        cautionMax={d.caution ? Number(d.caution) : null}
                      />
                    </div>
                  </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}

          {historique.length > 0 && (
            <ScrollReveal delay={0.2}>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-phoebe-anthracite">
                Historique recent
              </h2>
              <div className="space-y-2">
                {historique.map((d) => {
                  const v = d.vehicules;
                  const s = STATUT_LABELS[d.statut];
                  const hLignes = (d as Record<string, unknown>).lignes_demande as { id: string; vehicules: { marque: string; modele: string } | null }[] | undefined;
                  const hLabel = hLignes && hLignes.length > 1
                    ? `${hLignes.length} véhicules`
                    : hLignes && hLignes.length === 1
                      ? `${hLignes[0].vehicules?.marque ?? ""} ${hLignes[0].vehicules?.modele ?? ""}`
                      : v ? `${v.marque} ${v.modele}` : "—";
                  return (
                    <div key={d.id}
                      className="flex items-center justify-between rounded-xl bg-phoebe-pearl/40 px-5 py-3 text-sm transition-colors hover:bg-phoebe-pearl/60">
                      <span className="text-phoebe-anthracite/70">
                        {hLabel} · {new Date(d.updated_at).toLocaleDateString("fr-FR")}
                      </span>
                      {s && (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.color}`}>{s.label}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>
          )}
        </>
      )}
    </div>
  );
}
