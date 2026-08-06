import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fr } from "@/lib/i18n/fr";
import { en } from "@/lib/i18n/en";
import {
  validerDemandeTextile,
  transitionTextileAutorisee,
  TRANSITIONS_TEXTILE,
  STATUTS_TEXTILE,
  STATUT_TEXTILE_LABELS,
  libelleTypePagne,
  isUnitePagne,
  UNITES_PAGNE,
  filtrerArticles,
  type TypePagne,
} from "@/lib/textile";

/**
 * Service textile : vente de pagnes.
 *
 * Son trait central n'est pas un calcul, c'est une ABSENCE : aucun prix n'est
 * affiché, et ce n'est pas un tarif qu'on finira par renseigner.
 *
 * « Il y a tellement de fournisseurs qui les vendent à leur prix […] on ne peut
 * pas afficher un prix comme ça. Tu mets plutôt des devis. »
 */

const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");
const TYPES = ["uniwax_print", "uniwax_block", "uniwax_tabs", "hollandais"];

const base = {
  typePagne: "uniwax_print",
  motif: "",
  couleurs: "",
  quantite: 2,
  unite: "pagne",
};

describe("Demande de pagne — validation", () => {
  it("accepte une demande minimale", () => {
    expect(validerDemandeTextile(base, TYPES)).toEqual({ ok: true });
  });

  // Le motif est facultatif : un client peut vouloir « ce qui est disponible ».
  it("le motif et les couleurs ne sont pas obligatoires", () => {
    expect(validerDemandeTextile({ ...base, motif: "", couleurs: "" }, TYPES)).toEqual({ ok: true });
  });

  /**
   * Un type retiré du catalogue ne doit plus être demandable, même par un
   * formulaire resté ouvert dans un onglet.
   */
  it("refuse un type qui n'est plus proposé", () => {
    const r = validerDemandeTextile({ ...base, typePagne: "uniwax_tabs" }, ["uniwax_print"]);
    expect("error" in r && r.error).toContain("plus proposé");
  });

  it("refuse un type vide", () => {
    expect("error" in validerDemandeTextile({ ...base, typePagne: "  " }, TYPES)).toBe(true);
  });

  it("refuse une unité inventée", () => {
    expect("error" in validerDemandeTextile({ ...base, unite: "tonneau" }, TYPES)).toBe(true);
  });

  it.each([0, -3, 1.5])("refuse une quantité de %s", (q) => {
    expect("error" in validerDemandeTextile({ ...base, quantite: q }, TYPES)).toBe(true);
  });

  /**
   * Ce test disait l'inverse jusqu'au 05/08/2026 : « renvoie une commande de
   * gros vers l'équipe », et vérifiait que le message contenait « gros ». Le
   * gros est devenu un métier de la maison — il ne se repousse plus. Ce qui
   * reste est une garde contre la faute de frappe, et le message invite à
   * appeler plutôt qu'il n'éconduit.
   */
  it("un volume aberrant invite à appeler, sans fermer la porte", () => {
    const r = validerDemandeTextile({ ...base, quantite: 20000 }, TYPES);
    expect("error" in r && r.error).toContain("Vérifiez la quantité");
    expect("error" in r && r.error).not.toContain("commande de gros");
  });

  it("borne la longueur du motif et des couleurs", () => {
    expect("error" in validerDemandeTextile({ ...base, motif: "x".repeat(501) }, TYPES)).toBe(true);
    expect("error" in validerDemandeTextile({ ...base, couleurs: "x".repeat(201) }, TYPES)).toBe(true);
  });

  it("les unités connues sont reconnues, les autres non", () => {
    expect(isUnitePagne("pagne")).toBe(true);
    expect(isUnitePagne("yard")).toBe(true);
    expect(isUnitePagne("metre")).toBe(false);
  });
});

