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

  // Le laisser arriver du formulaire permettrait de payer ce qu'on veut.
  it("le montant réglé vient de la base, jamais du formulaire", () => {
    const corps = corpsDeFonction(source, "payerDossierVoyage");
    expect(corps).toMatch(/montant = Number\(paiement\.montant\)/);
    expect(corps).not.toMatch(/formData\.get\("montant/);
  });

  it("on ne règle que son propre dossier, et une seule fois", () => {
    const corps = corpsDeFonction(source, "payerDossierVoyage");
    expect(corps).toMatch(/dossier\.client_id !== user\.sub/);
    expect(corps).toMatch(/paiement\.statut !== "en_attente"/);
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

  it("son conseiller, ses pièces et son règlement", () => {
    expect(page).toContain("conseiller_id");
    expect(page).toContain("DossierPieces");
    expect(page).toContain("PayerDossier");
  });
});
