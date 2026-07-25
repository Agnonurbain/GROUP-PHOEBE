import type { Metadata } from "next"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { Database } from "@group-phoebe/database/types"
import { ExpeditionActions } from "./expeditions-actions"
import {
  ZONE_LABELS,
  MODE_LABELS,
  STATUT_LIVRAISON_LABELS,
} from "@/lib/livraison"

export const metadata: Metadata = {
  title: "Livraisons — Administration",
  description: "Gérez les expéditions payées : affectation des livreurs et suivi des statuts.",
}

const STATUT_COLORS: Record<string, string> = {
  creee: "bg-blue-50 text-blue-700",
  prise_en_charge: "bg-phoebe-gold/10 text-phoebe-gold-dark",
  en_transit: "bg-phoebe-gold/10 text-phoebe-gold-dark",
  livree: "bg-phoebe-green/10 text-phoebe-green-deep",
  echec_livraison: "bg-error/10 text-error",
}

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function ExpeditionsAdminPage() {
  const db = getAdmin()

  // Expéditions payées = celles ayant un paiement capturé.
  const { data: paies } = await db
    .from("paiements")
    .select("reference_id")
    .eq("reference_table", "expeditions")
    .eq("statut", "capture")

  const ids = [...new Set((paies ?? []).map((p) => p.reference_id).filter(Boolean))] as string[]

  const { data: expeditions } = ids.length
    ? await db.from("expeditions").select("*").in("id", ids).order("created_at", { ascending: false })
    : { data: [] }

  const clientIds = [...new Set((expeditions ?? []).map((e) => e.client_id))]
  const { data: clients } = clientIds.length
    ? await db.from("users").select("id, nom").in("id", clientIds)
    : { data: [] }
  const clientNom = new Map((clients ?? []).map((c) => [c.id, c.nom]))

  // Livreurs (pour le nom affecté + le menu d'affectation manuelle).
  const { data: livreursRaw } = await db
    .from("livreurs")
    .select("id, actif, zone_couverture, user_id")
  const livreurUserIds = [...new Set((livreursRaw ?? []).map((l) => l.user_id))]
  const { data: livreurUsers } = livreurUserIds.length
    ? await db.from("users").select("id, nom").in("id", livreurUserIds)
    : { data: [] }
  const livreurUserNom = new Map((livreurUsers ?? []).map((u) => [u.id, u.nom]))
  const livreurs = (livreursRaw ?? []).map((l) => ({
    id: l.id,
    actif: l.actif,
    nom: livreurUserNom.get(l.user_id) ?? "Livreur",
  }))
  const livreurNom = new Map(livreurs.map((l) => [l.id, l.nom]))
  const livreursActifs = livreurs.filter((l) => l.actif).map((l) => ({ id: l.id, nom: l.nom }))

  const statuts = Object.entries(STATUT_LIVRAISON_LABELS).map(([value, label]) => ({ value, label }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-phoebe-anthracite">Livraisons</h1>
        <p className="mt-1 text-sm text-phoebe-anthracite/70">
          Expéditions payées — affectez un livreur et faites évoluer le statut.
        </p>
      </div>

      {(!expeditions || expeditions.length === 0) ? (
        <div className="rounded-2xl border border-phoebe-pearl bg-white p-10 text-center">
          <p className="text-sm text-phoebe-anthracite/70">Aucune expédition payée pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {expeditions.map((e) => (
            <div key={e.id} className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-phoebe-anthracite">{e.numero_suivi}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUT_COLORS[e.statut] ?? "bg-phoebe-pearl text-phoebe-anthracite"}`}>
                      {STATUT_LIVRAISON_LABELS[e.statut] ?? e.statut}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-phoebe-anthracite/70">
                    Client : {clientNom.get(e.client_id) ?? "—"} ·{" "}
                    {ZONE_LABELS[e.zone as keyof typeof ZONE_LABELS] ?? e.zone} ·{" "}
                    {MODE_LABELS[e.mode as keyof typeof MODE_LABELS] ?? e.mode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-phoebe-gold-dark">
                    {e.prix != null ? `${Number(e.prix).toLocaleString()} FCFA` : "—"}
                  </p>
                  <p className="text-xs text-phoebe-anthracite/70">
                    {e.livreur_id ? `Livreur : ${livreurNom.get(e.livreur_id) ?? "—"}` : "Non affecté"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-phoebe-pearl pt-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-phoebe-anthracite/70">Expéditeur</p>
                  <p className="text-phoebe-anthracite">{e.expediteur_nom} · {e.expediteur_contact}</p>
                  <p className="mt-1 text-phoebe-anthracite/70">{e.adresse_collecte}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-phoebe-anthracite/70">Destinataire</p>
                  <p className="text-phoebe-anthracite">{e.destinataire_nom} · {e.destinataire_contact}</p>
                  <p className="mt-1 text-phoebe-anthracite/70">{e.adresse_livraison}</p>
                </div>
                {(e.nature_colis || e.poids_kg || e.dimensions) && (
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-phoebe-anthracite/70">Colis</p>
                    <p className="text-phoebe-anthracite/70">
                      {[e.nature_colis, e.poids_kg ? `${e.poids_kg} kg` : null, e.dimensions].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                )}
              </div>

              <ExpeditionActions
                expeditionId={e.id}
                currentStatut={e.statut}
                assigned={!!e.livreur_id}
                livreurs={livreursActifs}
                statuts={statuts}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
