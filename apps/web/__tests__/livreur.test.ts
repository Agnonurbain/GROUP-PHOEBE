import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  TRANSITIONS_LIVRAISON,
  transitionAutorisee,
  STATUTS_ACTIFS_LIVREUR,
  couvreLaCommune,
  parseZoneCouverture,
} from "@/lib/livraison";
import { accueilSelonRole } from "@/lib/roles";

const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");
const sql = (f: string) =>
  readFileSync(join(process.cwd(), "..", "..", "supabase", "migrations", f), "utf8");

function corpsDeFonction(source: string, nom: string): string {
  const debut = source.indexOf(`export async function ${nom}`);
  if (debut === -1) throw new Error(`Fonction introuvable : ${nom}`);
  const suivante = source.indexOf("\nexport ", debut + 1);
  return source.slice(debut, suivante === -1 ? undefined : suivante);
}

// Le cycle de livraison était libre : n'importe quel statut vers n'importe quel
// autre. Chaque changement écrivant une ligne d'historique (trigger
// `expedition_statut_log`), la timeline publique — seule chose qu'un client
// voit — pouvait afficher une chronologie impossible.
describe("Livraison — machine à états", () => {
  it("le colis suit l'ordre du terrain", () => {
    expect(transitionAutorisee("creee", "prise_en_charge")).toBe(true);
    expect(transitionAutorisee("prise_en_charge", "en_transit")).toBe(true);
    expect(transitionAutorisee("en_transit", "livree")).toBe(true);
  });

  it("on ne saute pas le transit", () => {
    expect(transitionAutorisee("creee", "livree")).toBe(false);
    expect(transitionAutorisee("prise_en_charge", "livree")).toBe(false);
  });

  it("une livraison ne se défait pas", () => {
    expect(TRANSITIONS_LIVRAISON.livree).toHaveLength(0);
    for (const cible of Object.keys(TRANSITIONS_LIVRAISON)) {
      expect(transitionAutorisee("livree", cible)).toBe(false);
    }
  });

  // Un destinataire absent est le cas courant, pas l'exception : sans reprise
  // possible, l'échec serait un cul-de-sac et le colis resterait en l'air.
  it("un échec peut être repris", () => {
    expect(transitionAutorisee("echec_livraison", "prise_en_charge")).toBe(true);
    expect(transitionAutorisee("echec_livraison", "en_transit")).toBe(true);
  });

  it("un échec est possible à chaque étape avant la remise", () => {
    for (const depuis of ["creee", "prise_en_charge", "en_transit"]) {
      expect(transitionAutorisee(depuis, "echec_livraison")).toBe(true);
    }
  });

  it("un statut inconnu n'ouvre aucune transition", () => {
    expect(transitionAutorisee("perdu", "livree")).toBe(false);
    expect(transitionAutorisee("creee", "perdu")).toBe(false);
  });

  // Un statut qui n'est ni terminal ni dans la liste du livreur disparaîtrait
  // de son écran tout en attendant une action de sa part.
  it("tout statut non terminal reste visible par le livreur", () => {
    for (const [statut, suivants] of Object.entries(TRANSITIONS_LIVRAISON)) {
      if (suivants.length > 0) {
        expect(STATUTS_ACTIFS_LIVREUR, statut).toContain(statut);
      }
    }
  });
});

