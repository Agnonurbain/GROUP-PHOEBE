import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  TRANSITIONS_DOSSIER,
  transitionDossierAutorisee,
  isTypeDocument,
} from "@/lib/assistance";
import { TRANSITIONS_BILLET, transitionBilletAutorisee } from "@/lib/billets";

const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");
const sql = (f: string) =>
  readFileSync(join(process.cwd(), "..", "..", "supabase", "migrations", f), "utf8");

function corpsDeFonction(source: string, nom: string): string {
  const debut = source.indexOf(`export async function ${nom}`);
  if (debut === -1) throw new Error(`Fonction introuvable : ${nom}`);
  const suivante = source.indexOf("\nexport ", debut + 1);
  return source.slice(debut, suivante === -1 ? undefined : suivante);
}

describe("Assistance — cycle d'un dossier", () => {
  it("le parcours nominal", () => {
    expect(transitionDossierAutorisee("soumis", "en_cours_traitement")).toBe(true);
    expect(transitionDossierAutorisee("en_cours_traitement", "finalise")).toBe(true);
  });

  // Réclamer des pièces n'est pas un cul-de-sac : le client complète et le
  // traitement reprend.
  it("la demande de pièces est un aller-retour", () => {
    expect(transitionDossierAutorisee("en_cours_traitement", "pieces_complementaires_requises")).toBe(true);
    expect(transitionDossierAutorisee("pieces_complementaires_requises", "en_cours_traitement")).toBe(true);
  });

  it("un dossier finalisé ne se rouvre pas", () => {
    expect(TRANSITIONS_DOSSIER.finalise).toHaveLength(0);
    expect(transitionDossierAutorisee("finalise", "soumis")).toBe(false);
  });

  it("la garde est branchée sur l'action", () => {
    const corps = corpsDeFonction(src("app/actions/assistance.ts"), "changerStatutDossier");
    expect(corps).toContain("transitionDossierAutorisee");
    expect(corps).toMatch(/\.eq\("statut", dossier\.statut\)/);
  });
});

describe("Assistance — cycle d'un billet", () => {
  it("le parcours nominal", () => {
    expect(transitionBilletAutorisee("soumise", "en_cours_traitement")).toBe(true);
    expect(transitionBilletAutorisee("devis_envoye", "payee")).toBe(true);
    expect(transitionBilletAutorisee("payee", "emise")).toBe(true);
  });

  // Un billet émis auprès de la compagnie ne se dénoue pas par un retour en
  // arrière dans notre outil.
  it("un billet émis est terminal", () => {
    expect(TRANSITIONS_BILLET.emise).toHaveLength(0);
  });

  // Un devis expiré se refait plutôt que de laisser le client sur une offre qui
  // n'a plus cours.
  it("un devis peut repartir en recherche", () => {
    expect(transitionBilletAutorisee("devis_envoye", "en_cours_traitement")).toBe(true);
  });

  it("on ne saute pas le devis", () => {
    expect(transitionBilletAutorisee("soumise", "payee")).toBe(false);
    expect(transitionBilletAutorisee("en_cours_traitement", "emise")).toBe(false);
  });

  it("la garde est branchée sur l'action", () => {
    const corps = corpsDeFonction(src("app/actions/billets.ts"), "changerStatutBillet");
    expect(corps).toContain("transitionBilletAutorisee");
  });
});

// `montant_estime` était écrit à la création depuis le tarif, et aucun paiement
// de module `voyage` n'était créé nulle part : le service était rendu et jamais
// encaissé. Ailleurs les défauts empêchaient de vendre ; ici on vendait
// gratuitement.
describe("Assistance — un dossier est enfin facturé", () => {
  const source = src("app/actions/assistance.ts");

  it("le paiement naît avec le dossier", () => {
    const corps = corpsDeFonction(source, "creerDossierVoyage");
    expect(corps).toContain('module: "voyage"');
    expect(corps).toContain('reference_table: "dossiers_voyage"');
    expect(corps).toContain('statut: "en_attente"');
  });

  // Une prestation « sur devis » ne doit pas produire une ligne à zéro qui
  // traînerait en attente.
  it("aucune ligne n'est créée sans prix", () => {
    expect(corpsDeFonction(source, "creerDossierVoyage")).toMatch(/prixPrestation > 0/);
  });

  /**
   * Le règlement en ligne d'un dossier est retiré (04/08/2026). Ce qui le
   * protégeait — montant lu en base, dossier appartenant au client, paiement
   * réglé une seule fois — est repris par `encaisserAuBureau`, à ceci près que
   * l'acteur est désormais l'équipe et non le client.
   */
  it("plus aucun règlement en ligne d'un dossier", () => {
    // On vise la DÉCLARATION et les IMPORTS, pas la prose : le commentaire qui
    // explique le retrait nomme forcément ce qui a été retiré.
    expect(source).not.toContain("export async function payerDossierVoyage");
    expect(source).not.toMatch(/^import .*creerSession(Stripe|CinetPay)/m);
  });
});

