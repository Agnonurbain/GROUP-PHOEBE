import type { Metadata } from "next"
import Link from "next/link"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { Database } from "@group-phoebe/database/types"
import { createClient } from "@/lib/supabase/server"
import { ScrollReveal } from "@/components/effects"
import {
  typeBienLabel,
  TRANSACTION_LABELS,
  STATUT_DEMANDE_LABELS,
  formaterPeriodeLocation,
} from "@/lib/immobilier"

export const metadata: Metadata = {
  title: "Transactions immobilier — Administration",
  description: "Registre des biens loués et vendus : qui, quoi, à quel prix et quand.",
}

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const th =
  "px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70"

/**
 * Registre interne GROUP PHOEBE : qui a loué ou acheté quel bien, à quel prix.
 *
 * Aucune table dédiée : chaque demande acceptée EST une ligne d'historique, et
 * un bien revendu plus tard donne simplement une nouvelle demande. Dupliquer ces
 * lignes dans un registre séparé aurait créé deux vérités à tenir d'accord.
 * Le montant affiché est `montant_convenu`, figé à l'acceptation (00053).
 */
export default async function TransactionsImmobilierPage() {
  const db = getAdmin()

  // Le cumul des sommes est réservé au propriétaire ; les opérateurs voient le
  // registre ligne à ligne, comme sur la page des demandes.
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const { data: profile } = claimsData?.claims
    ? await supabase.from("users").select("role").eq("id", claimsData.claims.sub).single()
    : { data: null }
  const estProprietaire = profile?.role === "proprietaire"

  const { data: demandes } = await db
    .from("demandes_immobilier")
    .select("id, statut, type, montant_convenu, montant_offre, montant_commission, taux_commission, location_debut, location_duree_mois, updated_at, created_at, bien_id, client_id, agent_id")
    .in("statut", ["acceptee", "finalisee"])
    .order("updated_at", { ascending: false })

  const lignes = demandes ?? []

  const bienIds = [...new Set(lignes.map((d) => d.bien_id))]
  const { data: biens } = bienIds.length
    ? await db.from("biens").select("id, type, localisation, transaction, statut").in("id", bienIds)
    : { data: [] }
  const bienById = new Map((biens ?? []).map((b) => [b.id, b]))

  const clientIds = [...new Set(lignes.map((d) => d.client_id))]
  const { data: clients } = clientIds.length
    ? await db.from("users").select("id, nom, telephone, email").in("id", clientIds)
    : { data: [] }
  const clientById = new Map((clients ?? []).map((c) => [c.id, c]))

  const { data: agentsRaw } = await db.from("agents_immobiliers").select("id, user_id")
  const agentUserIds = [...new Set((agentsRaw ?? []).map((a) => a.user_id))]
  const { data: agentUsers } = agentUserIds.length
    ? await db.from("users").select("id, nom").in("id", agentUserIds)
    : { data: [] }
  const nomParUser = new Map((agentUsers ?? []).map((u) => [u.id, u.nom]))
  const agentNom = new Map(
    (agentsRaw ?? []).map((a) => [a.id, nomParUser.get(a.user_id) ?? "Agent"])
  )

  const montant = (d: (typeof lignes)[number]) =>
    d.montant_convenu != null ? Number(d.montant_convenu) : null

  const total = lignes.reduce((somme, d) => somme + (montant(d) ?? 0), 0)
  const totalCommission = lignes.reduce(
    (somme, d) => somme + (d.montant_commission != null ? Number(d.montant_commission) : 0),
    0
  )
  const nbVentes = lignes.filter((d) => bienById.get(d.bien_id)?.transaction === "vente").length
  const nbLocations = lignes.length - nbVentes
  const nbFinalisees = lignes.filter((d) => d.statut === "finalisee").length

  return (
    <div className="space-y-8">
      <ScrollReveal variant="fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Transactions immobilier
        </h1>
        <p className="mt-1 text-sm text-phoebe-anthracite/70">
          Registre des biens loués et vendus — qui, quoi, à quel prix et quand.
        </p>
      </ScrollReveal>

      {lignes.length > 0 && (
        <ScrollReveal variant="fade-up" delay={0.05}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-phoebe-anthracite/60">Accords</p>
              <p className="mt-1 text-2xl font-bold text-phoebe-anthracite">{lignes.length}</p>
              <p className="text-xs text-phoebe-anthracite/60">dont {nbFinalisees} finalisé{nbFinalisees > 1 ? "s" : ""}</p>
            </div>
            <div className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-phoebe-anthracite/60">Ventes</p>
              <p className="mt-1 text-2xl font-bold text-phoebe-anthracite">{nbVentes}</p>
            </div>
            <div className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-phoebe-anthracite/60">Locations</p>
              <p className="mt-1 text-2xl font-bold text-phoebe-anthracite">{nbLocations}</p>
            </div>
            {estProprietaire && (
              <div className="rounded-2xl border border-phoebe-green/30 bg-phoebe-green/5 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-widest text-phoebe-anthracite/60">
                  Commission GROUP PHOEBE
                </p>
                <p className="mt-1 text-2xl font-bold text-phoebe-green-deep">
                  {totalCommission.toLocaleString("fr-FR")} FCFA
                </p>
                {/* Les biens appartiennent à des tiers : le volume transigé n'est
                    pas le revenu de la plateforme, la commission l'est. */}
                <p className="text-xs text-phoebe-anthracite/60">
                  sur {total.toLocaleString("fr-FR")} FCFA transigés
                </p>
              </div>
            )}
          </div>
        </ScrollReveal>
      )}

      <ScrollReveal variant="fade-up" delay={0.1}>
        {lignes.length === 0 ? (
          <div className="rounded-2xl border border-phoebe-pearl bg-white p-10 text-center">
            <p className="text-sm text-phoebe-anthracite/70">
              Aucune transaction pour le moment. Une ligne apparaît ici dès qu&apos;une offre
              est acceptée.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-phoebe-pearl bg-white shadow-sm">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="border-b border-phoebe-pearl bg-phoebe-pearl/30">
                <tr>
                  <th scope="col" className={th}>Date</th>
                  <th scope="col" className={th}>Client</th>
                  <th scope="col" className={th}>Bien</th>
                  <th scope="col" className={th}>Opération</th>
                  <th scope="col" className={th}>Montant convenu</th>
                  <th scope="col" className={th}>Commission</th>
                  <th scope="col" className={th}>Agent</th>
                  <th scope="col" className={th}>État</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-phoebe-pearl/70">
                {lignes.map((d) => {
                  const bien = bienById.get(d.bien_id)
                  const client = clientById.get(d.client_id)
                  const m = montant(d)
                  return (
                    <tr key={d.id} className="transition-colors hover:bg-phoebe-pearl/40">
                      <td className="px-5 py-3.5 text-phoebe-anthracite/80">
                        {new Date(d.updated_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-phoebe-anthracite">
                          {client?.nom ?? "—"}
                        </span>
                        <span className="block text-xs text-phoebe-anthracite/60">
                          {client?.telephone ?? client?.email ?? ""}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {bien ? (
                          <Link
                            href={`/admin/biens/${bien.id}`}
                            className="font-medium text-phoebe-anthracite hover:text-phoebe-green"
                          >
                            {typeBienLabel(bien.type)} — {bien.localisation}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-phoebe-anthracite/80">
                        {bien ? TRANSACTION_LABELS[bien.transaction] ?? bien.transaction : "—"}
                        {formaterPeriodeLocation(d.location_debut, d.location_duree_mois) && (
                          <span className="block text-xs text-phoebe-anthracite/60">
                            {formaterPeriodeLocation(d.location_debut, d.location_duree_mois)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {m != null ? (
                          <span className="font-semibold text-phoebe-green-deep">
                            {m.toLocaleString("fr-FR")} FCFA
                            {bien?.transaction === "location" && (
                              <span className="font-normal text-phoebe-anthracite/60"> / mois</span>
                            )}
                          </span>
                        ) : (
                          // Accords antérieurs à 00053 : le montant n'a pas été figé.
                          <span className="text-xs text-phoebe-anthracite/60">
                            non figé
                            {d.montant_offre != null
                              ? ` (offre : ${Number(d.montant_offre).toLocaleString("fr-FR")} FCFA)`
                              : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {d.montant_commission != null ? (
                          <>
                            <span className="font-semibold text-phoebe-anthracite">
                              {Number(d.montant_commission).toLocaleString("fr-FR")} FCFA
                            </span>
                            {d.taux_commission != null && (
                              <span className="block text-xs text-phoebe-anthracite/60">
                                {Number(d.taux_commission)} %
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-phoebe-anthracite/60">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-phoebe-anthracite/80">
                        {d.agent_id ? agentNom.get(d.agent_id) ?? "—" : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            d.statut === "finalisee"
                              ? "bg-phoebe-green/10 text-phoebe-green-deep"
                              : "bg-phoebe-gold/10 text-phoebe-gold-dark"
                          }`}
                        >
                          {STATUT_DEMANDE_LABELS[d.statut] ?? d.statut}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </ScrollReveal>
    </div>
  )
}
