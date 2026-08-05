import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  creneauxDuJour,
  joursDisponibles,
  creneauReservable,
  libelleCreneau,
  PARAMETRES_RENDEZ_VOUS_DEFAUT,
} from "@/lib/rendez-vous";
import { HORAIRES_DEFAUT, type HorairesOuvres } from "@/lib/heures-ouvrees";

/**
 * Créneaux de rendez-vous pour le dépôt d'un dossier.
 *
 * « Il choisit la date et puis il prend le rendez-vous de dépôt de dossier. »
 *
 * La règle mêle jours d'ouverture, durée de créneau, fermetures exceptionnelles
 * et délai de prévenance. Chaque élément est simple, la combinaison ne l'est
 * pas — d'où ces tests, qui ne touchent aucune base.
 */

const H = HORAIRES_DEFAUT; // lundi-samedi, 08:00–18:00, Abidjan = UTC
const P = PARAMETRES_RENDEZ_VOUS_DEFAUT; // 30 min, 1 place, 24 h, 60 jours

// Mercredi 12 août 2026, 6 h du matin. Fixe : les tests ne doivent pas
// dépendre du jour où ils tournent.
const MAINTENANT = new Date("2026-08-12T06:00:00.000Z");
const SANS_DELAI = { ...P, delai_min_heures: 0 };

describe("Créneaux d'une journée", () => {
  it("découpe la journée d'ouverture en créneaux", () => {
    const c = creneauxDuJour("2026-08-13", H, SANS_DELAI, { maintenant: MAINTENANT });
    expect(c.length).toBe(20); // 8 h → 18 h, par demi-heures
    expect(c[0].debut).toBe("2026-08-13T08:00:00.000Z");
    expect(c[0].fin).toBe("2026-08-13T08:30:00.000Z");
  });

  // Un créneau qui déborde ferait attendre un client devant une porte close.
  it("le dernier créneau tient entier avant la fermeture", () => {
    const c = creneauxDuJour("2026-08-13", H, { ...SANS_DELAI, duree_minutes: 45 }, { maintenant: MAINTENANT });
    const dernier = c[c.length - 1];
    expect(new Date(dernier.fin).getUTCHours()).toBeLessThanOrEqual(18);
    expect(dernier.fin).toBe("2026-08-13T17:45:00.000Z");
  });

  it("un dimanche ne propose rien", () => {
    // 16 août 2026 est un dimanche.
    expect(creneauxDuJour("2026-08-16", H, SANS_DELAI, { maintenant: MAINTENANT })).toEqual([]);
  });

  // Sans cela, l'agenda proposerait un rendez-vous le 1er janvier parce que
  // c'est un mercredi.
  it("une fermeture exceptionnelle vide la journée", () => {
    const c = creneauxDuJour("2026-08-13", H, SANS_DELAI, {
      maintenant: MAINTENANT,
      fermetures: ["2026-08-13"],
    });
    expect(c).toEqual([]);
  });

  // Sans délai de prévenance, un client réserverait pour dans dix minutes et
  // personne ne serait prévenu à temps.
  it("le délai de prévenance écarte les créneaux trop proches", () => {
    const c = creneauxDuJour("2026-08-13", H, P, { maintenant: MAINTENANT });
    // 12 août 6 h + 24 h = 13 août 6 h : la journée entière reste ouverte.
    expect(c.length).toBe(20);

    const memeJour = creneauxDuJour("2026-08-12", H, P, { maintenant: MAINTENANT });
    expect(memeJour).toEqual([]);
  });

  it("les places déjà prises réduisent le restant", () => {
    const c = creneauxDuJour("2026-08-13", H, { ...SANS_DELAI, capacite_par_creneau: 2 }, {
      maintenant: MAINTENANT,
      reserves: { "2026-08-13T08:00:00.000Z": 2, "2026-08-13T08:30:00.000Z": 1 },
    });
    expect(c[0].restant).toBe(0);
    expect(c[1].restant).toBe(1);
    expect(c[2].restant).toBe(2);
  });

  // Des horaires inexploitables ne doivent pas produire une boucle sans fin ni
  // un agenda fantaisiste : on n'affiche rien plutôt que n'importe quoi.
  it("des horaires inexploitables ne proposent rien", () => {
    const cassees: HorairesOuvres = { jours: [], ouverture: "08:00", fermeture: "18:00" };
    expect(creneauxDuJour("2026-08-13", cassees, SANS_DELAI, { maintenant: MAINTENANT })).toEqual([]);

    const inversees: HorairesOuvres = { jours: [1, 2, 3, 4, 5], ouverture: "18:00", fermeture: "08:00" };
    expect(creneauxDuJour("2026-08-13", inversees, SANS_DELAI, { maintenant: MAINTENANT })).toEqual([]);
  });

  it("une durée nulle ne produit pas une infinité de créneaux", () => {
    expect(creneauxDuJour("2026-08-13", H, { ...SANS_DELAI, duree_minutes: 0 }, { maintenant: MAINTENANT })).toEqual([]);
  });

  it("une date invalide ne fait rien exploser", () => {
    expect(creneauxDuJour("pas-une-date", H, SANS_DELAI, { maintenant: MAINTENANT })).toEqual([]);
  });
});

