import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  calculerIndemnisation,
  libelleIndemnisation,
  INDEMNISATION_INACTIVE,
  type ParametresIndemnisation,
} from "@/lib/indemnisation";
import { pageIncomplete } from "@/lib/legal";

const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");
const sql = (f: string) =>
  readFileSync(join(process.cwd(), "..", "..", "supabase", "migrations", f), "utf8");

function corpsDeFonction(source: string, nom: string): string {
  const debut = source.indexOf(`export async function ${nom}`);
  if (debut === -1) throw new Error(`Fonction introuvable : ${nom}`);
  const suivante = source.indexOf("\nexport ", debut + 1);
  return source.slice(debut, suivante === -1 ? undefined : suivante);
}

const actif: ParametresIndemnisation = {
  indemnisation_active: true,
  indemnisation_taux: 50,
  indemnisation_plafond: 100000,
  indemnisation_conditions: "",
};

// La valeur déclarée était demandée sans rien promettre : ni assurance, ni
// plafond, ni recours. Le barème est une décision commerciale — il est donc
// piloté, pas inventé — mais ce qu'on en dit doit suivre exactement.
describe("Indemnisation — calcul", () => {
  it("rien n'est dû tant que le régime n'est pas activé", () => {
    expect(calculerIndemnisation(500000, INDEMNISATION_INACTIVE)).toBe(0);
    expect(calculerIndemnisation(500000, { ...actif, indemnisation_active: false })).toBe(0);
  });

  it("le taux s'applique à la valeur déclarée", () => {
    expect(calculerIndemnisation(100000, { ...actif, indemnisation_plafond: 0 })).toBe(50000);
  });

  it("le plafond borne le résultat", () => {
    // 50 % de 400 000 = 200 000, ramené au plafond.
    expect(calculerIndemnisation(400000, actif)).toBe(100000);
  });

  // Sinon activer le régime sans renseigner de plafond n'indemniserait jamais
  // rien : un piège pour qui règle l'écran.
  it("un plafond à zéro signifie « pas de plafond », pas « rien »", () => {
    expect(calculerIndemnisation(400000, { ...actif, indemnisation_plafond: 0 })).toBe(200000);
  });

  it("une valeur absente ou nulle ne donne rien", () => {
    expect(calculerIndemnisation(null, actif)).toBe(0);
    expect(calculerIndemnisation(0, actif)).toBe(0);
    expect(calculerIndemnisation(-100, actif)).toBe(0);
  });
});

describe("Indemnisation — ce qu'on annonce au client", () => {
  // L'omission serait le vrai risque : laisser croire à une couverture qui
  // n'existe pas.
  it("l'absence de régime est dite explicitement", () => {
    const texte = libelleIndemnisation(INDEMNISATION_INACTIVE);
    expect(texte).toContain("Ne vaut pas assurance");
    expect(texte).toContain("aucune indemnisation");
  });

  it("le texte reprend le taux et le plafond réglés", () => {
    const texte = libelleIndemnisation(actif);
    expect(texte).toContain("50 %");
    // `toLocaleString("fr-FR")` sépare les milliers par une espace fine
    // insécable (U+202F) — la même qui avait fait échouer la génération des
    // factures PDF. Correcte en HTML, elle ne se compare pas à une espace
    // ordinaire : le test tolère les deux plutôt que de figer un caractère
    // invisible.
    expect(texte).toMatch(/100[\s\u202f\u00a0]000 FCFA/);
  });

  it("sans plafond, aucune limite n'est annoncée", () => {
    expect(libelleIndemnisation({ ...actif, indemnisation_plafond: 0 })).not.toContain("limite");
  });

  it("les conditions saisies sont reprises", () => {
    const texte = libelleIndemnisation({ ...actif, indemnisation_conditions: "Sur facture." });
    expect(texte).toContain("Sur facture.");
  });
});

