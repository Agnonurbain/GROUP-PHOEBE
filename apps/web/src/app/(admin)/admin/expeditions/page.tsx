import type { Metadata } from "next"
import Link from "next/link"
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
  description: "Gérez les expéditions : filtres, affectation des livreurs et suivi des statuts.",
}

const STATUT_COLORS: Record<string, string> = {
  creee: "bg-blue-50 text-blue-700",
  prise_en_charge: "bg-phoebe-gold/10 text-phoebe-gold-dark",
  en_transit: "bg-phoebe-gold/10 text-phoebe-gold-dark",
  livree: "bg-phoebe-green/10 text-phoebe-green-deep",
  echec_livraison: "bg-error/10 text-error",
}

function paiementBadge(ps: string | undefined): { label: string; color: string } {
  if (ps === "capture") return { label: "Payée", color: "bg-phoebe-green/10 text-phoebe-green-deep" }
  if (ps === "en_attente") return { label: "Att. paiement", color: "bg-blue-50 text-blue-700" }
  if (ps && ["echoue", "rembourse", "remboursement_requis"].includes(ps)) {
    return { label: "Non payée", color: "bg-error/10 text-error" }
  }
  return { label: "Sans paiement", color: "bg-phoebe-pearl text-phoebe-anthracite" }
}

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const selectClass =
  "rounded-lg border border-phoebe-anthracite/15 bg-white px-3 py-2 text-xs text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/20"

