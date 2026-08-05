import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validerDemandeTextile,
  transitionTextileAutorisee,
  TRANSITIONS_TEXTILE,
  STATUTS_TEXTILE,
  STATUT_TEXTILE_LABELS,
  libelleTypePagne,
  isUnitePagne,
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

  // Au-delà, c'est une commande de gros : elle se traite de vive voix.
  it("renvoie une commande de gros vers l'équipe", () => {
    const r = validerDemandeTextile({ ...base, quantite: 20000 }, TYPES);
    expect("error" in r && r.error).toContain("gros");
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
  it("l'écran explique l'absence de prix", () => {
    const form = src("app/(public)/textile/demande-form.tsx");
    expect(form).toContain("Pourquoi pas de prix affiché");
    expect(form).toContain("prix de référence");
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
