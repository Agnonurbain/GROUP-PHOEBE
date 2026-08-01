import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { Database } from "@group-phoebe/database/types"
import { ChauffeurForm, NouveauChauffeur } from "./chauffeur-form"

export const metadata: Metadata = {
  title: "Chauffeurs — Administration",
  description: "Chauffeurs, véhicules rattachés et courses en cours.",
}

/** Une course est « en cours » tant qu'elle mobilise le chauffeur. */
const STATUTS_MOBILISANTS = ["en_attente_validation", "acceptee", "en_cours"]

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function ChauffeursAdminPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims
  if (!user) redirect("/connexion")

  const { data: profil } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single()
  if (!profil || !["operateur", "proprietaire"].includes(profil.role)) redirect("/admin")

  const db = getAdmin()

  const [{ data: chauffeursRaw }, { data: liens }, { data: courses }, { data: vehiculesAvecOption }] =
    await Promise.all([
      db.from("chauffeurs").select("id, nom, telephone, actif, permis_professionnel_url").order("nom"),
      db.from("vehicule_chauffeurs").select("chauffeur_id, vehicule_id, vehicules(marque, modele)"),
      db
        .from("demandes_transport")
        .select("chauffeur_id")
        .in("statut", STATUTS_MOBILISANTS)
        .not("chauffeur_id", "is", null),
      // Véhicules qui annoncent l'option au client. Le drapeau est indépendant
      // de l'existence d'un chauffeur : c'est précisément le piège à signaler.
      db.from("vehicules").select("id, marque, modele").eq("chauffeur_disponible", true),
    ])

  const chauffeurs = chauffeursRaw ?? []

  const vehiculesParChauffeur = new Map<string, string[]>()
  for (const l of liens ?? []) {
    const v = l.vehicules as { marque: string; modele: string } | null
    if (!l.chauffeur_id || !v) continue
    const liste = vehiculesParChauffeur.get(l.chauffeur_id) ?? []
    liste.push(`${v.marque} ${v.modele}`)
    vehiculesParChauffeur.set(l.chauffeur_id, liste)
  }

  const chargeParChauffeur = new Map<string, number>()
  for (const c of courses ?? []) {
    if (c.chauffeur_id) {
      chargeParChauffeur.set(c.chauffeur_id, (chargeParChauffeur.get(c.chauffeur_id) ?? 0) + 1)
    }
  }

  // Un véhicule qui vend l'option sans aucun chauffeur actif rattaché produit une
  // réservation qui échoue, sur un message parlant du véhicule.
  const chauffeursActifs = new Set(chauffeurs.filter((c) => c.actif).map((c) => c.id))
  const rattachesActifs = new Set(
    (liens ?? [])
      .filter((l) => l.chauffeur_id && chauffeursActifs.has(l.chauffeur_id))
      .map((l) => l.vehicule_id)
  )
  const vehiculesOrphelins = (vehiculesAvecOption ?? []).filter((v) => !rattachesActifs.has(v.id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-phoebe-anthracite">Chauffeurs</h1>
        <p className="mt-1 text-sm text-phoebe-anthracite/70">
          Un chauffeur est une ressource, comme un véhicule — il n&apos;a pas de compte
          de connexion. Le rattachement à un véhicule se fait depuis la fiche du
          véhicule.
        </p>
      </div>

      {vehiculesOrphelins.length > 0 && (
        <div className="rounded-2xl border border-error/30 bg-error/5 p-4">
          <p className="text-sm font-semibold text-error">
            {vehiculesOrphelins.length} véhicule{vehiculesOrphelins.length > 1 ? "s" : ""} vend
            {vehiculesOrphelins.length > 1 ? "ent" : ""} l&apos;option « avec chauffeur » sans
            aucun chauffeur actif rattaché
          </p>
          <p className="mt-1 text-xs text-phoebe-anthracite/70">
            Toute réservation avec chauffeur sur{" "}
            {vehiculesOrphelins.map((v) => `${v.marque} ${v.modele}`).join(", ")} échoue —
            et le message parle de la disponibilité du véhicule, pas du chauffeur.
            Rattachez un chauffeur depuis la fiche, ou décochez l&apos;option.
          </p>
          <Link
            href="/admin/vehicules"
            className="mt-2 inline-block text-xs font-semibold text-phoebe-green hover:underline"
          >
            Voir les véhicules
          </Link>
        </div>
      )}

      <NouveauChauffeur />

      {chauffeurs.length === 0 ? (
        <div className="rounded-2xl border border-phoebe-pearl bg-white p-10 text-center">
          <p className="text-sm text-phoebe-anthracite/70">
            Aucun chauffeur enregistré. Sans chauffeur, toute réservation « avec
            chauffeur » échoue.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {chauffeurs.map((c) => {
            const vehicules = vehiculesParChauffeur.get(c.id) ?? []
            const enCours = chargeParChauffeur.get(c.id) ?? 0
            return (
              <div key={c.id} className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-phoebe-anthracite">{c.nom}</span>
                      {!c.actif && (
                        <span className="rounded-full bg-phoebe-pearl px-2.5 py-0.5 text-[11px] font-semibold text-phoebe-anthracite">
                          Inactif
                        </span>
                      )}
                      {c.actif && vehicules.length === 0 && (
                        <span className="rounded-full bg-phoebe-gold/10 px-2.5 py-0.5 text-[11px] font-semibold text-phoebe-gold-dark">
                          Aucun véhicule
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-phoebe-anthracite/70">
                      {vehicules.length > 0 ? vehicules.join(" · ") : "Rattachez-le depuis une fiche véhicule"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-phoebe-anthracite">{enCours}</p>
                    <p className="text-xs text-phoebe-anthracite/70">
                      course{enCours > 1 ? "s" : ""} en cours
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-phoebe-pearl pt-4">
                  <ChauffeurForm
                    chauffeurId={c.id}
                    initial={{
                      nom: c.nom,
                      telephone: c.telephone,
                      permis_professionnel_url: c.permis_professionnel_url ?? "",
                      actif: c.actif,
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
