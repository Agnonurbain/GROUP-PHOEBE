import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");
const sql = (f: string) =>
  readFileSync(join(process.cwd(), "..", "..", "supabase", "migrations", f), "utf8");

function corpsDeFonction(source: string, nom: string): string {
  const debut = source.indexOf(`export async function ${nom}`);
  if (debut === -1) throw new Error(`Fonction introuvable : ${nom}`);
  const suivante = source.indexOf("\nexport ", debut + 1);
  return source.slice(debut, suivante === -1 ? undefined : suivante);
}

// L'option « avec chauffeur » est vendue depuis l'origine, mais aucun chemin ne
// permettait d'en créer un : les pages admin ne faisaient que lire la table.
// Avec zéro chauffeur, `assignerVehiculesGroupe` ne trouvait aucun candidat et
// écartait le véhicule — le client lisait « Ce véhicule n'est pas disponible »
// alors que le véhicule était libre.
describe("Chauffeurs — gestion", () => {
  const source = src("app/actions/chauffeurs.ts");

  it.each(["creerChauffeur", "modifierChauffeur"])("%s est réservée au staff", (nom) => {
    expect(corpsDeFonction(source, nom)).toContain("requireStaff()");
  });

  // Sans normalisation, « 07 00 00 00 00 » et « +2250700000000 » créent deux
  // chauffeurs pour la même personne — donc deux ressources que l'affectation
  // croit libres en même temps.
  it("le téléphone est normalisé avant toute écriture", () => {
    for (const nom of ["creerChauffeur", "modifierChauffeur"]) {
      const corps = corpsDeFonction(source, nom);
      expect(corps, nom).toContain("normaliserTelephone(telephone)");
      expect(corps, nom).toMatch(/telephone: telephoneNormalise/);
    }
  });

  it("un numéro déjà pris est refusé, à la création comme à la modification", () => {
    expect(corpsDeFonction(source, "creerChauffeur")).toMatch(/déjà celui de/);
    const modif = corpsDeFonction(source, "modifierChauffeur");
    expect(modif).toMatch(/déjà celui de/);
    // Sans l'exclusion de soi-même, un chauffeur ne pourrait plus être modifié.
    expect(modif).toMatch(/\.neq\("id", chauffeurId\)/);
  });

  // La base double la garde applicative : deux identifiants distincts pour une
  // même personne rendraient l'exclusion GiST de disponibilites_chauffeur
  // inopérante — elle ne verrait aucun chevauchement.
  it("l'unicité du numéro est aussi tenue en base", () => {
    expect(sql("00068_chauffeurs_gestion.sql")).toMatch(
      /unique index[\s\S]*?chauffeurs \(telephone\)/
    );
  });

  it("on ne désactive pas un chauffeur qui a des courses en cours", () => {
    const corps = corpsDeFonction(source, "modifierChauffeur");
    expect(corps).toMatch(/ancien\.actif && !actif/);
    expect(corps).toContain("Réaffectez-la");
  });
});

describe("Chauffeurs — affectation automatique", () => {
  const assignation = src("app/actions/vehicle-assignment.ts");

  // Sans ce filtre, la désactivation ne servait qu'à l'affichage : un chauffeur
  // inactif restait candidat à toute nouvelle course.
  it("un chauffeur inactif n'est plus candidat", () => {
    expect(assignation).toMatch(/chauffeurs!inner\(actif\)/);
    expect(assignation).toMatch(/\.eq\("chauffeurs\.actif", true\)/);
  });

  // Les deux causes menaient au même message, qui parlait du véhicule alors
  // qu'il était libre : le client renonçait ou réessayait à l'identique.
  it("le manque de chauffeur ne se dit plus comme un manque de véhicule", () => {
    expect(assignation).toContain("bloqueParChauffeur");
    expect(assignation).toMatch(/Aucun chauffeur disponible pour/);
  });

  it("le véhicule est libéré quand aucun chauffeur ne suit", () => {
    // La réservation posée est retirée avant de passer au véhicule suivant,
    // sinon un créneau resterait bloqué pour une course qui n'existe pas.
    const bloc = assignation.slice(assignation.indexOf("if (!chauffeurId)"));
    expect(bloc).toMatch(/disponibilites_vehicule[\s\S]*?\.delete\(\)/);
    expect(bloc).toMatch(/reservedVehicules\.pop\(\)/);
  });
});