export default async function ExpeditionsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const fStatut = sp.statut ?? "all"
  const fPaiement = sp.paiement ?? "all"
  const fAffectation = sp.affectation ?? "all"
  const fQ = (sp.q ?? "").trim()
  const filtre = fStatut !== "all" || fPaiement !== "all" || fAffectation !== "all" || fQ !== ""

  const db = getAdmin()

  const { data: allExp } = await db
    .from("expeditions")
    .select("*")
    .order("created_at", { ascending: false })
  const expAll = allExp ?? []

  const ids = expAll.map((e) => e.id)
  const { data: paies } = ids.length
    ? await db.from("paiements").select("reference_id, statut").eq("reference_table", "expeditions").in("reference_id", ids)
    : { data: [] }
  const paiementStatut = new Map<string, string>()
  for (const p of paies ?? []) {
    if (p.reference_id && !paiementStatut.has(p.reference_id)) paiementStatut.set(p.reference_id, p.statut)
  }

  const clientIds = [...new Set(expAll.map((e) => e.client_id))]
  const { data: clients } = clientIds.length
    ? await db.from("users").select("id, nom").in("id", clientIds)
    : { data: [] }
  const clientNom = new Map((clients ?? []).map((c) => [c.id, c.nom]))

  const { data: livreursRaw } = await db.from("livreurs").select("id, actif, user_id")
  const livreurUserIds = [...new Set((livreursRaw ?? []).map((l) => l.user_id))]
  const { data: livreurUsers } = livreurUserIds.length
    ? await db.from("users").select("id, nom").in("id", livreurUserIds)
    : { data: [] }
  const livreurUserNom = new Map((livreurUsers ?? []).map((u) => [u.id, u.nom]))
  const livreurs = (livreursRaw ?? []).map((l) => ({ id: l.id, actif: l.actif, nom: livreurUserNom.get(l.user_id) ?? "Livreur" }))
  const livreurNom = new Map(livreurs.map((l) => [l.id, l.nom]))
  const livreursActifs = livreurs.filter((l) => l.actif).map((l) => ({ id: l.id, nom: l.nom }))

  const statuts = Object.entries(STATUT_LIVRAISON_LABELS).map(([value, label]) => ({ value, label }))

  // Filtrage
  const expeditions = expAll.filter((e) => {
    if (fStatut !== "all" && e.statut !== fStatut) return false
    if (fAffectation === "non_affectees" && e.livreur_id) return false
    if (fAffectation === "affectees" && !e.livreur_id) return false
    const ps = paiementStatut.get(e.id)
    if (fPaiement === "paye" && ps !== "capture") return false
    if (fPaiement === "attente" && ps !== "en_attente") return false
    if (fPaiement === "echoue" && !(ps && ["echoue", "rembourse", "remboursement_requis"].includes(ps))) return false
    if (fQ && !e.numero_suivi.toLowerCase().includes(fQ.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-phoebe-anthracite">Livraisons</h1>
        <p className="mt-1 text-sm text-phoebe-anthracite/70">
          Toutes les expéditions — filtrez, affectez un livreur et faites évoluer le statut.
        </p>
      </div>

      {/* Filtres */}
      <form method="GET" action="/admin/expeditions" className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-phoebe-pearl bg-white p-4">
        <div>
          <label htmlFor="q" className="mb-1 block text-[11px] font-medium text-phoebe-anthracite/70">N° de suivi</label>
          <input id="q" name="q" defaultValue={fQ} placeholder="GP-…" className={selectClass} />
        </div>
        <div>
          <label htmlFor="statut" className="mb-1 block text-[11px] font-medium text-phoebe-anthracite/70">Statut</label>
          <select id="statut" name="statut" defaultValue={fStatut} className={selectClass}>
            <option value="all">Tous</option>
            {statuts.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="paiement" className="mb-1 block text-[11px] font-medium text-phoebe-anthracite/70">Paiement</label>
          <select id="paiement" name="paiement" defaultValue={fPaiement} className={selectClass}>
            <option value="all">Tous</option>
            <option value="paye">Payées</option>
            <option value="attente">En attente</option>
            <option value="echoue">Non payées</option>
          </select>
        </div>
        <div>
          <label htmlFor="affectation" className="mb-1 block text-[11px] font-medium text-phoebe-anthracite/70">Affectation</label>
          <select id="affectation" name="affectation" defaultValue={fAffectation} className={selectClass}>
            <option value="all">Toutes</option>
            <option value="non_affectees">Non affectées</option>
            <option value="affectees">Affectées</option>
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-phoebe-green px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-phoebe-green-deep">
          Filtrer
        </button>
        {filtre && (
          <Link href="/admin/expeditions" className="rounded-lg px-3 py-2 text-xs font-medium text-phoebe-anthracite/70 transition-colors hover:text-error">
            Réinitialiser
          </Link>
        )}
        <span className="ml-auto text-xs text-phoebe-anthracite/70">{expeditions.length} résultat{expeditions.length > 1 ? "s" : ""}</span>
      </form>

      {expeditions.length === 0 ? (
        <div className="rounded-2xl border border-phoebe-pearl bg-white p-10 text-center">
          <p className="text-sm text-phoebe-anthracite/70">Aucune expédition pour ces filtres.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {expeditions.map((e) => {
            const pb = paiementBadge(paiementStatut.get(e.id))
            const photos = ((e as unknown as { photos?: string[] }).photos) ?? []
            return (
            <div key={e.id} className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-phoebe-anthracite">{e.numero_suivi}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUT_COLORS[e.statut] ?? "bg-phoebe-pearl text-phoebe-anthracite"}`}>
                      {STATUT_LIVRAISON_LABELS[e.statut] ?? e.statut}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pb.color}`}>{pb.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-phoebe-anthracite/70">
                    Client : {clientNom.get(e.client_id) ?? "—"} ·{" "}
                    {ZONE_LABELS[e.zone as keyof typeof ZONE_LABELS] ?? e.zone} ·{" "}
                    {MODE_LABELS[e.mode as keyof typeof MODE_LABELS] ?? e.mode} ·{" "}
                    {new Date(e.created_at).toLocaleDateString("fr-FR")}
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
                {photos.length > 0 && (
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-phoebe-anthracite/70">Photos</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {photos.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Colis ${i + 1}`} className="h-16 w-16 rounded-lg border border-phoebe-pearl object-cover" />
                        </a>
                      ))}
                    </div>
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
            )
          })}
        </div>
      )}
    </div>
  )
}
