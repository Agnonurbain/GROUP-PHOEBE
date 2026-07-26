import { defineConfig, devices } from "@playwright/test";

// URL cible. Par défaut le serveur `pnpm dev` local (démarré automatiquement).
// Pour tester une preview : E2E_BASE_URL=https://... (mais /api/test-login est
// dev-only, donc les tests authentifiés ne passent qu'en local).
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Démarre le serveur de dev seulement si aucune URL externe n'est fournie.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
