// Billets d'avion — source unique des libellés, statuts et règles de validation.
// Module pur : la server action s'en sert pour refuser, le formulaire pour guider.
//
// Il n'y a pas de recherche de vol en direct (aucune connexion GDS) : le client
// décrit son besoin, l'équipe cherche puis répond avec un prix. Le vocabulaire
// reste donc celui d'une demande, jamais celui d'une réservation confirmée.

export const TYPES_TRAJET = ["aller_simple", "aller_retour"] as const
export type TypeTrajet = (typeof TYPES_TRAJET)[number]

export const TYPE_TRAJET_LABELS: Record<string, string> = {
  aller_simple: "Aller simple",
  aller_retour: "Aller-retour",
}

export function isTypeTrajet(v: string): v is TypeTrajet {
  return (TYPES_TRAJET as readonly string[]).includes(v)
}

export const CLASSES = ["economique", "premium", "affaires", "premiere"] as const
export type ClasseVol = (typeof CLASSES)[number]

export const CLASSE_LABELS: Record<string, string> = {
  economique: "Économique",
  premium: "Premium",
  affaires: "Affaires",
  premiere: "Première",
}

export function isClasseVol(v: string): v is ClasseVol {
  return (CLASSES as readonly string[]).includes(v)
}

export const STATUTS_BILLET = [
  "soumise",
  "en_cours_traitement",
  "devis_envoye",
  "emise",
  "annulee",
] as const

export type StatutBillet = (typeof STATUTS_BILLET)[number]

export const STATUT_BILLET_LABELS: Record<string, string> = {
  soumise: "Soumise",
  en_cours_traitement: "Recherche en cours",
  devis_envoye: "Devis envoyé",
  emise: "Billet émis",
  annulee: "Annulée",
}

export const STATUT_BILLET_COLORS: Record<string, string> = {
  soumise: "bg-blue-50 text-blue-700",
  en_cours_traitement: "bg-phoebe-gold/10 text-phoebe-gold-dark",
  devis_envoye: "bg-phoebe-gold/20 text-phoebe-gold-dark",
  emise: "bg-phoebe-green/10 text-phoebe-green-deep",
  annulee: "bg-error/10 text-error",
}

export function isStatutBillet(v: string): v is StatutBillet {
  return (STATUTS_BILLET as readonly string[]).includes(v)
}

/** Statuts encore ouverts : une demande close ne se rechiffre pas. */
export const STATUTS_BILLET_OUVERTS = [
  "soumise",
  "en_cours_traitement",
  "devis_envoye",
] as const

// Un passeport doit rester valable un certain temps après le départ — la règle la
// plus répandue est six mois. En deçà, l'embarquement peut être refusé : autant
// le dire à la saisie plutôt qu'à l'aéroport.
export const MOIS_VALIDITE_PASSEPORT_REQUIS = 6

export type VoyageursParTranche = {
  adultes: number
  enfants: number
  bebes: number
}

/** Libellé de la ventilation, comme sur les comparateurs de vols. */
export function libelleVoyageurs({ adultes, enfants, bebes }: VoyageursParTranche): string {
  const parts = [`${adultes} adulte${adultes > 1 ? "s" : ""}`]
  if (enfants > 0) parts.push(`${enfants} enfant${enfants > 1 ? "s" : ""}`)
  if (bebes > 0) parts.push(`${bebes} bébé${bebes > 1 ? "s" : ""}`)
  return parts.join(" · ")
}

export function totalVoyageurs(v: VoyageursParTranche): number {
  return v.adultes + v.enfants + v.bebes
}

export type DemandeBilletSaisie = {
  typeTrajet: string
  depart: string
  destination: string
  dateDepart: string
  dateRetour: string
  classe: string
  voyageurs: VoyageursParTranche
  passeportNom: string
  passeportNumero: string
  passeportExpiration: string
}

/**
 * Valide une saisie de demande de billet. Fonction pure, appelée par la server
 * action : le formulaire guide, mais rien ne garantit ce qui arrive au serveur.
 *
 * `aujourdHui` est injectable pour rendre les tests indépendants de la date.
 */
export function validerDemandeBillet(
  saisie: DemandeBilletSaisie,
  aujourdHui: Date = new Date()
): { error: string } | { ok: true } {
  const {
    typeTrajet, depart, destination, dateDepart, dateRetour, classe, voyageurs,
    passeportNom, passeportNumero, passeportExpiration,
  } = saisie

  if (!isTypeTrajet(typeTrajet)) return { error: "Type de trajet invalide." }
  if (!isClasseVol(classe)) return { error: "Classe de voyage invalide." }

  if (!depart.trim() || !destination.trim()) {
    return { error: "Indiquez le lieu de départ et la destination." }
  }
  if (depart.trim().toLowerCase() === destination.trim().toLowerCase()) {
    return { error: "Le départ et la destination doivent être différents." }
  }

  const jour = (v: string) => {
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return null
    d.setHours(0, 0, 0, 0)
    return d
  }
  const debutJournee = new Date(aujourdHui)
  debutJournee.setHours(0, 0, 0, 0)

  const depart_ = jour(dateDepart)
  if (!depart_) return { error: "Date de départ invalide." }
  if (depart_ < debutJournee) return { error: "La date de départ ne peut pas être dans le passé." }

  if (typeTrajet === "aller_retour") {
    const retour = jour(dateRetour)
    if (!retour) return { error: "Un aller-retour demande une date de retour." }
    if (retour < depart_) return { error: "Le retour ne peut pas précéder le départ." }
  } else if (dateRetour) {
    return { error: "Un aller simple ne comporte pas de date de retour." }
  }

  const { adultes, enfants, bebes } = voyageurs
  for (const n of [adultes, enfants, bebes]) {
    if (!Number.isInteger(n) || n < 0) return { error: "Nombre de voyageurs invalide." }
  }
  if (adultes < 1) return { error: "Au moins un adulte est requis." }
  // Un bébé voyage sur les genoux d'un adulte : il en faut autant que de bébés.
  if (bebes > adultes) {
    return { error: "Chaque bébé doit voyager avec un adulte : il ne peut pas y avoir plus de bébés que d'adultes." }
  }
  if (totalVoyageurs(voyageurs) > 9) {
    return { error: "Au-delà de 9 voyageurs, contactez-nous directement : la réservation passe par un tarif groupe." }
  }

  if (!passeportNom.trim()) return { error: "Le nom figurant sur le passeport est obligatoire." }
  if (!passeportNumero.trim()) return { error: "Le numéro de passeport est obligatoire." }

  const expiration = jour(passeportExpiration)
  if (!expiration) return { error: "Date d'expiration du passeport invalide." }
  if (expiration <= debutJournee) return { error: "Ce passeport est expiré." }

  // La validité se juge à la date du voyage, pas à celle de la demande.
  const minimum = new Date(depart_)
  minimum.setMonth(minimum.getMonth() + MOIS_VALIDITE_PASSEPORT_REQUIS)
  if (expiration < minimum) {
    return {
      error: `Votre passeport doit rester valable au moins ${MOIS_VALIDITE_PASSEPORT_REQUIS} mois après le départ. Renouvelez-le avant de réserver.`,
    }
  }

  return { ok: true }
}
