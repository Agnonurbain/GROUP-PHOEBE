import type { Metadata } from "next"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { Database } from "@group-phoebe/database/types"
import { createClient } from "@/lib/supabase/server"
import { getParametresImmobilier } from "@/lib/public-cache"
import { DemandeImmoActions } from "./demandes-immo-actions"
import { ContreOffreForm } from "./contre-offre-form"
import { VisiteSection } from "./visite-section"
import {
  STATUTS_DEMANDE,
  STATUT_DEMANDE_LABELS,
  STATUTS_CONTRE_OFFRE_POSSIBLE,
  formaterPeriodeLocation,
  TYPE_DEMANDE_LABELS,
  typeBienLabel,
} from "@/lib/immobilier"

export const metadata: Metadata = {
  title: "Demandes immobilier — Administration",
  description: "Gérez les demandes immobilières : statuts, visites et affectation des agents.",
}

const STATUT_COLORS: Record<string, string> = {
  en_attente: "bg-blue-50 text-blue-700",
  en_cours_traitement: "bg-phoebe-gold/10 text-phoebe-gold-dark",
  visite_programmee: "bg-phoebe-gold/10 text-phoebe-gold-dark",
  offre_soumise: "bg-phoebe-gold/10 text-phoebe-gold-dark",
  contre_offre: "bg-phoebe-gold/20 text-phoebe-gold-dark",
  acceptee: "bg-phoebe-green/10 text-phoebe-green-deep",
  finalisee: "bg-phoebe-green/10 text-phoebe-green-deep",
  refusee: "bg-error/10 text-error",
  annulee: "bg-phoebe-anthracite/10 text-phoebe-anthracite",
}

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function DemandesImmobilierAdminPage() {
  const db = getAdmin()

  // Le formulaire de contre-offre écrit un montant : réservé au propriétaire.
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const { data: profile } = claimsData?.claims
    ? await supabase.from("users").select("role").eq("id", claimsData.claims.sub).single()
    : { data: null }
  const estProprietaire = profile?.role === "proprietaire"

  const params = await getParametresImmobilier()

  const { data: demandes } = await db
    .from("demandes_immobilier")
    .select("*")
    .order("created_at", { ascending: false })

  const bienIds = [...new Set((demandes ?? []).map((d) => d.bien_id))]
  const { data: biens } = bienIds.length
    ? await db.from("biens").select("id, type, localisation, prix, statut, transaction").in("id", bienIds)
    : { data: [] }
  const bienLabel = new Map((biens ?? []).map((b) => [b.id, `${typeBienLabel(b.type)} — ${b.localisation}`]))
  const bienPrix = new Map((biens ?? []).map((b) => [b.id, Number(b.prix)]))
  const bienStatut = new Map((biens ?? []).map((b) => [b.id, b.statut]))
  const bienTransaction = new Map((biens ?? []).map((b) => [b.id, b.transaction]))

  const clientIds = [...new Set((demandes ?? []).map((d) => d.client_id))]
  const { data: clients } = clientIds.length
    ? await db.from("users").select("id, nom").in("id", clientIds)
    : { data: [] }
  const clientNom = new Map((clients ?? []).map((c) => [c.id, c.nom]))

  const { data: agentsRaw } = await db.from("agents_immobiliers").select("id, user_id")
  const agentUserIds = [...new Set((agentsRaw ?? []).map((a) => a.user_id))]
  const { data: agentUsers } = agentUserIds.length
    ? await db.from("users").select("id, nom").in("id", agentUserIds)
    : { data: [] }
  const agentUserNom = new Map((agentUsers ?? []).map((u) => [u.id, u.nom]))
  const agents = (agentsRaw ?? []).map((a) => ({ id: a.id, nom: agentUserNom.get(a.user_id) ?? "Agent" }))
  const agentNom = new Map(agents.map((a) => [a.id, a.nom]))

  const statuts = STATUTS_DEMANDE.map((value) => ({ value, label: STATUT_DEMANDE_LABELS[value] }))

  // Visites (liées par bien_id + client_id)
  const { data: visitesRaw } = await db
    .from("visites")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)
  const visitesParDemande = new Map<string, typeof visitesRaw>()
  for (const d of demandes ?? []) {
    const match = (visitesRaw ?? []).filter((v) => v.bien_id === d.bien_id && v.client_id === d.client_id)
    if (match.length > 0) visitesParDemande.set(d.id, match)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-phoebe-anthracite">Demandes immobilier</h1>
        <p className="mt-1 text-sm text-phoebe-anthracite/70">
          Informations, visites et offres — faites évoluer les statuts, gérez les visites et affectez un agent.
        </p>
      </div>

      {(!demandes || demandes.length === 0) ? (
        <div className="rounded-2xl border border-phoebe-pearl bg-white p-10 text-center">
          <p className="text-sm text-phoebe-anthracite/70">Aucune demande pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {demandes.map((d) => (
            <div key={d.id} className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-phoebe-anthracite">{bienLabel.get(d.bien_id) ?? "Bien"}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUT_COLORS[d.statut] ?? "bg-phoebe-pearl text-phoebe-anthracite"}`}>
                      {STATUT_DEMANDE_LABELS[d.statut] ?? d.statut}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-phoebe-anthracite/70">
                    Client : {clientNom.get(d.client_id) ?? "—"} · {TYPE_DEMANDE_LABELS[d.type] ?? d.type} ·{" "}
                    {new Date(d.created_at).toLocaleDateString("fr-FR")}
                    {d.date_souhaitee && (
                      <> · souhaite le {new Date(d.date_souhaitee).toLocaleDateString("fr-FR")}</>
                    )}
                    {formaterPeriodeLocation(d.location_debut, d.location_duree_mois) && (
                      <> · location {formaterPeriodeLocation(d.location_debut, d.location_duree_mois)}</>
                    )}
                  </p>
                  {d.message && (
                    <p className="mt-2 max-w-prose rounded-lg bg-phoebe-pearl/50 px-3 py-2 text-xs italic text-phoebe-anthracite/80">
                      « {d.message} »
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {d.montant_offre != null && (
                    <p className="text-lg font-bold text-phoebe-green-deep">{Number(d.montant_offre).toLocaleString("fr-FR")} FCFA</p>
                  )}
                  {d.montant_contre_offre != null && d.montant_convenu == null && (
                    <p className="text-xs font-semibold text-phoebe-gold-dark">
                      Contre-offre : {Number(d.montant_contre_offre).toLocaleString("fr-FR")} FCFA
                    </p>
                  )}
                  {d.montant_convenu != null && (
                    <p className="text-xs font-semibold text-phoebe-green-deep">
                      Convenu : {Number(d.montant_convenu).toLocaleString("fr-FR")} FCFA
                      {bienTransaction.get(d.bien_id) === "location" ? " / mois" : ""}
                      <span className="ml-1 font-normal text-phoebe-anthracite/60">(figé)</span>
                    </p>
                  )}
                  {d.montant_commission != null && (
                    <p className="text-xs text-phoebe-anthracite/70">
                      Commission {d.taux_commission != null ? `${Number(d.taux_commission)} %` : ""} :{" "}
                      {Number(d.montant_commission).toLocaleString("fr-FR")} FCFA
                    </p>
                  )}
                  <p className="text-xs text-phoebe-anthracite/70">
                    {d.agent_id ? `Agent : ${agentNom.get(d.agent_id) ?? "—"}` : "Non affecté"}
                  </p>
                </div>
              </div>

              <DemandeImmoActions
                demandeId={d.id}
                currentStatut={d.statut}
                currentAgent={d.agent_id}
                agents={agents}
                statuts={statuts}
              />

              {estProprietaire
                && d.type === "offre"
                && d.montant_offre != null
                && (STATUTS_CONTRE_OFFRE_POSSIBLE as readonly string[]).includes(d.statut)
                && ["disponible", "reserve"].includes(bienStatut.get(d.bien_id) ?? "")
                && bienPrix.get(d.bien_id) != null && (
                <ContreOffreForm
                  demandeId={d.id}
                  montantOffre={Number(d.montant_offre)}
                  prixBien={bienPrix.get(d.bien_id)!}
                  tauxMaxReduction={params.taux_max_reduction}
                  montantContreOffre={d.montant_contre_offre != null ? Number(d.montant_contre_offre) : null}
                />
              )}

              <VisiteSection
                demandeId={d.id}
                bienId={d.bien_id}
                clientId={d.client_id}
                agentId={d.agent_id}
                visites={visitesParDemande.get(d.id) ?? []}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
