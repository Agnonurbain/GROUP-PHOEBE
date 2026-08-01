import type { Metadata } from "next"
import { BackLink } from "@/components/public/back-link"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"

import { Card } from "@/components/ui"
import { annulerParClient } from "@/app/actions/demandes"
import { annulerExpeditionParClient } from "@/app/actions/livraison"
import { PayerAcompte } from "@/components/public/payer-acompte"
import { PayerBillet } from "@/components/public/payer-billet"
import { ContreOffreReponse } from "@/components/public/contre-offre-reponse"
import { TelechargerFacture } from "@/components/public/telecharger-facture"
import { PreuveLivraison } from "@/components/public/preuve-livraison"
import { DeposerAvis } from "@/components/public/deposer-avis"
import { ReponseCreneauVisite } from "@/components/public/reponse-creneau-visite"
import { DossierPieces, type PieceClient } from "@/components/public/dossier-pieces"
import { PayerDossier } from "@/components/public/payer-dossier"
import { formaterCreneau } from "@/lib/immobilier"
import { getT } from "@/lib/i18n/server"
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
  /**
   * Factures émises pour cette demande. Plusieurs sont possibles : une demande
   * peut donner lieu à un acompte puis un solde, ou à une caution en plus du
   * montant.
   */
  factures: { id: string; numero: string }[]
  /** Livraison remise : preuve consultable par le client. */
  preuve: { recuPar: string | null; livreeAt: string | null } | null
  /** Table d'origine, pour rattacher un avis à la bonne prestation. */
  referenceTable: string
  /** Créneau de visite en attente de la réponse du client. */
  creneauAConfirmer: { id: string; creneau: string } | null
  /** Dossier d'assistance : pièces à déposer et montant à régler. */
  dossier: { pieces: PieceClient[]; aRegler: number | null; conseiller: string | null } | null
  /**
   * Documents d'une location : contrat dès qu'elle est engagée, état des lieux
   * dès qu'il a été fait. Le second justifie ce qui est retenu sur la caution —
   * il était saisi côté admin et jamais montré au client.
   */
  documents: { contrat: boolean; etatLieux: boolean; cautionRetenue: number } | null
}

const TABS = [
  { key: "actives" as const },
  { key: "terminees" as const },
  { key: "annulees" as const },
] as const

// `finalise` (assistance) et `finalisee` (immobilier) ne diffèrent que par un
// « e » : le second manquait à ces listes, si bien qu'une vente conclue restait
// indéfiniment dans l'onglet « Actives », badgée « En attente ».
const STATUTS_TERMINES = [
  "terminee", "termine", "finalise", "finalisee", "visite_realisee", "livree", "emise",
]
const STATUTS_ANNULES = [
  "annulee", "annule", "refusee", "refuse", "echec_livraison",
]

function isActive(s: string) {
  return !STATUTS_TERMINES.includes(s) && !STATUTS_ANNULES.includes(s)
}
function isTerminee(s: string) {
  return STATUTS_TERMINES.includes(s)
}
function isAnnulee(s: string) {
  return STATUTS_ANNULES.includes(s)
}

function canCancel(status: string) {
  return ["en_attente_paiement", "en_attente_validation", "acceptee", "en_negociation"].includes(status)
}

