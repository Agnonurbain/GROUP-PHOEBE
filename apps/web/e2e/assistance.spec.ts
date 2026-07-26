import { test, expect } from "@playwright/test";

// Contenu par pays (source unique lib/assistance).
// La Chine (études) affiche ses prestations chiffrées ; les pays Schengen dont
// le prix n'est pas encore communiqué affichent « Sur devis ».
test("assistance : la fiche Chine affiche ses prestations chiffrées", async ({ page }) => {
  await page.goto("/assistance/pays/chine");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Chine/);
  // Visa étude — accompagnement bourse : 1 800 000 FCFA (séparateur locale-dépendant).
  await expect(page.locator("body")).toContainText(/1[\s,]?800[\s,]?000/);
  await expect(page.getByRole("button", { name: /Soumettre ma demande/i }).first()).toBeVisible();
});

test("assistance : un pays Schengen sans tarif affiche « Sur devis »", async ({ page }) => {
  await page.goto("/assistance/pays/grece");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Grèce/);
  await expect(page.locator("body")).toContainText(/Sur devis/i);
  await expect(page.getByRole("button", { name: /Soumettre ma demande/i }).first()).toBeVisible();
});
