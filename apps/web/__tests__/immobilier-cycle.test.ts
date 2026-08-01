import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  TRANSITIONS_DEMANDE_IMMO,
  TRANSITIONS_VISITE,
  transitionDemandeAutorisee,
  transitionVisiteAutorisee,
  STATUTS_CONTRE_OFFRE_POSSIBLE,
} from "@/lib/immobilier";

const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");
const sql = (f: string) =>
  readFileSync(join(process.cwd(), "..", "..", "supabase", "migrations", f), "utf8");

function corpsDeFonction(source: string, nom: string): string {
  const debut = source.indexOf(`export async function ${nom}`);
  if (debut === -1) throw new Error(`Fonction introuvable : ${nom}`);
  const suivante = source.indexOf("\nexport ", debut + 1);
  return source.slice(debut, suivante === -1 ? undefined : suivante);
}

// Le cycle était libre : n'importe lequel des neuf statuts menait à n'importe
// quel autre. Ce n'était pas théorique — voir le test du double engagement.
describe("Immobilier — cycle d'une demande", () => {
  it("le parcours nominal d'une offre est possible", () => {
    expect(transitionDemandeAutorisee("en_attente", "offre_soumise")).toBe(true);
    expect(transitionDemandeAutorisee("offre_soumise", "contre_offre")).toBe(true);
    expect(transitionDemandeAutorisee("contre_offre", "acceptee")).toBe(true);
    expect(transitionDemandeAutorisee("acceptee", "finalisee")).toBe(true);
  });

  /**
   * Le cœur du sujet. Une demande `refusee` — y compris close automatiquement
   * parce qu'un concurrent avait emporté le bien — pouvait repasser à
   * `acceptee` : le contrôle du bien laissait passer (`reserve` est accepté, et
   * c'est justement l'état où le gagnant l'a mis), le prix du perdant se
   * figeait, une commission se calculait, et `cloturerConcurrentes` ne
   * refermait pas le vrai gagnant puisque `acceptee` ne figure pas dans les
   * statuts qu'elle balaie.
   */
  it("une demande refusée ne peut pas être ré-acceptée", () => {
    expect(transitionDemandeAutorisee("refusee", "acceptee")).toBe(false);
    // La condition qui rendait le bug atteignable existe toujours : c'est bien
    // la machine à états qui protège, pas un heureux hasard.
    expect(STATUTS_CONTRE_OFFRE_POSSIBLE).not.toContain("acceptee");
  });

  it.each(["refusee", "annulee", "finalisee"])("%s est terminal", (statut) => {
    expect(TRANSITIONS_DEMANDE_IMMO[statut as keyof typeof TRANSITIONS_DEMANDE_IMMO]).toHaveLength(0);
  });

  // Le prix est figé et la commission calculée : revenir en négociation
  // laisserait deux montants arrêtés sur la même affaire.
  it("une demande acceptée ne retourne pas en négociation", () => {
    expect(transitionDemandeAutorisee("acceptee", "contre_offre")).toBe(false);
    expect(transitionDemandeAutorisee("acceptee", "offre_soumise")).toBe(false);
  });

  it("un statut inconnu n'ouvre aucune transition", () => {
    expect(transitionDemandeAutorisee("inexistant", "acceptee")).toBe(false);
    expect(transitionDemandeAutorisee("en_attente", "inexistant")).toBe(false);
  });

  it("la garde est branchée sur l'action", () => {
    const corps = corpsDeFonction(src("app/actions/immobilier.ts"), "changerStatutDemandeImmobilier");
    expect(corps).toContain("transitionDemandeAutorisee");
    // Conditionner l'écriture au statut lu écarte deux opérateurs simultanés.
    expect(corps).toMatch(/\.eq\("statut", demande\.statut\)/);
  });
});

