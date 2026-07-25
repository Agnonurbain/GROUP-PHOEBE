import type { Metadata } from "next"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { Database } from "@group-phoebe/database/types"
import { DossierActions } from "./dossiers-actions"
import { STATUTS_DOSSIER, STATUT_DOSSIER_LABELS } from "@/lib/assistance"

export const metadata: Metadata = {
  title: "Dossiers visa — Administration",
  description: "Gérez les dossiers d'assistance visa : statuts et affectation des conseillers.",
}

const STATUT_COLORS: Record<string, string> = {
  soumis: "bg-blue-50 text-blue-700",
  en_cours_traitement: "bg-phoebe-gold/10 text-phoebe-gold-dark",
  pieces_complementaires_requises: "bg-error/10 text-error",
  finalise: "bg-phoebe-green/10 text-phoebe-green-deep",
}

const TYPE_LABELS: Record<string, string> = {
  etudes: "Études",
  tourisme_visa: "Tourisme / Visa",
}

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function DossiersVoyageAdminPage() {
  const db = getAdmin()

  const { data: dossiers } = await db
    .from("dossiers_voyage")
    .select("*")
    .order("created_at", { ascending: false })

  const userIds = [
    ...new Set([
      ...(dossiers ?? []).map((d) => d.client_id),
      ...(dossiers ?? []).map((d) => d.conseiller_id).filter(Boolean) as string[],
    ]),
  ]
  const { data: users } = userIds.length
    ? await db.from("users").select("id, nom").in("id", userIds)
    : { data: [] }
  const userNom = new Map((users ?? []).map((u) => [u.id, u.nom]))

  const { data: staff } = await db
    .from("users")
    .select("id, nom")
    .in("role", ["operateur", "proprietaire"])
  const conseillers = (staff ?? []).map((s) => ({ id: s.id, nom: s.nom }))

  const statuts = STATUTS_DOSSIER.map((value) => ({ value, label: STATUT_DOSSIER_LABELS[value] }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-phoebe-anthracite">Dossiers visa</h1>
        <p className="mt-1 text-sm text-phoebe-anthracite/70">
          Suivez les demandes d&apos;assistance, faites évoluer les statuts et affectez un conseiller.
        </p>
      </div>

      {(!dossiers || dossiers.length === 0) ? (
        <div className="rounded-2xl border border-phoebe-pearl bg-white p-10 text-center">
          <p className="text-sm text-phoebe-anthracite/70">Aucun dossier pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dossiers.map((d) => (
            <div key={d.id} className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-phoebe-anthracite">{d.pays_cible}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUT_COLORS[d.statut] ?? "bg-phoebe-pearl text-phoebe-anthracite"}`}>
                      {STATUT_DOSSIER_LABELS[d.statut] ?? d.statut}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-phoebe-anthracite/70">
                    Client : {userNom.get(d.client_id) ?? "—"} · {TYPE_LABELS[d.type] ?? d.type} ·{" "}
                    {new Date(d.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <p className="text-xs text-phoebe-anthracite/70">
                  {d.conseiller_id ? `Conseiller : ${userNom.get(d.conseiller_id) ?? "—"}` : "Non affecté"}
                </p>
              </div>

              <DossierActions
                dossierId={d.id}
                currentStatut={d.statut}
                currentConseiller={d.conseiller_id}
                conseillers={conseillers}
                statuts={statuts}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
