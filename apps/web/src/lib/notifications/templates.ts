export type NotificationEvent =
  | "nouvelle_reservation"
  | "reservation_confirmee"
  | "reservation_annulee"
  | "paiement_initie"
  | "paiement_confirme"
  | "paiement_echoue"
  | "etat_lieux_depart"
  | "etat_lieux_retour"
  | "inspection_terminee"
  | "caution_remboursee"
  | "rappel_paiement"
  | "vehicule_disponible"
  | "document_requis"
  | "verification_validee"
  | "verification_refusee"
  | "nouveau_message"
  | "rappel_retour_vehicule";

export interface TemplateContext {
  // Client
  client_nom?: string;
  client_telephone?: string;
  client_email?: string;
  // Véhicule
  vehicule_marque?: string;
  vehicule_modele?: string;
  vehicule_immatriculation?: string;
  vehicule_categorie?: string;
  // Dates
  date_debut?: Date | string;
  date_fin?: Date | string;
  date_retour_prevue?: Date | string;
  // Montants
  montant_location?: number;
  montant_caution?: number;
  montant_retenu?: number;
  montant_rembourse?: number;
  montant_total?: number;
  // Paiement
  methode_paiement?: string;
  reference_paiement?: string;
  // Demande
  demande_id?: string;
  numero_demande?: string;
  // Lieu
  lieu_depart?: string;
  lieu_destination?: string;
  // Admin
  admin_nom?: string;
  // Custom
  [key: string]: string | number | boolean | Date | undefined;
}

function formatDate(date?: Date | string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("fr-FR");
}