// `finalisee` portait deux sens : « la visite a eu lieu » sur une demande de
// visite, « la vente est conclue » sur une offre — et dans ce second cas le
// bien quitte le catalogue. C'est la classe d'erreur de l'annulation en
// livraison, qui réutilisait `echec_livraison`.
describe("Immobilier — une visite réalisée n'est pas une vente", () => {
  it("le statut dédié existe et suit la visite", () => {
    expect(transitionDemandeAutorisee("visite_programmee", "visite_realisee")).toBe(true);
    // Une visite ne conclut pas directement une transaction.
    expect(transitionDemandeAutorisee("visite_programmee", "finalisee")).toBe(false);
  });

  it("après la visite, le client peut faire une offre", () => {
    expect(transitionDemandeAutorisee("visite_realisee", "offre_soumise")).toBe(true);
  });

  it("l'action de visite pose le bon statut", () => {
    const source = src("app/actions/immobilier.ts");
    expect(source).toContain('"visite_realisee"');
    expect(source).not.toMatch(/statut === "realisee" \? "finalisee"/);
  });

  it("la migration reprend l'existant", () => {
    const migration = sql("00072_immobilier_visite_realisee.sql");
    expect(migration).toMatch(/set statut = 'visite_realisee'[\s\S]*type = 'visite'/);
  });
});

describe("Immobilier — cycle d'une visite", () => {
  it("le parcours nominal", () => {
    expect(transitionVisiteAutorisee("proposee", "confirmee")).toBe(true);
    expect(transitionVisiteAutorisee("confirmee", "realisee")).toBe(true);
  });

  it("une visite réalisée est terminale", () => {
    expect(TRANSITIONS_VISITE.realisee).toHaveLength(0);
  });

  // Un créneau qui ne convient pas se reprogramme : c'est le déroulé normal.
  it("une visite annulée se reprogramme", () => {
    expect(transitionVisiteAutorisee("annulee", "proposee")).toBe(true);
  });

  it("on ne saute pas la confirmation", () => {
    expect(transitionVisiteAutorisee("proposee", "realisee")).toBe(false);
  });
});

// `proposee` attendait une réponse que personne ne pouvait donner : seul un
// opérateur passait à `confirmee`, si bien qu'il « confirmait » un rendez-vous
// que le client n'avait jamais accepté — alors qu'il a payé des frais de visite
// non remboursables pour ce déplacement.
describe("Immobilier — le client répond à son créneau", () => {
  const source = src("app/actions/immobilier.ts");
  const corps = corpsDeFonction(source, "repondreCreneauVisite");

  it("seul le titulaire de la visite peut répondre", () => {
    expect(corps).toMatch(/visite\.client_id !== user\.sub/);
  });

  it("on ne répond qu'à un créneau qui attend une réponse", () => {
    expect(corps).toMatch(/visite\.statut !== "proposee"/);
    expect(corps).toMatch(/\.eq\("statut", "proposee"\)/);
  });

  // Le relâcher ici remettrait le bien au catalogue alors que le client attend
  // toujours sa visite, déjà payée.
  it("décliner ne relibère pas le bien", () => {
    expect(corps).not.toContain('from("biens")');
  });

  it("le client dispose des deux réponses", () => {
    const composant = src("components/public/reponse-creneau-visite.tsx");
    expect(composant).toContain('value="accepte"');
    expect(composant).toContain('value="decline"');
  });
});

// `finalise` (assistance) et `finalisee` (immobilier) ne diffèrent que par un
// « e » : le second manquait aux listes, si bien qu'une vente conclue restait
// indéfiniment dans l'onglet « Actives », badgée « En attente ».
describe("Réservations — une affaire conclue quitte les actives", () => {
  const page = src("app/(public)/compte/reservations/page.tsx");

  it("les statuts terminaux sont listés une seule fois", () => {
    expect(page).toContain("STATUTS_TERMINES");
    expect(page).toContain("STATUTS_ANNULES");
  });

  it.each(["finalisee", "visite_realisee", "finalise"])("%s est terminal", (statut) => {
    const bloc = page.slice(page.indexOf("const STATUTS_TERMINES"), page.indexOf("const STATUTS_ANNULES"));
    expect(bloc).toContain(`"${statut}"`);
  });
});
