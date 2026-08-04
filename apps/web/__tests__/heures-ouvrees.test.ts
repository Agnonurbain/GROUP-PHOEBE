import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  echeanceOuvree,
  heuresOuvreesEcoulees,
  estOuvre,
  horairesUtilisables,
  HORAIRES_DEFAUT,
  type HorairesOuvres,
} from "@/lib/heures-ouvrees";

const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");

const d = (iso: string) => new Date(iso);
// Lundi au samedi, 8 h – 18 h. Abidjan est à UTC+0 : l'heure UTC est l'heure locale.
const h = HORAIRES_DEFAUT;

describe("Heures ouvrées — ce qui compte comme ouvert", () => {
  it("un mardi à 10 h est ouvré", () => {
    expect(estOuvre(d("2026-09-15T10:00:00Z"), h)).toBe(true);
  });

  it("un mardi à 22 h ne l'est pas", () => {
    expect(estOuvre(d("2026-09-15T22:00:00Z"), h)).toBe(false);
  });

  it("un dimanche ne l'est pas", () => {
    expect(estOuvre(d("2026-09-20T10:00:00Z"), h)).toBe(false);
  });

  // La fermeture est exclue : à 18 h pile, c'est fermé.
  it("l'heure de fermeture est exclue", () => {
    expect(estOuvre(d("2026-09-15T17:59:00Z"), h)).toBe(true);
    expect(estOuvre(d("2026-09-15T18:00:00Z"), h)).toBe(false);
  });
});

describe("Heures ouvrées — échéance", () => {
  it("en pleine journée, le délai s'ajoute simplement", () => {
    // Mardi 9 h + 4 h ouvrées = mardi 13 h.
    expect(echeanceOuvree(d("2026-09-15T09:00:00Z"), 4, h).toISOString()).toBe(
      "2026-09-15T13:00:00.000Z"
    );
  });

  // Le cas qui motive tout : une demande de fin de journée ne doit pas mourir
  // pendant la nuit.
  it("une demande de 17 h déborde sur le lendemain matin", () => {
    // Mardi 17 h : 1 h avant fermeture, puis 3 h le mercredi dès 8 h → 11 h.
    expect(echeanceOuvree(d("2026-09-15T17:00:00Z"), 4, h).toISOString()).toBe(
      "2026-09-16T11:00:00.000Z"
    );
  });

  it("une demande du soir démarre à l'ouverture suivante", () => {
    // Mardi 22 h : rien ne court la nuit, le compte démarre mercredi 8 h.
    expect(echeanceOuvree(d("2026-09-15T22:00:00Z"), 4, h).toISOString()).toBe(
      "2026-09-16T12:00:00.000Z"
    );
  });

  // Samedi est ouvré, dimanche non : un vendredi soir enjambe le dimanche.
  it("une demande du samedi soir attend le lundi", () => {
    // Samedi 19 septembre 17 h → 1 h le samedi, puis 3 h le lundi 21 → 11 h.
    expect(echeanceOuvree(d("2026-09-19T17:00:00Z"), 4, h).toISOString()).toBe(
      "2026-09-21T11:00:00.000Z"
    );
  });

  it("un dimanche entier ne consomme rien", () => {
    expect(echeanceOuvree(d("2026-09-20T10:00:00Z"), 2, h).toISOString()).toBe(
      "2026-09-21T10:00:00.000Z"
    );
  });

  it("un délai plus long qu'une journée s'étale sur plusieurs", () => {
    // Mardi 9 h + 12 h ouvrées : 9 h le mardi (jusqu'à 18 h), 3 h le mercredi.
    expect(echeanceOuvree(d("2026-09-15T09:00:00Z"), 12, h).toISOString()).toBe(
      "2026-09-16T11:00:00.000Z"
    );
  });

  // Sans jour ouvré, le budget ne s'épuiserait jamais : mieux vaut un décompte
  // calendaire qu'un véhicule immobilisé pour toujours.
  it("des horaires inexploitables retombent sur le calendaire", () => {
    const cassees: HorairesOuvres = { jours: [], ouverture: "08:00", fermeture: "18:00" };
    expect(horairesUtilisables(cassees)).toBe(false);
    expect(echeanceOuvree(d("2026-09-15T22:00:00Z"), 4, cassees).toISOString()).toBe(
      "2026-09-16T02:00:00.000Z"
    );

    const inversees: HorairesOuvres = { jours: [1], ouverture: "18:00", fermeture: "08:00" };
    expect(horairesUtilisables(inversees)).toBe(false);
  });
});

