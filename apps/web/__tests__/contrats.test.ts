import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  contratMobilise,
  periodesDues,
  jourIso,
  type CreneauContrat,
} from "@/lib/contrats";

const base: CreneauContrat = {
  jours_semaine: [1, 2, 3, 4, 5],
  heure_debut: "06:30",
  heure_fin: "08:00",
  date_debut: "2026-09-01",
  date_fin: "2027-06-30",
  statut: "actif",
};

const d = (iso: string) => new Date(iso);

// Un ramassage scolaire court sur neuf mois mais ne prend le véhicule que le
// matin, les jours d'école. Le poser dans `disponibilites_vehicule` comme un
// intervalle continu l'immobiliserait en bloc — d'où le créneau confronté à la
// demande plutôt qu'une réservation posée.
describe("Contrats — ce que le créneau mobilise vraiment", () => {
  it("le véhicule est pris pendant le créneau, un jour desservi", () => {
    // Mardi 15 septembre 2026, 7h-7h30.
    expect(contratMobilise(base, d("2026-09-15T07:00:00Z"), d("2026-09-15T07:30:00Z"))).toBe(true);
  });

  it("il reste louable le reste de la journée", () => {
    // Même mardi, mais l'après-midi : hors créneau.
    expect(contratMobilise(base, d("2026-09-15T14:00:00Z"), d("2026-09-15T18:00:00Z"))).toBe(false);
  });

  it("il reste louable les jours non desservis", () => {
    // Samedi 19 septembre, en plein dans la plage horaire.
    expect(contratMobilise(base, d("2026-09-19T06:45:00Z"), d("2026-09-19T07:30:00Z"))).toBe(false);
  });

  // C'est le cœur du sujet : sans cette nuance, l'abonnement bloquerait neuf
  // mois de location.
  it("une location de plusieurs jours croisant un jour desservi est bloquée", () => {
    expect(contratMobilise(base, d("2026-09-14T00:00:00Z"), d("2026-09-16T00:00:00Z"))).toBe(true);
  });

  it("un week-end complet passe entre les créneaux", () => {
    // Samedi 00h au dimanche 23h : aucun jour desservi.
    expect(contratMobilise(base, d("2026-09-19T00:00:00Z"), d("2026-09-20T23:00:00Z"))).toBe(false);
  });

  it("rien n'est mobilisé hors de la durée du contrat", () => {
    expect(contratMobilise(base, d("2026-08-25T07:00:00Z"), d("2026-08-25T07:30:00Z"))).toBe(false);
    expect(contratMobilise(base, d("2027-07-06T07:00:00Z"), d("2027-07-06T07:30:00Z"))).toBe(false);
  });

  it("un contrat sans terme mobilise indéfiniment", () => {
    const sansFin = { ...base, date_fin: null };
    expect(contratMobilise(sansFin, d("2030-09-17T07:00:00Z"), d("2030-09-17T07:30:00Z"))).toBe(true);
  });

  it.each(["suspendu", "resilie"])("un contrat %s ne mobilise rien", (statut) => {
    expect(contratMobilise({ ...base, statut }, d("2026-09-15T07:00:00Z"), d("2026-09-15T07:30:00Z"))).toBe(false);
  });

  // Un contrat sans jour ni horaire ne décrit aucun usage : le traiter comme un
  // blocage total condamnerait le véhicule sur une saisie incomplète.
  it("un contrat sans créneau ne mobilise rien", () => {
    expect(contratMobilise({ ...base, jours_semaine: [] }, d("2026-09-15T07:00:00Z"), d("2026-09-15T07:30:00Z"))).toBe(false);
    expect(contratMobilise({ ...base, heure_debut: null, heure_fin: null }, d("2026-09-15T07:00:00Z"), d("2026-09-15T07:30:00Z"))).toBe(false);
  });

  it("dimanche vaut 7, pas 0", () => {
    expect(jourIso(d("2026-09-20T12:00:00Z"))).toBe(7);
    expect(jourIso(d("2026-09-14T12:00:00Z"))).toBe(1);
  });
});

