import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { Database } from "@group-phoebe/database/types"
import {
  CATEGORIE_CONTRAT_LABELS,
  FREQUENCE_LABELS,
  STATUT_CONTRAT_LABELS,
  STATUT_ECHEANCE_LABELS,
  JOURS_LABELS,
  type CategorieContrat,
  type Frequence,
  type StatutContrat,
} from "@/lib/contrats"
import { NouveauContrat, ContratActions, EcheanceActions } from "./contrat-forms"

export const metadata: Metadata = {
  title: "Abonnements — Administration",
  description: "Contrats récurrents : créneaux, facturation et échéances.",
}

const STATUT_COULEURS: Record<string, string> = {
  actif: "bg-phoebe-green/10 text-phoebe-green-deep",
  suspendu: "bg-phoebe-gold/10 text-phoebe-gold-dark",
  resilie: "bg-phoebe-pearl text-phoebe-anthracite",
}

const ECHEANCE_COULEURS: Record<string, string> = {
  a_facturer: "bg-blue-50 text-blue-700",
  facturee: "bg-phoebe-gold/10 text-phoebe-gold-dark",
  payee: "bg-phoebe-green/10 text-phoebe-green-deep",
  impayee: "bg-error/10 text-error",
  annulee: "bg-phoebe-pearl text-phoebe-anthracite",
}

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const fmt = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`
const jour = (d: string) => new Date(d).toLocaleDateString("fr-FR")

export default async function ContratsAdminPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims
  if (!user) redirect("/connexion")

  const { data: profil } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single()
  // Un abonnement engage un montant périodique : propriétaire seul, comme tout
  // ce qui porte un prix.
  if (profil?.role !== "proprietaire") redirect("/admin")

  const db = getAdmin()

  const [{ data: contratsRaw }, { data: clients }, { data: vehicules }, { data: chauffeurs }] =
    await Promise.all([
      db
        .from("contrats_recurrents")
        .select("*")
        .order("created_at", { ascending: false }),
      db.from("users").select("id, nom, telephone").eq("role", "client").order("nom"),
      db.from("vehicules").select("id, marque, modele").order("marque"),
      db.from("chauffeurs").select("id, nom").eq("actif", true).order("nom"),
    ])

  const contrats = contratsRaw ?? []

  const { data: echeances } = contrats.length
    ? await db
        .from("echeances_contrat")
        .select("*")
        .in("contrat_id", contrats.map((c) => c.id))
        .order("periode_debut", { ascending: false })
    : { data: [] }

  const echeancesParContrat = new Map<string, typeof echeances>()
  for (const e of echeances ?? []) {
    const liste = echeancesParContrat.get(e.contrat_id) ?? []
    liste.push(e)
    echeancesParContrat.set(e.contrat_id, liste)
  }

  const nomClient = new Map((clients ?? []).map((c) => [c.id, c.nom]))
  const nomVehicule = new Map((vehicules ?? []).map((v) => [v.id, `${v.marque} ${v.modele}`]))
  const nomChauffeur = new Map((chauffeurs ?? []).map((c) => [c.id, c.nom]))

  const impayees = (echeances ?? []).filter((e) => e.statut === "impayee")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-phoebe-anthracite">Abonnements</h1>
        <p className="mt-1 text-sm text-phoebe-anthracite/70">
          Ramassage scolaire et chauffeur personnel. Un abonnement ne bloque pas le
          véhicule en continu : il n&apos;en réserve que son créneau, le reste du
          temps reste louable.
        </p>
      </div>

      {impayees.length > 0 && (
        <div className="rounded-2xl border border-error/30 bg-error/5 p-4">
          <p className="text-sm font-semibold text-error">
            {impayees.length} échéance{impayees.length > 1 ? "s" : ""} impayée
            {impayees.length > 1 ? "s" : ""} —{" "}
            {fmt(impayees.reduce((s, e) => s + Number(e.montant), 0))}
          </p>
        </div>
      )}

      <NouveauContrat
        clients={(clients ?? []).map((c) => ({ id: c.id, nom: c.nom ?? c.telephone ?? "Client" }))}
        vehicules={(vehicules ?? []).map((v) => ({ id: v.id, nom: `${v.marque} ${v.modele}` }))}
        chauffeurs={(chauffeurs ?? []).map((c) => ({ id: c.id, nom: c.nom }))}
      />

      {contrats.length === 0 ? (
        <div className="rounded-2xl border border-phoebe-pearl bg-white p-10 text-center">
          <p className="text-sm text-phoebe-anthracite/70">Aucun abonnement enregistré.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contrats.map((c) => {
            const lignes = echeancesParContrat.get(c.id) ?? []
            const jours = (c.jours_semaine ?? []) as number[]
            return (
              <div key={c.id} className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-phoebe-anthracite">
                        {nomClient.get(c.client_id) ?? "Client"}
                      </span>
                      <span className="rounded-full bg-phoebe-pearl px-2.5 py-0.5 text-[11px] font-semibold text-phoebe-anthracite">
                        {CATEGORIE_CONTRAT_LABELS[c.categorie as CategorieContrat] ?? c.categorie}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          STATUT_COULEURS[c.statut] ?? "bg-phoebe-pearl"
                        }`}
                      >
                        {STATUT_CONTRAT_LABELS[c.statut as StatutContrat] ?? c.statut}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-phoebe-anthracite/70">
                      Du {jour(c.date_debut)}
                      {c.date_fin ? ` au ${jour(c.date_fin)}` : " — sans terme"}
                      {c.vehicule_id ? ` · ${nomVehicule.get(c.vehicule_id) ?? "véhicule"}` : ""}
                      {c.chauffeur_id ? ` · ${nomChauffeur.get(c.chauffeur_id) ?? "chauffeur"}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-phoebe-anthracite/70">
                      {jours.length > 0
                        ? jours.map((j) => JOURS_LABELS[j]?.slice(0, 3)).join(", ")
                        : "aucun jour"}
                      {c.heure_debut && c.heure_fin
                        ? ` · ${c.heure_debut.slice(0, 5)}–${c.heure_fin.slice(0, 5)}`
                        : " · créneau incomplet"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-phoebe-gold-dark">
                      {c.montant_periodique ? fmt(Number(c.montant_periodique)) : "—"}
                    </p>
                    <p className="text-xs text-phoebe-anthracite/70">
                      {FREQUENCE_LABELS[c.frequence_facturation as Frequence] ??
                        c.frequence_facturation ??
                        "non facturé"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-phoebe-pearl pt-4">
                  <ContratActions contratId={c.id} statut={c.statut} />
                </div>

                {lignes.length > 0 && (
                  <div className="mt-4 border-t border-phoebe-pearl pt-4">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-phoebe-anthracite/70">
                      Échéances
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {lignes.map((e) => (
                        <li key={e.id} className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="text-phoebe-anthracite/70">
                            {jour(e.periode_debut)} → {jour(e.periode_fin)}
                          </span>
                          <span className="font-medium text-phoebe-anthracite">
                            {fmt(Number(e.montant))}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              ECHEANCE_COULEURS[e.statut] ?? "bg-phoebe-pearl"
                            }`}
                          >
                            {STATUT_ECHEANCE_LABELS[
                              e.statut as keyof typeof STATUT_ECHEANCE_LABELS
                            ] ?? e.statut}
                          </span>
                          <EcheanceActions echeanceId={e.id} statut={e.statut} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