const templates: Record<NotificationEvent, (ctx: TemplateContext) => { sujet: string; contenu: string }> = {
  nouvelle_reservation: (ctx) => ({
    sujet: "Nouvelle demande de réservation",
    contenu: `Bonjour ${ctx.client_nom ?? "Client"},\n\nVotre demande de réservation pour un ${ctx.vehicule_marque ?? ""} ${ctx.vehicule_modele ?? ""}${ctx.vehicule_immatriculation ? ` (${ctx.vehicule_immatriculation})` : ""} a bien été reçue.\n\n📅 Période : ${formatDate(ctx.date_debut)} → ${formatDate(ctx.date_fin)}\n📍 ${ctx.lieu_depart ? `Départ : ${ctx.lieu_depart}` : ""}${ctx.lieu_destination ? ` / Arrivée : ${ctx.lieu_destination}` : ""}\n💰 Montant estimé : ${ctx.montant_total ? formatCurrency(ctx.montant_total) + " FCFA" : "Sur devis"}\n\nNotre équipe vous contactera sous peu pour confirmer.\n\n— L'équipe GROUP PHOEBE`,
  }),

  reservation_confirmee: (ctx) => ({
    sujet: "Réservation confirmée",
    contenu: `Bonjour ${ctx.client_nom ?? "Client"},\n\nVotre réservation est confirmée ! ✅\n\n🚗 ${ctx.vehicule_marque ?? ""} ${ctx.vehicule_modele ?? ""}${ctx.vehicule_immatriculation ? ` (${ctx.vehicule_immatriculation})` : ""}\n📅 Du ${formatDate(ctx.date_debut)} au ${formatDate(ctx.date_fin)}\n📍 ${ctx.lieu_depart ? `Départ : ${ctx.lieu_depart}` : ""}${ctx.lieu_destination ? ` / Arrivée : ${ctx.lieu_destination}` : ""}\n💰 Total : ${ctx.montant_total ? formatCurrency(ctx.montant_total) + " FCFA" : ""}\n${ctx.montant_caution ? `🔒 Caution : ${formatCurrency(ctx.montant_caution)} FCFA` : ""}\n\nRéférence : ${ctx.numero_demande ?? ctx.demande_id ?? ""}\n\nPrésentez-vous avec votre pièce d'identité au point de départ.\n\n— L'équipe GROUP PHOEBE`,
  }),

  reservation_annulee: (ctx) => ({
    sujet: "Réservation annulée",
    contenu: `Bonjour ${ctx.client_nom ?? "Client"},\n\nVotre réservation ${ctx.numero_demande ?? ctx.demande_id ?? ""} a été annulée.\n\n${ctx.montant_rembourse ? `💰 Remboursement de ${formatCurrency(ctx.montant_rembourse)} FCFA en cours (délai : 3-5 jours ouvrés).` : ""}\n\nPour toute question, contactez-nous.\n\n— L'équipe GROUP PHOEBE`,
  }),

  paiement_initie: (ctx) => ({
    sujet: "Paiement en cours",
    contenu: `Bonjour ${ctx.client_nom ?? "Client"},\n\nVotre paiement de ${ctx.montant_total ? formatCurrency(ctx.montant_total) + " FCFA" : ""} a été initié via ${ctx.methode_paiement ?? "le moyen de paiement choisi"}.\n\nRéférence : ${ctx.reference_paiement ?? ctx.numero_demande ?? ""}\n\nVous serez notifié dès la confirmation.\n\n— L'équipe GROUP PHOEBE`,
  }),

  paiement_confirme: (ctx) => ({
    sujet: "Paiement confirmé",
    contenu: `Bonjour ${ctx.client_nom ?? "Client"},\n\n✅ Paiement confirmé !\n\n💰 Montant : ${ctx.montant_total ? formatCurrency(ctx.montant_total) + " FCFA" : ""}\n💳 Méthode : ${ctx.methode_paiement ?? ""}\n📄 Référence : ${ctx.reference_paiement ?? ctx.numero_demande ?? ""}\n\nVotre réservation ${ctx.numero_demande ?? ctx.demande_id ?? ""} est maintenant payée.\n\n— L'équipe GROUP PHOEBE`,
  }),

  paiement_echoue: (ctx) => ({
    sujet: "Échec du paiement",
    contenu: `Bonjour ${ctx.client_nom ?? "Client"},\n\n❌ Votre paiement de ${ctx.montant_total ? formatCurrency(ctx.montant_total) + " FCFA" : ""} a échoué.\n\nRéférence : ${ctx.reference_paiement ?? ctx.numero_demande ?? ""}\n\nVeuillez réessayer ou changer de moyen de paiement depuis votre espace client.\n\n— L'équipe GROUP PHOEBE`,
  }),

  etat_lieux_depart: (ctx) => ({
    sujet: "État des lieux de départ enregistré",
    contenu: `Bonjour ${ctx.client_nom ?? "Client"},\n\n✅ L'état des lieux de départ a été enregistré pour votre location.\n\n🚗 ${ctx.vehicule_marque ?? ""} ${ctx.vehicule_modele ?? ""}${ctx.vehicule_immatriculation ? ` (${ctx.vehicule_immatriculation})` : ""}\n📅 Date : ${formatDate(ctx.date_debut)}\n📍 ${ctx.lieu_depart ?? ""}\n\nBonne route et prudence !\n\n— L'équipe GROUP PHOEBE`,
  }),

  etat_lieux_retour: (ctx) => ({
    sujet: "État des lieux de retour enregistré",
    contenu: `Bonjour ${ctx.client_nom ?? "Client"},\n\n✅ L'état des lieux de retour a été enregistré.\n\n🚗 ${ctx.vehicule_marque ?? ""} ${ctx.vehicule_modele ?? ""}${ctx.vehicule_immatriculation ? ` (${ctx.vehicule_immatriculation})` : ""}\n📅 Date de retour : ${formatDate(ctx.date_fin)}\n${ctx.montant_retenu ? `💰 Montant retenu : ${formatCurrency(ctx.montant_retenu)} FCFA` : ""}\n${ctx.montant_rembourse ? `💸 Remboursement : ${formatCurrency(ctx.montant_rembourse)} FCFA sous 48h` : ""}\n\n— L'équipe GROUP PHOEBE`,
  }),

  inspection_terminee: (ctx) => ({
    sujet: "Inspection terminée — location clôturée",
    contenu: `Bonjour ${ctx.client_nom ?? "Client"},\n\nL'inspection du véhicule est terminée.\n\n🚗 ${ctx.vehicule_marque ?? ""} ${ctx.vehicule_modele ?? ""}${ctx.vehicule_immatriculation ? ` (${ctx.vehicule_immatriculation})` : ""}\n${ctx.montant_retenu && ctx.montant_retenu > 0 ? `⚠️ ${formatCurrency(ctx.montant_retenu)} FCFA retenus sur la caution.` : "✅ Aucun dommage constaté. Caution intégralement remboursée sous 48h."}\n\n— L'équipe GROUP PHOEBE`,
  }),

  caution_remboursee: (ctx) => ({
    sujet: "Caution remboursée",
    contenu: `Bonjour ${ctx.client_nom ?? "Client"},\n\n✅ Votre caution de ${ctx.montant_rembourse ? formatCurrency(ctx.montant_rembourse) + " FCFA" : ""} a été remboursée.\n\nRéférence : ${ctx.numero_demande ?? ctx.demande_id ?? ""}\nDélai d'apparition sur votre compte : 1-3 jours ouvrés selon votre banque.\n\n— L'équipe GROUP PHOEBE`,
  }),

  rappel_paiement: (ctx) => ({
    sujet: "Rappel : paiement en attente",
    contenu: `Bonjour ${ctx.client_nom ?? "Client"},\n\n⏰ Votre réservation ${ctx.numero_demande ?? ctx.demande_id ?? ""} attend encore son paiement.\n\n💰 Montant : ${ctx.montant_total ? formatCurrency(ctx.montant_total) + " FCFA" : ""}\n📅 Date prévue : ${formatDate(ctx.date_debut)}\n\nConnectez-vous pour payer et confirmer votre réservation.\n\n— L'équipe GROUP PHOEBE`,
  }),

  vehicule_disponible: (ctx) => ({
    sujet: "Véhicule disponible",
    contenu: `Bonjour ${ctx.client_nom ?? "Client"},\n\nLe véhicule qui vous intéresse est de nouveau disponible !\n\n🚗 ${ctx.vehicule_marque ?? ""} ${ctx.vehicule_modele ?? ""}${ctx.vehicule_categorie ? ` (${ctx.vehicule_categorie})` : ""}\n💰 ${ctx.montant_location ? formatCurrency(ctx.montant_location) + " FCFA/jour" : ""}\n\nRéservez vite avant qu'il ne reparte.\n\n— L'équipe GROUP PHOEBE`,
  }),

  document_requis: (ctx) => ({
    sujet: "Documents requis pour votre réservation",
    contenu: `Bonjour ${ctx.client_nom ?? "Client"},\n\nPour finaliser votre réservation ${ctx.numero_demande ?? ctx.demande_id ?? ""}, nous avons besoin des documents suivants :\n\n- Pièce d'identité (recto/verso)\n- Permis de conduire (si conducteur)\n- Justificatif de domicile\n\nDéposez-les dans votre espace client sous 24h.\n\n— L'équipe GROUP PHOEBE`,
  }),

  verification_validee: (ctx) => ({
    sujet: "Identité vérifiée ✅",
    contenu: `Bonjour ${ctx.client_nom ?? "Client"},\n\n✅ Votre identité a été validée ! Vous pouvez maintenant réserver sans délai.\n\n— L'équipe GROUP PHOEBE`,
  }),

  verification_refusee: (ctx) => ({
    sujet: "Documents à corriger",
    contenu: `Bonjour ${ctx.client_nom ?? "Client"},\n\n❌ Vos documents n'ont pas pu être validés.\n\nRaison : ${ctx.admin_nom ? "Voir détails dans votre espace client" : "Documents illisibles / expirés / non conformes"}\n\nMerci de déposer de nouveaux documents.\n\n— L'équipe GROUP PHOEBE`,
  }),

  nouveau_message: (ctx) => ({
    sujet: "Nouveau message",
    contenu: `Bonjour ${ctx.client_nom ?? "Client"},\n\nVous avez reçu un nouveau message concernant votre réservation ${ctx.numero_demande ?? ctx.demande_id ?? ""}.\n\nConsultez votre espace client pour répondre.\n\n— L'équipe GROUP PHOEBE`,
  }),

  rappel_retour_vehicule: (ctx) => ({
    sujet: "Rappel : retour du véhicule demain",
    contenu: `Bonjour ${ctx.client_nom ?? "Client"},\n\n⏰ Demain ${formatDate(ctx.date_fin)} est le jour du retour de votre véhicule.\n\n🚗 ${ctx.vehicule_marque ?? ""} ${ctx.vehicule_modele ?? ""}${ctx.vehicule_immatriculation ? ` (${ctx.vehicule_immatriculation})` : ""}\n📍 Lieu de retour : ${ctx.lieu_destination ?? ctx.lieu_depart ?? "Point de départ initial"}\n\nMerci de prévoir le plein de carburant et d'être à l'heure.\n\n— L'équipe GROUP PHOEBE`,
  }),
};

export function renderTemplate(event: NotificationEvent, ctx: TemplateContext): { sujet: string; contenu: string } {
  const tpl = templates[event];
  if (!tpl) {
    return {
      sujet: event,
      contenu: JSON.stringify(ctx),
    };
  }
  return tpl(ctx);
}

export function getAvailableEvents(): NotificationEvent[] {
  return Object.keys(templates) as NotificationEvent[];
}