describe("Cycle d'une demande", () => {
  it("chaque statut a un libellé", () => {
    for (const s of STATUTS_TEXTILE) {
      expect(STATUT_TEXTILE_LABELS[s], s).toBeTruthy();
    }
  });

  it("le parcours nominal va jusqu'à la livraison", () => {
    expect(transitionTextileAutorisee("soumise", "en_cours_traitement")).toBe(true);
    expect(transitionTextileAutorisee("en_cours_traitement", "devis_envoye")).toBe(true);
    expect(transitionTextileAutorisee("devis_envoye", "confirmee")).toBe(true);
    expect(transitionTextileAutorisee("confirmee", "livree")).toBe(true);
  });

  // Le client négocie, l'équipe reconsulte : c'est un aller-retour normal.
  it("un devis peut repartir en traitement", () => {
    expect(transitionTextileAutorisee("devis_envoye", "en_cours_traitement")).toBe(true);
  });

  /**
   * Sans cette borne, une demande livrée pourrait repasser en devis et le
   * montant serait réécrit après coup, sur une vente déjà faite.
   */
  it("une demande livrée ou annulée est terminée", () => {
    expect(TRANSITIONS_TEXTILE.livree).toEqual([]);
    expect(TRANSITIONS_TEXTILE.annulee).toEqual([]);
  });

  it("on ne saute pas le devis pour confirmer", () => {
    expect(transitionTextileAutorisee("soumise", "confirmee")).toBe(false);
    expect(transitionTextileAutorisee("en_cours_traitement", "livree")).toBe(false);
  });

  it("un statut inconnu n'ouvre rien", () => {
    expect(transitionTextileAutorisee("soumise", "expediee")).toBe(false);
    expect(transitionTextileAutorisee("inconnue", "livree")).toBe(false);
  });
});

describe("Libellé d'un type de pagne", () => {
  const t = (marque: string, gamme: string): TypePagne => ({
    cle: "x", marque, gamme, description: null, ordre: 1,
  });

  it("associe la marque et la gamme", () => {
    expect(libelleTypePagne(t("Uniwax", "Print"))).toBe("Uniwax — Print");
  });

  // « Hollandais — Hollandais » se lirait comme un bégaiement.
  it("ne répète pas une marque qui est sa propre gamme", () => {
    expect(libelleTypePagne(t("Hollandais", "Hollandais"))).toBe("Hollandais");
  });
});

/**
 * L'absence de prix est le cœur du service, pas un manque. Elle doit se voir
 * dans le schéma, sinon quelqu'un ajoutera une colonne « prix » et le site
 * annoncera un montant que l'équipe ne pourra pas tenir.
 */
describe("Textile — aucun prix au catalogue", () => {
  const migration = readFileSync(
    join(process.cwd(), "..", "..", "supabase", "migrations", "00087_service_textile.sql"),
    "utf8"
  );

  it("la table des types ne porte aucune colonne de prix", () => {
    const debut = migration.indexOf("create table if not exists public.types_pagne");
    const corps = migration.slice(debut, migration.indexOf(");", debut));
    expect(corps).not.toMatch(/\bprix\b/i);
    expect(corps).not.toMatch(/\bmontant\b/i);
  });

  it("le module métier n'expose aucun calcul de prix", () => {
    const lib = src("lib/textile.ts");
    expect(lib).not.toMatch(/export function .*[Pp]rix/);
  });

  it("le montant naît sur la demande, pas au catalogue", () => {
    expect(migration).toContain("montant_propose");
    expect(migration).toContain("devis_valable_jusqu_a");
  });

  // Le client cherchera une grille : lui dire pourquoi il n'y en a pas vaut
  // mieux que de le laisser croire à un oubli.
  /**
   * L'explication est passée au dictionnaire lors de la traduction. Le test la
   * suit là où elle vit : la chercher dans le JSX interdirait de traduire la
   * page qu'il protège, ce qui reviendrait à faire garder une porte par un mur.
   */
  it("l'écran explique l'absence de prix", () => {
    const form = src("app/(public)/textile/demande-form.tsx");
    expect(form).toContain("t.textile.pourquoiPasDePrix");
    expect(fr.textile.pourquoiPasDePrix).toContain("prix");
    expect(fr.textile.pourquoiPasDePrixTexte).toContain("prix de référence");
    // Et l'anglais dit la même chose, sans quoi seule la moitié des visiteurs
    // comprendrait pourquoi aucun montant n'est affiché.
    expect(en.textile.pourquoiPasDePrixTexte).toContain("reference price");
  });
});

/**
 * Chiffrer, c'est écrire un montant facturé : la règle du dépôt s'applique ici
 * comme partout. La policy `staff_manage` laisse un opérateur écrire n'importe
 * quelle colonne via l'API REST — le trigger est le seul rempart sur ce chemin.
 */
