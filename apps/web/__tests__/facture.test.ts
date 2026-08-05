import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createStore, type Row } from "./helpers/supabase-store";

vi.mock("@/lib/payments/stripe", () => ({
  getStripe: () => ({ refunds: { create: vi.fn() } }),
}));

const { genererEtStockerFacture } = await import("@/lib/facture-pdf");
const { confirmerCommande } = await import("@/lib/payments/traitement");

/* eslint-disable @typescript-eslint/no-explicit-any */

function paiement(id: string, over: Row = {}): Row {
  return {
    id,
    commande_id: null,
    module: "transport",
    reference_table: "demandes_transport",
    reference_id: `d-${id}`,
    type: "montant",
    montant: 118000,
    methode: "cinetpay",
    statut: "en_attente",
    webhook_reference: null,
    created_at: "2026-07-31T00:00:00Z",
    ...over,
  };
}

function baseTables(over: Record<string, Row[]> = {}) {
  return {
    users: [{ id: "u1", nom: "Awa Koné", telephone: "+2250700000000", email: "awa@test.ci" }],
    parametres_facturation: [{ id: true, taux_tva: 18, numero_suivant: 1, prefixe_facture: "FAC" }],
    factures: [],
    ...over,
  };
}

describe("Facture — génération à la capture du paiement", () => {
  // Le bug d'origine : `paiements` ne porte pas de colonne `client_id`, et la
  // génération lisait `paiement.client_id` (undefined). `factures.client_id`
  // étant NOT NULL, aucune facture n'aurait jamais été créée — sans bruit,
  // l'appelant avalant l'erreur pour ne pas faire échouer l'encaissement.
  it("résout le client depuis la table référencée, pas depuis le paiement", async () => {
    const factures: Row[] = [];
    const store = createStore(baseTables({
      factures,
      demandes_transport: [{ id: "d-p1", client_id: "u1" }],
    }));

    await genererEtStockerFacture(store as any, paiement("p1") as any);

    expect(factures).toHaveLength(1);
    expect(factures[0].client_id).toBe("u1");
    expect(factures[0].paiement_id).toBe("p1");
  });

  it("ventile le TTC encaissé en HT + TVA", async () => {
    const factures: Row[] = [];
    const store = createStore(baseTables({
      factures,
      demandes_transport: [{ id: "d-p1", client_id: "u1" }],
    }));

    await genererEtStockerFacture(store as any, paiement("p1", { montant: 118000 }) as any);

    // Le montant encaissé est le TTC : 118 000 à 18 % => 100 000 HT.
    expect(factures[0].montant_ttc).toBe(118000);
    expect(factures[0].montant_ht).toBeCloseTo(100000, 2);
    expect(factures[0].taux_tva).toBe(18);
  });

  // Chaque ligne d'un panier multi-véhicules est un paiement distinct, capturé
  // dans la même transaction prestataire. La numérotation lisait puis
  // incrémentait en deux temps : deux factures pouvaient porter le même numéro,
  // et `factures.numero` étant unique, la seconde était perdue en silence.
  it("attribue un numéro distinct à chaque facture", async () => {
    const factures: Row[] = [];
    const store = createStore(baseTables({
      factures,
      demandes_transport: [
        { id: "d-p1", client_id: "u1" },
        { id: "d-p2", client_id: "u1" },
        { id: "d-p3", client_id: "u1" },
      ],
    }));

    await Promise.all([
      genererEtStockerFacture(store as any, paiement("p1") as any),
      genererEtStockerFacture(store as any, paiement("p2") as any),
      genererEtStockerFacture(store as any, paiement("p3") as any),
    ]);

    const numeros = factures.map((f) => f.numero);
    expect(numeros).toHaveLength(3);
    expect(new Set(numeros).size).toBe(3);
  });

  it("un webhook rejoué ne crée pas de seconde facture ni ne consomme un numéro", async () => {
    const factures: Row[] = [];
    const params = [{ id: true, taux_tva: 18, numero_suivant: 1, prefixe_facture: "FAC" }];
    const store = createStore(baseTables({
      factures,
      parametres_facturation: params,
      demandes_transport: [{ id: "d-p1", client_id: "u1" }],
    }));

    await genererEtStockerFacture(store as any, paiement("p1") as any);
    await genererEtStockerFacture(store as any, paiement("p1") as any);

    expect(factures).toHaveLength(1);
    // Un numéro réservé n'est jamais rendu : le second appel ne doit pas en brûler un.
    expect(params[0].numero_suivant).toBe(2);
  });

  // Le bucket `factures` est privé — une facture porte le nom, le téléphone,
  // l'email et les montants d'un client. Stocker une URL publique donnait un
  // lien mort dès l'émission ; c'est le chemin qui est conservé, et l'URL est
  // signée à la demande après contrôle du demandeur.
  it("dépose le PDF dans le bucket factures et conserve le chemin, pas une URL", async () => {
    const factures: Row[] = [];
    const store = createStore(baseTables({
      factures,
      demandes_transport: [{ id: "d-p1", client_id: "u1" }],
    }));

    await genererEtStockerFacture(store as any, paiement("p1") as any);

    const [[chemin, meta]] = [...store.uploads.entries()];
    expect(meta.bucket).toBe("factures");
    expect(meta.contentType).toBe("application/pdf");
    expect(chemin).toBe(`${factures[0].numero}.pdf`);
    expect(factures[0].pdf_chemin).toBe(chemin);
    expect(String(factures[0].pdf_chemin)).not.toMatch(/^https?:/);
  });

  it("résout le client des autres modules (billet, immobilier, expédition)", async () => {
    for (const [table, id] of [
      ["demandes_billet", "b1"],
      ["demandes_immobilier", "i1"],
      ["expeditions", "e1"],
      ["dossiers_voyage", "v1"],
    ] as const) {
      const factures: Row[] = [];
      const store = createStore(baseTables({
        factures,
        [table]: [{ id: `d-${id}`, client_id: "u1" }],
      }));

      await genererEtStockerFacture(
        store as any,
        paiement(id, { reference_table: table }) as any
      );

      expect(factures, table).toHaveLength(1);
      expect(factures[0].reference_table).toBe(table);
    }
  });
});

