import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { Database } from "@group-phoebe/database/types"
import { Button } from "@/components/ui"
import { CheckIcon } from "@/components/icons"
import { PhotoLightbox } from "@/components/photo-lightbox"
import { ZONE_LABELS, MODE_LABELS, STATUT_LIVRAISON_LABELS } from "@/lib/livraison"

import { getT } from "@/lib/i18n/server"
export const metadata: Metadata = {
  title: "{t.livraison.enregistree} — Confirmation",
  description: "Votre commande de livraison GROUP PHOEBE a été enregistrée.",
}

export default async function ConfirmationLivraison({
  searchParams,
}: {
  searchParams: Promise<{ exp?: string }>
}) {
  const t = await getT()
  const { exp } = await searchParams
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims

  // Lecture via service role puis vérification de propriété (la table n'a pas
  // encore de politiques RLS côté client).
  let expedition:
    | { numero_suivi: string; statut: string; zone: string; mode: string; prix: number | null; destinataire_nom: string; client_id: string }
    | null = null
  let photos: string[] = []

  if (exp && user) {
    const admin = createAdminClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await admin
      .from("expeditions")
      .select("*")
      .eq("id", exp)
      .single()
    if (data && data.client_id === user.sub) {
      expedition = data
      photos = ((data as unknown as { photos?: string[] }).photos) ?? []
    }
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-accent-green/20 blur-xl" />
          <CheckIcon size={64} className="relative text-accent-green" />
        </div>
      </div>
      <h1 className="mb-3 text-4xl font-bold text-public-text">{t.livraison.enregistree}</h1>
      <p className="mb-8 max-w-sm text-public-text-muted leading-relaxed">
        {t.livraison.enregistreeTexte}
      </p>

      {expedition && (
        <div className="mb-8 w-full rounded-2xl border border-public-border bg-public-bg-card p-6 text-left">
          <p className="text-xs uppercase tracking-wider text-public-text-muted">{t.livraison.numeroSuivi}</p>
          <p className="mt-1 text-2xl font-bold text-accent-orange">{expedition.numero_suivi}</p>
          <p className="mt-1 text-xs text-public-text-muted">{t.livraison.conservezNumero}</p>

          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-public-text-muted">Statut</dt>
              <dd className="font-medium text-public-text">{STATUT_LIVRAISON_LABELS[expedition.statut] ?? expedition.statut}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-public-text-muted">Destinataire</dt>
              <dd className="font-medium text-public-text">{expedition.destinataire_nom}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-public-text-muted">Zone · Mode</dt>
              <dd className="font-medium text-public-text">
                {ZONE_LABELS[expedition.zone as keyof typeof ZONE_LABELS] ?? expedition.zone} · {MODE_LABELS[expedition.mode as keyof typeof MODE_LABELS] ?? expedition.mode}
              </dd>
            </div>
            {expedition.prix != null && (
              <div className="flex justify-between">
                <dt className="text-public-text-muted">Montant</dt>
                <dd className="font-bold text-public-text">{expedition.prix.toLocaleString("fr-FR")} FCFA</dd>
              </div>
            )}
          </dl>

          {photos.length > 0 && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wider text-public-text-muted">{t.livraison.photosColis}</p>
              <div className="mt-2">
                <PhotoLightbox photos={photos} />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <Link href="/livraison">
          <Button variant="ghost">{t.livraison.retourLivraison}</Button>
        </Link>
        <Link href="/compte/reservations">
          <Button variant="default">Mes commandes</Button>
        </Link>
      </div>
    </main>
  )
}
