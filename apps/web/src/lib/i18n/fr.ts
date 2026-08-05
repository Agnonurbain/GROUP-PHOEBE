// Dictionnaire français — la référence.
//
// `en.ts` en dérive son type : une clé ajoutée ici sans traduction anglaise fait
// échouer la compilation. C'est la seule garantie qui tienne dans la durée, un
// dictionnaire se désynchronisant silencieusement sinon.
//
// Portée : l'INTERFACE. Le contenu métier — descriptions de biens, articles,
// pages légales — reste en français : une traduction approximative d'un texte
// qui engage l'entreprise se voit, et vaut moins que son absence assumée.

export const fr = {
  nav: {
    accueil: "Accueil",
    transport: "Transport",
    livraison: "Livraison",
    immobilier: "Immobilier",
    assistance: "Assistance Voyages",
    textile: "Textile",
    blog: "Blog",
    avis: "Avis",
    suivi: "Suivre un colis",
    contact: "Contact",
    monCompte: "Mon compte",
    mesReservations: "Mes réservations",
    connexion: "Connexion",
    inscription: "Inscription",
    deconnexion: "Déconnexion",
    panier: "Panier",
    administration: "Administration",
    menu: "Menu",
    fermer: "Fermer",
  },

  commun: {
    chargement: "Chargement…",
    envoi: "Envoi…",
    enregistrer: "Enregistrer",
    annuler: "Annuler",
    confirmer: "Confirmer",
    retour: "Retour",
    retourAccueil: "Retour à l'accueil",
    voirDetail: "Voir le détail",
    voirPlus: "Voir plus",
    rechercher: "Rechercher",
    filtrer: "Filtrer",
    reinitialiser: "Réinitialiser",
    precedent: "Précédent",
    suivant: "Suivant",
    obligatoire: "obligatoire",
    facultatif: "facultatif",
    oui: "Oui",
    non: "Non",
    aucunResultat: "Aucun résultat.",
    erreurGenerique: "Une erreur est survenue. Veuillez réessayer.",
    devise: "FCFA",
  },

  accueil: {
    titre: "Transport, livraison, immobilier et assistance",
    sousTitre:
      "Quatre métiers, une seule équipe, à Abidjan et partout en Côte d'Ivoire.",
    decouvrir: "Découvrir nos services",
    nosServices: "Nos services",
  },

  services: {
    transportDesc: "Vente et location de véhicules, avec ou sans chauffeur.",
    immobilierDesc: "Achat, vente et location de biens à Abidjan et au-delà.",
    assistanceDesc:
      "Visas, études et voyages internationaux, accompagnés de bout en bout.",
    livraisonDesc: "Colis pris en charge, suivis et livrés partout dans le pays.",
    textileDesc: "Pagnes Uniwax et wax hollandais, sur devis.",
  },

  compte: {
    titre: "Mes réservations",
    connectezVous: "Connectez-vous pour voir vos réservations.",
    onglets: { actives: "Actives", terminees: "Terminées", annulees: "Annulées" },
    aucune: "Aucune réservation",
    aucuneActive: "Aucune réservation active.",
    aucuneTerminee: "Aucune réservation terminée.",
    aucuneAnnulee: "Aucune réservation annulée.",
    profil: "Mon profil",
    retourProfil: "Retour au profil",
    statut: {
      enAttente: "En attente",
      termine: "Terminé",
      annule: "Annulé",
      paye: "Payé",
      reponseAttendue: "Réponse attendue",
      devisRecu: "Devis reçu",
      billetEmis: "Billet émis",
    },
    facture: "Facture",
    contrat: "Contrat de location",
    etatLieux: "État des lieux",
    preuveRemise: "Voir la preuve de remise",
    recuPar: "Reçu par",
    cautionRetenue: "Caution retenue",
    donnerAvis: "Donner mon avis",
    suivreColis: "Suivre le colis",
    annulerEnvoi: "Annuler l'envoi",
    annulerReservation: "Annuler la réservation",
    aRegler: "À régler",
    aPayer: "À payer",
    conseiller: "Conseiller",
    mesPieces: "Mes pièces",
    ajouterPiece: "Ajouter une pièce",
    creneauConvient: "Ce créneau vous convient ?",
    jeConfirme: "Je confirme",
    autreDate: "Autre date",
  },

  paiement: {
    carte: "Carte",
    mobileMoney: "Mobile Money",
    aLaLivraison: "À la livraison",
    moyenPaiement: "Moyen de paiement",
    total: "Total",
    recapitulatif: "Récapitulatif",
    payer: "Payer",
    retourPanier: "Retour au panier",
    caution: "Caution (remboursable)",
    datesLocation: "Dates de location",
    debut: "Début",
    destination: "Destination",
    location: "Location",
    moyensAcceptes: "Moyens de paiement acceptés",
    paiement: "Paiement",
    selectionnerZone: "Sélectionnez une zone",
    totalAPayer: "Total à payer",
    vehicule: "Véhicule",
    panierVide: "Votre panier est vide",
    zoneAppliquee: "Zone appliquée",
    zoneDetectee: "Zone détectée",
    zoneTarifaire: "Zone tarifaire",
  },

  suivi: {
    titre: "Suivre un colis",
    consigne: "Saisissez votre numéro de suivi (format GP-XXXXXXXX).",
    bouton: "Suivre",
    introuvable: "Aucun colis trouvé pour ce numéro. Vérifiez le numéro de suivi.",
    photosColis: "Photos du colis",
    retourLivraison: "Retour à la livraison",
  },

  auth: {
    connexionTitre: "Connexion",
    inscriptionTitre: "Créer un compte",
    identifiant: "Téléphone ou e-mail",
    motDePasse: "Mot de passe",
    motDePasseOublie: "Mot de passe oublié ?",
    pasDeCompte: "Pas encore de compte ?",
    dejaInscrit: "Déjà inscrit ?",
    seConnecter: "Se connecter",
    creerCompte: "Créer mon compte",
    nom: "Nom complet",
    telephone: "Téléphone",
    email: "Adresse e-mail",
    dateNaissance: "Date de naissance",
  },

  footer: {
    services: "Services",
    contact: "Contact",
    legal: "Légal",
    droits: "Tous droits réservés.",
  },

  legal: {
    documentProvisoire: "Document provisoire",
    derniereMaj: "Dernière mise à jour",
    mentionsLegales: "Mentions légales",
    cgv: "Conditions générales de vente",
    confidentialite: "Politique de confidentialité",
  },

  panier: {
    recapitulatif: "Récapitulatif",
    sousTotalJour: "Sous-total / jour",
    parJour: "/jour",
    moyensPaiement: "Moyens de paiement",
    parcourirCatalogue: "Parcourez notre catalogue pour ajouter des véhicules.",
    prixHorsCaution: "Prix par jour, hors caution.",
    vide: "Votre panier est vide.",
    continuer: "Continuer mes achats",
    passerCommande: "Passer commande",
  },

  livraisonForm: {
    commanderLivraison: "Commander une livraison",
    nomDestinataire: "Nom du destinataire",
    contactDestinataire: "Contact du destinataire",
    votreNom: "Votre nom",
    votreContact: "Votre contact",
    choisirCommune: "— Choisir une commune —",
    zoneDeduite: "La zone de livraison se déduit des communes saisies.",
    aidePhotos: "Ajoutez une ou plusieurs photos pour faciliter la prise en charge.",
    expediteurDestinataire: "Expéditeur & destinataire",
    adresses: "Adresses",
    detailsColis: "Détails du colis",
    modeLivraison: "Mode de livraison",
    mode: "Mode",
    adresseCollecte: "Adresse de collecte",
    adresseLivraison: "Adresse de livraison",
    communeCollecte: "Commune de collecte",
    communeLivraison: "Commune de livraison",
    natureColis: "Nature du colis",
    poids: "Poids (kg)",
    dimensions: "Dimensions",
    valeurDeclaree: "Valeur déclarée (FCFA)",
    photos: "Photos du colis (optionnel)",
    dateSouhaitee: "Date de livraison souhaitée",
    palierPoids: "Palier de poids",
    zoneAuto: "Zone (auto)",
    // Repères de saisie : traduits aussi, sinon un formulaire anglais garde des
    // exemples français au milieu.
    exQuartier: "Quartier, rue, repère…",
    exNature: "Documents, vêtements, électronique…",
    exPoids: "Ex : 2.5",
    exDimensions: "Ex : 30 × 20 × 15 cm",
    exTelephone: "+225 07 00 00 00 00",
    optionnel: "Optionnel",
    apartirDe: "À partir de demain. La collecte est organisée pour livrer ce jour-là.",
  },

  verticales: {
    nosServices: "Nos services",
    commencezPar: "Commencez par le service ",
    quiVousRessemble: "qui vous ressemble.",
    commentCaMarche: "Comment ça marche",
    notreEngagement: "Notre engagement",
    uneQuestion: "Une question ? Notre équipe ",
    aVotreEcoute: "est à votre écoute.",
    transportTitre: "Transport",
    transportDesc: "Vente et location de véhicules, avec ou sans chauffeur.",
    immobilierTitre: "Immobilier",
    immobilierDesc: "Achat, vente et location de biens à Abidjan et au-delà.",
    assistanceTitre: "Assistance Voyages",
    assistanceDesc: "Visas, études et voyages internationaux, accompagnés de bout en bout.",
    livraisonTitre: "Livraison",
    livraisonDesc: "Colis pris en charge, suivis et livrés partout dans le pays.",
    textileTitre: "Textile",
    textileDesc: "Pagnes Uniwax et wax hollandais, sur devis.",
    explorer: "Explorer",
  },

  immobilier: {
    // Source unique des libellés de type : le filtre affichait « Villa » et
    // « Local commercial » là où les fiches disaient « Maison » et « Bureau ».
    // L'utilisateur filtrait sur un mot et en voyait un autre.
    typeTerrain: "Terrain",
    typeMaison: "Maison",
    typeAppartement: "Appartement",
    typeBureau: "Bureau",
    tousTypes: "Tous types",
    toutes: "Toutes",
    transaction: "Transaction",
    vente: "Vente",
    location: "Location",
    type: "Type",
    localisation: "Localisation",
    prixMin: "Prix min (FCFA)",
    prixMax: "Prix max (FCFA)",
    surfaceMin: "Surface min (m²)",
    pieces: "Pièces",
    exLocalisation: "Abidjan, Cocody…",
    exPrixMin: "Ex : 10 000 000",
    exPrixMax: "Ex : 100 000 000",
    exSurface: "Ex : 50",
    aucunBien: "Aucun bien trouvé",
    elargirCriteres: "Essayez d'élargir vos critères de recherche.",
    voirDetail: "Voir le détail",
    caracteristiques: "Caractéristiques",
    prix: "Prix",
    demandeEnvoyee: "Demande envoyée",
    mesDemandes: "Mes demandes",
    voirAutresBiens: "Voir d'autres biens",
    vendeurTitre: "Vous vendez ? Connaissez",
    vendeurTitreEmphase: "sa vraie valeur.",
    vendeurTexte: "Estimez votre bien en 2 minutes. Notre expertise au service de votre patrimoine.",
  },

  assistancePays: {
    nosPrestations: "Nos prestations",
    commentCaSePasse: "Comment ça se passe",
    procedure: "Procédure",
    calendrier: "Calendrier",
    lesBourses: "Les bourses",
    recommande: "Recommandé",
    sansEngagement: "Sans engagement — l'équipe vous recontacte après votre demande.",
    destinationIndisponible: "Destination non disponible",
    pasEncoreProposee: "Cette destination n'est pas encore proposée.",
    autresDestinations: "Autres destinations",
    mesDossiers: "Mes dossiers",
  },

  negociation: {
    demanderPrix: "Demander un prix",
    titre: "Faites-nous une demande",
    explication: "Indiquez vos dates et votre besoin : notre équipe vous répond avec un prix.",
    du: "Du",
    au: "Au",
    villeDepart: "Ville de départ",
    destination: "Destination",
    choisir: "Choisir…",
    autre: "Autre",
    preciser: "Précisez",
    votreDemande: "Votre demande",
    exempleNote: "Budget envisagé, usage prévu, contraintes particulières…",
    // Le client doit savoir que sa demande expire : sinon il ne comprend pas
    // de la voir disparaître, et le véhicule qu'on lui réservait avec.
    // {delai} : la valeur vient du réglage admin, pas d'un nombre figé dans
    // la phrase — les deux divergeraient au premier changement.
    delai: "Le véhicule vous est réservé {delai}, le temps que nous répondions.",
    envoyer: "Envoyer ma demande",
  },

  langue: {
    choisir: "Choisir la langue",
    // Affiché sous le contenu métier resté en français : le taire laisserait
    // croire à une traduction manquante plutôt qu'à un choix.
    contenuNonTraduit:
      "Les descriptions détaillées sont rédigées en français. Notre équipe répond en anglais.",
  },
} as const;

/**
 * Même forme que `fr`, mais dont les feuilles sont de simples `string`.
 *
 * Sans cet élargissement, `as const` impose à l'anglais les valeurs françaises
 * littérales. Avec lui, ce sont les **clés** qui restent obligatoires : en
 * ajouter une ici sans sa traduction fait échouer la compilation, ce qui est
 * précisément la garantie recherchée.
 */
type Elargi<T> = {
  [K in keyof T]: T[K] extends string ? string : Elargi<T[K]>;
};

export type Dictionnaire = Elargi<typeof fr>;