describe("Textile — le montant appartient au propriétaire", () => {
  const migration = readFileSync(
    join(process.cwd(), "..", "..", "supabase", "migrations", "00087_service_textile.sql"),
    "utf8"
  );

  it("l'action de chiffrage exige le propriétaire", () => {
    const action = src("app/actions/textile.ts");
    const d = action.indexOf("export async function proposerDevisTextile");
    expect(d).toBeGreaterThan(-1);
    expect(action.slice(d, action.indexOf("\nexport ", d + 1))).toContain("requireProprietaireAvecId()");
  });

  it("le trigger garde la colonne en base", () => {
    expect(migration).toContain("create trigger garde_montant_textile");
    expect(migration).toContain("public.is_proprietaire()");
  });

  /**
   * `security invoker` est délibéré : en `security definer`, `current_user`
   * vaudrait le propriétaire de la fonction et la garde bloquerait TOUS les
   * chemins, server actions incluses.
   */
  it("la garde reste en security invoker et ne cible que PostgREST", () => {
    const debut = migration.indexOf("function public.garde_montant_textile()");
    const corps = migration.slice(debut, migration.indexOf("$$;", debut));
    expect(corps).toContain("current_user not in ('anon', 'authenticated')");
    expect(corps).not.toContain("security definer");
  });

  // Le sélecteur générique ne doit pas poser « devis_envoye » : le client
  // verrait un devis sans prix.
  it("le statut « devis envoyé » n'est pas atteignable sans montant", () => {
    const action = src("app/actions/textile.ts");
    const d = action.indexOf("export async function changerStatutTextile");
    expect(action.slice(d, action.indexOf("\nexport ", d + 1))).toContain('statut === "devis_envoye"');
  });
});

describe("Textile — le service est branché", () => {
  it("la verticale connaît le chemin", () => {
    expect(src("lib/verticales.ts")).toContain('textile: ["/textile"]');
  });

  it("l'en-tête a son logo", () => {
    expect(src("components/public/smart-header.tsx")).toContain("/logos/textile.png");
  });

  it("l'accueil propose le service", () => {
    expect(src("app/(public)/page-client.tsx")).toContain('cle: "textile"');
  });

  it("l'équipe a son écran, atteignable depuis la navigation", () => {
    expect(src("app/(admin)/admin/textile/page.tsx")).toContain("TextileActions");
    expect(src("app/(admin)/admin/_lib/nav.ts")).toContain("/admin/textile");
  });
});

/**
 * Le catalogue.
 *
 * « Ajoute un catalogue mais garde le fait que le client décrit ce qu'il
 * cherche. » Les deux chemins coexistent : désigner un modèle, ou le décrire.
 * Fermer l'un des deux reviendrait à ne plus vendre que ce qui est déjà
 * photographié.
 */
