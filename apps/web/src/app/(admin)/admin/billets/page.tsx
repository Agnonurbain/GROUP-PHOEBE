import { VerificationPiece, LienPasseport } from "./verification-pieces"
import type { Metadata } from "next"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { Database } from "@group-phoebe/database/types"
import { createClient } from "@/lib/supabase/server"
import { getParametresBillet } from "@/lib/public-cache"
import { BilletActions } from "./billet-actions"
import {
  STATUT_BILLET_LABELS,
  STATUT_BILLET_COLORS,
  STATUTS_BILLET_OUVERTS,
  TYPE_TRAJET_LABELS,
  CLASSE_LABELS,
  libelleVoyageurs,
} from "@/lib/billets"

export const metadata: Metadata = {
  title: "Billets d'avion — Administration",
  description: "Demandes de réservation de billets : recherche, devis et émission.",
}

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const dateFr = (v: string) => new Date(v).toLocaleDateString("fr-FR")

export default async function BilletsAdminPage() {
  const db = getAdmin()

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const { data: profile } = claimsData?.claims
    ? await supabase.from("users").select("role").eq("id", claimsData.claims.sub).single()
    : { data: null }
  const estProprietaire = profile?.role === "proprietaire"

  // Même règle que celle appliquée au client : la validité exigée est pilotée.
  const params = await getParametresBillet()

  const { data: demandes } = await db
    .from("demandes_billet")
    .select("*")
    .order("created_at", { ascending: false })

  const lignes = demandes ?? []

  const clientIds = [...new Set(lignes.map((d) => d.client_id))]
  const { data: clients } = clientIds.length
    ? await db.from("users").select("id, nom, telephone, email").in("id", clientIds)
    : { data: [] }
  const clientById = new Map((clients ?? []).map((c) => [c.id, c]))

  // Accompagnants : saisis avec la demande depuis 00079. Sans eux à l'écran, la
  // saisie du client ne servirait à personne — et la compagnie exige le
  // passeport de chaque voyageur pour émettre son billet.
  const { data: passagers } = lignes.length
    ? await db
        .from("passagers_billet")
        .select("id, demande_id, nom, type, passeport_numero, passeport_expiration, passeport_fichier")
        .in("demande_id", lignes.map((d) => d.id))
        .order("created_at")
    : { data: [] }
  type PassagerLigne = {
    id: string
    demande_id: string
    nom: string
    type: string | null
    passeport_numero: string
    passeport_expiration: string
    passeport_fichier: string | null
  }
  const passagersParDemande = new Map<string, PassagerLigne[]>()
  for (const p of (passagers ?? []) as PassagerLigne[]) {
    const liste = passagersParDemande.get(p.demande_id) ?? []
    liste.push(p)
    passagersParDemande.set(p.demande_id, liste)
  }

  const { data: staff } = await db
    .from("users")
    .select("id, nom")
    .in("role", ["operateur", "proprietaire"])
  const conseillers = (staff ?? []).map((s) => ({ id: s.id, nom: s.nom }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-phoebe-anthracite">Billets d&apos;avion</h1>
        <p className="mt-1 text-sm text-phoebe-anthracite/70">
          Demandes de réservation — cherchez le vol, envoyez un devis, puis marquez le
          billet comme émis.
        </p>
      </div>

      {lignes.length === 0 ? (
        <div className="rounded-2xl border border-phoebe-pearl bg-white p-10 text-center">
          <p className="text-sm text-phoebe-anthracite/70">Aucune demande de billet pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lignes.map((d) => {
            const client = clientById.get(d.client_id)
            const ouverte = (STATUTS_BILLET_OUVERTS as readonly string[]).includes(d.statut)

            // Un passeport doit rester valable après le départ : le signaler ici
            // évite un billet émis sur un document qui ne passera pas.
            const limite = new Date(d.date_depart)
            limite.setMonth(limite.getMonth() + params.mois_validite_passeport)
            const passeportJuste = new Date(d.passeport_expiration) < limite

            return (
              <div key={d.id} className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-phoebe-anthracite">
                        {d.depart} → {d.destination}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUT_BILLET_COLORS[d.statut] ?? "bg-phoebe-pearl text-phoebe-anthracite"}`}>
                        {STATUT_BILLET_LABELS[d.statut] ?? d.statut}
                      </span>
                      <span className="rounded-full bg-phoebe-pearl px-2.5 py-0.5 text-[11px] font-medium text-phoebe-anthracite/80">
                        {TYPE_TRAJET_LABELS[d.type_trajet] ?? d.type_trajet}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-phoebe-anthracite/70">
                      Client : {client?.nom ?? "—"}
                      {client?.telephone ? ` · ${client.telephone}` : ""}
                      {" · "}
                      Départ le {dateFr(d.date_depart)}
                      {d.date_retour ? ` · retour le ${dateFr(d.date_retour)}` : ""}
                      {" · "}
                      {libelleVoyageurs({ adultes: d.nb_adultes, enfants: d.nb_enfants, bebes: d.nb_bebes })}
                      {" · "}
                      {CLASSE_LABELS[d.classe] ?? d.classe}
                    </p>

                    <p className="mt-2 text-xs text-phoebe-anthracite/70">
                      Passeport : <span className="font-medium text-phoebe-anthracite">{d.passeport_nom}</span>
                      {" · "}n° {d.passeport_numero}
                      {" · "}expire le {dateFr(d.passeport_expiration)}
                      {passeportJuste && (
                        <span className="ml-2 rounded-md bg-error/10 px-2 py-0.5 text-[11px] font-semibold text-error">
                          validité insuffisante après le départ
                        </span>
                      )}
                    </p>

                    {d.passeport_fichier && (
                      <p className="mt-1 text-xs">
                        <LienPasseport demandeId={d.id} piece="passeport" />
                      </p>
                    )}

                    {(passagersParDemande.get(d.id) ?? []).length > 0 && (
                      <div className="mt-2 rounded-lg border border-phoebe-pearl bg-phoebe-pearl/30 px-3 py-2">
                        <p className="text-[11px] font-semibold text-phoebe-anthracite">
                          Autres voyageurs ({(passagersParDemande.get(d.id) ?? []).length})
                        </p>
                        <ul className="mt-1 space-y-1">
                          {(passagersParDemande.get(d.id) ?? []).map((p, i) => (
                            <li key={p.id} className="text-xs text-phoebe-anthracite/70">
                              <span className="font-medium text-phoebe-anthracite">
                                {i + 2}. {p.nom}
                              </span>
                              {p.type ? ` (${p.type})` : ""}
                              {" · "}n° {p.passeport_numero}
                              {" · "}expire le {dateFr(p.passeport_expiration)}
                              {new Date(p.passeport_expiration) < limite && (
                                <span className="ml-2 rounded-md bg-error/10 px-2 py-0.5 text-[11px] font-semibold text-error">
                                  validité insuffisante après le départ
                                </span>
                              )}
                              {p.passeport_fichier && (
                                <span className="ml-2">
                                  <LienPasseport demandeId={d.id} piece={`passager:${p.id}`} />
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-phoebe-anthracite/70">
                      <span>
                        Fièvre jaune :
                        {d.certificat_fievre_jaune
                          ? <span className="text-phoebe-green-deep"> Certificat déclaré</span>
                          : <span className="text-error"> Non déclaré</span>}
                        {d.certificat_fievre_jaune_valide === true && (
                          <span className="ml-1.5 text-phoebe-green-deep">· Vérifié</span>
                        )}
                        {d.certificat_fievre_jaune_valide === false && (
                          <span className="ml-1.5 text-error">· À régulariser</span>
                        )}
                        <VerificationPiece
                          demandeId={d.id}
                          piece="fievre_jaune"
                          declaree={d.certificat_fievre_jaune}
                          valide={d.certificat_fievre_jaune_valide}
                          aUnDocument={Boolean(d.certificat_fievre_jaune_url)}
                        />
                      </span>
                      {(d.nb_enfants > 0 || d.nb_bebes > 0) && (
                        <span>
                          Autorisation parentale :
                          {d.mineur_autorisation_parentale
                            ? <span className="text-phoebe-green-deep"> Déclarée</span>
                            : <span className="text-error"> Non déclarée</span>}
                          {d.mineur_autorisation_verifie === true && (
                            <span className="ml-1.5 text-phoebe-green-deep">· Vérifiée</span>
                          )}
                          {d.mineur_autorisation_verifie === false && (
                            <span className="ml-1.5 text-error">· À régulariser</span>
                          )}
                          <VerificationPiece
                            demandeId={d.id}
                            piece="autorisation_mineur"
                            declaree={d.mineur_autorisation_parentale}
                            valide={d.mineur_autorisation_verifie}
                            aUnDocument={Boolean(d.mineur_autorisation_url)}
                          />
                        </span>
                      )}
                    </div>

                    {d.message && (
                      <p className="mt-2 max-w-prose rounded-lg bg-phoebe-pearl/50 px-3 py-2 text-xs italic text-phoebe-anthracite/80">
                        « {d.message} »
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    {d.montant_propose != null && (
                      <>
                        <p className="text-lg font-bold text-phoebe-green-deep">
                          {(Number(d.montant_propose) + Number(d.frais_service ?? 0)).toLocaleString("fr-FR")} FCFA
                        </p>
                        <p className="text-xs text-phoebe-anthracite/70">
                          vol {Number(d.montant_propose).toLocaleString("fr-FR")}
                          {d.frais_service != null && Number(d.frais_service) > 0 && (
                            <> + frais {Number(d.frais_service).toLocaleString("fr-FR")}</>
                          )}
                        </p>
                      </>
                    )}
                    <p className="text-xs text-phoebe-anthracite/70">
                      Demandé le {dateFr(d.created_at)}
                    </p>
                    {d.statut === "devis_envoye" && d.devis_valable_jusqu_a && (
                      new Date(d.devis_valable_jusqu_a) < new Date()
                        ? <p className="mt-0.5 text-[11px] font-semibold text-error">Devis expiré</p>
                        : <p className="mt-0.5 text-[11px] text-phoebe-anthracite/60">
                            Devis valable jusqu&apos;au {dateFr(d.devis_valable_jusqu_a)}
                          </p>
                    )}
                    {d.statut === "payee" && (
                      <p className="mt-0.5 text-[11px] font-semibold text-phoebe-green-deep">Payé — à émettre</p>
                    )}
                  </div>
                </div>

                <BilletActions
                  demandeId={d.id}
                  statut={d.statut}
                  conseillerId={d.conseiller_id}
                  conseillers={conseillers}
                  montantPropose={d.montant_propose != null ? Number(d.montant_propose) : null}
                  estProprietaire={estProprietaire}
                  ouverte={ouverte}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
