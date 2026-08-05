import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { verticaleDeChemin, attributVerticale, VERTICALES } from "@/lib/verticales";

/**
 * Le logo de l'en-tête suit le service de la page.
 *
 * La question « à quel service appartient cette page » se décidait à DEUX
 * endroits, indépendamment : `smart-header` pour le logo, `vertical-layout`
 * pour la couleur d'accent. Les deux listes ne disaient pas la même chose et
 * aucune n'était complète — elles ne connaissaient que les chemins portant le
 * nom du service.
 *
 * Le panier, le tunnel de réservation et le suivi de colis retombaient donc sur
 * le logo générique. Le client changeait d'univers en cours de parcours, au
 * moment précis où il paie.
 */

const RACINE = join(process.cwd(), "src");
const src = (p: string) => readFileSync(join(RACINE, p), "utf8");

describe("Verticale d'une page — le logo suit le service", () => {
  it.each([
    ["/transport/catalogue", "transport"],
    ["/transport/vehicule/toyota-corolla", "transport"],
    // Le panier ne contient que des véhicules.
    ["/panier", "transport"],
    ["/panier/paiement", "transport"],
    ["/reservation/confirmation", "transport"],
    ["/reservation/echec", "transport"],
    ["/livraison", "livraison"],
    ["/livraison/commander", "livraison"],
    // La page ne porte pas le nom du service, elle en fait pourtant partie.
    ["/suivi", "livraison"],
    ["/immobilier", "immobilier"],
    ["/immobilier/abc-123", "immobilier"],
    ["/assistance", "assistance"],
    ["/assistance/pays/chine", "assistance"],
  ])("%s → %s", (chemin, attendu) => {
    expect(verticaleDeChemin(chemin)).toBe(attendu);
  });

  it.each(["/", "/contact", "/blog", "/blog/un-article", "/avis", "/legal/cgv", "/compte/profil"])(
    "%s n'appartient à aucun service",
    (chemin) => {
      expect(verticaleDeChemin(chemin)).toBeNull();
      expect(attributVerticale(chemin)).toBe("accueil");
    }
  );

  // Sans la borne sur le séparateur, un chemin qui commence par les mêmes
  // lettres serait rattaché au service à tort.
  it("un préfixe ne mord pas sur un chemin voisin", () => {
    expect(verticaleDeChemin("/transportation")).toBeNull();
    expect(verticaleDeChemin("/suivid")).toBeNull();
    expect(verticaleDeChemin("/panierx")).toBeNull();
  });
});

describe("Verticale — une seule source", () => {
  it("l'en-tête et la mise en page passent par la même fonction", () => {
    for (const [fichier, attendu] of [
      ["components/public/smart-header.tsx", "verticaleDeChemin"],
      ["app/(public)/vertical-layout.tsx", "attributVerticale"],
    ]) {
      const code = src(fichier);
      expect(code, fichier).toContain('from "@/lib/verticales"');
      expect(code, fichier).toContain(attendu);
      // Une liste de préfixes recopiée sur place serait le retour du défaut.
      expect(code, fichier).not.toMatch(/startsWith\("\/(transport|livraison|immobilier|assistance)"\)/);
    }
  });

  /**
   * Toute page publique sous un dossier de service doit être rattachée à ce
   * service. Ce test lit l'arborescence des routes : ajouter une page sous
   * `app/(public)/livraison/` la couvre automatiquement, et ajouter un parcours
   * ailleurs — comme `/suivi` — casse jusqu'à ce qu'on le déclare.
   */
  it("toutes les routes d'un dossier de service sont rattachées", () => {
    const base = join(RACINE, "app", "(public)");
    const routes: string[] = [];
    const parcourir = (dir: string, chemin: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const complet = join(dir, e.name);
        if (e.isDirectory()) {
          // Les groupes `(x)` ne comptent pas dans l'URL.
          parcourir(complet, e.name.startsWith("(") ? chemin : `${chemin}/${e.name}`);
        } else if (e.name === "page.tsx" && statSync(complet).isFile()) {
          routes.push(chemin || "/");
        }
      }
    };
    parcourir(base, "");

    const manquantes = routes
      // La liste vient du module : recopiée ici, elle aurait oublié le
      // cinquième service — c'est ce qui est arrivé au textile.
      .filter((r) => (VERTICALES as string[]).includes(r.split("/")[1]))
      .filter((r) => verticaleDeChemin(r.replace(/\[[^\]]+\]/g, "x")) === null);
    expect(manquantes).toEqual([]);
  });
});

/**
 * Un service qui existe doit être atteignable.
 *
 * Le textile était en ligne, dans l'en-tête, avec sa page et son catalogue —
 * et absent du pied de page. Rien ne cassait : le visiteur qui cherchait la
 * liste des services n'en voyait que quatre sur cinq.
 */
describe("Verticale — tout service est listé dans le pied de page", () => {
  it.each(VERTICALES)("« %s » a son lien", (v) => {
    const footer = src("components/public/footer.tsx");
    const debut = footer.indexOf("const servicesLinks");
    expect(debut).toBeGreaterThan(-1);
    const liste = footer.slice(debut, footer.indexOf("]", debut));
    // Le transport pointe vers son catalogue, pas vers /transport : on vérifie
    // le préfixe, qui est ce qui rattache la page au service.
    expect(liste, `${v} manque au pied de page`).toContain(`href: "/${v}`);
  });
});