describe("Catalogue de pagnes", () => {
  const migration = readFileSync(
    join(process.cwd(), "..", "..", "supabase", "migrations", "00088_catalogue_pagnes.sql"),
    "utf8"
  );

  it("un article n'a pas de prix, comme le type qui le porte", () => {
    const debut = migration.indexOf("create table if not exists public.articles_pagne");
    const corps = migration.slice(debut, migration.indexOf(");", debut));
    expect(corps).not.toMatch(/\bprix\b/i);
    expect(corps).not.toMatch(/\bmontant\b/i);
  });

  /**
   * Le lien est NULLABLE, et c'est le point : sans cela, on ne vendrait plus
   * que ce qui est déjà au catalogue.
   */
  it("désigner un article reste facultatif", () => {
    expect(migration).toMatch(/add column if not exists article_id uuid references public\.articles_pagne\(id\) on delete set null/);
    expect(migration).not.toMatch(/article_id uuid not null/);
  });

  // Retirer un modèle ne doit pas effacer les demandes qui le visaient.
  it("retirer un article n'efface pas les demandes qui le visaient", () => {
    expect(migration).toContain("on delete set null");
  });

  // Un article épuisé sort de la vitrine sans être effacé : des demandes
  // passées le désignent.
  it("un article se retire, il ne se supprime pas", () => {
    const action = src("app/actions/textile.ts");
    const d = action.indexOf("export async function basculerArticlePagne");
    const corps = action.slice(d, action.indexOf("\nexport ", d + 1));
    expect(corps).toContain("update({ disponible");
    expect(corps).not.toContain(".delete()");
  });

  /**
   * Le bucket est PUBLIC, contrairement à `dossiers-documents` : ce sont des
   * photos de vitrine, pas des pièces d'identité. Les signer reviendrait à
   * protéger ce qu'on cherche à montrer.
   */
  it("les photos sont publiques, le dépôt réservé au propriétaire", () => {
    expect(migration).toMatch(/values \('catalogue-pagnes', 'catalogue-pagnes', true\)/);
    expect(migration).toContain("catalogue_pagnes_manage_proprietaire");
    const d = migration.indexOf("catalogue_pagnes_manage_proprietaire");
    expect(migration.slice(d, d + 400)).toContain("public.is_proprietaire()");
  });

  /**
   * L'identifiant reçu du formulaire n'est pas cru sur parole : il pourrait
   * désigner un article retiré, ou d'une autre gamme que celle demandée.
   */
  it("l'article reçu est vérifié en base avant d'être lié", () => {
    const action = src("app/actions/textile.ts");
    const d = action.indexOf("export async function creerDemandeTextile");
    const corps = action.slice(d, action.indexOf("\nexport ", d + 1));
    expect(corps).toContain('.eq("disponible", true)');
    expect(corps).toContain("article.type_pagne === saisie.typePagne");
  });

  // Les chemins viennent du navigateur : un chemin forgé désignerait un
  // fichier d'un autre bucket.
  it("les chemins de photos sont bornés au dossier du catalogue", () => {
    const action = src("app/actions/textile.ts");
    const d = action.indexOf("export async function creerArticlePagne");
    const corps = action.slice(d, action.indexOf("\nexport ", d + 1));
    expect(corps).toContain('startsWith("articles/")');
    expect(corps).toContain('includes("..")');
  });

  it("la description libre survit au catalogue", () => {
    const form = src("app/(public)/textile/demande-form.tsx");
    expect(form).toContain("t.textile.rienAuCatalogue");
    expect(fr.textile.rienAuCatalogue).toContain("catalogue");
    // Le champ motif reste présent dans les deux cas.
    expect(form).toContain('name="motif"');
  });

  it("catalogue et formulaire partagent un seul état", () => {
    const parent = src("app/(public)/textile/textile-client.tsx");
    expect(parent).toContain("CatalogueClient");
    expect(parent).toContain("DemandeTextileForm");
    // Deux états séparés auraient fini par diverger.
    expect(parent).toContain("useState<ArticlePagne | null>");
  });

  it("l'atelier du propriétaire est branché", () => {
    expect(src("app/(admin)/admin/textile/page.tsx")).toContain("CatalogueForm");
    expect(src("app/(admin)/admin/textile/catalogue-form.tsx")).toContain("creerArticlePagne");
  });
});

/**
 * La recherche se fait dans le navigateur : à cette échelle, un aller-retour
 * serveur à chaque lettre coûterait plus qu'il ne rapporte.
 */
describe("Recherche dans le catalogue", () => {
  const article = (over: Partial<import("@/lib/textile").ArticlePagne> = {}) => ({
    id: "1", typePagne: "uniwax_print", reference: "UW23458",
    nom: "Fleur de mariage", description: null, couleurs: "bleu et or",
    photos: [], vedette: false, ...over,
  });

  it("sans recherche, tout passe", () => {
    const a = [article(), article({ id: "2", nom: "Autre" })];
    expect(filtrerArticles(a, "")).toHaveLength(2);
  });

  // Le client tape ce qui lui vient et n'a pas à savoir dans quel champ ça se
  // trouve.
  it.each([
    ["fleur", "le nom"],
    ["UW23458", "la référence"],
    ["bleu", "les couleurs"],
  ])("« %s » trouve par %s", (q) => {
    expect(filtrerArticles([article()], q)).toHaveLength(1);
  });

  it("la casse et les espaces ne comptent pas", () => {
    expect(filtrerArticles([article()], "  FLEUR  ")).toHaveLength(1);
  });

  it("le filtre de gamme se combine à la recherche", () => {
    const a = [article(), article({ id: "2", typePagne: "hollandais" })];
    expect(filtrerArticles(a, "", "hollandais")).toHaveLength(1);
    expect(filtrerArticles(a, "fleur", "hollandais")).toHaveLength(1);
    expect(filtrerArticles(a, "introuvable", "hollandais")).toHaveLength(0);
  });
});

/**
 * Ce qui est écrit doit être lu quelque part.
 *
 * `article_id` était renseigné à la demande et n'apparaissait nulle part : ni
 * sur la carte de l'équipe, qui devait deviner quel modèle commander, ni chez
 * le client. Une écriture sans lecture est une donnée morte — et ici, elle
 * portait la commande elle-même.
 */
