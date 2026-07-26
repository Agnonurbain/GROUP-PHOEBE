import { type Page, expect } from "@playwright/test";

// Identifiants d'un compte CLIENT de test (voir TEST_ACCOUNTS.md).
// À définir dans l'environnement pour activer les tests authentifiés :
//   E2E_CLIENT_EMAIL, E2E_CLIENT_PASSWORD
export const CLIENT_EMAIL = process.env.E2E_CLIENT_EMAIL;
export const CLIENT_PASSWORD = process.env.E2E_CLIENT_PASSWORD;

export const hasClientCreds = Boolean(CLIENT_EMAIL && CLIENT_PASSWORD);

// Connexion via la route de test (dev only) : pose les cookies de session.
export async function loginAsClient(page: Page): Promise<void> {
  if (!CLIENT_EMAIL || !CLIENT_PASSWORD) {
    throw new Error("E2E_CLIENT_EMAIL / E2E_CLIENT_PASSWORD non définis.");
  }
  await page.goto(
    `/api/test-login?email=${encodeURIComponent(CLIENT_EMAIL)}&password=${encodeURIComponent(CLIENT_PASSWORD)}`
  );
  await expect(page).toHaveURL("/");
}