// La génération est un cron, donc rejouable. Elle rattrape aussi un contrat
// créé en retard ou un cron qui n'a pas tourné.
describe("Contrats — périodes de facturation", () => {
  it("une mensualité par mois écoulé", () => {
    const p = periodesDues("2026-09-01", null, "mensuelle", d("2026-11-15T00:00:00Z"));
    expect(p.map((x) => x.debut)).toEqual(["2026-09-01", "2026-10-01", "2026-11-01"]);
    expect(p[0].fin).toBe("2026-09-30");
  });

  it("le trimestre couvre trois mois", () => {
    const p = periodesDues("2026-09-01", null, "trimestrielle", d("2026-10-01T00:00:00Z"));
    expect(p).toHaveLength(1);
    expect(p[0]).toEqual({ debut: "2026-09-01", fin: "2026-11-30" });
  });

  // Facturer au-delà du terme ferait payer un service qui n'est plus rendu.
  it("la dernière période s'arrête au terme du contrat", () => {
    const p = periodesDues("2026-09-01", "2026-10-15", "mensuelle", d("2027-01-01T00:00:00Z"));
    expect(p).toHaveLength(2);
    expect(p[1]).toEqual({ debut: "2026-10-01", fin: "2026-10-15" });
  });

  it("rien n'est dû avant le début", () => {
    expect(periodesDues("2026-09-01", null, "mensuelle", d("2026-08-15T00:00:00Z"))).toEqual([]);
  });

  // Une date aberrante en base ne doit pas faire tourner le cron sans fin.
  it("le rattrapage est borné", () => {
    const p = periodesDues("1900-01-01", null, "mensuelle", d("2026-09-01T00:00:00Z"));
    expect(p.length).toBeLessThanOrEqual(240);
  });
});

const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");

function corpsDeFonction(source: string, nom: string): string {
  const debut = source.indexOf(`export async function ${nom}`);
  if (debut === -1) throw new Error(`Fonction introuvable : ${nom}`);
  const suivante = source.indexOf("\nexport ", debut + 1);
  return source.slice(debut, suivante === -1 ? undefined : suivante);
}

describe("Contrats — garanties d'écriture", () => {
  const actions = src("app/actions/contrats.ts");
  const generation = src("lib/payments/echeances-contrats.ts");

  // Un abonnement engage un montant périodique : même règle que partout ailleurs.
  it.each(["creerContrat", "changerStatutContrat", "changerStatutEcheance"])(
    "%s est réservée au propriétaire",
    (nom) => {
      expect(corpsDeFonction(actions, nom)).toContain("requireProprietaire()");
    }
  );

  // Le verrou de l'idempotence : le cron est rejouable, et sans lui un second
  // passage facturerait deux fois la même période.
  it("la génération s'appuie sur le conflit d'unicité, pas sur une lecture préalable", () => {
    expect(generation).toMatch(/error\.code !== "23505"/);
    expect(generation).not.toMatch(/select[\s\S]{0,120}periode_debut[\s\S]{0,80}insert/);
  });

  // Sans montant ni fréquence, l'abonnement décrit un service, pas un
  // engagement de paiement : le facturer à zéro produirait des lignes vides.
  it("un contrat non facturable ne génère pas d'échéance", () => {
    expect(generation).toContain("isFrequence(c.frequence_facturation)");
    expect(generation).toMatch(/montant <= 0/);
  });

  // Réactiver rattraperait toute la période d'interruption comme si le service
  // avait été rendu.
  it("un contrat résilié ne se réactive pas", () => {
    const corps = corpsDeFonction(actions, "changerStatutContrat");
    expect(corps).toMatch(/statut === "resilie"/);
    expect(corps).toContain("Créez-en un nouveau");
  });

  it("les transitions d'échéance portent sur l'état attendu", () => {
    const corps = corpsDeFonction(actions, "changerStatutEcheance");
    expect(corps).toMatch(/\.eq\("statut", echeance\.statut\)/);
    expect(corps).toContain("depuisAutorises");
  });
});

describe("Contrats — l'abonnement ne bloque pas le véhicule en continu", () => {
  const assignation = src("app/actions/vehicle-assignment.ts");

  it("l'affectation confronte la demande au créneau", () => {
    expect(assignation).toContain("contratMobilise");
    expect(assignation).toContain("prisParAbonnement");
  });

  // Le poser dans disponibilites_vehicule immobiliserait le véhicule sur toute
  // la durée de l'abonnement.
  it("aucune réservation n'est posée pour un abonnement", () => {
    const contrats = src("app/actions/contrats.ts");
    expect(contrats).not.toContain("disponibilites_vehicule");
  });

  it("le véhicule est écarté avant toute écriture", () => {
    const bloc = assignation.slice(assignation.indexOf("prisParAbonnement(v.id)"));
    expect(bloc.indexOf("continue")).toBeLessThan(bloc.indexOf("disponibilites_vehicule"));
  });
});