describe("Jours proposables", () => {
  it("ne propose que des jours ouvrés", () => {
    const jours = joursDisponibles(H, { ...SANS_DELAI, horizon_jours: 10 }, { maintenant: MAINTENANT });
    // Du 12 au 22 août 2026 : les dimanches 16 et 22... le 22 est un samedi.
    expect(jours).toContain("2026-08-13");
    expect(jours).not.toContain("2026-08-16"); // dimanche
  });

  // Afficher un jour entièrement complet n'apprend rien et oblige à cliquer
  // pour découvrir qu'il n'y a rien.
  it("écarte un jour dont tous les créneaux sont pris", () => {
    const reserves: Record<string, number> = {};
    for (const c of creneauxDuJour("2026-08-13", H, SANS_DELAI, { maintenant: MAINTENANT })) {
      reserves[c.debut] = 1;
    }
    const jours = joursDisponibles(H, { ...SANS_DELAI, horizon_jours: 10 }, { maintenant: MAINTENANT, reserves });
    expect(jours).not.toContain("2026-08-13");
    expect(jours).toContain("2026-08-14");
  });

  it("respecte l'horizon", () => {
    const jours = joursDisponibles(H, { ...SANS_DELAI, horizon_jours: 2 }, { maintenant: MAINTENANT });
    expect(jours.every((j) => j <= "2026-08-14")).toBe(true);
  });

  // Une borne de sûreté : un horizon démesuré ne doit pas faire tourner la
  // boucle sans fin.
  it("un horizon démesuré reste borné", () => {
    const jours = joursDisponibles(H, { ...SANS_DELAI, horizon_jours: 100000 }, { maintenant: MAINTENANT });
    expect(jours.length).toBeLessThan(400);
  });
});

/**
 * Entre l'affichage et le clic, la journée avance et d'autres clients
 * réservent. Vérifier côté serveur est ce qui empêche une réservation à une
 * heure qui n'existe plus.
 */
describe("Un créneau est-il encore réservable", () => {
  it("accepte un créneau proposé et libre", () => {
    expect(creneauReservable("2026-08-13T09:00:00.000Z", H, SANS_DELAI, { maintenant: MAINTENANT }))
      .toEqual({ ok: true });
  });

  it("refuse une heure qui n'est pas un début de créneau", () => {
    const r = creneauReservable("2026-08-13T09:07:00.000Z", H, SANS_DELAI, { maintenant: MAINTENANT });
    expect("error" in r && r.error).toContain("plus proposé");
  });

  it("refuse un jour fermé", () => {
    const r = creneauReservable("2026-08-16T09:00:00.000Z", H, SANS_DELAI, { maintenant: MAINTENANT });
    expect("error" in r).toBe(true);
  });

  it("refuse un créneau qui vient d'être pris", () => {
    const r = creneauReservable("2026-08-13T09:00:00.000Z", H, SANS_DELAI, {
      maintenant: MAINTENANT,
      reserves: { "2026-08-13T09:00:00.000Z": 1 },
    });
    expect("error" in r && r.error).toContain("vient d'être pris");
  });

  it("refuse un créneau sous le délai de prévenance", () => {
    const r = creneauReservable("2026-08-12T09:00:00.000Z", H, P, { maintenant: MAINTENANT });
    expect("error" in r).toBe(true);
  });

  it("refuse une date invalide", () => {
    expect("error" in creneauReservable("n'importe quoi", H, P)).toBe(true);
  });
});