/**
 * L'encaissement au comptoir.
 *
 * « On laisse la possibilité aux gens de venir payer au bureau ou en ligne.
 * C'est pas une obligation de payer en ligne. » Sans cette action, l'argent
 * rentrerait au comptoir et le système afficherait « en attente »
 * indéfiniment — la moitié d'une fonctionnalité.
 */
describe("Assistance — encaisser au bureau", () => {
  const source = src("app/actions/billets.ts");
  const corps = corpsDeFonction(source, "encaisserAuBureau");

  it("est réservé à l'équipe", () => {
    expect(corps).toContain("requireStaff()");
  });

  // Écrire un second chemin de confirmation aurait fini par diverger de celui
  // du webhook : même fonction, donc même statut attendu, même facture.
  it("délègue au même chemin qu'un paiement en ligne", () => {
    expect(corps).toContain("confirmerCommande");
    expect(corps).not.toContain('statut: "capture"');
  });

  it("ne solde qu'un paiement réellement en attente", () => {
    expect(corps).toMatch(/\.eq\("statut", "en_attente"\)/);
  });

  it("n'accepte que les références qu'il sait traiter", () => {
    expect(corps).toContain('"demandes_billet"');
    expect(corps).toContain('"dossiers_voyage"');
  });

  // Une action sans écran serait le défaut habituel : écrite, jamais appelée.
  it("est branché sur les deux écrans d'administration", () => {
    for (const page of ["app/(admin)/admin/billets/page.tsx", "app/(admin)/admin/dossiers-voyage/page.tsx"]) {
      expect(src(page), page).toContain("EncaisserAuBureau");
    }
    expect(src("app/(admin)/admin/billets/encaisser-bureau.tsx")).toContain("encaisserAuBureau");
  });

  // Sans troisième bouton, un client sans carte ni Mobile Money resterait
  // bloqué sur son devis.
  it("le client peut choisir le bureau", () => {
    expect(src("components/public/payer-billet.tsx")).toContain('value="agence"');
    expect(src("app/actions/billets.ts")).toMatch(/\["cinetpay", "stripe", "agence"\]/);
  });
});

// La table existait depuis la migration initiale, avec ses policies posées en
// 00038, et zéro ligne de code — alors que `pieces_complementaires_requises`
// réclamait des documents qu'aucun canal ne permettait d'envoyer.
describe("Assistance — les pièces justificatives existent", () => {
  const source = src("app/actions/assistance.ts");

  it("le client ne dépose que sur son dossier", () => {
    const corps = corpsDeFonction(source, "deposerPieceDossier");
    expect(corps).toMatch(/dossier\.client_id !== user\.sub/);
    expect(corps).toContain("isTypeDocument");
  });

  // Passeports, diplômes, actes de naissance : le contenu le plus sensible.
  it("les pièces vont dans un bucket privé, chemin stocké", () => {
    const corps = corpsDeFonction(source, "deposerPieceDossier");
    expect(corps).toContain('"dossiers-documents"');
    expect(corps).not.toContain("getPublicUrl");
    expect(sql("00073_assistance_pieces_et_facturation.sql")).toMatch(
      /'dossiers-documents'.*false/
    );
  });

  // Redéposer une pièce rejetée doit la remplacer : deux lignes pour un seul
  // document donneraient deux vérifications à faire.
  it("redéposer remplace au lieu d'ajouter", () => {
    const corps = corpsDeFonction(source, "deposerPieceDossier");
    expect(corps).toMatch(/onConflict: "dossier_id,type_document"/);
    expect(sql("00073_assistance_pieces_et_facturation.sql")).toContain(
      "documents_dossier_type_unique"
    );
  });

  // Sans motif, le client devine ce qu'il doit corriger et redépose la même.
  it("un rejet exige un motif", () => {
    const corps = corpsDeFonction(source, "verifierPieceDossier");
    expect(corps).toMatch(/decision === "rejete" && !commentaire/);
    expect(corps).toContain("le client doit savoir quoi corriger");
  });

  it("une pièce déjà tranchée n'est pas rejouée", () => {
    expect(corpsDeFonction(source, "verifierPieceDossier")).toMatch(/\.eq\("statut", "soumis"\)/);
  });

  it("le lien est signé, jamais public", () => {
    const corps = corpsDeFonction(source, "lienPieceDossier");
    expect(corps).toContain("createSignedUrl");
    expect(corps).not.toContain("getPublicUrl");
  });

  it("les types de pièce sont bornés", () => {
    expect(isTypeDocument("passeport")).toBe(true);
    expect(isTypeDocument("nimporte_quoi")).toBe(false);
  });
});