describe("Devis — l'échéance est portée par la donnée", () => {
  const negociation = src("app/actions/negociation.ts");
  const expiration = src("lib/payments/expiration-demandes.ts");
  const reservations = src("app/(public)/compte/reservations/page.tsx");

  it("l'échéance est écrite à l'ouverture de la négociation", () => {
    expect(negociation).toContain("devis_expire_at");
  });

  // Elle se calculait depuis updated_at : toute écriture sur la demande — une
  // note d'opérateur — repoussait l'expiration sans que personne l'ait décidé.
  it("le cron lit la colonne, avec un repli pour l'existant", () => {
    expect(expiration).toMatch(/devis_expire_at\.lt\./);
    expect(expiration).toMatch(/devis_expire_at\.is\.null/);
  });

  it("le client voit jusqu'à quand son devis tient", () => {
    expect(reservations).toContain("devis_expire_at");
    expect(reservations).toContain("Devis valable jusqu");
  });
});

describe("Réservation — le code mort est retiré, pas la donnée", () => {
  // `creerReservation` n'était appelée de nulle part, et c'était le seul endroit
  // qui collectait les conducteurs secondaires : la supprimer sans déplacer la
  // collecte aurait vidé l'écran de vérification qu'on venait de construire.
  it("creerReservation n'existe plus", () => {
    expect(existsSync(join(process.cwd(), "src", "app/actions/reservation.ts"))).toBe(false);
  });

  it("le panier collecte désormais le second conducteur", () => {
    const checkout = src("app/actions/checkout.ts");
    expect(checkout).toContain("conducteur_secondaire_nom");
    expect(checkout).toContain("conducteurs_secondaires");
    // Bucket privé : le chemin est stocké, jamais une URL publique.
    expect(checkout).toContain("identity-documents");
    expect(checkout).not.toMatch(/getPublicUrl[\s\S]{0,80}conducteur/);
  });

  it("le formulaire de paiement présente les champs", () => {
    const page = src("app/(public)/panier/paiement/page-client.tsx");
    expect(page).toContain('name="conducteur_secondaire_nom"');
    expect(page).toContain('name="conducteur_secondaire_permis"');
  });
});

// Les trois délais du cycle transport vivaient dans `lib/constants.ts` : les
// changer demandait un déploiement, alors que l'un d'eux décide d'une rétention
// de caution.
describe("Transport — délais pilotables", () => {
  const actions = src("app/actions/tarifs.ts");

  it("le réglage est réservé au propriétaire", () => {
    const corps = corpsDeFonction(actions, "modifierDelaisTransport");
    expect(corps).toContain("requireProprietaireAvecId()");
  });

  // Un délai nul ferait expirer instantanément tout ce qui entre dans le
  // circuit ; au-delà d'une semaine, l'expiration ne protège plus rien.
  it("les délais sont bornés", () => {
    const corps = corpsDeFonction(actions, "modifierDelaisTransport");
    expect(corps).toMatch(/valeur <= 0 \|\| valeur > 168/);
  });

  it("les trois délais sont pilotés, pas seulement la négociation", () => {
    const corps = corpsDeFonction(actions, "modifierDelaisTransport");
    for (const champ of [
      "delai_negociation_heures",
      "delai_sans_reponse_heures",
      "delai_non_presentation_heures",
    ]) {
      expect(corps, champ).toContain(champ);
    }
  });

  // Le repli compte : ces délais pilotent des crons qui libèrent des véhicules
  // et retiennent des cautions. Une lecture ratée les rendrait nuls, et
  // l'expiration s'appliquerait à tout — y compris à une réservation d'hier.
  it("une lecture ratée retombe sur les constantes historiques", () => {
    const lib = src("lib/parametres-transport.ts");
    expect(lib).toContain("PARAMETRES_TRANSPORT_DEFAUT");
    expect(lib).toMatch(/if \(!data\) return PARAMETRES_TRANSPORT_DEFAUT/);
  });

  // Les deux divergeraient au premier changement.
  it("le délai annoncé au client suit le réglage", () => {
    const composant = src("components/public/demander-prix.tsx");
    expect(composant).toMatch(/delai: string/);
    expect(composant).toMatch(/replace\("\{delai\}", delai\)/);
    // Aucune durée figée dans la phrase du dictionnaire.
    expect(src("lib/i18n/fr.ts")).not.toMatch(/réservé 30 minutes/);
  });

  it("les crons lisent le paramètre, plus la constante", () => {
    const expiration = src("lib/payments/expiration-demandes.ts");
    expect(expiration).toContain("getParametresTransport");
    expect(expiration).not.toContain("DELAI_SANS_REPONSE_HEURES *");
  });
});
