import type { Metadata } from "next"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { Database } from "@group-phoebe/database/types"
import { BackLink } from "@/components/public/back-link"
import { getT } from "@/lib/i18n"
import { PhotoLightbox } from "@/components/photo-lightbox"
import {
  ZONE_LABELS,
  MODE_LABELS,
  STATUT_LIVRAISON_LABELS,
} from "@/lib/livraison"

export const metadata: Metadata = {
  title: "Suivre un colis",
  description: "Suivez votre livraison GROUP PHOEBE en temps réel grâce à votre numéro de suivi.",
}

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function SuiviPage({
  searchParams,
}: {
  searchParams: Promise<{ numero?: string }>
}) {
  const t = await getT()
  const { numero } = await searchParams
  const numeroNorm = numero?.trim().toUpperCase() ?? ""

  let expedition:
    | { numero_suivi: string; statut: string; zone: string; mode: string; created_at: string }
    | null = null
  let historique: { statut: string; horodatage: string }[] = []
  let photos: string[] = []
  let introuvable = false

  if (numeroNorm) {
    // Recherche par numéro de suivi (le numéro fait office de clé publique).
    const db = getAdmin()
    const { data } = await db
      .from("expeditions")
      .select("*")
      .eq("numero_suivi", numeroNorm)
      .single()

    if (data) {
      expedition = data
      photos = ((data as unknown as { photos?: string[] }).photos) ?? []
      const { data: hist } = await db
        .from("expedition_statut_historique")
        .select("statut, horodatage")
        .eq("expedition_id", data.id)
        .order("horodatage", { ascending: true })
      historique = hist ?? []
    } else {
      introuvable = true
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <div className="mb-6">
        <BackLink href="/livraison" label={t.suivi.retourLivraison} />
      </div>
      <h1 className="text-4xl font-bold text-public-text">{t.suivi.titre}</h1>
      <p className="mt-2 text-sm text-public-text-muted">
        {t.suivi.consigne}
      </p>

      <form method="get" className="mt-6 flex gap-2">
        <input
          name="numero"
          defaultValue={numeroNorm}
          placeholder="GP-XXXXXXXX"
          required
          className="w-full rounded-xl border border-public-border bg-public-bg px-4 py-2.5 text-sm text-public-text placeholder:text-public-text-faint focus:border-accent-orange focus:outline-none focus:ring-2 focus:ring-accent-orange/20"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-accent-orange px-5 py-2.5 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-accent-orange-hover"
        >
          {t.suivi.bouton}
        </button>
      </form>

      {introuvable && (
        <div role="alert" className="mt-6 rounded-xl border border-error/30 bg-error/5 px-5 py-3 text-sm text-error">
          {t.suivi.introuvable}
        </div>
      )}

      {expedition && (
        <div className="mt-8 rounded-2xl border border-public-border bg-public-bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg font-bold text-public-text">{expedition.numero_suivi}</span>
            <span className="rounded-full bg-accent-orange/10 px-3 py-1 text-xs font-semibold text-accent-orange">
              {STATUT_LIVRAISON_LABELS[expedition.statut] ?? expedition.statut}
            </span>
          </div>
          <p className="mt-1 text-sm text-public-text-muted">
            {ZONE_LABELS[expedition.zone as keyof typeof ZONE_LABELS] ?? expedition.zone} ·{" "}
            {MODE_LABELS[expedition.mode as keyof typeof MODE_LABELS] ?? expedition.mode}
          </p>

          {photos.length > 0 && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wider text-public-text-muted">{t.suivi.photosColis}</p>
              <div className="mt-2">
                <PhotoLightbox photos={photos} />
              </div>
            </div>
          )}

          {historique.length > 0 && (
            <ol className="mt-6 space-y-4 border-t border-public-border pt-6">
              {historique.map((h, i) => {
                const dernier = i === historique.length - 1
                return (
                  <li key={`${h.statut}-${h.horodatage}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`mt-1 h-3 w-3 rounded-full ${dernier ? "bg-accent-orange" : "bg-public-border"}`} />
                      {i < historique.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-public-border" />}
                    </div>
                    <div className="pb-1">
                      <p className={`text-sm font-medium ${dernier ? "text-public-text" : "text-public-text-muted"}`}>
                        {STATUT_LIVRAISON_LABELS[h.statut] ?? h.statut}
                      </p>
                      <p className="text-xs text-public-text-faint">
                        {new Date(h.horodatage).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}
