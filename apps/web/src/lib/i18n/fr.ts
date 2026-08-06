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
    textileDesc: "Pagnes Uniwax, Woodin et wax hollandais, sur devis.",
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

  /** L'espace client : profil, vérification d'identité, favoris. */
  espaceClient: {
    aucunFavori: "Vous n'avez pas encore de favoris.",
    soumettreDocuments: "Vous devez soumettre une pièce d'identité et un permis de conduire pour pouvoir effectuer une réservation.",
    documentsEnVerificationLong: "Vos documents sont en cours de vérification par notre équipe. Vous recevrez une notification dès qu'ils seront traités.",
    connexionProfil: "Connectez-vous pour accéder à votre profil.",
    motDePasseModifie: "Votre mot de passe a été modifié avec succès.",
    voirMesReservations: "Voir mes réservations →",
    seDeconnecter: "Se déconnecter",
    pieceIdentite: "Pièce d'identité",
    permisConduire: "Permis de conduire",
    apercuPieceIdentite: "Aperçu pièce d'identité",
    apercuPermis: "Aperçu permis de conduire",

    pieceSoumise: "Pièce d'identité soumise",
    permisSoumis: "Permis de conduire soumis",
    motif: "Motif :",
    documentsEnVerification: "Vos documents sont en cours de vérification par notre équipe.",
    documentsRejetes: "Vos documents ont été rejetés. Veuillez les soumettre à nouveau.",
    soumettreANouveau: "Soumettre à nouveau",
    identiteVerifiee: "Votre identité est vérifiée. Vous pouvez effectuer des réservations.",
    documentsEnvoyes:
      "Vos documents ont été envoyés avec succès. Notre équipe les vérifiera dans les plus brefs délais.",
    motifRejet: "Motif du rejet :",
    soumettreCorriges: "Veuillez soumettre à nouveau vos documents corrigés.",
    // La suppression de compte : dire ce qu'elle détruit, et sous quel régime.
    supprimerCompte: "Supprimer mon compte",
    suppressionIrreversible:
      "Cette action est irréversible. Toutes vos données personnelles seront définitivement effacées conformément au RGPD.",

    verificationIdentite: "Vérification d'identité",
    // Une phrase entière, pas un morceau autour d'un <strong> : l'anglais ne
    // met pas l'accent au même endroit, et une phrase en trois bouts ne se
    // traduit pas — c'est le même principe qu'au tunnel de paiement.
    renseignerNaissance:
      "Vous devez renseigner votre date de naissance avant de soumettre vos documents. L'âge minimum requis est de {age} ans.",
    completerProfil: "Compléter mon profil",
    ageMinimum:
      "Vous devez avoir au moins {age} ans pour soumettre vos documents et effectuer une réservation.",

    pasDePhoto: "Pas de photo",
    vehicules: "Véhicules",
    parcourirVehicules: "Parcourir les véhicules",
    lesBiensImmobiliers: "les biens immobiliers",
    montantEstime:
      "Montant estimé : {montant} FCFA — à régler au bureau lors de votre rendez-vous.",
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
    flottePremium: "Flotte de véhicules premium",
    assure: "Assuré",
    annee: "Année",
    boite: "Boîte",
    kilometrage: "Kilométrage",
    pasEncoreDisponible: "Ce véhicule n'est pas encore disponible à la location ou à la vente.",
    preferezAcheter: "Vous préférez l'acheter ? →",
    demandeAchatSansEngagement: "Vous envoyez une demande d'achat (sans engagement).",
    equipeConfirmePrix: "Notre équipe confirme le prix final et le montant de l'acompte.",
    reglerAcompte: "Vous réglez l'acompte pour réserver le véhicule.",
    faireDemandeAchat: "Faire une demande d'achat",
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
    etapeCommandez: "Commandez",
    etapePayezTitre: "Payez",
    etapeCollecte: "Nous collectons",
    etapeLivraison: "Livraison",
    petitsColis: "Petits colis",
    colisMoyens: "Colis moyens",
    grosColis: "Gros colis",
    coursesCommissions: "Courses & commissions",
    etapeChoisissezDesc: "Choisissez votre mode et remplissez les détails de livraison en ligne.",
    etapePayezDesc: "Réglez en ligne par carte ou Mobile Money, en toute sécurité.",
    etapeCollecteDesc: "Un coursier récupère votre colis à l'adresse indiquée.",
    etapeLivraisonDesc: "Votre colis est livré au destinataire, rapidement et en sécurité.",
    categorieDocuments: "Documents, vêtements, accessoires — jusqu'à 5 kg",
    categorieElectronique: "Équipements électroniques, livres, cadeaux — jusqu'à 20 kg",
    categorieVolumineux: "Cartons, meubles, équipements — jusqu'à 100 kg",
    categorieCourses: "Achats en magasin, retrait de documents, courses diverses",
    delaiStandardCoefficient: "Les tarifs ci-dessus sont ceux du délai standard. Un délai plus court s'applique en coefficient :",
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
    unites: {
      pagne: "Pagne (6 yards)",
      yard: "Yard",
      piece: "Pièce entière",
      balle: "Balle (gros)",
    },
    pourRevente: "J'achète pour revendre",
    pourReventeAide: "Nous sommes grossistes : dites-le nous et nous chiffrons au tarif de gros, en pagnes ou en balles.",
    revendeur: "Revendeur",
    devisSuite: "Nous consultons nos fournisseurs et revenons vers vous avec un prix ferme. Vous le retrouverez dans « Mes réservations », et vous serez prévenu dès qu'il est prêt.",
    devisSansEngagement: "Un devis n'engage à rien : vous décidez après l'avoir vu.",
    aucunTypeProposé: "Aucun type de pagne n'est proposé pour le moment. Contactez-nous directement.",
    heroLede: "Uniwax, Woodin et wax hollandais, au détail comme en gros. Dites-nous ce que vous cherchez — nous consultons nos fournisseurs et vous répondons avec un prix ferme.",
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
    textileDesc: "Pagnes Uniwax, Woodin et wax hollandais, sur devis.",
    explorer: "Explorer",
  },

  /** L'assistance voyages : visas, dossiers d'études, billets d'avion. */
  assistance: {
    etapeSoumettez: "Soumettez votre demande",
    etapeContact: "Notre équipe vous contacte",
    etapeSuivi: "Suivi du dossier",
    voyagesEtudes: "Voyages et études",
    etapeSoumettezDesc: "Choisissez une prestation et envoyez votre demande en ligne, sans engagement.",
    etapeContactDesc: "Nous étudions votre dossier et convenons des modalités et du règlement.",
    etapeSuiviDesc: "Nous assurons le suivi de votre dossier jusqu'à l'obtention du visa.",
    douPartezVous: "D'où partez-vous ?",
    bebeSurGenoux: "Un bébé voyage sur les genoux d'un adulte. Au-delà de {max} voyageurs, contactez-nous pour un tarif groupe.",
    passeportExigeCedeao: "Même vers la CEDEAO, le passeport est exigé par les compagnies desservant Abidjan, dont Air Côte d'Ivoire. La carte d'identité CEDEAO ne suffit pas à l'embarquement.",
    dateExpiration: "Date d'expiration",
    joindrePagePasseport: "Joindre la page du passeport nous évite une faute de saisie sur un nom translittéré. Ce n'est pas obligatoire : les champs ci-dessus suffisent.",
    certificatFievreJaune: "Je dispose d'un certificat de vaccination fièvre jaune valide",
    fievreJauneObligatoire: "Le vaccin contre la fièvre jaune est obligatoire pour tout voyageur de 9 mois et plus entrant en Côte d'Ivoire. Sans certificat à l'arrivée, la vaccination est faite à l'aéroport (7 000 FCFA). De nombreuses destinations l'exigent aussi depuis Abidjan.",
    autorisationParentaleCase: "Je dispose de l'autorisation parentale pour les mineurs",
    mineurAutorisation: "Tout mineur voyageant sans ses deux parents doit présenter une autorisation parentale légalisée à la mairie, et ce jusqu'à sa majorité.",
    aucunCreneauDepot: "Aucun créneau de dépôt n'est ouvert pour le moment. Contactez-nous pour convenir d'une date.",
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
    fraisVisiteNonRemboursables: "À régler maintenant pour réserver votre visite. Ces frais couvrent l'organisation de la visite et ne sont pas remboursables.",
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

  /** Ce qui reste du site public : accueil, contact, avis, blog, favoris. */
  divers: {
    modeles: "Modèles",
    metiers: "Métiers",
    adresse: "Adresse",
    nonVerifie: "Non vérifié",
    enAttenteVerification: "En attente de vérification",
    verifie: "Vérifié",
    rejete: "Rejeté",
    slideLocationPremium: "Location de véhicules premium",
    slideTransportChauffeur: "Transport avec chauffeur",
    slideLivraisonExpress: "Livraison de colis express",
    slideImmobilier: "Immobilier — achat, vente, location",
    slideVisasEtudes: "Visas, études & voyages",
    slideVehiculesLuxe: "Véhicules de luxe",
    altFlottePremium: "Flotte premium — Porsche Panamera",
    altTransportChauffeur: "Transport avec chauffeur — Rolls Royce",
    altLivraison: "Service de livraison de colis",
    altImmobilier: "Projets immobiliers premium",
    altVoyages: "Assistance migration, visa et étude",
    altLuxe: "Véhicules de luxe",
    propositionSoumiseProprietaire:
      "La proposition est soumise au propriétaire, qui seul l'applique. Un coefficient de zone multiplie un prix facturé : aucune valeur ne change tant qu'il n'a pas tranché.",
    groupPhoebeCoteIvoire: "GROUP PHOEBE — Côte d'Ivoire",
    excellenceChaqueEtape: "L'excellence à chaque étape de votre vie",
    cinqMetiersExigence: "Transport, immobilier, assistance voyages, livraison et textile — cinq métiers, une même exigence, partout en Côte d'Ivoire.",
    reserverSimple: "Réserver n'a jamais été aussi simple — en quatre étapes.",
    accepteCgv: "J'ai lu et j'accepte les {cgv} et la {confidentialite}.",
    valeurActuelle: "Valeur actuelle de {champ} pour {zone} :",
    passagesACompleter:
      "Les passages marqués [À COMPLÉTER] attendent des informations que seule l'entreprise détient.",
    texteNonValide:
      "Ce texte n'engage pas encore GROUP PHOEBE et doit être validé avant publication.",
    mesPieces: "Mes pièces ({n})",
    ajouterPiece: "Ajouter une pièce",
    typePiece: "Type de pièce…",
    rendezVousDepot: "Rendez-vous de dépôt",
    rendezVousEnregistre: "Rendez-vous enregistré. Vous le retrouverez ici.",
    prendreRendezVous: "Prendre rendez-vous pour déposer mon dossier",
    choisirDateHoraire: "Choisissez une date, puis un horaire",
    plusDeCreneau: "Plus de créneau ce jour-là. Choisissez une autre date.",
    envoye: "Envoyé.",
    reponseEnregistree: "Réponse enregistrée.",
    creneauConvient: "Ce créneau vous convient ?",
    confirmerRefus: "Confirmer le refus",
    verifierDisponibilite: "Vérifier la disponibilité",
    aucunePosition: "Aucune position enregistrée",
    positionMiseAJour: "Position mise à jour",
    proposerCoefficientZone: "Proposer une modification de coefficient zone",
    propositionEnvoyee: "Proposition envoyée.",
    envoyerProposition: "Envoyer la proposition",
    raisonModification: "Raison de la modification",
    derniereMiseAJour: "Dernière mise à jour : {date}",
    passagesMarques: "Les passages marqués",
    // ─── Composants transverses ────────────────────────────────────────────
    motDePasse: "Mot de passe",
    changerMotDePasseIntro: "Changez le mot de passe de votre compte.",
    changerMonMotDePasse: "Changer mon mot de passe",
    motDePasseActuel: "Mot de passe actuel",
    nouveauMotDePasse: "Nouveau mot de passe",
    confirmerNouveauMotDePasse: "Confirmer le nouveau mot de passe",
    enregistrerNouveauMotDePasse: "Enregistrer le nouveau mot de passe",
    exempleMotDePasseActuel: "Votre mot de passe actuel",
    exempleHuitCaracteres: "8 caractères minimum",
    exempleRepetez: "Répétez le nouveau mot de passe",
    role: "Rôle",
    supprimerCompteConfirmation: "Supprimer votre compte ?",
    seDeconnecterConfirmation: "Se déconnecter ?",
    changerTheme: "Changer de thème",
    discuterWhatsApp: "Discuter sur WhatsApp",
    ouvrirOnglet: "Ouvrir dans un onglet",
    toutMarquerLu: "Tout marquer lu",
    // Les engagements et les étapes de l'accueil : le tableau vivait au niveau
    // du module, donc figé au chargement du fichier. Il se construit
    // maintenant dans le composant, à partir de la langue affichée.
    paiementSecuriseTitre: "Paiement sécurisé",
    paiementSecuriseDesc: "Carte bancaire et Mobile Money (Orange, MTN, Wave) — transactions chiffrées.",
    etapeChoisissez: "Choisissez",
    etapeChoisissezDesc: "Parcourez nos services et trouvez ce qu'il vous faut.",
    etapeReservez: "Réservez",
    etapeReservezDesc: "Indiquez vos dates, votre destination et vos préférences.",
    etapePayez: "Payez en sécurité",
    etapePayezDesc: "Réglez par carte ou Mobile Money en toute confiance.",
    etapeProfitez: "Profitez",
    etapeProfitezDesc: "Nous nous occupons du reste. Bonne route !",
    // ─── Accueil ───────────────────────────────────────────────────────────
    cinqMetiers: "Cinq métiers complémentaires, une même signature de qualité.",
    pourquoiNous: "Pourquoi nous choisir",
    pourquoiNousLede: "Un service pensé pour votre tranquillité, du premier clic à la prestation.",
    couvertureNationale: "Couverture nationale",
    couvertureNationaleDesc: "Abidjan et tout l'intérieur de la Côte d'Ivoire.",
    chauffeursPro: "Chauffeurs professionnels",
    chauffeursProDesc: "Option chauffeur expérimenté pour des trajets sereins.",
    assistanceDediee: "Assistance dédiée",
    assistanceDedieeDesc: "Une équipe à votre écoute pour chaque réservation.",
    contactezNous: "Contactez-nous",
    choisirService: "Choisir un service",

    // ─── Contact ───────────────────────────────────────────────────────────
    parlonsProjet: "Parlons de votre projet",
    parlonsProjetLede: "Une question, un devis, une collaboration ? Nous sommes à votre écoute.",
    nosCoordonnees: "Nos coordonnées",
    suivezNous: "Suivez-nous",
    messageEnvoye: "Message envoyé",
    messageRecu:
      "Merci ! Notre équipe a bien reçu votre message et vous recontactera au plus vite.",
    prenom: "Prénom",
    exemplePrenom: "Kouamé",
    exempleEmail: "vous@exemple.com",
    exempleMessage: "Décrivez votre demande…",

    // ─── Avis, blog, favoris ───────────────────────────────────────────────
    cequeClientsDisent: "Ce que nos clients disent",
    avisLede:
      "Des retours authentiques de nos clients sur nos services de transport, immobilier, assistance et livraison.",
    aucunAvis: "Aucun avis pour le moment.",
    reponseDeGroupPhoebe: "Réponse de GROUP PHOEBE",
    avisPublieApresRelecture: "Merci — votre avis sera publié après relecture.",
    votreExperience: "Votre expérience…",
    blogLede:
      "Conseils pratiques, guides et actualités pour vous accompagner dans vos projets de transport, immobilier, assistance et livraison.",
    aucunArticle: "Aucun article pour le moment.",
    pasDePhoto: "Pas de photo",
    parcourirVehicules: "Parcourir les véhicules",
    lesBiensImmobiliers: "les biens immobiliers",
    numeroSuiviObligatoire: "Numéro de suivi (obligatoire)",
    horsLigneBanniere: "Vous êtes hors ligne — les pages consultées restent accessibles",

    // ─── CGV ───────────────────────────────────────────────────────────────
    conditionsVente: "conditions générales de vente",
    etLa: "et la",
    politiqueConfidentialite: "politique de confidentialité",
  },

  /**
   * Titres d'onglet et descriptions de partage.
   *
   * Ils vivaient dans des `export const metadata`, évalués au chargement du
   * module : ils ne pouvaient pas suivre la langue du visiteur, quoi qu'on
   * fasse. Ils passent par `generateMetadata`, une requête à la fois.
   */
  meta: {
    accueilTitre: "GROUP PHOEBE — Transport, Immobilier & Assistance",
    accueilDescription:
      "GROUP PHOEBE : transport et livraison, immobilier et assistance voyages à Abidjan et partout en Côte d'Ivoire. Location de véhicules, vente de biens, visas et études.",
    accueilPartage:
      "Location de véhicules, vente immobilière et assistance voyages en Côte d'Ivoire.",

    transportTitre: "Location de véhicules — Catalogue",
    transportDescription:
      "Découvrez notre flotte de véhicules premium à la location ou à l'achat à Abidjan et partout en Côte d'Ivoire. SUV, berlines, minibus — réservez en ligne.",
    transportPartage:
      "Découvrez notre flotte de véhicules premium à la location ou à l'achat à Abidjan et partout en Côte d'Ivoire.",

    livraisonTitre: "Livraison de colis — Transport & Coursier",
    livraisonDescription:
      "Service de livraison de colis et coursier à Abidjan et partout en Côte d'Ivoire. Envois rapides, livraison porte-à-porte avec GROUP PHOEBE.",
    livraisonCommanderTitre: "Commander une livraison",
    livraisonCommanderDescription:
      "Commandez une livraison de colis à Abidjan et partout en Côte d'Ivoire avec GROUP PHOEBE.",
    livraisonConfirmationTitre: "Livraison enregistrée — Confirmation",
    livraisonConfirmationDescription:
      "Votre commande de livraison GROUP PHOEBE a été enregistrée.",

    immobilierTitre: "Immobilier — Achat, Vente & Location",
    immobilierDescription:
      "Trouvez le bien immobilier de vos rêves en Côte d'Ivoire : appartements, villas, terrains. Vente, location et estimation gratuite avec GROUP PHOEBE.",
    immobilierConfirmationTitre: "Demande envoyée — Immobilier",
    immobilierConfirmationDescription: "Votre demande a bien été enregistrée.",

    assistanceTitre: "Assistance Voyages — Visas, Études & Formalités",
    assistanceDescription:
      "GROUP PHOEBE vous accompagne dans vos démarches de visa, études à l'étranger et formalités administratives depuis la Côte d'Ivoire.",
    assistanceConfirmationTitre: "Dossier soumis — Assistance",
    assistanceConfirmationDescription:
      "Votre demande d'assistance visa a bien été enregistrée.",

    textileTitre: "Textile — Pagnes Uniwax, Woodin et Hollandais",
    textileDescription:
      "Pagnes Uniwax, Woodin et wax hollandais, au détail comme en gros. Dites-nous ce que vous cherchez : nous consultons nos fournisseurs et vous répondons avec un prix ferme.",
    textileConfirmationTitre: "Demande envoyée — Textile",
    textileConfirmationDescription: "Votre demande de devis a bien été enregistrée.",

    panierTitre: "Panier — Réservation",
    panierDescription:
      "Finalisez votre réservation de véhicule, bien immobilier ou service d'assistance GROUP PHOEBE en toute simplicité.",
    paiementTitre: "Paiement — Finaliser la réservation",
    paiementDescription:
      "Choisissez votre moyen de paiement et finalisez votre réservation GROUP PHOEBE en toute sécurité.",

    profilTitre: "Mon Profil",
    profilDescription:
      "Gérez vos informations personnelles, vos documents d'identité et préférences sur votre compte GROUP PHOEBE.",
    reservationsTitre: "Mes Réservations",
    reservationsDescription:
      "Consultez et gérez toutes vos réservations de transport, immobilier et assistance voyage GROUP PHOEBE.",
    favorisTitre: "Mes Favoris",
    favorisDescription:
      "Retrouvez vos véhicules et biens immobiliers favoris GROUP PHOEBE en un coup d'œil.",
    verificationTitre: "Vérification d'identité",
    verificationDescription:
      "Soumettez vos documents d'identité et permis de conduire pour vérifier votre compte GROUP PHOEBE.",

    contactTitre: "Contact",
    contactDescription:
      "Contactez GROUP PHOEBE pour un devis transport, immobilier ou assistance voyage à Abidjan et partout en Côte d'Ivoire.",
    suiviTitre: "Suivre un colis",
    suiviDescription:
      "Suivez votre livraison GROUP PHOEBE en temps réel grâce à votre numéro de suivi.",
    avisTitre: "Avis clients — GROUP PHOEBE",
    avisDescription:
      "Des retours authentiques de nos clients sur nos services de transport, immobilier, assistance et livraison.",
    blogTitre: "Blog & Guides — GROUP PHOEBE",
    blogDescription:
      "Conseils pratiques, guides et actualités pour vous accompagner dans vos projets de transport, immobilier, assistance et livraison.",

    // Le gabarit racine : titre par défaut, et le « | GROUP PHOEBE » ajouté aux
    // titres des pages.
    siteTitre: "GROUP PHOEBE — Transport, Livraison, Immobilier & Assistance Migration",
    siteDescription:
      "Plateforme numérique de services professionnels : transport, livraison de colis, immobilier et assistance migration, visa et études en Côte d'Ivoire.",
    sitePartageTitre: "GROUP PHOEBE — Services professionnels",
    sitePartageDescription:
      "Transport, livraison, immobilier et assistance migration, visa et études en Côte d'Ivoire.",
    // La locale Open Graph suit la langue : annoncer `fr_CI` sur une page
    // servie en anglais fait afficher la mauvaise variante aux réseaux.
    ogLocale: "fr_CI",
  },

  /**
   * Les messages d'erreur des server actions.
   *
   * Ils étaient écrits en français littéral dans les actions : un visiteur
   * anglophone remplissait un formulaire et recevait « Vous devez être
   * connecté » — au moment précis où il a besoin de comprendre ce qui bloque.
   *
   * Les clés dérivent du message français : elles sont laides, et c'est
   * délibéré — les inventer aurait demandé de juger 218 fois, et une clé
   * mal choisie se relit moins bien qu'une clé mécanique.
   */
  err: {
    vehiculePlusDisponible: "{vehicule} n'est plus disponible.",
    demandeClose: "Demande {statut} : elle est close.",
    erreurInitialisationPaiement: "Erreur d'initialisation du paiement : {detail}",
    limiteOffresAtteinte: "Vous avez atteint la limite de {max} offre(s) en cours.",
    bienNonAcceptable: "Bien {statut} : impossible d'accepter une offre dessus.",
    erreurUploadPermis: "Erreur d'envoi du permis de conduire : {detail}",
    passageImpossible: "Passage impossible de « {de} » à « {vers} ».",
    negociationClose: "Demande {statut} : la négociation est close.",
    auDelaDevisLivraison: "Au-delà de {max} kg, la livraison se fait sur devis. Contactez-nous pour organiser l'envoi.",
    moyenInadapte: "{moyen} porte jusqu'à {max} kg. Choisissez un moyen adapté à {poids} kg.",
    confirmezEncaissement: "Confirmez avoir encaissé {montant} FCFA avant de valider la remise.",
    erreurUploadPiece: "Erreur d'envoi de la pièce d'identité : {detail}",
    erreurMiseAJour: "Erreur de mise à jour : {detail}",
    vousDevezEtreConnecte: "Vous devez être connecté.",
    vehiculeInvalide: "Véhicule invalide.",
    vousDevezAccepterLesConditionsGenerales: "Vous devez accepter les conditions générales de vente.",
    vehiculeIntrouvable: "Véhicule introuvable.",
    demandeInvalide: "Demande invalide.",
    lePrixFinalDoitEtreUn: "Le prix final doit être un montant positif.",
    demandeIntrouvable: "Demande introuvable.",
    cetteDemandeNEstPasUn: "Cette demande n'est pas un achat.",
    cetteDemandeNEstPlusEn: "Cette demande n'est plus en attente de validation.",
    leMontantDeLAcompteDoit: "Le montant de l'acompte doit être supérieur à 0.",
    vousDevezEtreConnectePourSoumettre: "Vous devez être connecté pour soumettre un dossier.",
    profilIntrouvable: "Profil introuvable.",
    destinationInvalide: "Destination invalide.",
    prestationInvalide: "Prestation invalide.",
    impossibleDeCreerLeDossierVeuillez: "Impossible de créer le dossier. Veuillez réessayer.",
    statutInvalide: "Statut invalide.",
    dossierIntrouvable: "Dossier introuvable.",
    leDossierAChangeDEtat: "Le dossier a changé d'état entre-temps. Rechargez la page.",
    dossierInvalide: "Dossier invalide.",
    typeDePieceInvalide: "Type de pièce invalide.",
    choisissezUnFichier: "Choisissez un fichier.",
    ceDossierNEstPasLe: "Ce dossier n'est pas le vôtre.",
    fichierInvalidePdfOuImage5: "Fichier invalide : PDF ou image, 5 Mo maximum.",
    echecDeLEnvoiReessayez: "Échec de l'envoi. Réessayez.",
    nonAuthentifie: "Non authentifié.",
    pieceIntrouvable: "Pièce introuvable.",
    accesRefuse: "Accès refusé.",
    lienIndisponible: "Lien indisponible.",
    indiquezCeQuiNeVaPas: "Indiquez ce qui ne va pas : le client doit savoir quoi corriger.",
    cettePieceADejaEteTraitee: "Cette pièce a déjà été traitée.",
    creneauOuDossierManquant: "Créneau ou dossier manquant.",
    ceDossierADejaUnRendez: "Ce dossier a déjà un rendez-vous. Annulez-le avant d'en prendre un autre.",
    impossibleDeReserverCeCreneauReessayez: "Impossible de réserver ce créneau. Réessayez.",
    rendezVousManquant: "Rendez-vous manquant.",
    ceRendezVousNEstPlus: "Ce rendez-vous n'est plus annulable.",
    ecrivezVotreMessage: "Écrivez votre message.",
    messageTropLong4000CaracteresMaximum: "Message trop long (4000 caractères maximum).",
    messageNonEnvoyeReessayez: "Message non envoyé. Réessayez.",
    tousLesChampsSontObligatoires: "Tous les champs sont obligatoires.",
    vousDevezAvoirAuMoins18: "Vous devez avoir au moins 18 ans pour vous inscrire.",
    leMotDePasseDoitContenir: "Le mot de passe doit contenir au moins 8 caractères.",
    formatDeTelephoneInvalide: "Format de téléphone invalide.",
    tropDeTentativesReessayezDansUne: "Trop de tentatives. Réessayez dans une minute.",
    identifiantOuMotDePasseIncorrect: "Identifiant ou mot de passe incorrect.",
    leCodeDeVerificationEstObligatoire: "Le code de vérification est obligatoire.",
    numeroDeTelephoneInvalide: "Numéro de téléphone invalide.",
    codeInvalideOuExpireVeuillezReessayer: "Code invalide ou expiré. Veuillez réessayer.",
    leNumeroDeTelephoneEstObligatoire: "Le numéro de téléphone est obligatoire.",
    impossibleDEnvoyerLeCodeVerifiez: "Impossible d’envoyer le code. Vérifiez le numéro.",
    lAdresseEmailEstObligatoire: "L'adresse email est obligatoire.",
    impossibleDEnvoyerLEmailVerifiez: "Impossible d'envoyer l'email. Vérifiez l'adresse.",
    lesMotsDePasseNeCorrespondent: "Les mots de passe ne correspondent pas.",
    sessionExpireeVeuillezRecommencer: "Session expirée. Veuillez recommencer.",
    leNouveauMotDePasseDoit: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
    leNouveauMotDePasseDoit2: "Le nouveau mot de passe doit être différent de l'actuel.",
    sessionExpireeVeuillezVousReconnecter: "Session expirée. Veuillez vous reconnecter.",
    ceCompteNUtilisePasDe: "Ce compte n'utilise pas de mot de passe (connexion via Google).",
    motDePasseActuelIncorrect: "Mot de passe actuel incorrect.",
    leNomEstObligatoire: "Le nom est obligatoire.",
    vousDevezAvoirAuMoins182: "Vous devez avoir au moins 18 ans.",
    impossibleDeMettreAJourLe: "Impossible de mettre à jour le profil.",
    numeroDeTelephoneRequis: "Numéro de téléphone requis.",
    impossibleDeRenvoyerLeCodeReessayez: "Impossible de renvoyer le code. Réessayez plus tard.",
    sessionExpiree: "Session expirée.",
    impossibleDeSupprimerLeCompte: "Impossible de supprimer le compte.",
    seulsLesClientsPeuventLaisserUn: "Seuls les clients peuvent laisser un avis.",
    reservationRequise: "Réservation requise.",
    noteInvalide15: "Note invalide (1-5).",
    vousAvezDejaLaisseUnAvis: "Vous avez déjà laissé un avis pour cette réservation.",
    vousDevezEtreConnectePourDemander: "Vous devez être connecté pour demander un billet.",
    impossibleDEnregistrerLaDemandeVeuillez: "Impossible d'enregistrer la demande. Veuillez réessayer.",
    impossibleDEnregistrerLesVoyageursVeuillez: "Impossible d'enregistrer les voyageurs. Veuillez réessayer.",
    sessionExpireeOuAccesRefuse: "Session expirée ou accès refusé.",
    passezParLeFormulaireDeDevis: "Passez par le formulaire de devis pour ce statut.",
    laDemandeAChangeDEtat: "La demande a changé d'état entre-temps. Rechargez la page.",
    seulLeProprietairePeutChiffrerUn: "Seul le propriétaire peut chiffrer un billet.",
    leMontantDoitEtreUnMontant: "Le montant doit être un montant positif.",
    methodeDePaiementInvalide: "Méthode de paiement invalide.",
    cetteDemandeNAPasDe: "Cette demande n'a pas de devis en attente.",
    leDevisNAPasDe: "Le devis n'a pas de montant.",
    ceDevisAExpireContactezNous: "Ce devis a expiré. Contactez-nous pour un nouveau devis.",
    seulLeProprietairePeutModifierCes: "Seul le propriétaire peut modifier ces paramètres.",
    lesFraisDeServiceDoiventEtre: "Les frais de service doivent être positifs ou nuls.",
    laValiditeDePasseportExigeeDoit: "La validité de passeport exigée doit être entre 0 et 24 mois.",
    leNombreMaximumDeVoyageursDoit: "Le nombre maximum de voyageurs doit être entre 1 et 50.",
    leDelaiDeReponseDoitEtre: "Le délai de réponse doit être entre 1 et 720 heures.",
    laValiditeDuDevisDoitEtre: "La validité du devis doit être entre 1 et 720 heures.",
    pieceInconnue: "Pièce inconnue.",
    aucunDocumentDepose: "Aucun document déposé.",
    referenceInconnue: "Référence inconnue.",
    aucunMontantEnAttenteSurCette: "Aucun montant en attente sur cette référence.",
    votreIdentiteDoitEtreVerifieeAvant: "Votre identité doit être vérifiée avant de réserver. Rendez-vous sur votre profil pour soumettre vos documents.",
    articlesDateDeDebutEtDate: "Articles, date de début et date de fin sont obligatoires.",
    laDateDeFinDoitEtre: "La date de fin doit être postérieure à la date de début.",
    formatDesArticlesInvalide: "Format des articles invalide.",
    votrePanierEstVide: "Votre panier est vide.",
    laDureeMinimaleEstDUn: "La durée minimale est d'un jour.",
    aucunVehiculeDisponibleParmiLesArticles: "Aucun véhicule disponible parmi les articles sélectionnés.",
    erreurLorsDeLaCreationDu: "Erreur lors de la création du paiement.",
    veuillezIndiquerVotreNom: "Veuillez indiquer votre nom.",
    indiquezUnEmailOuUnTelephone: "Indiquez un email ou un téléphone pour vous recontacter.",
    lAdresseEmailNEstPas: "L'adresse email n'est pas valide.",
    votreMessageDoitContenirAuMoins: "Votre message doit contenir au moins 10 caractères.",
    tropDeMessagesEnvoyesReessayezDans: "Trop de messages envoyés. Réessayez dans une minute.",
    leMotifDeRefusEstObligatoire: "Le motif de refus est obligatoire.",
    nonConnecte: "Non connecté.",
    cetteDemandeNePeutPlusEtre: "Cette demande ne peut plus être annulée.",
    ceConducteurADejaEteTraite: "Ce conducteur a déjà été traité.",
    aucunPermisDepose: "Aucun permis déposé.",
    vehiculeDateDeDebutEtDate: "Véhicule, date de début et date de fin sont obligatoires.",
    typeInvalide: "Type invalide.",
    uneOuPlusieursPeriodesChevauchentUn: "Une ou plusieurs périodes chevauchent un blocage ou une réservation existante.",
    chauffeurDateDeDebutEtDate: "Chauffeur, date de début et date de fin sont obligatoires.",
    cettePeriodeChevaucheUnBlocageExistant: "Cette période chevauche un blocage existant pour ce chauffeur.",
    factureNonDisponible: "Facture non disponible.",
    lienDeTelechargementIndisponible: "Lien de téléchargement indisponible.",
    accesRefuseProprietaireRequis: "Accès refusé : propriétaire requis.",
    laTvaDoitEtreCompriseEntre: "La TVA doit être comprise entre 0 et 100 %.",
    lePrefixeDeFactureEstObligatoire: "Le préfixe de facture est obligatoire.",
    lePrefixeDoitEtreEnMajuscules: "Le préfixe doit être en majuscules, 10 caractères au plus.",
    nonAuthentifie2: "Non authentifié",
    vousDevezEtreConnectePourEnvoyer: "Vous devez être connecté pour envoyer une demande.",
    bienInvalide: "Bien invalide.",
    typeDeDemandeInvalide: "Type de demande invalide.",
    bienIntrouvable: "Bien introuvable.",
    ceBienNEstPlusDisponible: "Ce bien n'est plus disponible.",
    moyenDePaiementInvalide: "Moyen de paiement invalide.",
    vousAvezDejaUneDemandeDe: "Vous avez déjà une demande de visite en cours sur ce bien. Retrouvez-la dans « Mes réservations ».",
    indiquezLaDureeDeLocationSouhaitee: "Indiquez la durée de location souhaitée, en mois.",
    indiquezLaDateDeDebutDe: "Indiquez la date de début de location souhaitée.",
    leMontantDeLOffreDoit: "Le montant de l'offre doit être un montant positif.",
    impossibleDeCreerLePaiement: "Impossible de créer le paiement.",
    passezParLeFormulaireDeContre: "Passez par le formulaire de contre-offre pour ce statut.",
    seulLeProprietairePeutProposerUne: "Seul le propriétaire peut proposer une contre-offre.",
    uneContreOffreNeSApplique: "Une contre-offre ne s'applique qu'à une demande de type offre.",
    cetteDemandeNePorteAucuneOffre: "Cette demande ne porte aucune offre chiffrée.",
    ceBienNEstPlusNegociable: "Ce bien n'est plus négociable.",
    cetteDemandeNEstPasLa: "Cette demande n'est pas la vôtre.",
    aucuneContreOffreEnAttenteSur: "Aucune contre-offre en attente sur cette demande.",
    ceBienNEstPlusDisponible2: "Ce bien n'est plus disponible : un accord a été conclu entre-temps. Votre offre est close.",
    champsObligatoiresManquantsAgentRequis: "Champs obligatoires manquants (agent requis).",
    creneauInvalide: "Créneau invalide.",
    leCreneauDoitEtreDansLe: "Le créneau doit être dans le futur.",
    visiteOuStatutInvalide: "Visite ou statut invalide.",
    visiteIntrouvable: "Visite introuvable.",
    laVisiteAChangeDEtat: "La visite a changé d'état entre-temps. Rechargez la page.",
    lesFraisDeVisiteDoiventEtre: "Les frais de visite doivent être un montant positif.",
    leTauxDeReductionDoitEtre: "Le taux de réduction doit être entre 0 et 100.",
    leNombreMaxDOffresDoit: "Le nombre max d'offres doit être au moins 1.",
    reponseInvalide: "Réponse invalide.",
    cetteVisiteNEstPasLa: "Cette visite n'est pas la vôtre.",
    ceCreneauNAttendPlusDe: "Ce créneau n'attend plus de réponse.",
    ceCreneauAChangeEntreTemps: "Ce créneau a changé entre-temps. Rechargez la page.",
    vousDevezEtreConnectePourCommander: "Vous devez être connecté pour commander une livraison.",
    tousLesChampsExpediteurDestinataireEt: "Tous les champs expéditeur, destinataire et adresses sont obligatoires.",
    modeDeLivraisonInvalide: "Mode de livraison invalide.",
    indiquezLaDateDeLivraisonSouhaitee: "Indiquez la date de livraison souhaitée.",
    laDateProgrammeeDoitEtreAu: "La date programmée doit être au plus tôt demain.",
    indiquezLePoidsDuColisEn: "Indiquez le poids du colis (en kg).",
    laValeurDeclareeEstInvalide: "La valeur déclarée est invalide.",
    choisissezUnMoyenDeLivraison: "Choisissez un moyen de livraison.",
    ceMoyenDeLivraisonNEst: "Ce moyen de livraison n'est plus proposé.",
    tarifIndisponiblePourCetteCombinaison: "Tarif indisponible pour cette combinaison.",
    impossibleDeCreerLExpeditionVeuillez: "Impossible de créer l'expédition. Veuillez réessayer.",
    expeditionInvalide: "Expédition invalide.",
    expeditionIntrouvable: "Expédition introuvable.",
    aucunLivreurDisponibleTousOntAtteint: "Aucun livreur disponible : tous ont atteint leur capacité du jour.",
    expeditionOuLivreurManquant: "Expédition ou livreur manquant.",
    unColisDejaLivreNePeut: "Un colis déjà livré ne peut pas être désaffecté.",
    lePrixDoitEtreUnMontant: "Le prix doit être un montant positif.",
    indiquezLeMotifDeLAjustement: "Indiquez le motif de l'ajustement.",
    lePrixNePeutPlusEtre: "Le prix ne peut plus être ajusté une fois le colis en transit.",
    indiquezLeMotifDeLaCloture: "Indiquez le motif de la clôture.",
    seuleUneExpeditionEnEchecPeut: "Seule une expédition en échec peut être clôturée ainsi.",
    lePaiementDeCetEnvoiEst: "Le paiement de cet envoi est déjà instruit.",
    cetEnvoiNEstPasLe: "Cet envoi n'est pas le vôtre.",
    leColisEstDejaPrisEn: "Le colis est déjà pris en charge. Contactez-nous pour l'annuler.",
    leColisAChangeDEtat: "Le colis a changé d'état entre-temps. Rechargez la page.",
    ceStatutDemandeUnePreuveOu: "Ce statut demande une preuve ou un motif.",
    indiquezQuiAReceptionneLeColis: "Indiquez qui a réceptionné le colis.",
    unePhotoDeLaRemiseEst: "Une photo de la remise est obligatoire.",
    photoInvalideFormatsAcceptesJpegPng: "Photo invalide : formats acceptés JPEG, PNG ou WebP.",
    echecDeLEnvoiDeLa: "Échec de l'envoi de la photo. Réessayez.",
    indiquezLeMotifDeLEchec: "Indiquez le motif de l'échec.",
    aucunePreuveDisponible: "Aucune preuve disponible.",
    lesDatesDeDebutEtDe: "Les dates de début et de fin sont obligatoires.",
    donneesDuPanierInvalides: "Données du panier invalides.",
    lePanierEstVide: "Le panier est vide.",
    accesRefuse2: "Accès refusé",
    lePrixNegocieDoitEtreUn: "Le prix négocié doit être un montant positif.",
    cetteDemandeNEstPasEn: "Cette demande n'est pas en négociation.",
    cetteDemandeNAPasDe2: "Cette demande n'a pas de prix négocié en attente.",
    seulsLesOperateursPeuventProposerUne: "Seuls les opérateurs peuvent proposer une modification.",
    zoneChampEtValeurProposeeSont: "Zone, champ et valeur proposée sont obligatoires.",
    champInvalide: "Champ invalide.",
    zoneIntrouvable: "Zone introuvable.",
    seulLeProprietairePeutValiderOu: "Seul le propriétaire peut valider ou refuser.",
    decisionInvalide: "Décision invalide.",
    propositionIntrouvable: "Proposition introuvable.",
    cettePropositionADejaEteTraitee: "Cette proposition a déjà été traitée.",
    vousDevezEtreConnectePourDemander2: "Vous devez être connecté pour demander un devis.",
    accesRefuseSeulLeProprietairePeut: "Accès refusé : seul le propriétaire peut chiffrer une demande.",
    leMontantDoitEtreUnChiffre: "Le montant doit être un chiffre positif.",
    laValiditeDuDevisVaDe: "La validité du devis va de 1 à 90 jours.",
    cetteDemandeNEstPasA: "Cette demande n'est pas à un stade où un devis se propose.",
    donnezUnNomACeModele: "Donnez un nom à ce modèle.",
    choisissezUneGamme: "Choisissez une gamme.",
    cetteGammeNExistePas: "Cette gamme n'existe pas.",
    articleInconnu: "Article inconnu.",
    marqueManquanteOuTropLongue: "Marque manquante ou trop longue.",
    gammeManquanteOuTropLongue: "Gamme manquante ou trop longue.",
    ceLibelleNeDonneAucuneCle: "Ce libellé ne donne aucune clé exploitable.",
    gammeInconnue: "Gamme inconnue.",
    cEstLaDerniereGammeActive: "C'est la dernière gamme active : la retirer fermerait le formulaire.",
    categorieMarqueEtModeleSontObligatoires: "Catégorie, marque et modèle sont obligatoires.",
    selectionnezAuMoinsUnePhoto: "Sélectionnez au moins une photo.",
    photoIntrouvable: "Photo introuvable.",
    lesDeuxDocumentsSontObligatoires: "Les deux documents sont obligatoires.",
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