describe("Livraison — le livreur n'agit que sur ses colis", () => {
  const source = src("app/actions/livreur.ts");

  it.each(["avancerStatutLivraison", "confirmerLivraison", "signalerEchecLivraison"])(
    "%s exige un livreur actif et vérifie l'affectation",
    (nom) => {
      const corps = corpsDeFonction(source, nom);
      expect(corps).toContain("requireLivreur()");
      expect(corps).toContain("chargerExpeditionDuLivreur");
    }
  );

  // Les server actions écrivent en clé de service, qui contourne la RLS : le
  // contrôle d'appartenance doit être explicite, sinon un livreur agit sur le
  // colis d'un autre.
  it("l'appartenance est comparée au livreur courant, pas seulement lue", () => {
    expect(source).toMatch(/exp\.livreur_id\s*!==\s*livreurId/);
  });

  it("un livreur désactivé perd l'accès", () => {
    const corps = corpsDeFonction(source, "requireLivreur");
    expect(corps).toMatch(/!livreur\.actif/);
  });

  // Un colis était « livré » parce que quelqu'un l'avait tapé.
  it("la livraison exige une photo et le nom du réceptionnaire", () => {
    const corps = corpsDeFonction(source, "confirmerLivraison");
    expect(corps).toContain('err("unePhotoDeLaRemiseEst")');
    expect(corps).toContain('err("indiquezQuiAReceptionneLeColis")');
  });

  it("un échec exige un motif", () => {
    const corps = corpsDeFonction(source, "signalerEchecLivraison");
    expect(corps).toContain('err("indiquezLeMotifDeLEchec")');
  });

  // Deux validations parties du même écran ne doivent produire qu'une
  // transition, et la seconde ne doit pas réécrire la preuve par-dessus l'autre.
  it("la transition est conditionnée au statut d'origine", () => {
    expect(source).toMatch(/\.eq\("statut",\s*depuis\)/);
  });
});

describe("Livraison — l'admin suit la même machine à états", () => {
  it("changerStatutExpedition refuse une transition impossible", () => {
    const corps = corpsDeFonction(src("app/actions/livraison.ts"), "changerStatutExpedition");
    expect(corps).toContain("transitionAutorisee(");
  });
});

// Le piège a déjà mordu sur les biens avec l'agent immobilier : garde
// applicative qui laisse passer, RLS qui filtre, UPDATE à zéro ligne, et
// l'interface qui répond « enregistré ».
describe("Livraison — accès RLS du livreur", () => {
  const migration = sql("00063_espace_livreur.sql");

  it("le livreur peut lire ses expéditions et leur historique", () => {
    expect(migration).toContain("expeditions_select_livreur");
    expect(migration).toContain("exp_hist_select_livreur");
  });

  it("un livreur désactivé ne résout aucun identifiant", () => {
    expect(migration).toMatch(/own_livreur_id[\s\S]*?and l\.actif/);
  });

  // RLS borne les lignes, jamais les colonnes : sans trigger, un livreur
  // pourrait via l'API REST se réaffecter un colis ou en changer le prix.
  it("un livreur ne peut écrire ni prix, ni affectation, ni client", () => {
    expect(migration).toContain("garde_livreur_expedition");
    expect(migration).toMatch(/new\.prix is distinct from old\.prix/);
    expect(migration).toMatch(/new\.livreur_id is distinct from old\.livreur_id/);
    expect(migration).toMatch(/new\.client_id is distinct from old\.client_id/);
  });

  // Même raison que `garde_montants` : en security definer, `current_user`
  // vaudrait le propriétaire de la fonction et la garde ne verrait jamais
  // le vrai appelant.
  it("la garde reste en security invoker", () => {
    expect(migration).toMatch(/garde_livreur_expedition[\s\S]*?security invoker/);
  });
});

