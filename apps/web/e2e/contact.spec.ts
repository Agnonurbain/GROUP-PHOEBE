import { test, expect } from "@playwright/test";

// Le paramètre ?sujet= pré-sélectionne la bonne catégorie (sans rien soumettre).
test("contact : ?sujet=estimation-bien pré-sélectionne « Immobilier »", async ({ page }) => {
  await page.goto("/contact?sujet=estimation-bien");
  await expect(page.locator("#c-sujet")).toHaveValue("Immobilier");
  await expect(page.locator("#c-message")).toHaveValue(/estimation/i);
});
