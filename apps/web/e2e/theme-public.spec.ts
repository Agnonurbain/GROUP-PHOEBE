import { test, expect } from "@playwright/test";

// Le site public est SOMBRE par défaut (identité verrouillée dans design.md).
// Le mode clair est une variante explicite, jamais l'état initial.

test("public : sombre par défaut, aucune classe imposée au premier rendu", async ({ page }) => {
  await page.goto("/");
  const fond = await page.evaluate(
    () => getComputedStyle(document.querySelector("[data-vertical]")!).backgroundColor
  );
  expect(fond).toBe("rgb(20, 19, 18)");
});

test("public : la bascule applique le mode clair", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Changer de th/i }).first().click();

  await expect
    .poll(() =>
      page.evaluate(
        () => getComputedStyle(document.querySelector("[data-vertical]")!).backgroundColor
      )
    )
    .toBe("rgb(250, 249, 247)");

  // Régression : les composants figeaient les valeurs de la palette en hex,
  // ce qui rendait le bouton « Connexion » invisible en clair.
  const connexion = page.getByRole("link", { name: "Connexion" });
  if (await connexion.count()) {
    const couleur = await connexion.locator("button").evaluate((el) => getComputedStyle(el).color);
    expect(couleur).toBe("rgb(28, 26, 24)");
  }
});
