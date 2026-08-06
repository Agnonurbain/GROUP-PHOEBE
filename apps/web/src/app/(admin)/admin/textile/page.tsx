import type { Metadata } from "next"
import Image from "next/image"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ScrollReveal } from "@/components/effects"
import {
  STATUT_TEXTILE_LABELS,
  STATUTS_TEXTILE_OUVERTS,
  UNITE_LABELS,
  libelleTypePagne,
  type StatutTextile,
  type UnitePagne,
} from "@/lib/textile"
import { catalogueComplet, typesPagneComplet, margeRevendeur } from "@/app/actions/textile"
import { TextileActions } from "./textile-actions"
import { CatalogueForm } from "./catalogue-form"
import { GammesForm } from "./gammes-form"
import { MargeForm } from "./marge-form"

export const metadata: Metadata = {
  title: "Textile — Administration",
  description: "Demandes de devis pagne.",
}

const STATUT_COLORS: Record<string, string> = {
  soumise: "bg-blue-50 text-blue-700",
  en_cours_traitement: "bg-amber-50 text-amber-700",
  devis_envoye: "bg-phoebe-gold/15 text-phoebe-gold-dark",
  confirmee: "bg-phoebe-green/10 text-phoebe-green-deep",
  livree: "bg-phoebe-pearl text-phoebe-anthracite",
  annulee: "bg-error/10 text-error",
}

const dateFr = (v: string) => new Date(v).toLocaleDateString("fr-FR")

