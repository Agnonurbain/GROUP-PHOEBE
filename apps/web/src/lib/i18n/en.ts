// English dictionary.
//
// Typed against `fr.ts` : a key added there without its English counterpart
// fails the build. Nothing else keeps two dictionaries in step over time.

import type { Dictionnaire } from "./fr";

export const en: Dictionnaire = {
  nav: {
    accueil: "Home",
    transport: "Transport",
    livraison: "Delivery",
    immobilier: "Real estate",
    assistance: "Travel assistance",
    blog: "Blog",
    avis: "Reviews",
    suivi: "Track a parcel",
    contact: "Contact",
    monCompte: "My account",
    mesReservations: "My bookings",
    connexion: "Sign in",
    inscription: "Sign up",
    deconnexion: "Sign out",
    panier: "Cart",
    administration: "Administration",
    menu: "Menu",
    fermer: "Close",
  },

  commun: {
    chargement: "Loading…",
    envoi: "Sending…",
    enregistrer: "Save",
    annuler: "Cancel",
    confirmer: "Confirm",
    retour: "Back",
    retourAccueil: "Back to home",
    voirDetail: "View details",
    voirPlus: "See more",
    rechercher: "Search",
    filtrer: "Filter",
    reinitialiser: "Reset",
    precedent: "Previous",
    suivant: "Next",
    obligatoire: "required",
    facultatif: "optional",
    oui: "Yes",
    non: "No",
    aucunResultat: "No results.",
    erreurGenerique: "Something went wrong. Please try again.",
    // La devise ne se traduit pas : c'est le franc CFA dans les deux langues.
    devise: "FCFA",
  },

  accueil: {
    titre: "Transport, delivery, real estate and travel assistance",
    sousTitre: "Four businesses, one team, in Abidjan and across Côte d'Ivoire.",
    decouvrir: "Explore our services",
    nosServices: "Our services",
  },

  services: {
    transportDesc: "Vehicle sales and rental, with or without a driver.",
    immobilierDesc: "Buy, sell and rent property in Abidjan and beyond.",
    assistanceDesc: "Visas, studies and international travel, supported end to end.",
    livraisonDesc: "Parcels collected, tracked and delivered nationwide.",
  },

  compte: {
    titre: "My bookings",
    connectezVous: "Sign in to see your bookings.",
    onglets: { actives: "Active", terminees: "Completed", annulees: "Cancelled" },
    aucune: "No bookings",
    aucuneActive: "No active bookings.",
    aucuneTerminee: "No completed bookings.",
    aucuneAnnulee: "No cancelled bookings.",
    profil: "My profile",
    retourProfil: "Back to profile",
    statut: {
      enAttente: "Pending",
      termine: "Completed",
      annule: "Cancelled",
      paye: "Paid",
      reponseAttendue: "Awaiting your reply",
      devisRecu: "Quote received",
      billetEmis: "Ticket issued",
    },
    facture: "Invoice",
    contrat: "Rental agreement",
    etatLieux: "Condition report",
    preuveRemise: "View proof of delivery",
    recuPar: "Received by",
    cautionRetenue: "Deposit withheld",
    donnerAvis: "Leave a review",
    suivreColis: "Track parcel",
    annulerEnvoi: "Cancel shipment",
    annulerReservation: "Cancel booking",
    aRegler: "Amount due",
    aPayer: "To pay",
    conseiller: "Adviser",
    mesPieces: "My documents",
    ajouterPiece: "Add a document",
    creneauConvient: "Does this time work for you?",
    jeConfirme: "Confirm",
    autreDate: "Another date",
  },

  paiement: {
    carte: "Card",
    mobileMoney: "Mobile Money",
    aLaLivraison: "On delivery",
    moyenPaiement: "Payment method",
    total: "Total",
    recapitulatif: "Summary",
    payer: "Pay",
    retourPanier: "Back to cart",
  },

  suivi: {
    titre: "Track a parcel",
    consigne: "Enter your tracking number (format GP-XXXXXXXX).",
    bouton: "Track",
    introuvable: "No parcel found for this number. Please check it.",
    photosColis: "Parcel photos",
    retourLivraison: "Back to delivery",
  },

  auth: {
    connexionTitre: "Sign in",
    inscriptionTitre: "Create an account",
    identifiant: "Phone or email",
    motDePasse: "Password",
    motDePasseOublie: "Forgot your password?",
    pasDeCompte: "No account yet?",
    dejaInscrit: "Already registered?",
    seConnecter: "Sign in",
    creerCompte: "Create my account",
    nom: "Full name",
    telephone: "Phone",
    email: "Email address",
    dateNaissance: "Date of birth",
  },

  footer: {
    services: "Services",
    contact: "Contact",
    legal: "Legal",
    droits: "All rights reserved.",
  },

  legal: {
    documentProvisoire: "Draft document",
    derniereMaj: "Last updated",
    mentionsLegales: "Legal notice",
    cgv: "Terms and conditions of sale",
    confidentialite: "Privacy policy",
  },

  langue: {
    choisir: "Choose language",
    contenuNonTraduit:
      "Detailed descriptions are written in French. Our team replies in English.",
  },
};