// `zone_couverture` était comparée par égalité stricte à `expeditions.zone`,
// qui vaut `intracommunale` | `intercommunale` | `nationale` : une classe de
// trajet, pas un territoire. Le champ n'étant renseigné nulle part, le filtre
// laissait tout le monde passer — il marchait par accident. Y écrire « Cocody »,
// comme le nom de la colonne le suggère, rendait le livreur inéligible à tout.
describe("Livraison — zone de couverture d'un livreur", () => {
  it("un livreur sans zone dessert tout", () => {
    expect(couvreLaCommune(null, "Cocody")).toBe(true);
    expect(couvreLaCommune("", "Yopougon")).toBe(true);
    expect(couvreLaCommune("   ", "Bouaké")).toBe(true);
  });

  it("une liste de communes est respectée", () => {
    expect(couvreLaCommune("Cocody, Marcory", "Marcory")).toBe(true);
    expect(couvreLaCommune("Cocody, Marcory", "Yopougon")).toBe(false);
  });

  it("la casse, les accents et les espaces ne décident de rien", () => {
    expect(couvreLaCommune("Attécoubé", "attecoube")).toBe(true);
    expect(couvreLaCommune("  Cocody ,Marcory ", "COCODY")).toBe(true);
  });

  // Une commune inconnue sur un colis ne doit pas faire passer un livreur dont
  // la zone est explicitement restreinte.
  it("une zone déclarée exclut un colis sans commune", () => {
    expect(couvreLaCommune("Cocody", null)).toBe(false);
    expect(couvreLaCommune("Cocody", "")).toBe(false);
  });

  // Le vrai piège : l'ancienne sémantique ne doit plus jamais correspondre.
  it("une classe de trajet n'est pas une commune", () => {
    expect(couvreLaCommune("intracommunale", "Cocody")).toBe(false);
  });

  it("parseZoneCouverture ignore les entrées vides", () => {
    expect(parseZoneCouverture("Cocody,, Marcory ,")).toEqual(["Cocody", "Marcory"]);
    expect(parseZoneCouverture(null)).toEqual([]);
  });
});

describe("Livraison — capacité d'un livreur", () => {
  const source = src("app/actions/livreurs-admin.ts");

  it("la modification est réservée au propriétaire", () => {
    const corps = corpsDeFonction(source, "modifierLivreur");
    expect(corps).toContain("requireProprietaire()");
  });

  // Une capacité à 0 ferait un livreur que l'affectation écarte toujours, sans
  // que rien ne le dise. Pour suspendre quelqu'un, il y a la case « actif ».
  it("une capacité nulle ou négative est refusée", () => {
    const corps = corpsDeFonction(source, "modifierLivreur");
    expect(corps).toMatch(/capacite\s*<\s*1/);
  });

  it("l'affectation automatique compare la commune, pas la classe de trajet", () => {
    const corps = corpsDeFonction(src("app/actions/livraison.ts"), "affecterLivreurAuto");
    expect(corps).toContain("commune_collecte");
    expect(corps).not.toMatch(/select\("zone"\)/);
  });

  it("la commune est persistée à la création de l'expédition", () => {
    const corps = corpsDeFonction(src("app/actions/livraison.ts"), "creerExpedition");
    expect(corps).toContain("commune_collecte: communeCollecte");
  });
});

// La photo montre la porte d'un client et le nom de qui a réceptionné : même
// traitement que les factures — bucket privé, chemin stocké, URL signée.
describe("Livraison — la preuve de remise n'est pas publique", () => {
  const source = src("app/actions/livreur.ts");

  it("la preuve part dans le bucket privé, pas dans colis-photos", () => {
    const corps = corpsDeFonction(source, "confirmerLivraison");
    expect(corps).toContain('"livraison-preuves"');
    expect(corps).not.toContain('.from("colis-photos")');
  });

  it("c'est le chemin qui est stocké, jamais une URL publique", () => {
    const corps = corpsDeFonction(source, "confirmerLivraison");
    expect(corps).toContain("preuve_chemin: chemin");
    expect(corps).not.toContain("getPublicUrl");
  });

  it("le bucket est déclaré privé et le client lit les siennes", () => {
    const migration = sql("00064_preuve_privee_et_zones_livreur.sql");
    expect(migration).toMatch(/'livraison-preuves'.*false/);
    expect(migration).toContain("preuves_select_client");
  });

  // Une policy qui référence une colonne pas encore renommée fait échouer toute
  // la migration — la CLI enveloppe chaque fichier dans une transaction, donc
  // rien ne passe. C'est arrivé une fois : le renommage était en bas du fichier.
  it("le renommage précède la policy qui s'appuie dessus", () => {
    const migration = sql("00064_preuve_privee_et_zones_livreur.sql");
    const rename = migration.indexOf("rename column preuve_photo to preuve_chemin");
    const policy = migration.indexOf("e.preuve_chemin = storage.objects.name");
    expect(rename).toBeGreaterThan(-1);
    expect(policy).toBeGreaterThan(rename);
  });
});

