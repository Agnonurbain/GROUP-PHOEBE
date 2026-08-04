import type { Metadata } from "next"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { Database } from "@group-phoebe/database/types"
import { PiecesSection, type PieceAdmin } from "./pieces-section"
import { DossierActions } from "./dossiers-actions"
import { EncaisserAuBureau } from "../billets/encaisser-bureau"
import { libelleCreneau } from "@/lib/rendez-vous"
import { STATUTS_DOSSIER, STATUT_DOSSIER_LABELS, prixLabel } from "@/lib/assistance"

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

  // Pièces justificatives : la table existait depuis la migration initiale, avec
  // ses policies posées en 00038, et personne ne la lisait — alors que le statut
  // `pieces_complementaires_requises` en réclamait.
  const dossierIds = (dossiers ?? []).map((d) => d.id)

  // Un dossier ne se règle plus en ligne : le montant est arrêté et encaissé au
  // bureau, lors du rendez-vous de dépôt. Sans cette lecture, l'équipe
  // encaisserait au comptoir sans pouvoir l'enregistrer nulle part.
  // Le rendez-vous de dépôt : sans lui à l'écran, l'équipe découvrirait le
  // client devant le comptoir.
  const { data: rendezVous } = dossierIds.length
    ? await db
        .from("rendez_vous_dossier")
        .select("dossier_id, debut, fin")
        .eq("statut", "reserve")
        .in("dossier_id", dossierIds)
        .order("debut")
    : { data: [] }
  const rdvParDossier = new Map(
    (rendezVous ?? []).map((r) => [r.dossier_id as string, { debut: String(r.debut), fin: String(r.fin) }])
  )

  const { data: paiementsEnAttente } = dossierIds.length
    ? await db
        .from("paiements")
        .select("reference_id, montant")
        .eq("reference_table", "dossiers_voyage")
        .eq("statut", "en_attente")
        .in("reference_id", dossierIds)
    : { data: [] }
  const aEncaisser = new Map(
    (paiementsEnAttente ?? []).map((p) => [p.reference_id as string, Number(p.montant)])
  )
  const { data: piecesRaw } = dossierIds.length
    ? await db
        .from("documents_dossier_voyage")
        .select("id, dossier_id, type_document, statut, commentaire")
        .in("dossier_id", dossierIds)
    : { data: [] }

  const piecesParDossier = new Map<string, PieceAdmin[]>()
  for (const p of piecesRaw ?? []) {
    const liste = piecesParDossier.get(p.dossier_id) ?? []
    liste.push({
      id: p.id,
      type_document: p.type_document,
      statut: p.statut,
      commentaire: p.commentaire,
    })
    piecesParDossier.set(p.dossier_id, liste)
  }

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
          {dossiers.map((d) => {
            const prestation = (d as { prestation?: string | null }).prestation ?? null
            const montant = (d as { montant_estime?: number | null }).montant_estime ?? null
            return (
            <div key={d.id} className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-phoebe-anthracite">
                      {prestation ? `${prestation} — ${d.pays_cible}` : d.pays_cible}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUT_COLORS[d.statut] ?? "bg-phoebe-pearl text-phoebe-anthracite"}`}>
                      {STATUT_DOSSIER_LABELS[d.statut] ?? d.statut}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-phoebe-anthracite/70">
                    Client : {userNom.get(d.client_id) ?? "—"} · {TYPE_LABELS[d.type] ?? d.type} ·{" "}
                    {new Date(d.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="text-right">
                  {prestation && (
                    <p className="text-sm font-bold text-phoebe-green-deep">{prixLabel(montant)}</p>
                  )}
                  <p className="text-xs text-phoebe-anthracite/70">
                    {d.conseiller_id ? `Conseiller : ${userNom.get(d.conseiller_id) ?? "—"}` : "Non affecté"}
                  </p>
                  {rdvParDossier.has(d.id) && (
                    <p className="mt-1 text-[11px] font-medium text-phoebe-green-deep">
                      Dépôt : {libelleCreneau(rdvParDossier.get(d.id)!.debut, rdvParDossier.get(d.id)!.fin)}
                    </p>
                  )}
                  {aEncaisser.has(d.id) && (
                    <p className="mt-1.5">
                      <EncaisserAuBureau
                        referenceTable="dossiers_voyage"
                        referenceId={d.id}
                        montant={aEncaisser.get(d.id)!}
                      />
                    </p>
                  )}
                </div>
              </div>

              <PiecesSection pieces={piecesParDossier.get(d.id) ?? []} />

              <DossierActions
                dossierId={d.id}
                currentStatut={d.statut}
                currentConseiller={d.conseiller_id}
                conseillers={conseillers}
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
