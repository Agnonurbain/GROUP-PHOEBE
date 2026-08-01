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
