// Contenu des pages légales.
//
// ⚠️ TEXTES D'EXEMPLE — à faire valider et compléter par GROUP PHOEBE et son
// conseil juridique. Ils donnent la structure attendue et signalent nommément
// ce qui manque, plutôt que de laisser trois liens morts dans le pied de page.
//
// Les mentions marquées [À COMPLÉTER] appellent une donnée réelle que je n'ai
// pas : numéro RCCM, capital, adresse du siège, hébergeur, délégué à la
// protection des données. Ne pas les inventer — une mention légale fausse est
// pire qu'absente.

export type Section = { titre: string; paragraphes: string[] }

export type PageLegale = {
  slug: string
  titre: string
  miseAJour: string
  chapeau: string
  sections: Section[]
}

const SOCIETE = "GROUP PHOEBE"

export const MENTIONS_LEGALES: PageLegale = {
  slug: "mentions-legales",
  titre: "Mentions légales",
  miseAJour: "2026-08-01",
  chapeau: `Informations relatives à l'éditeur du site ${SOCIETE} et à son hébergement.`,
  sections: [
    {
      titre: "Éditeur du site",
      paragraphes: [
        `${SOCIETE}, [À COMPLÉTER : forme juridique] au capital de [À COMPLÉTER] FCFA.`,
        "Siège social : [À COMPLÉTER : adresse complète], Abidjan, Côte d'Ivoire.",
        "Registre du commerce (RCCM) : [À COMPLÉTER]. Numéro de compte contribuable : [À COMPLÉTER].",
        "Directeur de la publication : [À COMPLÉTER : nom et qualité].",
      ],
    },
    {
      titre: "Contact",
      paragraphes: [
        "Téléphone : +225 07 78 63 19 83.",
        "Adresse électronique : [À COMPLÉTER].",
      ],
    },
    {
      titre: "Hébergement",
      paragraphes: [
        "Le site est hébergé par [À COMPLÉTER : hébergeur et adresse].",
        "Les données applicatives sont stockées chez [À COMPLÉTER : fournisseur et région d'hébergement].",
      ],
    },
    {
      titre: "Propriété intellectuelle",
      paragraphes: [
        `L'ensemble des contenus du site — textes, photographies de véhicules et de biens, logos, marques — est la propriété de ${SOCIETE} ou de ses partenaires, et protégé à ce titre.`,
        "Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite préalable, est interdite.",
      ],
    },
  ],
}

export const CGV: PageLegale = {
  slug: "cgv",
  titre: "Conditions générales de vente",
  miseAJour: "2026-08-01",
  chapeau: `Conditions applicables aux prestations de ${SOCIETE} : location et vente de véhicules, livraison de colis, intermédiation immobilière et assistance voyage.`,
  sections: [
    {
      titre: "1. Objet et acceptation",
      paragraphes: [
        `Les présentes conditions régissent les prestations proposées par ${SOCIETE} sur ce site.`,
        "Toute commande suppose leur acceptation préalable, recueillie explicitement au moment de la réservation.",
      ],
    },
    {
      titre: "2. Prix et paiement",
      paragraphes: [
        "Les prix sont indiqués en francs CFA, toutes taxes comprises. Le montant affiché avant validation est celui qui est facturé.",
        "Les paiements sont acceptés par carte bancaire, Mobile Money, et — pour la livraison de colis — en espèces ou Mobile Money à la remise.",
        "Une facture est émise pour chaque paiement encaissé et reste consultable depuis l'espace client.",
      ],
    },
    {
      titre: "3. Location de véhicule",
      paragraphes: [
        "La location est subordonnée à la présentation d'un permis de conduire en cours de validité et d'une pièce d'identité. Tout conducteur secondaire doit être déclaré et validé avant la prise du véhicule.",
        "Une caution est demandée à la réservation. Son montant et les cas de retenue sont indiqués avant paiement.",
        "Un état des lieux contradictoire est établi au départ et au retour. Il constitue la référence en cas de contestation et reste consultable depuis l'espace client.",
        "[À COMPLÉTER : kilométrage inclus, carburant, franchise d'assurance, zone géographique autorisée.]",
      ],
    },
    {
      titre: "4. Annulation et remboursement",
      paragraphes: [
        "Une réservation de véhicule peut être annulée sans frais jusqu'à 48 heures avant le départ. Passé ce délai, la caution est retenue.",
        "Une livraison peut être annulée tant que le colis n'a pas été pris en charge. Au-delà, la course est engagée.",
        "Les frais de visite immobilière ne sont pas remboursables : ils rémunèrent un déplacement effectué.",
        "Tout remboursement dû est instruit par nos équipes et versé par le canal du paiement d'origine.",
      ],
    },
    {
      titre: "5. Livraison de colis",
      paragraphes: [
        "Les délais annoncés courent à compter de la prise en charge effective du colis.",
        "La valeur déclarée est indicative et sert la priorité de manutention. Elle ne vaut pas assurance : [À COMPLÉTER : régime d'indemnisation retenu, plafond éventuel].",
        "La remise donne lieu à une preuve — photographie et nom du réceptionnaire — consultable depuis l'espace client.",
        "Les objets illicites, dangereux, périssables ou de valeur exceptionnelle sont exclus du service.",
      ],
    },
    {
      titre: "6. Responsabilité",
      paragraphes: [
        `${SOCIETE} est tenue d'une obligation de moyens dans l'exécution de ses prestations.`,
        "[À COMPLÉTER : limitations de responsabilité, force majeure, assurances souscrites.]",
      ],
    },
    {
      titre: "7. Réclamations et droit applicable",
      paragraphes: [
        "Toute réclamation peut être adressée par téléphone ou par écrit ; elle fait l'objet d'une réponse sous [À COMPLÉTER] jours ouvrés.",
        "Les présentes conditions sont régies par le droit ivoirien. À défaut d'accord amiable, les tribunaux d'Abidjan sont compétents.",
      ],
    },
  ],
}

