import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { Database } from "@group-phoebe/database/types"
import { STATUTS_ACTIFS_LIVREUR } from "@/lib/livraison"
import { LivreurForm } from "./livreur-form"

export const metadata: Metadata = {
  title: "Livreurs — Administration",
  description: "Zones desservies, capacité quotidienne et charge en cours de chaque livreur.",
}

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function LivreursAdminPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims
  if (!user) redirect("/connexion")

  const { data: profil } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single()
  if (profil?.role !== "proprietaire") redirect("/admin")

  const db = getAdmin()

  const { data: livreursRaw } = await db
    .from("livreurs")
    .select("id, user_id, zone_couverture, capacite_max_par_jour, actif")

  const livreurs = livreursRaw ?? []

  const userIds = [...new Set(livreurs.map((l) => l.user_id))]
  const { data: users } = userIds.length
    ? await db.from("users").select("id, nom, telephone, role").in("id", userIds)
    : { data: [] }
  const profils = new Map((users ?? []).map((u) => [u.id, u]))

  // Charge réelle : ce qui reste à faire, pas l'historique. C'est la même
  // définition que celle utilisée par l'affectation automatique.
  const { data: enCours } = await db
    .from("expeditions")
    .select("livreur_id")
    .in("statut", [...STATUTS_ACTIFS_LIVREUR])
    .not("livreur_id", "is", null)

  const charge = new Map<string, number>()
  for (const e of enCours ?? []) {
    if (e.livreur_id) charge.set(e.livreur_id, (charge.get(e.livreur_id) ?? 0) + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-phoebe-anthracite">Livreurs</h1>
        <p className="mt-1 text-sm text-phoebe-anthracite/70">
          Zone desservie et capacité quotidienne — les deux pilotent l&apos;affectation
          automatique d&apos;un colis. Les comptes se créent depuis{" "}
          <a href="/admin/comptes" className="text-phoebe-green hover:underline">
            Comptes internes
          </a>
          .
        </p>
      </div>

      {livreurs.length === 0 ? (
        <div className="rounded-2xl border border-phoebe-pearl bg-white p-10 text-center">
          <p className="text-sm text-phoebe-anthracite/70">
            Aucun livreur enregistré. Sans livreur, aucune expédition ne peut être affectée.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {livreurs.map((l) => {
            const p = profils.get(l.user_id)
            const enCharge = charge.get(l.id) ?? 0
            const sature = enCharge >= (l.capacite_max_par_jour ?? Infinity)
            return (
              <div key={l.id} className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-phoebe-anthracite">
                        {p?.nom ?? "Livreur"}
                      </span>
                      {!l.actif && (
                        <span className="rounded-full bg-phoebe-pearl px-2.5 py-0.5 text-[11px] font-semibold text-phoebe-anthracite">
                          Inactif
                        </span>
                      )}
                      {p?.role === "desactive" && (
                        <span className="rounded-full bg-error/10 px-2.5 py-0.5 text-[11px] font-semibold text-error">
                          Compte désactivé
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-phoebe-anthracite/70">
                      {p?.telephone ?? "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        sature ? "text-error" : "text-phoebe-anthracite"
                      }`}
                    >
                      {enCharge} / {l.capacite_max_par_jour}
                    </p>
                    <p className="text-xs text-phoebe-anthracite/70">
                      {sature ? "Capacité atteinte" : "colis en cours"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-phoebe-pearl pt-4">
                  <LivreurForm
                    livreurId={l.id}
                    initial={{
                      zone_couverture: l.zone_couverture ?? "",
                      capacite_max_par_jour: l.capacite_max_par_jour,
                      actif: l.actif,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