describe("Heures ouvrées — temps écoulé", () => {
  it("compte les seules heures ouvertes", () => {
    // Mardi 16 h → mercredi 10 h : 2 h le mardi + 2 h le mercredi.
    expect(
      heuresOuvreesEcoulees(d("2026-09-15T16:00:00Z"), d("2026-09-16T10:00:00Z"), h)
    ).toBe(4);
  });

  it("une nuit entière ne compte pas", () => {
    expect(
      heuresOuvreesEcoulees(d("2026-09-15T19:00:00Z"), d("2026-09-16T07:00:00Z"), h)
    ).toBe(0);
  });

  it("un dimanche ne compte pas", () => {
    // Samedi 18 h → lundi 8 h.
    expect(
      heuresOuvreesEcoulees(d("2026-09-19T18:00:00Z"), d("2026-09-21T08:00:00Z"), h)
    ).toBe(0);
  });

  /**
   * La propriété dont dépendent les crons : ils préfiltrent en SQL sur le temps
   * calendaire, puis tranchent sur le temps ouvré. Si le temps ouvré pouvait
   * dépasser le calendaire, le préfiltre écarterait des lignes qui auraient dû
   * expirer.
   */
  it("le temps ouvré ne dépasse jamais le temps calendaire", () => {
    const paires: [string, string][] = [
      ["2026-09-15T09:00:00Z", "2026-09-15T17:00:00Z"],
      ["2026-09-15T17:00:00Z", "2026-09-18T09:00:00Z"],
      ["2026-09-19T10:00:00Z", "2026-09-22T10:00:00Z"],
      ["2026-09-20T00:00:00Z", "2026-09-20T23:00:00Z"],
    ];
    for (const [a, b] of paires) {
      const ouvre = heuresOuvreesEcoulees(d(a), d(b), h);
      const calendaire = (d(b).getTime() - d(a).getTime()) / 3_600_000;
      expect(ouvre, `${a} → ${b}`).toBeLessThanOrEqual(calendaire);
    }
  });

  it("un intervalle inversé ne compte rien", () => {
    expect(
      heuresOuvreesEcoulees(d("2026-09-16T10:00:00Z"), d("2026-09-15T10:00:00Z"), h)
    ).toBe(0);
  });
});

/**
 * Les trois délais ne mesurent pas la même chose, donc ne se décomptent pas de
 * la même façon. C'est un choix, pas un oubli — et il doit rester lisible.
 */