// Le colis n'était créé qu'après un paiement en ligne intégral. En Côte
// d'Ivoire, le paiement à la remise est le mode dominant : exiger l'avance
// écartait du service la clientèle qu'il vise.
describe("Livraison — paiement à la livraison", () => {
  const livraison = src("app/actions/livraison.ts");
  const livreur = src("app/actions/livreur.ts");

  it("la commande accepte le paiement à la livraison", () => {
    const corps = corpsDeFonction(livraison, "creerExpedition");
    expect(corps).toContain('"a_la_livraison"');
  });

  it("aucune session prestataire n'est ouverte pour ce mode", () => {
    const corps = corpsDeFonction(livraison, "creerExpedition");
    const idx = corps.indexOf('if (methode === "a_la_livraison")');
    expect(idx).toBeGreaterThan(-1);
    // Le court-circuit précède l'appel aux prestataires.
    expect(idx).toBeLessThan(corps.indexOf("creerSessionStripe("));
    expect(idx).toBeLessThan(corps.indexOf("creerSessionCinetPay("));
  });

  // Remettre le colis et encaisser sont un seul geste : remis sans encaissement
  // c'est une perte sèche, encaissé sans remise c'est une caisse fausse.
  it("la remise exige la confirmation d'encaissement", () => {
    const corps = corpsDeFonction(livreur, "confirmerLivraison");
    expect(corps).toContain('formData.get("encaissement_confirme")');
    expect(corps).toContain('err("confirmezEncaissement"');
  });

  it("la capture n'a lieu qu'une fois la transition acquise", () => {
    // Le paiement est passé à appliquerStatut, qui ne capture qu'après un
    // update ayant touché une ligne.
    expect(livreur).toMatch(/paiementACapturer/);
    expect(livreur).toMatch(/\.eq\("statut", "en_attente"\)/);
  });
});

describe("Livraison — fins de parcours", () => {
  const livraison = src("app/actions/livraison.ts");

  // `echec_livraison` n'est pas terminal, mais quand l'envoi est abandonné rien
  // n'instruisait la suite : le client avait payé un service non rendu.
  it("la clôture d'un échec oriente le paiement selon ce qui a été encaissé", () => {
    const corps = corpsDeFonction(livraison, "cloturerEchecLivraison");
    expect(corps).toContain("remboursement_requis");
    expect(corps).toContain('"echoue"');
  });

  it("on ne clôture que ce qui est en échec", () => {
    const corps = corpsDeFonction(livraison, "cloturerEchecLivraison");
    expect(corps).toContain('err("seuleUneExpeditionEnEchecPeut")');
  });

  // Une fois le colis pris en charge, le livreur s'est déplacé.
  it("le client n'annule que tant que rien n'est engagé", () => {
    const corps = corpsDeFonction(livraison, "annulerExpeditionParClient");
    expect(corps).toMatch(/statut !== STATUT_LIVRAISON\.creee/);
    expect(corps).toMatch(/exp\.client_id !== user\.sub/);
  });

  // Lui retirer son livreur effacerait qui l'a remis, alors que la preuve y renvoie.
  it("un colis livré ne se désaffecte pas", () => {
    const corps = corpsDeFonction(livraison, "desaffecterLivreur");
    expect(corps).toMatch(/STATUT_LIVRAISON\.livree/);
  });
});

