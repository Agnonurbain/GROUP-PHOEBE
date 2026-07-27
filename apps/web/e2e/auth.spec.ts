import { test, expect } from "@playwright/test";

// Couvre les correctifs de la passe auth : ARIA du sélecteur de mode, clavier
// mobile du champ téléphone, cohérence pattern/placeholder, et thème sombre.

test("connexion : le sélecteur de mode expose les rôles ARIA", async ({ page }) => {
  await page.goto("/connexion");

  // L'ancien couple de boutons n'annonçait pas l'état sélectionné.
  const onglets = page.getByRole("tab");
  await expect(onglets).toHaveCount(2);
  await expect(onglets.first()).toHaveAttribute("aria-selected", "true");

  await onglets.nth(1).click();
  await expect(onglets.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
});

test("connexion : le champ téléphone est saisissable sur mobile", async ({ page }) => {
  await page.goto("/connexion");
  const tel = page.getByRole("textbox", { name: "Téléphone" });

  // `numeric` masquait la touche « + », pourtant exigée par le format.
  await expect(tel).toHaveAttribute("inputmode", "tel");

  // Le placeholder doit lui-même satisfaire le pattern du champ : il montrait
  // des espaces que le pattern refusait.
  const pattern = await tel.getAttribute("pattern");
  const placeholder = await tel.getAttribute("placeholder");
  expect(new RegExp(`^${pattern}$`).test(placeholder!)).toBe(true);
});

test("inscription : même sélecteur accessible, âge minimum à 18 ans", async ({ page }) => {
  await page.goto("/inscription");
  await expect(page.getByRole("tab")).toHaveCount(2);
  await expect(page.getByText(/au moins 18 ans/i)).toBeVisible();
});

test("auth : la bascule de thème applique le mode sombre", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByRole("button", { name: /Changer de th/i }).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains("dark")))
    .toBe(true);
});
