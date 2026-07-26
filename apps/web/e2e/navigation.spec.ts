import { test, expect } from "@playwright/test";

// Garde-fou de non-régression : cliquer sur une carte du catalogue ne doit PLUS
// donner un 404 (bug corrigé — le slug était comparé aux valeurs brutes en base).
test("catalogue → carte véhicule : pas de 404", async ({ page }) => {
  await page.goto("/transport/catalogue");

  const card = page.locator(
    'a[href^="/transport/vehicule/"], a[href*="/catalogue/groupe/"]'
  ).first();

  test.skip((await card.count()) === 0, "Aucun véhicule dans le catalogue");

  await card.click();
  await page.waitForLoadState("domcontentloaded");

  // Signal POSITIF : fiche véhicule (« Caractéristiques techniques ») ou page de
  // choix (« Que souhaitez-vous faire ? »). Un 404 n'afficherait aucun des deux.
  await expect(page.locator("body")).toContainText(
    /Caractéristiques techniques|Que souhaitez-vous faire|Équipements/
  );
});

test("immobilier → carte bien : pas de 404", async ({ page }) => {
  await page.goto("/immobilier");

  const card = page.locator('a[href^="/immobilier/"]').first();
  test.skip((await card.count()) === 0, "Aucun bien immobilier");

  await card.click();
  await page.waitForLoadState("domcontentloaded");

  await expect(page.getByRole("heading", { name: /Caractéristiques/i })).toBeVisible();
});