describe("Heures ouvrées — quel délai les respecte", () => {
  const migration = readFileSync(
    join(process.cwd(), "..", "..", "supabase", "migrations", "00075_heures_ouvrees.sql"),
    "utf8"
  );

  // Mesure la réactivité de l'équipe, qui ne répond pas la nuit.
  it("la réponse à une demande de prix est ouvrée par défaut", () => {
    expect(migration).toMatch(/delai_negociation_ouvre boolean not null default true/);
  });

  // Mesure une présence physique : retenir une caution parce que l'agence était
  // fermée serait une pénalité pour un empêchement qu'on a créé soi-même.
  it("le retard au retrait est ouvré par défaut", () => {
    expect(migration).toMatch(/delai_non_presentation_ouvre boolean not null default true/);
  });

  // Mesure le client, qui règle en ligne — et le paiement en ligne ne ferme pas.
  it("la demande sans suite reste calendaire par défaut", () => {
    expect(migration).toMatch(/delai_sans_reponse_ouvre boolean not null default false/);
  });

  it("l'échéance de négociation est arrêtée à l'écriture, pas au passage du cron", () => {
    const negociation = src("app/actions/negociation.ts");
    expect(negociation).toContain("echeanceOuvree");
    expect(negociation).toMatch(/devis_expire_at: echeance\.toISOString\(\)/);
  });

  // Le préfiltre SQL est calendaire : il ne peut écarter aucune ligne, le temps
  // ouvré étant toujours inférieur ou égal.
  it("les crons trient finement après un préfiltre calendaire", () => {
    const expiration = src("lib/payments/expiration-demandes.ts");
    expect(expiration).toContain("heuresOuvreesEcoulees");
    expect(expiration).toMatch(/delai_sans_reponse_ouvre/);
    expect(expiration).toMatch(/delai_non_presentation_ouvre/);
  });

  // Des horaires vides ou inversés rendraient tout délai insoluble.
  it("l'écran refuse des horaires inexploitables", () => {
    const action = src("app/actions/tarifs.ts");
    expect(action).toContain("Sélectionnez au moins un jour d'ouverture.");
    expect(action).toMatch(/ouverture >= fermeture/);
  });
});

/**
 * Les heures d'ouverture appartiennent à la maison, pas au transport.
 *
 * Elles ont été posées en 00075 sur `parametres_transport` : c'était juste tant
 * que le décompte des délais transport était seul à s'en servir. Les rendez-vous
 * de dépôt les lisent depuis 00081 — le nom est alors devenu faux, et un nom qui
 * ment finit par produire un doublon : le prochain qui aura besoin des horaires
 * ne les cherchera pas là et en créera d'autres. Déplacées en 00083.
 */
describe("Heures d'ouverture — une seule source, correctement nommée", () => {
  const migration = readFileSync(
    join(process.cwd(), "..", "..", "supabase", "migrations", "00083_horaires_ouverture.sql"),
    "utf8"
  );

  it("les colonnes ont quitté la table du transport", () => {
    expect(migration).toContain("create table if not exists public.parametres_ouverture");
    // Les laisser en place produirait exactement le doublon qu'on évite.
    expect(migration).toMatch(/drop column if exists jours_ouvres/);
    expect(migration).toMatch(/drop column if exists heure_ouverture/);
    expect(migration).toMatch(/drop column if exists heure_fermeture/);
  });

  // Reprendre les valeurs par défaut effacerait un réglage fait en admin.
  it("les valeurs en place sont reprises, pas réinitialisées", () => {
    expect(migration).toMatch(/insert into public\.parametres_ouverture[\s\S]{0,200}from public\.parametres_transport/);
  });

  // Une plage inversée rendrait tout délai en heures ouvrées insoluble et
  // l'agenda de rendez-vous vide.
  it("la plage reste contrainte", () => {
    expect(migration).toContain("heure_ouverture < heure_fermeture");
  });

  it("plus personne ne lit les horaires sur les paramètres transport", () => {
    const transport = src("lib/parametres-transport.ts");
    expect(transport).not.toMatch(/jours_ouvres|heure_ouverture|heure_fermeture/);
    expect(transport).not.toContain("horaires");
  });

  it("les trois consommateurs passent par la même source", () => {
    for (const f of [
      "app/actions/negociation.ts",
      "lib/payments/expiration-demandes.ts",
      "lib/parametres-rendez-vous.ts",
    ]) {
      expect(src(f), f).toContain("getHorairesOuverture");
    }
  });

  // Un réglage sans écran serait le défaut habituel : écrit, jamais appelé.
  it("le propriétaire les règle depuis un bloc dédié", () => {
    const action = src("app/actions/tarifs.ts");
    const debut = action.indexOf("export async function modifierHorairesOuverture");
    expect(debut).toBeGreaterThan(-1);
    expect(action.slice(debut, debut + 900)).toContain("requireProprietaireAvecId()");
    expect(src("app/(admin)/admin/tarifs/page.tsx")).toContain("HorairesForm");
  });
});