export default async function CompteReservations({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const t = await getT()
  const sp = await searchParams
  const currentTab = sp.tab || "actives"
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="px-6 py-20 text-center">
        <h1 className="text-4xl font-bold text-public-text">{t.compte.titre}</h1>
        <p className="mt-4 text-sm text-public-text-muted">{t.compte.connectezVous}</p>
      </div>
    )
  }

  const [transportRes, immobilierRes, assistanceRes, livraisonRes, billetsRes] = await Promise.all([
    supabase
      .from("demandes_transport")
      .select("id, created_at, statut, montant, categorie, type, prix_negocie, vehicule_id, caution_retenue, etat_lieux_depart_photos, etat_lieux_retour_photos, kilometrage_depart, devis_expire_at, vehicules!inner(marque, modele)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("demandes_immobilier")
      .select("id, created_at, statut, type, montant_offre, montant_contre_offre, montant_convenu, date_souhaitee, bien_id, biens(localisation, type)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("dossiers_voyage")
      .select("id, created_at, statut, type, pays_cible, prestation, montant_estime, conseiller_id")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("expeditions")
      .select("id, created_at, statut, prix, numero_suivi, mode, recu_par, livree_at, preuve_chemin")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("demandes_billet")
      .select("id, created_at, statut, type_trajet, depart, destination, date_depart, date_retour, nb_adultes, nb_enfants, nb_bebes, montant_propose, frais_service, devis_valable_jusqu_a")
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
        .select("id, bien_id, creneau, statut")
        .eq("client_id", user.id)
        .in("bien_id", bienIdsImmo)
        .neq("statut", "annulee")
        .order("creneau", { ascending: false })
    : { data: null }

  // Un seul créneau retenu par bien : le plus récent non annulé.
  const creneauParBien = new Map<string, { id: string; creneau: string; statut: string }>()
  for (const v of visitesClient ?? []) {
    if (!creneauParBien.has(v.bien_id)) {
      creneauParBien.set(v.bien_id, { id: v.id, creneau: v.creneau, statut: v.statut })
    }
  }

  // Factures du client, tous modules confondus. `factures_select_own` limite la
  // lecture aux siennes ; on les indexe par demande pour les rattacher aux
  // lignes ci-dessous. Une facture n'existe que sur un paiement encaissé.
  const { data: facturesClient } = await supabase
    .from("factures")
    .select("id, numero, reference_id, created_at")
    .eq("client_id", user.id)
    .eq("annulee", false)
    .order("created_at", { ascending: true })

  const facturesParDemande = new Map<string, { id: string; numero: string }[]>()
  for (const f of facturesClient ?? []) {
    const liste = facturesParDemande.get(f.reference_id) ?? []
    liste.push({ id: f.id, numero: f.numero })
    facturesParDemande.set(f.reference_id, liste)
  }
  const facturesDe = (id: string) => facturesParDemande.get(id) ?? []

  // Dossiers d'assistance : pièces déposées, montant restant dû, conseiller.
  // Les trois manquaient — le client ne voyait ni ce qu'il devait, ni comment
  // envoyer une pièce, ni à qui il avait affaire.
  const dossierIds = (assistanceRes.data ?? []).map((d) => d.id)

  const { data: piecesClient } = dossierIds.length
    ? await supabase
        .from("documents_dossier_voyage")
        .select("id, dossier_id, type_document, statut, commentaire")
        .in("dossier_id", dossierIds)
    : { data: [] }

  const piecesParDossier = new Map<string, PieceClient[]>()
  for (const p of piecesClient ?? []) {
    const liste = piecesParDossier.get(p.dossier_id) ?? []
    liste.push({
      id: p.id,
      type_document: p.type_document,
      statut: p.statut,
      commentaire: (p as { commentaire?: string | null }).commentaire ?? null,
    })
    piecesParDossier.set(p.dossier_id, liste)
  }

  const { data: paiementsDossier } = dossierIds.length
    ? await supabase
        .from("paiements")
        .select("reference_id, montant")
        .eq("reference_table", "dossiers_voyage")
        .eq("statut", "en_attente")
        .in("reference_id", dossierIds)
    : { data: [] }

  const paiementDuParDossier = new Map(
    (paiementsDossier ?? []).map((p) => [p.reference_id, Number(p.montant)])
  )

  const conseillerIds = [
    ...new Set((assistanceRes.data ?? []).map((d) => d.conseiller_id).filter(Boolean) as string[]),
  ]
  const { data: conseillers } = conseillerIds.length
    ? await supabase.from("users").select("id, nom").in("id", conseillerIds)
    : { data: [] }
  const nomConseiller = new Map((conseillers ?? []).map((c) => [c.id, c.nom ?? "Conseiller"]))

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
    referenceTable: "demandes_transport",
    detailHref: `/reservation/confirmation?demande=${d.id}`,
    // Une négociation en cours court contre une échéance : la taire obligeait le
    // client à deviner combien de temps son devis tenait.
    period:
      d.statut === "en_negociation" && d.devis_expire_at
        ? `Devis valable jusqu'à ${new Date(d.devis_expire_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
        : new Date(d.created_at).toLocaleDateString("fr-FR"),
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
    factures: facturesDe(d.id),
    preuve: null,
    // Le contrat n'a de sens qu'une fois la location engagée ; l'état des lieux
    // dès qu'un relevé existe, au départ comme au retour.
    documents: ["acceptee", "en_cours", "terminee"].includes(d.statut)
      ? {
          contrat: true,
          etatLieux:
            d.kilometrage_depart != null ||
            (d.etat_lieux_depart_photos?.length ?? 0) > 0 ||
            (d.etat_lieux_retour_photos?.length ?? 0) > 0,
          cautionRetenue: Number(d.caution_retenue ?? 0),
        }
      : null,
    creneauAConfirmer: null,
    dossier: null,
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
    referenceTable: "demandes_immobilier",
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
    factures: facturesDe(d.id),
    preuve: null,
    documents: null,
    // Un créneau « proposé » attend sa réponse : c'est le client qui se déplace,
    // et il a payé pour ce rendez-vous.
    creneauAConfirmer: (() => {
      const v = creneauParBien.get(d.bien_id)
      return v?.statut === "proposee" ? { id: v.id, creneau: formaterCreneau(v.creneau) } : null
    })(),
    dossier: null,
  })) ?? []

  const assistanceReservations: ReservationItem[] = assistanceRes.data?.map((d) => ({
    id: d.id,
    created_at: d.created_at,
    title: `${d.type} - ${d.pays_cible}`,
    category: "Assistance",
    referenceTable: "dossiers_voyage",
    detailHref: `/reservation/confirmation?demande=${d.id}`,
    period: new Date(d.created_at).toLocaleDateString("fr-FR"),
    // Le montant existait en base sans jamais être montré : le client ne
    // savait ni ce qu'il devait, ni qu'il ne devait rien.
    price: d.montant_estime ? `${Number(d.montant_estime).toLocaleString("fr-FR")} FCFA` : "Sur devis",
    status: d.statut,
    photoUrl: null,
    aPayer: null,
    isAchat: false,
    contreOffre: null,
    factures: facturesDe(d.id),
    preuve: null,
    documents: null,
    creneauAConfirmer: null,
    dossier: {
      pieces: piecesParDossier.get(d.id) ?? [],
      aRegler: paiementDuParDossier.get(d.id) ?? null,
      conseiller: d.conseiller_id ? (nomConseiller.get(d.conseiller_id) ?? null) : null,
    },
  })) ?? []

  const livraisonReservations: ReservationItem[] = livraisonRes.data?.map((d) => ({
    id: d.id,
    created_at: d.created_at,
    title: `Colis ${d.numero_suivi}`,
    category: "Livraison",
    referenceTable: "expeditions",
    detailHref: `/suivi?numero=${encodeURIComponent(d.numero_suivi)}`,
    period: new Date(d.created_at).toLocaleDateString("fr-FR"),
    price: d.prix != null ? `${Number(d.prix).toLocaleString("fr-FR")} FCFA` : "—",
    status: d.statut,
    photoUrl: null,
    aPayer: null,
    isAchat: false,
    contreOffre: null,
    factures: facturesDe(d.id),
    // La preuve n'existe que sur un colis effectivement remis.
    preuve: d.preuve_chemin ? { recuPar: d.recu_par, livreeAt: d.livree_at } : null,
    documents: null,
    creneauAConfirmer: null,
    dossier: null,
  })) ?? []

  const maintenant = new Date()
  const billetReservations: ReservationItem[] = billetsRes.data?.map((d) => ({
    id: d.id,
    created_at: d.created_at,
    title: `${d.depart} → ${d.destination}`,
    category: "Billet",
    referenceTable: "demandes_billet",
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
    aPayer:
      d.statut === "devis_envoye" && d.montant_propose != null
        && d.devis_valable_jusqu_a && new Date(d.devis_valable_jusqu_a) > maintenant
        ? Number(d.montant_propose) + Number(d.frais_service ?? 0)
        : null,
    isAchat: false,
    contreOffre: null,
    factures: facturesDe(d.id),
    preuve: null,
    documents: null,
    creneauAConfirmer: null,
    dossier: null,
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
    if (STATUTS_TERMINES.includes(status)) return { color: "text-public-text-muted", label: "Terminé" }
    if (["annulee", "annule", "refusee", "refuse"].includes(status)) return { color: "text-[#EF4444]", label: "Annulé" }
    // Le client doit agir : le libellé le dit plutôt que « En attente ».
    if (status === "contre_offre") return { color: "text-accent-gold", label: "Réponse attendue" }
    if (status === "devis_envoye") return { color: "text-accent-gold", label: "Devis reçu" }
    if (status === "payee") return { color: "text-accent-green", label: "Payé" }
    if (status === "emise") return { color: "text-accent-green", label: "Billet émis" }
    if (STATUT_BILLET_LABELS[status]) return { color: "text-accent-orange", label: STATUT_BILLET_LABELS[status] }
    return { color: "text-accent-orange", label: "En attente" }
  }

  return (
    <div className="px-6 py-10">
      <div className="mb-6">
        <BackLink href="/compte/profil" label={t.compte.retourProfil} />
      </div>
      <h1 className="text-4xl font-bold text-public-text">{t.compte.titre}</h1>

      <div className="mt-6 flex gap-4 border-b border-public-border pb-3">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/compte/reservations?tab=${tab.key}`}
            className={`text-sm transition-colors ${currentTab === tab.key ? "font-semibold text-public-text" : "text-public-text-muted hover:text-public-text"}`}
          >
            {t.compte.onglets[tab.key]}
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
                  {r.aPayer != null && r.category === "Billet" && (
                    <PayerBillet demandeId={r.id} total={r.aPayer} />
                  )}
                  {r.aPayer != null && r.category !== "Billet" && (
                    <PayerAcompte demandeId={r.id} montant={r.aPayer} isAchat={r.isAchat} />
                  )}
                  <Link
                    href={r.detailHref}
                    className="text-xs text-public-text hover:text-accent-gold transition-colors text-right"
                  >
                    {r.category === "Livraison" ? t.compte.suivreColis : t.commun.voirDetail}
                  </Link>
                  {/* Une facture par paiement encaissé : le numéro n'est affiché
                      que s'il y en a plusieurs, sinon il n'apprend rien. */}
                  {/* Le contrat et l'état des lieux : le second justifie ce qui
                      est retenu sur la caution, et n'était visible que du staff. */}
                  {r.documents && (
                    <div className="flex flex-col items-end gap-0.5">
                      {r.documents.cautionRetenue > 0 && (
                        <span className="text-[11px] text-[#EF4444]">
                          {t.compte.cautionRetenue} : {r.documents.cautionRetenue.toLocaleString("fr-FR")} FCFA
                        </span>
                      )}
                      <a
                        href={`/api/contrat-pdf?id=${r.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-public-text-muted transition-colors hover:text-accent-gold"
                      >
                        {t.compte.contrat}
                      </a>
                      {r.documents.etatLieux && (
                        <a
                          href={`/api/etat-lieux-pdf?id=${r.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-public-text-muted transition-colors hover:text-accent-gold"
                        >
                          {t.compte.etatLieux}
                        </a>
                      )}
                    </div>
                  )}
                  {/* L'avis n'a de sens qu'une fois la prestation rendue. */}
                  {isTerminee(r.status) && (
                    <DeposerAvis referenceTable={r.referenceTable} referenceId={r.id} />
                  )}
                  {r.dossier?.conseiller && (
                    <span className="text-[11px] text-public-text-muted">
                      Conseiller : {r.dossier.conseiller}
                    </span>
                  )}
                  {r.dossier && r.dossier.aRegler != null && (
                    <PayerDossier dossierId={r.id} montant={r.dossier.aRegler} />
                  )}
                  {r.dossier && (
                    <DossierPieces dossierId={r.id} pieces={r.dossier.pieces} />
                  )}
                  {r.creneauAConfirmer && (
                    <ReponseCreneauVisite
                      visiteId={r.creneauAConfirmer.id}
                      creneau={r.creneauAConfirmer.creneau}
                    />
                  )}
                  {r.preuve && (
                    <PreuveLivraison
                      expeditionId={r.id}
                      recuPar={r.preuve.recuPar}
                      livreeAt={r.preuve.livreeAt}
                    />
                  )}
                  {r.factures.map((f) => (
                    <TelechargerFacture
                      key={f.id}
                      factureId={f.id}
                      label={r.factures.length > 1 ? `Facture ${f.numero}` : "Facture"}
                    />
                  ))}
                  {/* Une livraison ne s'annule que tant que personne ne s'est
                      déplacé : au-delà, la course est engagée. */}
                  {r.category === "Livraison" && r.status === "creee" && (
                    <form action={async () => { "use server"; await annulerExpeditionParClient(r.id) }}>
                      <button
                        type="submit"
                        className="text-xs text-[#EF4444] hover:text-[#DC2626] transition-colors"
                      >
                        {t.compte.annulerEnvoi}
                      </button>
                    </form>
                  )}
                  {r.category === "Transport" && canCancel(r.status) && (
                    <form action={async () => { await annulerParClient(r.id) }}>
                      <button
                        type="submit"
                        className="text-xs text-[#EF4444] hover:text-[#DC2626] transition-colors"
                      >
                        {t.compte.annulerReservation}
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
