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
    sousTitre:
      "Choisissez vos dates, votre destination et votre moyen de paiement pour finaliser la réservation.",
    villeLivraison: "Ville de livraison",
    villeIntrouvable: "Ville introuvable ? Sélectionnez manuellement votre zone",
    chauffeurObligatoire: "Chauffeur obligatoire inclus pour cette zone.",
    secondConducteur: "Ajouter un second conducteur (facultatif)",
    nomSecondConducteur: "Nom du second conducteur",
    permisSecondConducteur: "Son permis de conduire",
    // Sans cette phrase, le client croit que le second conducteur peut prendre
    // le volant dès la remise des clés.
    permisVerifie:
      "Il sera vérifié par notre équipe. Sans permis validé, seul le titulaire de la réservation peut conduire.",
    // {montant} est inséré à l'affichage : figer « FCFA » dans la phrase
    // empêcherait de placer la devise autrement en anglais.
    confirmerEtPayer: "Confirmer et payer {montant}",
    negocierWhatsApp: "Négocier sur WhatsApp",
    paiementSecurise: "Paiement sécurisé",
    voirCatalogue: "Voir le catalogue",
    // {n} jours : le pluriel se décide dans la langue, pas par un « s » ajouté
    // à la volée — l'anglais et le français ne coupent pas au même endroit.
    // Le fil d'étapes du tunnel, et le lien d'évitement du gabarit.
    etapeRecapitulatif: "Récapitulatif",
    etapePaiement: "Paiement",
    etapeConfirmation: "Confirmation",
    progression: "Progression de la commande",
    etapeTerminee: " (terminé)",
    allerContenu: "Aller au contenu principal",
    joursLocation_un: "{n} jour de location",
    traitementEnCours: "Traitement en cours…",
    support247: "Support 24/7",
    annulationGratuite: "Annulation gratuite",
    joursLocation_pluriel: "{n} jours de location",
  },

  /** Le catalogue de véhicules, ses filtres et la fiche d'un véhicule. */
  transport: {
    heroLede: "Découvrez nos véhicules d'exception pour vos déplacements.",
    grilleLede: "Cliquez sur un véhicule pour le réserver ou faire une demande d'achat.",
    rechercher: "Rechercher marque, modèle…",
    categorie: "Catégorie",
    toutesCategories: "Toutes catégories",
    vehiculeLeger: "Véhicule léger",
    car: "Car",
    minibus: "Minibus",
    avecChauffeur: "Avec chauffeur",
    climatise: "Climatisé",
    automatique: "Automatique",
    aVendre: "À vendre",
    moinsFiltres: "Moins de filtres",
    plusFiltres: "Plus de filtres",
    carburant: "Carburant",
    tous: "Tous",
    toutes: "Toutes",
    essence: "Essence",
    diesel: "Diesel",
    hybride: "Hybride",
    electrique: "Électrique",
    transmission: "Transmission",
    manuelle: "Manuelle",
    placesMinimum: "Places minimum",
    anneeMinimum: "Année minimum",
    exempleAnnee: "Ex : 2020",
    etat: "État",
    neuf: "Neuf",
    occasion: "Occasion",
    prixMin: "Prix min (FCFA/j)",
    prixMax: "Prix max (FCFA/j)",
    exemplePrixMin: "Ex : 50000",
    exemplePrixMax: "Ex : 200000",
    filtreActif_un: "filtre actif",
    filtreActif_pluriel: "filtres actifs",

    chauffeur: "Chauffeur",
    notreFlotte: "Notre Flotte",
    vehiculesDisponibles: "Véhicules disponibles",
    aucunResultatFiltres: "Aucun résultat pour ces filtres",
    elargirCriteres: "Essayez d'élargir vos critères ou de réinitialiser les filtres.",
    disponible: "Disponible",
    surDemande: "Sur demande",
    prixSurDemande: "Prix sur demande",

    vehiculesDuGroupe_un: "{n} véhicule disponible",
    vehiculesDuGroupe_pluriel: "{n} véhicules disponibles",
    vehiculeAssure: "Véhicule assuré",
    queSouhaitezVous: "Que souhaitez-vous faire ?",
    courteOuLongueDuree: "Courte ou longue durée",
    acheterCeVehicule: "Acheter ce véhicule",
    plutotLouer: "← Plutôt le louer ?",

    caracteristiques: "Caractéristiques techniques",
    equipements: "Équipements",
    // Texte de repli quand un véhicule n'a pas de description saisie.
    descriptionDefaut:
      "Le {vehicule} est le véhicule idéal pour vos déplacements. Alliant confort, puissance et fiabilité, il vous offre une expérience de conduite inégalée sur toutes les routes de Côte d'Ivoire.",

    prixStandard: "Prix standard",
    tarifsParZone: "Tarifs par zone",
    supplementChauffeur: "Supplément chauffeur obligatoire inclus dans le tarif",
    parJour: "{montant} FCFA/jour",
    selectionnezDates: "Sélectionnez vos dates",
    jeReserveCeVehicule: "Je réserve ce véhicule",
    jeReserve: "Je réserve",
    aPartirDe: "À partir de",
    aPartirDeParJour: "À partir de {montant} FCFA/jour",
    contactezNousDevis: "Contactez-nous pour un devis",

    photoBientot: "Photo bientôt disponible",
    photoPrecedente: "Photo précédente",
    photoSuivante: "Photo suivante",
    photoSur: "{vehicule} — photo {n} sur {total}",

    prixAffiche: "Prix affiché",
    prixIndicatif: "Prix indicatif, négociable avec notre équipe.",
    connexionRequise: "Vous devez être connecté pour envoyer une demande.",
  },

  /** La livraison : la page de présentation et le formulaire de commande. */
  livraison: {
    heroTitre: "Livraison de colis & Coursier",
    heroLede: "Envois rapides et sécurisés à Abidjan et partout en Côte d'Ivoire, livrés porte-à-porte.",
    heroAlt: "Livraison de colis",
    nosTarifs: "Nos tarifs",
    tarifsLede: "Le prix dépend de la distance entre la collecte et la livraison, du mode d'envoi et du poids du colis.",
    transportonsLede: "Du pli administratif au gros colis, avec la même attention.",
    commander: "Commander une livraison",
    suivreColis: "Suivre un colis",
    paiementAnnule:
      "Le paiement a été annulé. Vous pouvez relancer votre commande à tout moment.",
    delaiSouhaite: "Délai souhaité",
    // Le poids ne fait plus le prix depuis 00084 : il dit quels véhicules
    // peuvent porter le colis. Le taire laissait croire à une facturation au kilo.
    poidsNeFaitPasLePrix:
      "Le poids ne change pas le prix : il détermine quels moyens peuvent porter votre colis. Au-delà de {max} kg, contactez-nous pour un devis.",
    zoneAutomatique:
      "La zone est déterminée automatiquement à partir des adresses de collecte et de livraison.",
    commentCaMarche: "Comment ça marche",
    ceQueNousTransportons: "Ce que nous transportons",
    colisAujourdhui: "Un colis à envoyer",
    aujourdhui: "aujourd'hui",

    consigneCommande:
      "Choisissez les communes et indiquez le poids : la zone et le prix sont calculés automatiquement.",
    collecteDemain: "À partir de demain. La collecte est organisée pour livrer ce jour-là.",
    poidsDetermineMoyens:
      "Le poids détermine les moyens qui peuvent porter votre colis — au-delà de {max} kg, contactez-nous pour un devis.",
    auDelaDevis: "Au-delà de {max} kg, contactez-nous pour un devis.",
    jusquA: "jusqu'à {n} kg",
    moyenLivraison: "Moyen de livraison",
    aucunVehiculePorte:
      "Aucun de nos véhicules ne porte {poids} kg. Contactez-nous pour un devis.",
    horsGrille: "Au-delà de {max} kg : contactez-nous pour un devis.",
    prixApresSaisie: "Choisissez les communes et indiquez le poids pour calculer le prix.",
    retourLivraison: "Retour à la livraison",
    communeCollecte: "Commune de collecte",
    communeLivraison: "Commune de livraison",
    aucuneCommune: "Aucune commune trouvée.",

    enregistree: "Livraison enregistrée",
    enregistreeTexte:
      "Votre commande de livraison a bien été enregistrée. Notre équipe organise la collecte de votre colis.",
    numeroSuivi: "Numéro de suivi",
    conservezNumero: "Conservez ce numéro pour suivre votre colis.",
    photosColis: "Photos du colis",
    colisRemis: "Colis remis",
    recuPar: "Reçu par {nom}",
  },

  /** Le textile : le catalogue de pagnes et la demande de devis. */
  textile: {
    heroLede: "Uniwax et wax hollandais. Dites-nous ce que vous cherchez — nous consultons nos fournisseurs et vous répondons avec un prix ferme.",
    lePagneQuIlVousFaut: "Le pagne qu'il vous faut",
    notreCatalogue: "Notre catalogue",
    catalogueLede:
      "Choisissez un modèle, ou décrivez ce que vous cherchez — les deux mènent au même devis.",
    catalogueVide:
      "Le catalogue se remplit. En attendant, décrivez ce que vous cherchez dans le formulaire ci-dessous — nous consultons nos fournisseurs.",
    rechercherCatalogue: "Rechercher dans le catalogue",
    exempleRecherche: "Un nom, une couleur, une référence…",
    effacerRecherche: "Effacer la recherche",
    tout: "Tout",
    modele_un: "{n} modèle",
    modele_pluriel: "{n} modèles",
    surTotal: "{n} sur {total}",
    modeleSelectionne: " · un modèle sélectionné",
    rienNeCorrespond: "Rien ne correspond à « {recherche} ».",
    decrivezQuandMeme:
      "Décrivez ce que vous cherchez dans le formulaire : nous le trouvons même s'il n'est pas au catalogue.",
    photoAVenir: "Photo à venir",
    coupDeCoeur: "Coup de cœur",
    reference: "Réf. {reference}",
    surDevis: "Sur devis",

    connexionDevis:
      "Connectez-vous pour demander un devis : nous vous répondons avec un prix ferme après consultation de nos fournisseurs.",
    modeleChoisi: "Modèle choisi",
    choisirAutre: "Choisir autre chose, ou décrire moi-même",
    quelPagne: "Quel pagne cherchez-vous ?",
    quantite: "Quantité",
    unite: "Unité",
    couleursSouhaitees: "Couleurs souhaitées",
    exempleCouleurs: "Ex. bleu et or",
    precisions: "Précisions",
    examplePrecisions: "Occasion, délai souhaité, quoi que ce soit d'utile",
    pourquoiPasDePrix: "Pourquoi pas de prix affiché ?",
    rienAuCatalogue:
      "Vous n'avez rien trouvé au catalogue ? Décrivez-le : nous le cherchons chez nos fournisseurs.",
    pourquoiPasDePrixTexte:
      "Le pagne n'a pas de prix de référence : chaque fournisseur vend au sien, et il bouge. Nous consultons les nôtres pour votre demande précise, puis nous vous envoyons un prix ferme — sans engagement de votre part.",
    demanderDevis: "Demander un devis",
    retourTextile: "Retour au textile",
    demandePartie: "Votre demande est partie",
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
    // La devise de la maison ne se traduit pas : c'est un élément de marque,
    // au même titre que le logo. Elle passe tout de même par le dictionnaire,
    // pour que la garde de traduction n'ait pas à faire d'exception.
    slogan: "Leader Excellence Efficacité.",
    presentation: "Transport, immobilier, assistance voyages, livraison et textile en Côte d'Ivoire.",
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
    voirCatalogue: "Voir le catalogue",
    retourCatalogue: "Retour au catalogue",
    vider: "Vider le panier",
    // « Panier (3 véhicules) » : le nombre entre dans le titre, et la forme
    // se choisit dans la langue affichée.
    titre_un: "Panier ({n} véhicule)",
    titre_pluriel: "Panier ({n} véhicules)",
    location_un: "Location ({n} véhicule)",
    location_pluriel: "Location ({n} véhicules)",
    annulationGratuite: "Annulation gratuite",
    // Une action irréversible se confirme, et la confirmation dit ce qu'elle
    // détruit : « Vider ? » seul laisse deviner.
    viderConfirmation: "Vider le panier ? Cette action retire tous les véhicules.",
    diminuerQuantite: "Diminuer la quantité",
    augmenterQuantite: "Augmenter la quantité",
    avecChauffeur: "Avec chauffeur",
    totalProvisoire:
      "Total final (durée, destination et caution) calculé à l'étape suivante.",
    paiementSecurise: "Paiement sécurisé",
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

  /** L'assistance voyages : visas, dossiers d'études, billets d'avion. */
  assistance: {
    heroLede: "Études en Chine, voyages en Europe — nous montons et suivons votre dossier de bout en bout.",
    billetLede: "Dites-nous où et quand vous voulez partir : nous cherchons le vol et vous envoyons un devis. Le règlement se fait en ligne ou à notre bureau, comme vous préférez.",
    paysLede: "Les pays que nous couvrons, avec le tarif de départ de notre accompagnement — donné à titre indicatif.",
    // ─── Assistance ────────────────────────────────────────────────────────
    visaExpertise: "Votre visa, notre expertise",
    assistanceVoyagesEtudes: "Assistance Voyages & Études",
    assistanceBillets: "Assistance réservation et achat de billets d'avion",
    assistanceVisas: "Assistance demande de visa et de bourses d'études",
    demandeEnregistree:
      "Votre demande a bien été enregistrée. Notre équipe étudie votre dossier et vous contactera prochainement pour convenir des modalités et du paiement.",
    demandeEnregistreePays:
      "Votre demande pour un visa {pays} a bien été enregistrée. Notre équipe étudie votre dossier et vous contactera prochainement pour convenir des modalités et du paiement.",
    demandeBilletEnregistree:
      "Votre demande de billet a bien été enregistrée. Nous recherchons le meilleur vol pour votre trajet et vous envoyons un devis. Aucun paiement n'a été prélevé à cette étape.",
    retourAssistance: "Retour à l'assistance",
    titreIndicatif: "À titre indicatif",
    piecesAFournir: "Pièces à fournir ({n})",
    ceQueCouvre: "Ce que couvre notre assistance.",

    connexionBillet:
      "Connectez-vous pour demander un billet : nous avons besoin de vos informations de passeport pour préparer la réservation.",
    ouAllezVous: "Où allez-vous ?",
    typeTrajet: "Type de trajet",
    dateDepart: "Date de départ",
    passeportPrincipal: "Passeport du voyageur principal",
    validiteApresDepart: "Il doit rester valable au moins {mois} mois après le départ.",
    validiteCePasseport: "Ce passeport doit rester valable au moins {mois} mois après le départ.",
    nomPrenoms: "Nom et prénoms",
    numeroPasseport: "Numéro de passeport",
    pagePasseport: "Page du passeport",
    passeportsAutres: "Passeports des autres voyageurs ({n})",
    memesInformations:
      "Les mêmes informations que ci-dessus, pour chaque personne qui voyage. Sans elles, la compagnie ne peut pas émettre son billet.",
    autorisationParentale:
      "Cette autorisation est obligatoire pour les enfants voyageant sans leurs deux parents. La démarche prend plusieurs jours : anticipez.",
    precisionsOptionnel: "Précisions (optionnel)",
    exemplePrecisions: "Compagnie souhaitée, horaires, bagages, escale…",
    fraisService: "Frais de service : {montant} FCFA par billet",
    nomExactPasseport:
      "Le nom doit être exactement celui du passeport : une différence rend le billet inutilisable à l'embarquement.",
    fraisServiceDetail:
      "Ils s'ajoutent au prix du vol et couvrent la recherche, la réservation et l'émission. Le devis vous donnera le total.",
    aucunPaiementDelai:
      "Nous recherchons le meilleur vol pour votre trajet et vous répondons {delai} avec un devis. Aucun paiement à cette étape.",
    aucunPaiementEtape:
      "Nous recherchons le meilleur vol pour votre trajet et vous répondons avec un devis. Aucun paiement à cette étape.",
    aPayer: "À payer : {montant} FCFA",
    presentezVousBureau:
      "Noté. Présentez-vous à notre bureau pour régler et retirer votre billet.",
  },

  immobilier: {
    heroLede: "Vente, location, estimation — nous vous accompagnons à chaque étape.",
    offresLede: "Nos offres du moment, mises à jour en continu.",
    trouvezBien: "Trouvez le bien de vos rêves",
    pageSur: " · page {n} sur {total}",
    situerCarte: "Situer le bien sur une carte",
    offreEnCours_un: "{n} personne a fait une offre sur ce bien",
    offreEnCours_pluriel: "{n} personnes ont fait une offre sur ce bien",
    // Un bien qui n'est plus disponible : dire son état, puis proposer une suite.
    bienIndisponible:
      "Il est actuellement {statut}. Parcourez les biens disponibles pour trouver une alternative.",
    bienPlusDisponible: "Ce bien n'est plus disponible",
    documentsEnRegle: "Documents en règle",
    documentsEnRegleTexte:
      "Tous les documents de ce bien sont en règle — titre de propriété et pièces administratives vérifiés. Ils sont prêts à être présentés et inspectés devant un notaire lors de la finalisation de la transaction.",
    retourImmobilier: "Retour à l'immobilier",
    voirBiensDisponibles: "Voir les biens disponibles",
    demandeEnregistree:
      "Votre {type} a bien été enregistrée. Notre équipe vous recontacte au plus vite pour la suite.",
    connexionPourDemander:
      "Connectez-vous pour demander une information, réserver une visite ou faire une offre sur ce bien.",
    bienVousInteresse: "Ce bien vous intéresse ?",
    dateSouhaitee: "Date souhaitée",
    fraisVisite: "Frais de visite : {montant} FCFA",
    debutSouhaite: "Début souhaité",
    dureeMois: "Durée (mois)",
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

  /**
   * Les pages d'état : erreur, page absente, hors ligne, paiement non abouti.
   *
   * Ce sont les écrans qu'un visiteur voit au pire moment. Les laisser en
   * français quand il a choisi l'anglais, c'est le perdre là où il a déjà un
   * problème.
   */
  etats: {
    erreurTitre: "Une erreur est survenue",
    erreurTexte: "Un problème technique est survenu. Veuillez réessayer.",
    reessayer: "Réessayer",

    introuvableTitre: "Page introuvable",
    introuvableTexte:
      "La page que vous cherchez n'existe pas ou n'est plus accessible.",

    horsLigneTitre: "Vous êtes hors ligne",
    horsLigneTexte:
      "Vérifiez votre connexion internet. Les pages déjà consultées restent accessibles.",
    horsLigneMeta: "Vous êtes actuellement hors ligne.",

    paiementEchoueTitre: "Paiement non abouti",
    // Dire que les disponibilités sont libérées évite au client de croire
    // qu'il a bloqué un véhicule en payant mal.
    paiementEchoueTexte:
      "Le paiement a été annulé ou a échoué. Les disponibilités ont été libérées — vous pouvez réessayer à tout moment.",
    paiementEchoueMeta:
      "Le paiement de votre réservation GROUP PHOEBE a été annulé ou a échoué.",

    paiementEnregistreTitre: "Paiement enregistré",
    paiementEnregistreMeta: "Votre réservation GROUP PHOEBE a été enregistrée avec succès.",
    /**
     * Deux phrases entières plutôt qu'un morceau inséré au milieu.
     *
     * Le code composait « Votre réservation » + « pour le {véhicule} » + la
     * suite : l'anglais ne coupe pas là, et le français lui-même a un genre à
     * accorder. Une phrase à trous se traduit, une phrase en morceaux non.
     */
    reservationEnAttente:
      "Votre réservation est en attente de validation par notre équipe. Vous recevrez une notification dès qu'elle sera confirmée.",
    reservationEnAttenteVehicule:
      "Votre réservation pour le {vehicule} est en attente de validation par notre équipe. Vous recevrez une notification dès qu'elle sera confirmée.",
    voirMesReservations: "Voir mes réservations",
    retourCatalogue: "Retour au catalogue",
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