describe("Textile — le modèle choisi ne se perd pas", () => {
  it("l'équipe voit le modèle désigné sur la demande", () => {
    const page = src("app/(admin)/admin/textile/page.tsx");
    expect(page).toContain("articles_pagne(nom, reference, couleurs, photos)");
    expect(page).toContain("Modèle du catalogue");
  });

  it("le client retrouve sa demande dans son espace", () => {
    const page = src("app/(public)/compte/reservations/page.tsx");
    expect(page).toContain('.from("demandes_textile")');
    expect(page).toContain('referenceTable: "demandes_textile"');
    // Le nom du modèle prime sur la gamme : c'est ainsi qu'il reconnaît sa
    // demande.
    expect(page).toContain("d.articles_pagne?.nom");
  });

  /**
   * « Sur devis » plutôt qu'un tiret : l'absence de prix est le principe du
   * service, pas une donnée manquante.
   */
  it("une demande sans devis se lit « Sur devis », pas « — »", () => {
    const page = src("app/(public)/compte/reservations/page.tsx");
    const d = page.indexOf("const textileReservations");
    const corps = page.slice(d, page.indexOf("const allReservations", d));
    expect(corps).toContain('"Sur devis"');
  });
});

/**
 * 00087 annonçait les gammes « pilotables ». Elles l'étaient en base, et
 * nulle part ailleurs : les ajouter demandait du SQL. Une pilotabilité sans
 * écran n'existe pas pour celui qui exploite.
 */
describe("Textile — les gammes se pilotent depuis l'admin", () => {
  const action = src("app/actions/textile.ts");

  it("l'écran propriétaire porte la création et le retrait", () => {
    const form = src("app/(admin)/admin/textile/gammes-form.tsx");
    expect(form).toContain("creerTypePagne");
    expect(form).toContain("basculerTypePagne");
    expect(src("app/(admin)/admin/textile/page.tsx")).toContain("<GammesForm");
  });

  // Propriétaire seul : une gamme engage ce que la maison déclare vendre.
  it.each(["creerTypePagne", "basculerTypePagne"])("%s exige le propriétaire", (nom) => {
    const d = action.indexOf(`export async function ${nom}`);
    const corps = action.slice(d, action.indexOf("\nexport ", d + 1));
    expect(corps).toContain("requireProprietaireAvecId");
  });

  // La clé doit respecter `^[a-z0-9_]+$` : la faire saisir transformerait une
  // contrainte technique en message d'erreur pour l'exploitant.
  it("la clé se dérive du libellé au lieu de se saisir", () => {
    const d = action.indexOf("export async function creerTypePagne");
    const corps = action.slice(d, action.indexOf("\nexport ", d + 1));
    expect(corps).toContain("normalize(\"NFD\")");
    expect(corps).toContain("/[^a-z0-9]+/g");
    expect(corps).not.toContain('formData.get("cle")');
  });

  /**
   * Retirer la dernière gamme active fermerait le formulaire public : plus
   * rien à choisir, donc plus de demande possible.
   */
  it("la dernière gamme active ne se retire pas", () => {
    const d = action.indexOf("export async function basculerTypePagne");
    const corps = action.slice(d, action.indexOf("\nexport ", d + 1));
    expect(corps).toContain('.eq("actif", true)');
    expect(corps).toContain('err("cEstLaDerniereGammeActive")');
  });

  // Une gamme retirée reste référencée par les demandes passées.
  it("une gamme se retire, elle ne se supprime pas", () => {
    const d = action.indexOf("export async function basculerTypePagne");
    const corps = action.slice(d, action.indexOf("\nexport ", d + 1));
    expect(corps).toContain("update({ actif");
    expect(corps).not.toContain(".delete()");
  });
});

/**
 * Woodin, et la vente en gros.
 *
 * « Maintenant, on va vendre en gros et puis vendre en balles. […] Nous, on est
 * grossiste. Ceux qui veulent revendre les pagnes, on peut les fournir à un bon
 * coût. » (retour du 05/08/2026)
 *
 * Le gros devient un métier de la maison : ce qui change, ce n'est pas une
 * option de plus, c'est que le formulaire ne doit plus renvoyer les gros
 * volumes vers le téléphone.
 */
