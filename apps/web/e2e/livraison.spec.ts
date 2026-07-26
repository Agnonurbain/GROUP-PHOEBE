import { test, expect } from "@playwright/test";
import { loginAsClient, hasClientCreds } from "./helpers";

// Flux argent (navigable) : la zone et le prix de livraison se calculent
// automatiquement à partir des communes — SANS aller jusqu'au paiement.
test("livraison : zone et prix calculés automatiquement depuis les adresses", async ({ page }) => {
  test.skip(!hasClientCreds, "E2E_CLIENT_EMAIL / E2E_CLIENT_PASSWORD non définis");

  await loginAsClient(page);
  await page.goto("/livraison/commander");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Commander une livraison/);

  // Avant saisie des communes, aucun montant n'est proposé.
  await expect(page.getByRole("button", { name: /Renseignez les adresses/i })).toBeVisible();

  await page.fill("#commune_collecte", "Cocody");
  await page.fill("#commune_livraison", "Cocody");

  // Après saisie, le bouton propose un montant à payer (prix calculé).
  await expect(
    page.getByRole("button", { name: /Payer\s+[\d\s ]+FCFA/ })
  ).toBeVisible();
});
