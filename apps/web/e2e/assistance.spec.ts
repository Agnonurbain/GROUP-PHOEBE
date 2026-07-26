import { test, expect } from "@playwright/test";

// Prix par pays (source unique lib/assistance) : la Grèce doit afficher son
// tarif de base (85000), pas un prix générique.
test("assistance : la page pays affiche le tarif spécifique du pays", async ({ page }) => {
  await page.goto("/assistance/pays/grece");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Grèce/);
  // Séparateur des milliers variable selon la locale du navigateur (espace,
  // espace insécable via \s, ou virgule).
  await expect(page.locator("body")).toContainText(/85[\s,]?000/);
  await expect(page.getByRole("button", { name: /Soumettre ma demande/i }).first()).toBeVisible();
});
