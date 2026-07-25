import { describe, it, expect, vi } from "vitest";

// getStripe n'est appele que sur le chemin remboursement tardif ; on le neutralise.
vi.mock("@/lib/payments/stripe", () => ({
  getStripe: () => ({ refunds: { create: vi.fn() } }),
}));

const { confirmerCommande, annulerCommande } = await import(
  "@/lib/payments/traitement"
);

// ─── Mock Supabase en memoire : modelise paiements + demandes_transport et les
// chaines de requetes utilisees par traitement.ts (select/eq/single, update/eq,
// delete/eq). Les objets sont mutes en place pour observer les effets. ────────

type Row = Record<string, unknown>;

function createStore(tables: Record<string, Row[]>) {
  function match(row: Row, filters: [string, unknown][]) {
    return filters.every(([c, v]) => row[c] === v);
  }
  return {
    from(table: string) {
      const rows = tables[table] ?? [];
      return {
        select() {
          const filters: [string, unknown][] = [];
          const b = {
            eq(c: string, v: unknown) { filters.push([c, v]); return b; },
            single() {
              const r = rows.find((row) => match(row, filters)) ?? null;
              return Promise.resolve({ data: r, error: null });
            },
            then(resolve: (x: unknown) => void) {
              resolve({ data: rows.filter((row) => match(row, filters)), error: null });
            },
          };
          return b;
        },
        update(vals: Row) {
          const filters: [string, unknown][] = [];
          const b = {
            eq(c: string, v: unknown) { filters.push([c, v]); return b; },
            then(resolve: (x: unknown) => void) {
              const matched = rows.filter((row) => match(row, filters));
              matched.forEach((row) => Object.assign(row, vals));
              resolve({ error: null, count: matched.length });
            },
          };
          return b;
        },
        delete() {
          const filters: [string, unknown][] = [];
          const b = {
            eq(c: string, v: unknown) { filters.push([c, v]); return b; },
            then(resolve: (x: unknown) => void) {
              for (let i = rows.length - 1; i >= 0; i--) {
                if (match(rows[i], filters)) rows.splice(i, 1);
              }
              resolve({ error: null });
            },
          };
          return b;
        },
      };
    },
  };
}

function paiement(id: string, over: Row = {}): Row {
  return {
    id,
    commande_id: "cmd-1",
    module: "transport",
    reference_table: "demandes_transport",
    reference_id: `d-${id}`,
    type: "montant",
    montant: 70000,
    methode: "cinetpay",
    statut: "en_attente",
    webhook_reference: null,
    ...over,
  };
}
function demande(id: string, over: Row = {}): Row {
  return { id, type: "reservation_directe", vehicule_id: `v-${id}`, statut: "en_attente_paiement", periode: "[2026-08-01,2026-08-03)", chauffeur_id: null, ...over };
}

/* eslint-disable @typescript-eslint/no-explicit-any */

describe("Paiement multi-vehicules — confirmation de toute la commande", () => {
  it("confirmer via UN paiement confirme TOUS les paiements du groupe", async () => {
    const paiements = [paiement("p1"), paiement("p2"), paiement("p3")];
    const demandes = [demande("d-p1"), demande("d-p2"), demande("d-p3")];
    const store = createStore({ paiements, demandes_transport: demandes });

    // Le prestataire ne renvoie que p1 (transaction_id de la session).
    const res = await confirmerCommande(store as any, "p1");

    expect(res.ok).toBe(true);
    // Les 3 paiements sont captures, pas seulement p1.
    expect(paiements.every((p) => p.statut === "capture")).toBe(true);
    // Les 3 demandes passent en validation.
    expect(demandes.every((d) => d.statut === "en_attente_validation")).toBe(true);
  });

  it("paiement isole (commande_id null) : seul ce paiement est confirme", async () => {
    const paiements = [
      paiement("solo", { commande_id: null }),
      paiement("autre", { commande_id: null, reference_id: "d-autre" }),
    ];
    const demandes = [demande("d-solo"), demande("d-autre")];
    const store = createStore({ paiements, demandes_transport: demandes });

    await confirmerCommande(store as any, "solo");

    expect(paiements.find((p) => p.id === "solo")!.statut).toBe("capture");
    expect(paiements.find((p) => p.id === "autre")!.statut).toBe("en_attente");
  });

  it("achat : la demande passe en acceptee et le vehicule en reserve", async () => {
    const paiements = [paiement("pa", { commande_id: null })];
    const demandes = [demande("d-pa", { type: "achat" })];
    const vehicules = [{ id: "v-d-pa", statut: "disponible" }];
    const store = createStore({ paiements, demandes_transport: demandes, vehicules });

    await confirmerCommande(store as any, "pa");

    expect(paiements[0].statut).toBe("capture");
    expect(demandes[0].statut).toBe("acceptee");
    expect(vehicules[0].statut).toBe("reserve");
  });

  it("Stripe : le payment_intent est stocke sur TOUS les paiements du groupe (annulation partielle remboursable)", async () => {
    const paiements = [
      paiement("p1", { methode: "stripe" }),
      paiement("p2", { methode: "stripe" }),
      paiement("p3", { methode: "stripe" }),
    ];
    const demandes = [demande("d-p1"), demande("d-p2"), demande("d-p3")];
    const store = createStore({ paiements, demandes_transport: demandes });

    await confirmerCommande(store as any, "p1", "pi_test_123");

    // Chaque paiement porte la reference : annuler un vehicule secondaire pourra
    // etre rembourse automatiquement (rembourserPaiement a besoin du payment_intent).
    expect(paiements.every((p) => p.webhook_reference === "pi_test_123")).toBe(true);
  });

  it("idempotence : un paiement deja capture n'est pas retraite", async () => {
    const paiements = [paiement("p1", { statut: "capture" }), paiement("p2")];
    const demandes = [demande("d-p1"), demande("d-p2")];
    const store = createStore({ paiements, demandes_transport: demandes });

    const res = await confirmerCommande(store as any, "p1");

    expect(res.raison).toBe("Déjà traité");
    // p2 non touche (le webhook rejouera ; le groupe reste coherent)
    expect(paiements.find((p) => p.id === "p2")!.statut).toBe("en_attente");
  });
});

describe("Paiement multi-vehicules — echec de toute la commande", () => {
  it("echouer via UN paiement annule TOUTES les demandes du groupe et libere les vehicules", async () => {
    const paiements = [paiement("p1"), paiement("p2")];
    const demandes = [demande("d-p1"), demande("d-p2")];
    const dispo = [
      { vehicule_id: "v-d-p1", type: "reservation", periode: "[2026-08-01,2026-08-03)" },
      { vehicule_id: "v-d-p2", type: "reservation", periode: "[2026-08-01,2026-08-03)" },
    ];
    const store = createStore({
      paiements,
      demandes_transport: demandes,
      disponibilites_vehicule: dispo,
      disponibilites_chauffeur: [],
    });

    const res = await annulerCommande(store as any, "p1");

    expect(res.ok).toBe(true);
    expect(paiements.every((p) => p.statut === "echoue")).toBe(true);
    expect(demandes.every((d) => d.statut === "annulee")).toBe(true);
    // Les 2 blocages de disponibilite sont liberes.
    expect(dispo.length).toBe(0);
  });
});