describe("Libellé d'un créneau", () => {
  it("se lit sans effort", () => {
    const l = libelleCreneau("2026-08-13T09:00:00.000Z", "2026-08-13T09:30:00.000Z");
    expect(l).toContain("jeudi");
    expect(l).toContain("13");
    expect(l).toContain("août");
    expect(l).toContain("09:00");
    expect(l).toContain("09:30");
  });
});

/**
 * Le branchement, pas seulement la règle.
 *
 * Le module ci-dessus est juste ; encore faut-il que le serveur s'en serve, et
 * qu'il ne fasse pas confiance à ce que le navigateur lui envoie.
 */
describe("Rendez-vous — ce que fait le serveur", () => {
  const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");
  const action = src("app/actions/assistance.ts");
  const corps = (nom: string) => {
    const d = action.indexOf(`export async function ${nom}`);
    expect(d, nom).toBeGreaterThan(-1);
    const suivante = action.indexOf("\nexport ", d + 1);
    return action.slice(d, suivante === -1 ? undefined : suivante);
  };

  it("on ne réserve que sur son propre dossier", () => {
    expect(corps("reserverCreneau")).toContain("dossier.client_id !== user.sub");
  });

  // Entre l'affichage et le clic, la journée avance et d'autres réservent :
  // faire confiance au créneau reçu laisserait réserver une heure fermée.
  it("le créneau reçu est revalidé côté serveur", () => {
    expect(corps("reserverCreneau")).toContain("creneauReservable");
  });

  // Un dossier n'a qu'un rendez-vous vivant : l'index unique de 00081 tranche
  // la course entre deux clics, et le message l'explique au client.
  it("le doublon est intercepté et expliqué", () => {
    const c = corps("reserverCreneau");
    expect(c).toContain('"23505"');
    expect(c).toContain('err("ceDossierADejaUnRendez")');
  });

  it("annuler ne touche qu'un rendez-vous réservé, et le sien", () => {
    const c = corps("annulerRendezVous");
    expect(c).toContain('.eq("client_id", user.sub as string)');
    // Annuler un rendez-vous déjà honoré effacerait une visite qui a eu lieu.
    expect(c).toContain('.eq("statut", "reserve")');
  });

  it("l'équipe est prévenue quand un créneau est pris", () => {
    expect(corps("reserverCreneau")).toContain("notifierAdminNouveauRendezVous");
  });

  // Une fonctionnalité sans écran serait le défaut habituel : écrite, jamais
  // appelée.
  it("le client voit l'agenda, l'équipe voit le rendez-vous", () => {
    expect(src("app/(public)/compte/reservations/page.tsx")).toContain("RendezVousDepot");
    expect(src("app/(admin)/admin/dossiers-voyage/page.tsx")).toContain("libelleCreneau");
  });

  /**
   * Les jours et heures d'ouverture ne sont PAS redéfinis pour les rendez-vous :
   * ils viennent de `parametres_transport`, où ils vivent depuis 00075. Un
   * second jeu produirait deux calendriers qui finiraient par diverger.
   */
  it("un seul calendrier pour toute la maison", () => {
    // Les horaires ont quitté `parametres_transport` en 00083 : le nom mentait
    // dès lors que les rendez-vous les lisaient aussi. Ce test suit la source
    // partagée, quelle qu'elle soit — ce qui compte est qu'il n'y en ait
    // qu'une, et que les rendez-vous ne redéfinissent rien.
    const params = src("lib/parametres-rendez-vous.ts");
    expect(params).toContain("getHorairesOuverture");
    expect(params).not.toMatch(/jours_ouvres|heure_ouverture|heure_fermeture/);

    const migration = readFileSync(
      join(process.cwd(), "..", "..", "supabase", "migrations", "00081_rendez_vous_dossier.sql"),
      "utf8"
    );
    expect(migration).not.toMatch(/add column .*jours_ouvres|create table .*horaires/i);
  });

  it("le propriétaire règle les créneaux et les fermetures", () => {
    const tarifs = src("app/actions/tarifs.ts");
    for (const nom of ["modifierParametresRendezVous", "basculerFermetureAgence"]) {
      const d = tarifs.indexOf(`export async function ${nom}`);
      expect(d, nom).toBeGreaterThan(-1);
      expect(tarifs.slice(d, d + 600)).toContain("requireProprietaireAvecId()");
    }
    expect(src("app/(admin)/admin/tarifs/page.tsx")).toContain("RendezVousForm");
  });
});