describe("Indemnisation — garanties d'écriture", () => {
  const actions = src("app/actions/pages-legales.ts");
  const livraison = src("app/actions/livraison.ts");

  it("le barème est réservé au propriétaire", () => {
    expect(corpsDeFonction(actions, "modifierIndemnisation")).toContain("requireProprietaire()");
  });

  // Le client lirait un engagement là où il n'y en a pas.
  it("un régime actif à 0 % est refusé", () => {
    const corps = corpsDeFonction(actions, "modifierIndemnisation");
    expect(corps).toMatch(/active && taux <= 0/);
  });

  // Même raison que le taux de TVA figé sur une facture : faire évoluer le
  // barème ne doit pas réécrire un engagement déjà pris.
  it("le montant est figé sur l'expédition à la clôture", () => {
    const corps = corpsDeFonction(livraison, "cloturerEchecLivraison");
    expect(corps).toContain("indemnisation_montant");
    expect(corps).toMatch(/exp\.indemnisation_montant != null/);
  });
});

describe("Pages légales — éditables et honnêtes", () => {
  const actions = src("app/actions/pages-legales.ts");
  const page = src("app/(public)/legal/[slug]/page.tsx");

  it("l'édition est réservée au propriétaire", () => {
    expect(corpsDeFonction(actions, "modifierPageLegale")).toContain("requireProprietaire()");
  });

  // Publier une page trouée la présenterait comme un engagement ferme alors
  // qu'il y manque une mention obligatoire.
  it("une page contenant un [À COMPLÉTER] ne peut pas être publiée", () => {
    const corps = corpsDeFonction(actions, "modifierPageLegale");
    expect(corps).toContain("[À COMPLÉTER");
    expect(corps).toContain("Complétez-les avant de publier");
  });

  it("pageIncomplete repère les trous", () => {
    expect(pageIncomplete({ sections: [{ titre: "A", paragraphes: ["RCCM : [À COMPLÉTER]."] }] })).toBe(true);
    expect(pageIncomplete({ sections: [{ titre: "A", paragraphes: ["Tout est renseigné."] }] })).toBe(false);
  });

  // Un brouillon indexé serait cité comme l'engagement de l'entreprise.
  it("un brouillon reste hors des moteurs de recherche", () => {
    expect(page).toMatch(/page\.publie \? undefined : \{ index: false/);
    expect(page).toContain("Document provisoire");
  });

  // Le contenu vivait dans un fichier TS : le corriger demandait un déploiement.
  it("le contenu n'est plus figé dans le code", () => {
    expect(existsSync(join(process.cwd(), "src", "app/(public)/legal/contenu.ts"))).toBe(false);
    expect(page).toContain("getPageLegale");
  });

  it("les brouillons sont chargés par la migration", () => {
    const migration = sql("00071_pages_legales_et_indemnisation.sql");
    expect(migration).toContain("insert into public.pages_legales");
    // Chargés non publiés : ils portent encore des trous.
    expect(migration).toMatch(/'\[[\s\S]*'::jsonb, false\)/);
  });
});

// La couverture d'article était une URL libre : `next/image` lève à l'exécution
// sur un hôte absent de remotePatterns, donc la photo d'un article pouvait
// casser la page entière.
describe("Blog — couverture hébergée avec le site", () => {
  const action = src("app/actions/blog.ts");
  const article = src("app/(public)/blog/[slug]/page.tsx");
  const form = src("app/(admin)/admin/blog/article-form.tsx");

  it("la couverture est déposée dans le bucket, pas saisie en URL", () => {
    expect(action).toContain('.from("blog-images")');
    expect(form).toMatch(/name="image_couverture"\s+type="file"/);
  });

  it("une modification sans nouvelle image garde l'actuelle", () => {
    expect(action).toContain("image_couverture_actuelle");
    expect(form).toContain('name="image_couverture_actuelle"');
  });

  // Contrairement aux photos de colis : un article publié sans sa couverture,
  // sans avertissement, se corrige à l'aveugle.
  it("un envoi raté bloque l'enregistrement", () => {
    expect(action).toContain("Échec de l'envoi de l'image");
  });

  it("la page publique peut enfin utiliser next/image", () => {
    expect(article).toContain("<Image");
    expect(article).not.toMatch(/<img\s/);
  });
});
