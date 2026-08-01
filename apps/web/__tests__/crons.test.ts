import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Toute route cron doit être planifiée, et toute planification doit viser une
 * route existante.
 *
 * `expirer-demandes-immobilier` existait depuis 00048 et n'était dans aucun
 * `schedule` : jamais appelée. Les demandes sans réponse restaient ouvertes
 * indéfiniment et le bien demeurait masqué du catalogue — une panne silencieuse,
 * puisqu'un cron qui ne tourne pas ne produit aucune erreur.
 */

const RACINE = join(process.cwd(), "..", "..");
const workflow = readFileSync(join(RACINE, ".github", "workflows", "cron.yml"), "utf8");

function routesDeclarees(): string[] {
  return readdirSync(join(process.cwd(), "src", "app", "api", "cron"), {
    withFileTypes: true,
  })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

function routesPlanifiees(): string[] {
  return [
    ...new Set([...workflow.matchAll(/path=api\/cron\/([a-z-]+)/g)].map((m) => m[1])),
  ].sort();
}

describe("Crons — planification", () => {
  it("chaque route cron est planifiée", () => {
    const declarees = routesDeclarees();
    const planifiees = routesPlanifiees();
    const orphelines = declarees.filter((r) => !planifiees.includes(r));
    expect(orphelines).toEqual([]);
  });

  it("chaque planification vise une route existante", () => {
    const declarees = routesDeclarees();
    const fantomes = routesPlanifiees().filter((r) => !declarees.includes(r));
    expect(fantomes).toEqual([]);
  });

  // Le `case` associe une expression cron à une route : deux routes sur la même
  // expression, et l'une des deux ne serait jamais appelée.
  it("aucune expression cron n'est utilisée deux fois", () => {
    const expressions = [...workflow.matchAll(/- cron: '([^']+)'/g)].map((m) => m[1]);
    expect(new Set(expressions).size).toBe(expressions.length);
  });

  it("chaque expression planifiée est associée à une route", () => {
    const expressions = [...workflow.matchAll(/- cron: '([^']+)'/g)].map((m) => m[1]);
    const associees = [...workflow.matchAll(/"([^"]+)"\)\s*echo "path=/g)].map((m) => m[1]);
    const sansRoute = expressions.filter((e) => !associees.includes(e));
    expect(sansRoute).toEqual([]);
  });

  // Un cron qui s'authentifie mal échoue en silence côté appelant si l'erreur
  // est avalée : le workflow doit rester en échec visible.
  it("l'appel échoue bruyamment", () => {
    expect(workflow).toContain("--fail");
    expect(workflow).toContain("set -euo pipefail");
  });
});

describe("Crons — chaque route se protège", () => {
  it.each(routesDeclarees())("%s exige le secret et échoue fermée", (route) => {
    const code = readFileSync(
      join(process.cwd(), "src", "app", "api", "cron", route, "route.ts"),
      "utf8"
    );
    // On vérifie le comportement, pas la formulation du message : la première
    // version de ce test comparait une chaîne littérale et échouait sur un
    // simple accent, alors que la garde était correcte.
    //
    // Fail closed : sans secret configuré, le littéral vaudrait
    // "Bearer undefined" — chaîne que n'importe qui peut envoyer.
    expect(code, route).toMatch(/const secret = process\.env\.CRON_SECRET/);
    expect(code, route).toMatch(/if \(!secret\)[\s\S]{0,140}status: 500/);
    expect(code, route).toMatch(/authHeader !== `Bearer \$\{secret\}`/);
    expect(code, route).toMatch(/status: 401/);
  });
});
