// Mock Supabase en mémoire : modélise les chaînes de requêtes utilisées par
// traitement.ts et facture-pdf.ts (select/eq/single/maybeSingle, update/eq,
// delete/eq, insert), le rpc de numérotation et le bucket Storage.
//
// Les objets sont mutés en place pour observer les effets. Extrait de
// checkout-multi-paiement.test.ts pour être partagé avec les tests de facture :
// depuis que la confirmation d'un paiement génère une facture, un store qui ne
// couvre pas ce chemin laisse partir un vrai appel réseau et le test pend
// jusqu'au timeout.

export type Row = Record<string, unknown>;

export type Store = ReturnType<typeof createStore>;

export function createStore(tables: Record<string, Row[]>) {
  const uploads = new Map<string, { bucket: string; contentType?: string }>();

  function match(row: Row, filters: [string, unknown][]) {
    return filters.every(([c, v]) => row[c] === v);
  }

  return {
    // Exposé pour les assertions : ce qui a été déposé dans Storage.
    uploads,

    from(table: string) {
      const rows = (tables[table] ??= []);
      return {
        select() {
          const filters: [string, unknown][] = [];
          const b = {
            eq(c: string, v: unknown) { filters.push([c, v]); return b; },
            single() {
              const r = rows.find((row) => match(row, filters)) ?? null;
              return Promise.resolve({ data: r, error: null });
            },
            maybeSingle() {
              const r = rows.find((row) => match(row, filters)) ?? null;
              return Promise.resolve({ data: r, error: null });
            },
            then(resolve: (x: unknown) => void) {
              resolve({ data: rows.filter((row) => match(row, filters)), error: null });
            },
          };
          return b;
        },
        insert(vals: Row) {
          rows.push({ ...vals });
          return Promise.resolve({ error: null });
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

    // Réplique `prochain_numero_facture()` : lit et incrémente le singleton en
    // un geste, comme l'UPDATE ... RETURNING de la migration 00060.
    rpc(name: string) {
      if (name !== "prochain_numero_facture") {
        return Promise.resolve({ data: null, error: { message: `rpc inconnu : ${name}` } });
      }
      const params = (tables.parametres_facturation ?? [])[0];
      if (!params) {
        return Promise.resolve({ data: null, error: { message: "singleton absent" } });
      }
      const reserve = Number(params.numero_suivant ?? 1);
      params.numero_suivant = reserve + 1;
      const prefixe = String(params.prefixe_facture ?? "FAC");
      const annee = new Date().getFullYear();
      return Promise.resolve({
        data: `${prefixe}-${annee}-${String(reserve).padStart(4, "0")}`,
        error: null,
      });
    },

    storage: {
      from(bucket: string) {
        return {
          upload(path: string, _body: unknown, opts?: { contentType?: string }) {
            uploads.set(path, { bucket, contentType: opts?.contentType });
            return Promise.resolve({ data: { path }, error: null });
          },
          createSignedUrl(path: string, expiresIn: number) {
            return Promise.resolve({
              data: { signedUrl: `https://storage.test/${bucket}/${path}?exp=${expiresIn}` },
              error: null,
            });
          },
        };
      },
    },
  };
}