// Le bucket est privé et la facture porte le nom, le téléphone, l'email et les
// montants d'un client. Ce qui protège l'accès n'est pas testable en unitaire —
// c'est la RLS — mais le contournement l'est : lire la facture en clé de service
// rendrait n'importe laquelle lisible par qui connaît un identifiant. Ce test
// lit le source et casse si la lecture bascule sur le client admin.
describe("Facture — le téléchargement passe par la session du demandeur", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "app/actions/factures.ts"),
    "utf8"
  );

  const corps = (() => {
    const debut = source.indexOf("export async function telechargerFacture");
    if (debut === -1) throw new Error("telechargerFacture introuvable");
    const fin = source.indexOf("\nexport ", debut + 1);
    return source.slice(debut, fin === -1 ? undefined : fin);
  })();

  it("lit la facture avec le client de session, pas en clé de service", () => {
    // Tolérant au formatage, strict sur le client utilisé.
    const lecture = corps.slice(0, corps.indexOf(".storage"));
    expect(lecture).toMatch(/supabase\s*\.from\("factures"\)/);
    expect(lecture).not.toMatch(/admin\s*\.from\("factures"\)/);
  });

  it("signe l'URL au lieu de renvoyer un lien public", () => {
    expect(corps).toContain("createSignedUrl");
    expect(corps).not.toContain("getPublicUrl");
  });

  it("vérifie l'authentification avant toute lecture", () => {
    expect(corps.indexOf("getUser()")).toBeLessThan(corps.indexOf('.from("factures")'));
    expect(corps).toContain('err("nonAuthentifie")');
  });
});

describe("Facture — l'encaissement prime", () => {
  // Une facture ratée ne doit pas renvoyer un statut d'erreur au prestataire :
  // il rejouerait le webhook sur un paiement déjà capturé.
  it("un échec de facture ne fait pas échouer la confirmation du paiement", async () => {
    const paiements = [paiement("p1")];
    // Aucune ligne dans demandes_transport : le client est introuvable,
    // la génération de facture lève.
    const store = createStore(baseTables({
      paiements,
      demandes_transport: [{ id: "d-p1", statut: "en_attente_paiement", type: "reservation_directe", vehicule_id: "v1", chauffeur_id: null, periode: "[2026-08-01,2026-08-03)" }],
      factures: [],
    }));

    const res = await confirmerCommande(store as any, "p1");

    expect(res.ok).toBe(true);
    expect(paiements[0].statut).toBe("capture");
  });
});
