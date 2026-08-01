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
  "payee",
  "emise",
  "annulee",
] as const

export type StatutBillet = (typeof STATUTS_BILLET)[number]

export const STATUT_BILLET_LABELS: Record<string, string> = {
  soumise: "Soumise",
  en_cours_traitement: "Recherche en cours",
  devis_envoye: "Devis envoyé",
  payee: "Payée",
  emise: "Billet émis",
  annulee: "Annulée",
}

/**
 * Transitions autorisées d'une demande de billet.
 *
 * `emise` est terminal : un billet émis auprès de la compagnie ne se dénoue pas
 * par un retour en arrière dans notre outil. `annulee` l'est aussi — reprendre
 * une demande close suppose une nouvelle demande, avec un devis à jour.
 */
export const TRANSITIONS_BILLET: Record<StatutBillet, readonly StatutBillet[]> = {
  soumise: ["en_cours_traitement", "annulee"],
  en_cours_traitement: ["devis_envoye", "annulee"],
  // Un devis expiré se refait : on repasse en recherche plutôt que de laisser
  // le client sur une offre qui n'a plus cours.
  devis_envoye: ["payee", "en_cours_traitement", "annulee"],
  payee: ["emise", "annulee"],
  emise: [],
  annulee: [],
} as const

export function transitionBilletAutorisee(depuis: string, vers: string): boolean {
  if (!isStatutBillet(depuis) || !isStatutBillet(vers)) return false
  return TRANSITIONS_BILLET[depuis].includes(vers)
}

export const STATUT_BILLET_COLORS: Record<string, string> = {
  soumise: "bg-blue-50 text-blue-700",
  en_cours_traitement: "bg-phoebe-gold/10 text-phoebe-gold-dark",
  devis_envoye: "bg-phoebe-gold/20 text-phoebe-gold-dark",
  payee: "bg-phoebe-green/10 text-phoebe-green-deep",
  emise: "bg-phoebe-green/20 text-phoebe-green-deep",
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
  "payee",
] as const

// ─── Paramètres pilotés depuis /admin/tarifs (table parametres_billet) ───────
// Ces valeurs étaient figées dans le code. Elles restent ici comme REPLI : la
// source de vérité est la base, lue par getParametresBillet().

export type ParametresBillet = {
  /** Frais de dossier GROUP PHOEBE, par billet, en sus du prix du vol. */
  frais_service: number
  /**
   * Validité résiduelle du passeport exigée APRÈS le départ. Six mois est la
   * règle la plus répandue, mais elle varie selon la destination — d'où le
   * paramètre plutôt qu'une constante.
   */
  mois_validite_passeport: number
  /** Au-delà, la réservation passe par un tarif groupe négocié à part. */
  max_voyageurs: number
  /** Délai de réponse annoncé au client : un engagement, donc pilotable. */
  delai_reponse_heures: number
  /** Durée de validité du devis en heures. Passé ce délai, le client ne peut plus payer. */
  validite_devis_heures: number
}

export const PARAMETRES_BILLET_DEFAUT: ParametresBillet = {
  frais_service: 15000,
  mois_validite_passeport: 6,
  max_voyageurs: 9,
  delai_reponse_heures: 48,
  validite_devis_heures: 48,
}

/** Délai de réponse en langage courant : « sous 48 h », « sous 3 jours ». */
export function libelleDelai(heures: number): string {
  if (heures < 24) return `sous ${heures} h`
  const jours = Math.round(heures / 24)
  return jours === 1 ? "sous 24 h" : `sous ${jours} jours`
}

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
  certificatFievreJaune: boolean
  mineurAutorisationParentale: boolean
}

/**
 * Valide une saisie de demande de billet. Fonction pure, appelée par la server
 * action : le formulaire guide, mais rien ne garantit ce qui arrive au serveur.
 *
 * `aujourdHui` est injectable pour rendre les tests indépendants de la date.
 */
export function validerDemandeBillet(
  saisie: DemandeBilletSaisie,
  params: ParametresBillet = PARAMETRES_BILLET_DEFAUT,
  aujourdHui: Date = new Date()
): { error: string } | { ok: true } {
  const {
    typeTrajet, depart, destination, dateDepart, dateRetour, classe, voyageurs,
    passeportNom, passeportNumero, passeportExpiration,
    certificatFievreJaune, mineurAutorisationParentale,
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
  if (totalVoyageurs(voyageurs) > params.max_voyageurs) {
    return {
      error: `Au-delà de ${params.max_voyageurs} voyageurs, contactez-nous directement : la réservation passe par un tarif groupe.`,
    }
  }

  // Le certificat fièvre jaune est obligatoire pour entrer en Côte d'Ivoire et
  // dans la plupart des destinations depuis Abidjan. Tout voyageur de 9 mois et
  // plus doit en disposer — notre tranche « bébé » (< 2 ans) inclut des enfants
  // de 10 mois qui en ont besoin, donc on l'exige dès qu'un voyageur n'est plus
  // un nourrisson.
  if (!certificatFievreJaune) {
    return { error: "Le certificat de vaccination fièvre jaune est obligatoire pour voyager. Cochez la case correspondante." }
  }

  // Tout mineur voyageant sans ses deux parents doit présenter une autorisation
  // parentale légalisée à la mairie, jusqu'à 18 ans.
  if (enfants > 0 && !mineurAutorisationParentale) {
    return { error: "Un enfant voyageant sans ses deux parents doit disposer d'une autorisation parentale. Cochez la case correspondante." }
  }

  if (!passeportNom.trim()) return { error: "Le nom figurant sur le passeport est obligatoire." }
  if (!passeportNumero.trim()) return { error: "Le numéro de passeport est obligatoire." }

  const expiration = jour(passeportExpiration)
  if (!expiration) return { error: "Date d'expiration du passeport invalide." }
  if (expiration <= debutJournee) return { error: "Ce passeport est expiré." }

  // La validité se juge à la date du voyage, pas à celle de la demande.
  if (params.mois_validite_passeport > 0) {
    const minimum = new Date(depart_)
    minimum.setMonth(minimum.getMonth() + params.mois_validite_passeport)
    if (expiration < minimum) {
      return {
        error: `Votre passeport doit rester valable au moins ${params.mois_validite_passeport} mois après le départ. Renouvelez-le avant de réserver.`,
      }
    }
  }

  return { ok: true }
}