// Les deux drapeaux étaient affichés en admin avec un ✓ ou un ✗ et n'étaient
// écrits par personne : ils restaient NULL indéfiniment. Et pour cause, il n'y
// avait aucun document à contrôler — seulement une case cochée par le client.
describe("Assistance — les vérifications de billet sont enfin écrivables", () => {
  const source = src("app/actions/billets.ts");

  it("le staff peut trancher les deux pièces", () => {
    const corps = corpsDeFonction(source, "verifierPieceBillet");
    expect(corps).toContain("certificat_fievre_jaune_valide");
    expect(corps).toContain("mineur_autorisation_verifie");
    expect(corps).toContain("requireStaff()");
  });

  it("une pièce inconnue est refusée", () => {
    expect(corpsDeFonction(source, "verifierPieceBillet")).toContain("Pièce inconnue.");
  });

  it("les colonnes de dépôt existent", () => {
    const migration = sql("00073_assistance_pieces_et_facturation.sql");
    expect(migration).toContain("certificat_fievre_jaune_url");
    expect(migration).toContain("mineur_autorisation_url");
  });
});

describe("Assistance — ce que le client voit enfin", () => {
  const page = src("app/(public)/compte/reservations/page.tsx");

  it("le montant de sa prestation", () => {
    expect(page).toContain("montant_estime");
    expect(page).not.toMatch(/category: "Assistance",[\s\S]{0,400}price: "—"/);
  });

  it("son conseiller et ses pièces", () => {
    expect(page).toContain("conseiller_id");
    expect(page).toContain("DossierPieces");
  });

  /**
   * « Il n'y a pas de paiement à faire en ligne, je ne veux pas qu'on fasse des
   * paiements en ligne. » Le bouton est retiré, mais le montant reste annoncé :
   * le taire laisserait le client attendre un règlement qui ne vient jamais.
   */
  it("le dossier ne se règle plus en ligne, et le dit", () => {
    expect(page).not.toContain("PayerDossier");
    expect(page).toContain("à régler au bureau");
    expect(page).toContain("Montant estimé");
  });
});

/**
 * Écrire à l'équipe au sujet d'un dossier.
 *
 * « Au cas où ils veulent avoir plus de renseignements, il faut qu'il y ait
 * l'option écrire à l'équipe. » Le formulaire de contact général existait, mais
 * il ne sait pas de quel dossier on parle : l'équipe recevait « j'ai une
 * question sur mon visa » sans rien pour le raccrocher.
 */
describe("Assistance — écrire à l'équipe", () => {
  const source = src("app/actions/assistance.ts");
  const corps = corpsDeFonction(source, "envoyerMessageDossier");

  /**
   * Le rôle est déterminé côté serveur, jamais reçu du formulaire : un client
   * qui posterait `auteur_role=equipe` verrait sinon son message affiché comme
   * une réponse officielle de GROUP PHOEBE.
   */
  it("le rôle de l'auteur ne vient pas du formulaire", () => {
    expect(corps).toContain('estEquipe ? "equipe" : "client"');
    expect(corps).not.toMatch(/formData\.get\("auteur_role/);
  });

  it("un client n'écrit que sur son dossier", () => {
    expect(corps).toContain("dossier.client_id !== user.sub");
  });

  it("un message vide ou démesuré est refusé", () => {
    expect(corps).toContain("Écrivez votre message.");
    expect(corps).toContain("message.length > 4000");
  });

  // Un message que personne ne voit passer ne vaut pas mieux que pas de
  // message.
  it("l'autre partie est prévenue, dans les deux sens", () => {
    expect(corps).toContain("notifierAdminMessageDossier");
    expect(corps).toContain("notifierClient");
  });

  /**
   * La lecture passe par le client de SESSION, dont la policy borne chacun à
   * ses propres dossiers. En clé de service, le fil de n'importe quel dossier
   * serait exposé à qui devine un identifiant.
   */
  it("le fil se lit sous la policy, pas en clé de service", () => {
    const lecture = corpsDeFonction(source, "messagesDuDossier");
    expect(lecture).toContain("await createClient()");
    expect(lecture).toMatch(/supabase\s*\n?\s*\.from\("messages_dossier"\)/);
  });

  it("le fil est branché des deux côtés", () => {
    expect(src("app/(public)/compte/reservations/page.tsx")).toContain("MessageEquipe");
    expect(src("app/(admin)/admin/dossiers-voyage/page.tsx")).toContain("MessageEquipe");
  });

  // Un message envoyé est une trace, pas un brouillon : aucune policy UPDATE
  // ni DELETE ne l'autorise à être réécrit.
  it("un message ne se réécrit pas", () => {
    const migration = readFileSync(
      join(process.cwd(), "..", "..", "supabase", "migrations", "00082_messages_dossier.sql"),
      "utf8"
    );
    expect(migration).toContain("messages_dossier_insert");
    expect(migration).not.toMatch(/create policy[\s\S]{0,120}messages_dossier for (update|delete)/i);
  });
});