// Le bucket est public : le chemin suffit à faire une URL, sans signature.
const BASE_PHOTOS = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/catalogue-pagnes/`

export default async function AdminTextile() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims
  if (!user) redirect("/connexion")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single()
  if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
    redirect("/admin")
  }
  const estProprietaire = profile.role === "proprietaire"

  // La jointure sur l'article n'est pas décorative : quand le client a désigné
  // un modèle du catalogue, c'est CE modèle qu'il faut commander. Sans elle,
  // l'équipe lisait « Uniwax — Print » et devait deviner lequel.
  const { data: demandes } = await supabase
    .from("demandes_textile")
    .select("*, articles_pagne(nom, reference, couleurs, photos)")
    .order("created_at", { ascending: false })

  const lignes = demandes ?? []

  const clientIds = [...new Set(lignes.map((d) => d.client_id))]
  const { data: clients } = clientIds.length
    ? await supabase.from("users").select("id, nom, telephone").in("id", clientIds)
    : { data: [] }
  const clientById = new Map((clients ?? []).map((c) => [c.id, c]))

  const { data: types } = await supabase
    .from("types_pagne")
    .select("cle, marque, gamme, description, ordre")
    .eq("actif", true)
    .order("ordre")

  // Catalogue et gammes, complets : le propriétaire voit aussi ce qu'il a retiré.
  // Le catalogue est alimenté par le personnel ; les gammes restent au
  // propriétaire — elles déclarent ce que la maison vend.
  const [articles, gammes] = await Promise.all([
    catalogueComplet(),
    estProprietaire ? typesPagneComplet() : Promise.resolve([]),
  ])

  // La marge sert à CHIFFRER : l'opérateur qui prépare un devis en a besoin,
  // même s'il n'a pas le droit de la changer.
  const marge = await margeRevendeur()
  const typeById = new Map(
    (types ?? []).map((t) => [t.cle, libelleTypePagne({ ...t, description: t.description })])
  )

  // Les demandes ouvertes d'abord : ce sont celles qui attendent quelque chose
  // de l'équipe.
  const ouvertes = lignes.filter((d) => STATUTS_TEXTILE_OUVERTS.includes(d.statut as StatutTextile))
  const closes = lignes.filter((d) => !STATUTS_TEXTILE_OUVERTS.includes(d.statut as StatutTextile))

  return (
    <div className="space-y-8">
      <ScrollReveal variant="fade-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">Textile</h1>
          <p className="mt-2 text-sm text-phoebe-anthracite/70">
            Demandes de devis pagne. Aucun prix n&apos;est affiché au catalogue :
            le montant se fixe ici, demande par demande, après consultation des
            fournisseurs.
          </p>
        </div>
      </ScrollReveal>

      {/* Le catalogue avant les demandes : sans vitrine garnie, les demandes
          n'arrivent pas. Propriétaire seul — il engage l'image de la maison. */}
      {estProprietaire && (
        <ScrollReveal variant="fade-up" delay={0.03}>
          <MargeForm marge={marge} />
        </ScrollReveal>
      )}

      {estProprietaire && (
        <ScrollReveal variant="fade-up" delay={0.04}>
          <GammesForm types={gammes} />
        </ScrollReveal>
      )}

      <ScrollReveal variant="fade-up" delay={0.05}>
        <CatalogueForm
          types={(types ?? []).map((t) => ({
            cle: t.cle,
            marque: t.marque,
            gamme: t.gamme,
            description: t.description,
            ordre: t.ordre,
          }))}
          articles={articles}
        />
      </ScrollReveal>

      {lignes.length === 0 ? (
        <div className="rounded-2xl border border-phoebe-pearl bg-white py-12 text-center shadow-sm">
          <p className="text-phoebe-anthracite/70">Aucune demande pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...ouvertes, ...closes].map((d) => {
            const client = clientById.get(d.client_id)
            return (
              <div key={d.id} className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-phoebe-anthracite">
                        {typeById.get(d.type_pagne) ?? d.type_pagne}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUT_COLORS[d.statut] ?? "bg-phoebe-pearl text-phoebe-anthracite"}`}>
                        {STATUT_TEXTILE_LABELS[d.statut as StatutTextile] ?? d.statut}
                      </span>
                      {/* Un revendeur ne se chiffre pas comme un particulier :
                          l'équipe doit le voir AVANT d'aller consulter ses
                          fournisseurs, pas en relisant le message. */}
                      {d.pour_revente && (
                        <span className="rounded-full bg-phoebe-gold/20 px-2.5 py-0.5 text-[11px] font-semibold text-phoebe-gold-dark">
                          Revendeur — tarif de gros, marge {marge} %
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-phoebe-anthracite/70">
                      Client : {client?.nom ?? "—"}
                      {client?.telephone ? ` · ${client.telephone}` : ""}
                      {" · "}
                      {d.quantite} × {UNITE_LABELS[d.unite as UnitePagne] ?? d.unite}
                      {" · "}
                      demandé le {dateFr(d.created_at)}
                    </p>
                    {/* Le modèle désigné, quand il y en a un. C'est la
                        commande à passer : le montrer évite de la déduire du
                        motif décrit à côté. */}
                    {d.articles_pagne && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-phoebe-gold/30 bg-phoebe-gold/5 px-2 py-1.5">
                        {d.articles_pagne.photos?.[0] ? (
                          <Image
                            src={`${BASE_PHOTOS}${d.articles_pagne.photos[0]}`}
                            alt=""
                            width={32}
                            height={40}
                            className="h-10 w-8 rounded object-cover"
                          />
                        ) : null}
                        <p className="text-xs text-phoebe-anthracite">
                          Modèle du catalogue :{" "}
                          <span className="font-medium">{d.articles_pagne.nom}</span>
                          {d.articles_pagne.reference ? ` · réf. ${d.articles_pagne.reference}` : ""}
                          {d.articles_pagne.couleurs ? ` · ${d.articles_pagne.couleurs}` : ""}
                        </p>
                      </div>
                    )}
                    {(d.motif || d.couleurs) && (
                      <p className="mt-1 text-xs text-phoebe-anthracite/70">
                        {d.motif && <>Motif : {d.motif}</>}
                        {d.motif && d.couleurs && " · "}
                        {d.couleurs && <>Couleurs : {d.couleurs}</>}
                      </p>
                    )}
                    {d.message && (
                      <p className="mt-2 max-w-prose rounded-lg bg-phoebe-pearl/50 px-3 py-2 text-xs italic text-phoebe-anthracite/80">
                        « {d.message} »
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    {d.montant_propose != null && (
                      <p className="text-lg font-bold text-phoebe-green-deep">
                        {Number(d.montant_propose).toLocaleString("fr-FR")} FCFA
                      </p>
                    )}
                    {d.devis_valable_jusqu_a && (
                      new Date(d.devis_valable_jusqu_a) < new Date()
                        ? <p className="text-[11px] font-semibold text-error">Devis expiré</p>
                        : <p className="text-[11px] text-phoebe-anthracite/60">
                            Valable jusqu&apos;au {dateFr(d.devis_valable_jusqu_a)}
                          </p>
                    )}
                  </div>
                </div>

                <TextileActions
                  demandeId={d.id}
                  statut={d.statut as StatutTextile}
                  estProprietaire={estProprietaire}
                  montant={d.montant_propose != null ? Number(d.montant_propose) : null}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