export const CONFIDENTIALITE: PageLegale = {
  slug: "confidentialite",
  titre: "Politique de confidentialité",
  miseAJour: "2026-08-01",
  chapeau: "Quelles données nous collectons, pourquoi, combien de temps, et comment exercer vos droits.",
  sections: [
    {
      titre: "Données collectées",
      paragraphes: [
        "Identité et contact : nom, téléphone, adresse électronique, date de naissance.",
        "Pièces justificatives : permis de conduire, pièce d'identité, et le cas échéant permis d'un conducteur secondaire. Elles sont stockées de façon privée et ne sont jamais accessibles publiquement.",
        "Données de prestation : réservations, expéditions, adresses de retrait et de livraison, états des lieux, preuves de remise.",
        "Données de paiement : nous ne conservons aucun numéro de carte. Les paiements sont traités par nos prestataires.",
      ],
    },
    {
      titre: "Finalités",
      paragraphes: [
        "Exécuter les prestations commandées et vous en tenir informé.",
        "Satisfaire à nos obligations comptables et fiscales, notamment l'émission des factures.",
        "Prévenir la fraude et sécuriser l'accès aux comptes.",
      ],
    },
    {
      titre: "Durées de conservation",
      paragraphes: [
        "[À COMPLÉTER : durée de conservation par catégorie de données, notamment les pièces d'identité et les documents comptables.]",
      ],
    },
    {
      titre: "Destinataires",
      paragraphes: [
        `Les données sont accessibles aux seuls personnels de ${SOCIETE} qui en ont besoin, ainsi qu'à nos prestataires techniques et de paiement, dans la limite de leur mission.`,
        "Elles ne sont ni vendues ni cédées à des tiers à des fins commerciales.",
      ],
    },
    {
      titre: "Vos droits",
      paragraphes: [
        "Vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition sur vos données.",
        "Ces droits s'exercent auprès de [À COMPLÉTER : contact du responsable de traitement].",
        "Vous pouvez également saisir l'Autorité de régulation des télécommunications de Côte d'Ivoire (ARTCI), autorité compétente en matière de protection des données personnelles.",
      ],
    },
    {
      titre: "Cookies",
      paragraphes: [
        "Le site dépose les cookies nécessaires à votre session et à vos préférences de langue.",
        "[À COMPLÉTER : cookies de mesure d'audience éventuels et modalités de refus.]",
      ],
    },
  ],
}

export const PAGES_LEGALES = [MENTIONS_LEGALES, CGV, CONFIDENTIALITE]