describe("Textile — Woodin et la vente en gros", () => {
  const migration = readFileSync(
    join(process.cwd(), "..", "..", "supabase", "migrations", "00090_textile_woodin_gros.sql"),
    "utf8"
  );

  it("Woodin rejoint les marques", () => {
    expect(migration).toContain("'woodin', 'Woodin'");
    // Une seule gamme : l'exploitant n'en a pas détaillé, et en inventer
    // reviendrait à annoncer un catalogue qu'on n'a pas.
    expect(migration).toContain("Wax Woodin");
  });

  it("la balle est une unité à part entière", () => {
    expect(UNITES_PAGNE).toContain("balle");
    expect(migration).toContain("'pagne', 'yard', 'piece', 'balle'");
  });

  /**
   * Le plafond disait « au-delà de 10 000, c'est une commande de gros » et
   * renvoyait vers le téléphone. Le gros étant désormais ce qu'on cherche à
   * vendre, la porte reste ouverte : il ne reste qu'une garde contre la faute
   * de frappe, réglée sur l'unité.
   */
  it("le formulaire ne repousse plus les gros volumes", () => {
    // Le message RENVOYÉ, pas le commentaire qui raconte l'ancien : viser la
    // simple chaîne ferait correspondre l'explication elle-même.
    const r = validerDemandeTextile(
      { typePagne: "woodin", motif: "", couleurs: "", unite: "pagne", quantite: 20000 },
      ["woodin"]
    );
    expect("error" in r && r.error).not.toContain("commande de gros");

    // 500 balles passent la validation ; 501 relèvent de la faute de frappe.
    const base = {
      typePagne: "woodin", motif: "", couleurs: "", unite: "balle" as const,
    };
    const types = ["woodin"];
    expect(validerDemandeTextile({ ...base, quantite: 500 }, types)).toEqual({ ok: true });
    expect(validerDemandeTextile({ ...base, quantite: 501 }, types)).toHaveProperty("error");

    // Et le plafond suit l'unité : 501 pagnes restent parfaitement normaux.
    expect(
      validerDemandeTextile({ ...base, unite: "pagne", quantite: 501 }, types)
    ).toEqual({ ok: true });
  });

  /**
   * Une intention écrite doit être lue quelque part — c'est la leçon de
   * `article_id` (00089), qui était renseigné et n'apparaissait nulle part.
   */
  it("l'intention de revente est enregistrée ET montrée à l'équipe", () => {
    expect(migration).toContain("add column if not exists pour_revente");
    expect(src("app/actions/textile.ts")).toContain("pour_revente: saisie.pourRevente");
    expect(src("app/(public)/textile/demande-form.tsx")).toContain('name="pour_revente"');

    const admin = src("app/(admin)/admin/textile/page.tsx");
    expect(admin).toContain("d.pour_revente");
    expect(admin).toContain("tarif de gros");
  });

  /**
   * Le retour annonce une marge — « 40 % ou 50 % » selon une transcription,
   * « 80 % […] 50 % » selon l'autre. Trois chiffres pour une phrase, et
   * annoncer une marge revient à annoncer un prix : le service n'en affiche
   * aucun (00087).
   */
  it("aucun taux de marge n'entre dans le code", () => {
    for (const fichier of ["lib/textile.ts", "app/actions/textile.ts",
                           "app/(public)/textile/demande-form.tsx"]) {
      expect(src(fichier), fichier).not.toMatch(/\b(40|50|80)\s*%/);
    }
    // Dans les VALEURS insérées, pas dans les commentaires : celui de la
    // migration explique justement pourquoi aucun taux n'y figure.
    const sansCommentaires = migration.replace(/^--.*$/gm, "");
    expect(sansCommentaires).not.toMatch(/\b(40|50|80)\s*%/);
  });
});

/**
 * Un filtre vide n'est pas une recherche infructueuse.
 *
 * Les cinq Woodin ont été retirés du catalogue (photos d'un autre revendeur) :
 * filtrer sur cette gamme affichait alors « Rien ne correspond à «  » » — une
 * phrase à trou vide, qui donne l'air cassé alors que tout fonctionne.
 */
describe("Catalogue — filtre sans résultat", () => {
  const client = src("app/(public)/textile/catalogue-client.tsx");

  it("distingue la recherche infructueuse de la gamme sans modèle", () => {
    expect(client).toContain("t.textile.gammeSansModele");
    // La phrase à trou n'est utilisée QUE lorsqu'il y a quelque chose à citer.
    expect(client).toMatch(/recherche\s*\?\s*remplir\(t\.textile\.rienNeCorrespond/);
  });

  it("les deux messages existent dans les deux langues", () => {
    for (const d of [fr, en]) {
      expect(d.textile.gammeSansModele.length).toBeGreaterThan(10);
      expect(d.textile.rienNeCorrespond).toContain("{recherche}");
    }
  });
});
