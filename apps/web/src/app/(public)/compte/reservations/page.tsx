import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"

import { Card } from "@/components/ui"
import { annulerParClient } from "@/app/actions/demandes"

export const metadata: Metadata = {
  title: "Mes Réservations",
  description: "Consultez et gérez toutes vos réservations de transport, immobilier et assistance voyage GROUP PHOEBE.",
  openGraph: {
    title: "Mes Réservations",
    description: "Consultez et gérez toutes vos réservations de transport, immobilier et assistance voyage GROUP PHOEBE.",
  },
}

type ReservationItem = {
  id: string
  created_at: string
  title: string
  category: string
  period: string
  price: string
  status: string
  photoUrl: string | null
}

const TABS = [
  { key: "actives", label: "Actives" },
  { key: "terminees", label: "Terminées" },
  { key: "annulees", label: "Annulées" },
] as const

function isActive(s: string) {
  return !["terminee", "termine", "finalise", "annulee", "annule", "refusee", "refuse"].includes(s)
}
function isTerminee(s: string) {
  return ["terminee", "termine", "finalise"].includes(s)
}
function isAnnulee(s: string) {
  return ["annulee", "annule", "refusee", "refuse"].includes(s)
}

function canCancel(status: string) {
  return ["en_attente_paiement", "en_attente_validation", "acceptee", "en_negociation"].includes(status)
}

export default async function CompteReservations({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const currentTab = sp.tab || "actives"
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="px-6 py-20 text-center">
        <h1 className="text-4xl font-bold text-public-text">Mes Réservations</h1>
        <p className="mt-4 text-sm text-public-text-muted">Connectez-vous pour voir vos réservations.</p>
      </div>
    )
  }

  const [transportRes, immobilierRes, assistanceRes] = await Promise.all([
    supabase
      .from("demandes_transport")
      .select("id, created_at, statut, montant, categorie, vehicule_id, vehicules!inner(marque, modele)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("demandes_immobilier")
      .select("id, created_at, statut, type, montant_offre, bien_id, biens(localisation, type)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("dossiers_voyage")
      .select("id, created_at, statut, type, pays_cible")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
  ])

  const vehiculeIds = [...new Set(transportRes.data?.map((d) => d.vehicule_id).filter(Boolean) as string[] ?? [])]
  const { data: allPhotos } = vehiculeIds.length > 0
    ? await supabase.from("vehicule_photos").select("vehicule_id, url").in("vehicule_id", vehiculeIds).order("ordre")
    : { data: null }
  const photoMap = new Map<string, string>()
  if (allPhotos) {
    for (const p of allPhotos) {
      if (!photoMap.has(p.vehicule_id)) photoMap.set(p.vehicule_id, p.url)
    }
  }

  const transportReservations: ReservationItem[] = transportRes.data?.map((d) => ({
    id: d.id,
    created_at: d.created_at,
    title: `${d.vehicules?.marque ?? ""} ${d.vehicules?.modele ?? ""}`.trim() || "Véhicule",
    category: "Transport",
    period: new Date(d.created_at).toLocaleDateString("fr-FR"),
    price: d.montant ? `${d.montant.toLocaleString()} FCFA` : "—",
    status: d.statut,
    photoUrl: d.vehicule_id ? (photoMap.get(d.vehicule_id) ?? null) : null,
  })) ?? []

  const immobilierReservations: ReservationItem[] = immobilierRes.data?.map((d) => ({
    id: d.id,
    created_at: d.created_at,
    title: d.biens?.localisation ?? "Bien immobilier",
    category: "Immobilier",
    period: `Visite: ${new Date(d.created_at).toLocaleDateString("fr-FR")}`,
    price: d.montant_offre ? `${d.montant_offre.toLocaleString()} FCFA` : "—",
    status: d.statut,
    photoUrl: null,
  })) ?? []

  const assistanceReservations: ReservationItem[] = assistanceRes.data?.map((d) => ({
    id: d.id,
    created_at: d.created_at,
    title: `${d.type} - ${d.pays_cible}`,
    category: "Assistance",
    period: new Date(d.created_at).toLocaleDateString("fr-FR"),
    price: "—",
    status: d.statut,
    photoUrl: null,
  })) ?? []

  const allReservations = [...transportReservations, ...immobilierReservations, ...assistanceReservations]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const filtered =
    currentTab === "terminees"
      ? allReservations.filter((r) => isTerminee(r.status))
      : currentTab === "annulees"
        ? allReservations.filter((r) => isAnnulee(r.status))
        : allReservations.filter((r) => isActive(r.status))

  const statusStyle = (status: string) => {
    if (["terminee", "termine", "finalise"].includes(status)) return { color: "text-[#6B7280]", label: "Terminé" }
    if (["annulee", "annule", "refusee", "refuse"].includes(status)) return { color: "text-[#EF4444]", label: "Annulé" }
    return { color: "text-accent-orange", label: "En attente" }
  }

  return (
    <div className="px-6 py-10">
      <h1 className="text-4xl font-bold text-public-text">Mes Réservations</h1>

      <div className="mt-6 flex gap-4 border-b border-public-border pb-3">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/compte/reservations?tab=${tab.key}`}
            className={`text-sm transition-colors ${currentTab === tab.key ? "font-semibold text-public-text" : "text-public-text-muted hover:text-public-text"}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <svg width="160" height="120" viewBox="0 0 160 120" fill="none" className="text-public-text-faint">
              <path d="M80 15L140 50V95L80 120L20 95V50L80 15Z" fill="currentColor" fillOpacity="0.08" />
              <path d="M80 15L140 50V95L80 120L20 95V50L80 15Z" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
              <path d="M80 15L140 50M80 15L20 50M80 15V55M140 50L80 55M140 50V95L80 120M20 50V95L80 120M80 95V120M80 95L20 75M80 95L140 75" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
              <rect x="60" y="35" width="40" height="30" rx="3" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
              <rect x="72" y="30" width="16" height="10" rx="2" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.2" />
              <circle cx="80" cy="50" r="4" fill="currentColor" fillOpacity="0.15" />
              <path d="M60 65L45 72M100 65L115 72M45 72L80 90L115 72" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
              <rect x="68" y="55" width="8" height="12" rx="1" fill="currentColor" fillOpacity="0.1" />
              <rect x="80" y="58" width="8" height="10" rx="1" fill="currentColor" fillOpacity="0.08" />
            </svg>
            <p className="mt-6 text-sm text-public-text-muted">
              Aucune réservation {currentTab === "terminees" ? "terminée" : currentTab === "annulees" ? "annulée" : "active"}.
            </p>
          </div>
        ) : filtered.map((r) => {
          const st = statusStyle(r.status)
          return (
            <Card key={r.id} className="flex items-center gap-4">
              {r.photoUrl && (
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={r.photoUrl}
                    alt={r.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-public-text truncate">{r.title}</h3>
                  <span className="shrink-0 text-sm text-[#6B7280]">{r.category}</span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-public-text-muted">
                  <span>{r.period}</span>
                  <span className="text-sm font-bold text-public-text">{r.price}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-sm font-semibold ${st.color}`}>{st.label}</span>
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/reservation/confirmation?demande=${r.id}`}
                    className="text-xs text-public-text hover:text-accent-gold transition-colors text-right"
                  >
                    Voir le détail
                  </Link>
                  {r.category === "Transport" && canCancel(r.status) && (
                    <form action={async () => { await annulerParClient(r.id) }}>
                      <button
                        type="submit"
                        className="text-xs text-[#EF4444] hover:text-[#DC2626] transition-colors"
                      >
                        Annuler la réservation
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