// L'annulation réutilisait `echec_livraison` pour éviter un sixième statut.
// Économie de façade : les deux situations n'ont ni les mêmes suites ni la même
// lecture. Ces tests verrouillent la séparation.
describe("Livraison — une annulation n'est pas un échec", () => {
  const livraison = src("app/actions/livraison.ts");

  it("annuler pose le statut dédié, pas un échec", () => {
    const corps = corpsDeFonction(livraison, "annulerExpeditionParClient");
    expect(corps).toMatch(/statut: STATUT_LIVRAISON\.annulee/);
    expect(corps).not.toMatch(/statut: STATUT_LIVRAISON\.echecLivraison/);
  });

  // Sinon le colis restait sur l'écran du livreur, qui pouvait le reprendre et
  // le livrer alors que le paiement est déjà marqué remboursable.
  it("annuler retire le livreur", () => {
    const corps = corpsDeFonction(livraison, "annulerExpeditionParClient");
    expect(corps).toMatch(/livreur_id: null/);
  });

  it("un colis annulé sort de l'écran du livreur", () => {
    expect(STATUTS_ACTIFS_LIVREUR).not.toContain("annulee");
  });

  it("une annulation est terminale — on ne la reprend pas", () => {
    expect(TRANSITIONS_LIVRAISON.annulee).toHaveLength(0);
    for (const cible of Object.keys(TRANSITIONS_LIVRAISON)) {
      expect(transitionAutorisee("annulee", cible)).toBe(false);
    }
  });

  it("on n'annule que ce qui n'est pas encore engagé", () => {
    expect(transitionAutorisee("creee", "annulee")).toBe(true);
    expect(transitionAutorisee("prise_en_charge", "annulee")).toBe(false);
    expect(transitionAutorisee("en_transit", "annulee")).toBe(false);
    expect(transitionAutorisee("livree", "annulee")).toBe(false);
  });

  // Le pire cas évité : la clôture relisait un paiement déjà passé en
  // `remboursement_requis` par l'annulation, ne le voyait pas en `capture`, et
  // le basculait en `echoue` — le remboursement disparaissait de la file, sans
  // bruit, et le client n'était jamais remboursé.
  it("la clôture d'échec ne peut pas rejouer sur une annulation", () => {
    const corps = corpsDeFonction(livraison, "cloturerEchecLivraison");
    expect(corps).toMatch(/statut !== STATUT_LIVRAISON\.echecLivraison/);
  });

  // La clôture ne change pas le statut de l'expédition : elle reste donc
  // rejouable, et c'est le paiement qui doit s'en protéger. Voir aussi
  // statuts-paiement.test.ts, qui étend la règle à tout le dépôt.
  it("un paiement déjà instruit n'est pas retouché par une seconde clôture", () => {
    const corps = corpsDeFonction(livraison, "cloturerEchecLivraison");
    expect(corps).toContain('err("lePaiementDeCetEnvoiEst")');
  });

  // L'inverse touchait l'argent avant d'avoir acquis le droit d'annuler.
  it("l'annulation acquiert la transition avant de toucher au paiement", () => {
    const corps = corpsDeFonction(livraison, "annulerExpeditionParClient");
    const transition = corps.indexOf('STATUT_LIVRAISON.annulee');
    const paiement = corps.indexOf('from("paiements")');
    expect(transition).toBeGreaterThan(-1);
    expect(paiement).toBeGreaterThan(transition);
  });
});

describe("Connexion — chaque rôle atterrit chez lui", () => {
  it("le livreur va sur son espace terrain, pas sur l'espace client", () => {
    expect(accueilSelonRole("livreur")).toBe("/terrain/livreur");
  });

  it.each(["operateur", "proprietaire", "agent_immobilier"])("%s va au back-office", (role) => {
    expect(accueilSelonRole(role)).toBe("/admin");
  });

  it("un client et un rôle inconnu vont sur leur profil", () => {
    expect(accueilSelonRole("client")).toBe("/compte/profil");
    expect(accueilSelonRole(null)).toBe("/compte/profil");
  });
});
