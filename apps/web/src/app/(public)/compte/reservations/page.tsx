import type { Metadata } from "next"
import { BackLink } from "@/components/public/back-link"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"

import { Card } from "@/components/ui"
import { annulerParClient } from "@/app/actions/demandes"
import { PayerAcompte } from "@/components/public/payer-acompte"
import { ContreOffreReponse } from "@/components/public/contre-offre-reponse"
import { formaterCreneau } from "@/lib/immobilier"
import { TYPE_TRAJET_LABELS, STATUT_BILLET_LABELS, libelleVoyageurs } from "@/lib/billets"

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
  /** Montant à régler maintenant (acompte achat ou prix négocié), le cas échéant. */
  aPayer: number | null
  isAchat: boolean
  /** Lien « Voir le détail » (diffère selon le type : confirmation, suivi…). */
  detailHref: string
  /** Contre-offre immobilière en attente de réponse du client, le cas échéant. */
  contreOffre: number | null
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
  return ["terminee", "termine", "finalise", "livree", "emise"].includes(s)
}
function isAnnulee(s: string) {
  return ["annulee", "annule", "refusee", "refuse", "echec_livraison"].includes(s)
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

  const [transportRes, immobilierRes, assistanceRes, livraisonRes, billetsRes] = await Promise.all([
    supabase
      .from("demandes_transport")
      .select("id, created_at, statut, montant, categorie, type, prix_negocie, vehicule_id, vehicules!inner(marque, modele)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("demandes_immobilier")
      .select("id, created_at, statut, type, montant_offre, montant_contre_offre, montant_convenu, date_souhaitee, bien_id, biens(localisation, type)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("dossiers_voyage")
      .select("id, created_at, statut, type, pays_cible")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("expeditions")
      .select("id, created_at, statut, prix, numero_suivi, mode")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("demandes_billet")
      .select("id, created_at, statut, type_trajet, depart, destination, date_depart, date_retour, nb_adultes, nb_enfants, nb_bebes, montant_propose, frais_service")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
  ])

  // Créneaux de visite du client. La policy visites_select_own (00048) autorise
  // cette lecture avec sa session. Sans cela, un client payait des frais de
  // visite sans jamais voir la date nulle part.
  const bienIdsImmo = [...new Set(immobilierRes.data?.map((d) => d.bien_id) ?? [])]
  const { data: visitesClient } = bienIdsImmo.length > 0
    ? await supabase
        .from("visites")
        .select("bien_id, creneau, statut")
        .eq("client_id", user.id)
        .in("bien_id", bienIdsImmo)
        .neq("statut", "annulee")
        .order("creneau", { ascending: false })
    : { data: null }

  // Un seul créneau retenu par bien : le plus récent non annulé.
  const creneauParBien = new Map<string, { creneau: string; statut: string }>()
  for (const v of visitesClient ?? []) {
    if (!creneauParBien.has(v.bien_id)) {
      creneauParBien.set(v.bien_id, { creneau: v.creneau, statut: v.statut })
    }
  }

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
    detailHref: `/reservation/confirmation?demande=${d.id}`,
    period: new Date(d.created_at).toLocaleDateString("fr-FR"),
    price: d.montant ? `${d.montant.toLocaleString("fr-FR")} FCFA` : "—",
    status: d.statut,
    photoUrl: d.vehicule_id ? (photoMap.get(d.vehicule_id) ?? null) : null,
    // Un prix négocié / acompte confirmé par l'équipe (statut en_attente_paiement)
    // reste à régler par le client depuis cette page.
    aPayer:
      d.statut === "en_attente_paiement" && d.prix_negocie != null && Number(d.prix_negocie) > 0
        ? Number(d.prix_negocie)
        : null,
    isAchat: d.type === "achat",
    contreOffre: null,
  })) ?? []

  // Le libellé disait « Visite: <date de création> » pour toutes les demandes
  // immobilières, y compris une demande d'information. Il dit maintenant ce qui
  // s'est réellement passé, selon le type et l'avancement.
  const periodeImmo = (d: {
    type: string
    created_at: string
    date_souhaitee: string | null
    bien_id: string
  }): string => {
    const creation = new Date(d.created_at).toLocaleDateString("fr-FR")
    if (d.type !== "visite") {
      return `${d.type === "offre" ? "Offre" : "Demande"} du ${creation}`
    }
    const visite = creneauParBien.get(d.bien_id)
    if (visite) {
      return `Visite ${visite.statut === "confirmee" ? "confirmée" : visite.statut === "realisee" ? "réalisée" : "proposée"} — ${formaterCreneau(visite.creneau)}`
    }
    if (d.date_souhaitee) {
      return `Visite souhaitée le ${new Date(d.date_souhaitee).toLocaleDateString("fr-FR")} — créneau à confirmer`
    }
    return `Visite demandée le ${creation} — créneau à confirmer`
  }

  const immobilierReservations: ReservationItem[] = immobilierRes.data?.map((d) => ({
    id: d.id,
    created_at: d.created_at,
    title: d.biens?.localisation ?? "Bien immobilier",
    category: "Immobilier",
    detailHref: `/reservation/confirmation?demande=${d.id}`,
    period: periodeImmo(d),
    // Le montant convenu prime : c'est le prix arrêté, pas l'offre initiale.
    price: d.montant_convenu
      ? `${Number(d.montant_convenu).toLocaleString("fr-FR")} FCFA`
      : d.montant_offre
        ? `${Number(d.montant_offre).toLocaleString("fr-FR")} FCFA`
        : "—",
    status: d.statut,
    photoUrl: null,
    aPayer: null,
    isAchat: false,
    contreOffre:
      d.statut === "contre_offre" && d.montant_contre_offre != null
        ? Number(d.montant_contre_offre)
        : null,
  })) ?? []

  const assistanceReservations: ReservationItem[] = assistanceRes.data?.map((d) => ({
    id: d.id,
    created_at: d.created_at,
    title: `${d.type} - ${d.pays_cible}`,
    category: "Assistance",
    detailHref: `/reservation/confirmation?demande=${d.id}`,
    period: new Date(d.created_at).toLocaleDateString("fr-FR"),
    price: "—",
    status: d.statut,
    photoUrl: null,
    aPayer: null,
    isAchat: false,
    contreOffre: null,
  })) ?? []

  const livraisonReservations: ReservationItem[] = livraisonRes.data?.map((d) => ({
    id: d.id,
    created_at: d.created_at,
    title: `Colis ${d.numero_suivi}`,
    category: "Livraison",
    detailHref: `/suivi?numero=${encodeURIComponent(d.numero_suivi)}`,
    period: new Date(d.created_at).toLocaleDateString("fr-FR"),
    price: d.prix != null ? `${Number(d.prix).toLocaleString("fr-FR")} FCFA` : "—",
    status: d.statut,
    photoUrl: null,
    aPayer: null,
    isAchat: false,
    contreOffre: null,
  })) ?? []

  const billetReservations: ReservationItem[] = billetsRes.data?.map((d) => ({
    id: d.id,
    created_at: d.created_at,
    title: `${d.depart} → ${d.destination}`,
    category: "Billet",
    detailHref: "/assistance#billet",
    period: `${TYPE_TRAJET_LABELS[d.type_trajet] ?? d.type_trajet} · ${new Date(d.date_depart).toLocaleDateString("fr-FR")}${
      d.date_retour ? ` → ${new Date(d.date_retour).toLocaleDateString("fr-FR")}` : ""
    } · ${libelleVoyageurs({ adultes: d.nb_adultes, enfants: d.nb_enfants, bebes: d.nb_bebes })}`,
    // Le devis prime, et c'est le TOTAL qui est annoncé : prix du vol plus les
    // frais de service figés à la demande.
    price: d.montant_propose != null
      ? `${(Number(d.montant_propose) + Number(d.frais_service ?? 0)).toLocaleString("fr-FR")} FCFA`
      : "Devis en cours",
    status: d.statut,
    photoUrl: null,
    aPayer: null,
    isAchat: false,
    contreOffre: null,
  })) ?? []

  const allReservations = [...transportReservations, ...immobilierReservations, ...assistanceReservations, ...livraisonReservations, ...billetReservations]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const filtered =
    currentTab === "terminees"
      ? allReservations.filter((r) => isTerminee(r.status))
      : currentTab === "annulees"
        ? allReservations.filter((r) => isAnnulee(r.status))
        : allReservations.filter((r) => isActive(r.status))

  const statusStyle = (status: string) => {
    if (["terminee", "termine", "finalise"].includes(status)) return { color: "text-public-text-muted", label: "Terminé" }
    if (["annulee", "annule", "refusee", "refuse"].includes(status)) return { color: "text-[#EF4444]", label: "Annulé" }
    // Le client doit agir : le libellé le dit plutôt que « En attente ».
    if (status === "contre_offre") return { color: "text-accent-gold", label: "Réponse attendue" }
    if (status === "devis_envoye") return { color: "text-accent-gold", label: "Devis reçu" }
    if (status === "emise") return { color: "text-accent-green", label: "Billet émis" }
    if (STATUT_BILLET_LABELS[status]) return { color: "text-accent-orange", label: STATUT_BILLET_LABELS[status] }
    return { color: "text-accent-orange", label: "En attente" }
  }

  return (
    <div className="px-6 py-10">
      <div className="mb-6">
        <BackLink href="/compte/profil" label="Retour au profil" />
      </div>
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
                  <span className="shrink-0 text-sm text-public-text-muted">{r.category}</span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-public-text-muted">
                  <span>{r.period}</span>
                  <span className="text-sm font-bold text-public-text">{r.price}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-sm font-semibold ${st.color}`}>{st.label}</span>
                <div className="flex flex-col items-end gap-1.5">
                  {r.contreOffre != null && (
                    <ContreOffreReponse demandeId={r.id} montant={r.contreOffre} />
                  )}
                  {r.aPayer != null && (
                    <PayerAcompte demandeId={r.id} montant={r.aPayer} isAchat={r.isAchat} />
                  )}
                  <Link
                    href={r.detailHref}
                    className="text-xs text-public-text hover:text-accent-gold transition-colors text-right"
                  >
                    {r.category === "Livraison" ? "Suivre le colis" : "Voir le détail"}
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