// Le contrat et l'état des lieux étaient produits pour le client et ne lui
// étaient jamais montrés : `/api/contrat-pdf` n'était appelée de nulle part, et
// l'état des lieux refusait sa session. Or c'est le document qui justifie ce
// qu'on retient sur sa caution.
describe("Transport — documents du client", () => {
  const contrat = readFileSync(join(process.cwd(), "src", "app/api/contrat-pdf/route.ts"), "utf8");
  const etatLieux = readFileSync(join(process.cwd(), "src", "app/api/etat-lieux-pdf/route.ts"), "utf8");
  const reservations = src("app/(public)/compte/reservations/page.tsx");

  it.each([
    ["contrat", "app/api/contrat-pdf/route.ts"],
    ["état des lieux", "app/api/etat-lieux-pdf/route.ts"],
  ])("le %s est lisible par son client, et par le staff seulement sinon", (_, chemin) => {
    const code = readFileSync(join(process.cwd(), "src", chemin), "utf8");
    expect(code).toMatch(/demande\.client_id !== user\.sub/);
    expect(code).toMatch(/\["operateur", "proprietaire"\]/);
  });

  it("les deux routes exigent une session", () => {
    for (const code of [contrat, etatLieux]) {
      expect(code).toContain("Non authentifié");
    }
  });

  it("les deux documents sont atteignables depuis Mes réservations", () => {
    expect(reservations).toContain("/api/contrat-pdf?id=");
    expect(reservations).toContain("/api/etat-lieux-pdf?id=");
  });

  // Ce qui est retenu doit être lisible là où le justificatif l'est. Le libellé
  // vit désormais dans le dictionnaire — le test vise l'affichage du montant,
  // pas le mot français, sinon la traduction le casserait sans que la règle
  // ait bougé.
  it("la caution retenue est affichée au client", () => {
    expect(reservations).toContain("t.compte.cautionRetenue");
    expect(reservations).toMatch(/documents\.cautionRetenue[\s\S]*toLocaleString/);
  });
});

describe("Transport — conducteurs secondaires", () => {
  const source = src("app/actions/demandes.ts");

  it("la vérification est réservée au staff", () => {
    const corps = corpsDeFonction(source, "verifierConducteurSecondaire");
    expect(corps).toMatch(/\["operateur", "proprietaire"\]/);
  });

  // Une décision déjà prise ne se rejoue pas, et deux opérateurs simultanés
  // n'en produisent qu'une.
  it("la décision porte sur l'état attendu", () => {
    const corps = corpsDeFonction(source, "verifierConducteurSecondaire");
    expect(corps).toMatch(/\.eq\("statut_verification", "documents_soumis"\)/);
    expect(corps).toContain("déjà été traité");
  });

  // Le bucket identity-documents est privé et c'est le chemin qui est stocké.
  it("le permis est servi par une URL signée, pas publique", () => {
    const corps = corpsDeFonction(source, "permisConducteurSecondaire");
    expect(corps).toContain("createSignedUrl");
    expect(corps).not.toContain("getPublicUrl");
  });
});

// Trois liens du pied de page pointaient vers `#`, et `accepte_cgv` — présente
// depuis la migration initiale — n'était jamais remplie faute de case à cocher.
describe("Transport — consentement et pages légales", () => {
  const achat = src("app/actions/achat.ts");
  const checkout = src("app/actions/checkout.ts");

  it.each([
    ["achat", "app/actions/achat.ts"],
    ["checkout", "app/actions/checkout.ts"],
  ])("%s exige le consentement côté serveur", (_, chemin) => {
    const code = src(chemin);
    expect(code).toMatch(/formData\.get\("accepte_cgv"\) !== "on"/);
    expect(code).toContain("accepte_cgv: true");
  });

  it("le pied de page ne renvoie plus vers des ancres mortes", () => {
    const footer = src("components/public/footer.tsx");
    expect(footer).toContain("/legal/mentions-legales");
    expect(footer).toContain("/legal/cgv");
    expect(footer).toContain("/legal/confidentialite");
  });

  // Le brouillon et le noindex sont désormais couverts par
  // legal-indemnisation.test.ts, qui teste la page devenue éditable en base.

  // `demandes_transport.categorie` qualifie la demande, pas le véhicule : on y
  // écrivait `leger`, que la contrainte rejette — tout achat échouait.
  it("un achat n'écrit plus une catégorie de véhicule", () => {
    expect(achat).toContain('categorie: "classique"');
    expect(achat).not.toMatch(/categorie \|\| "leger"/);
    expect(checkout).toContain('categorie: "classique"');
  });
});
