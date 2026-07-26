import { test, expect } from "@playwright/test";

// Les pages publiques répondent et affichent leur titre principal.
const pages: { path: string; h1: RegExp }[] = [
  { path: "/", h1: /excellence/i },
  { path: "/transport/catalogue", h1: /Notre Flotte/i },
  { path: "/immobilier", h1: /bien de vos rêves/i },
  { path: "/livraison", h1: /Livraison de colis/i },
  { path: "/assistance", h1: /votre visa/i },
  { path: "/contact", h1: /Parlons de votre projet/i },
  { path: "/suivi", h1: /Suivre un colis/i },
];

for (const p of pages) {
  test(`page ${p.path} charge et affiche son titre`, async ({ page }) => {
    const res = await page.goto(p.path);
    expect(res?.status(), `statut HTTP de ${p.path}`).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(p.h1);
  });
}
