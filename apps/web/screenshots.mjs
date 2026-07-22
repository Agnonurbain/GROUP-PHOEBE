import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ibcutjlniuyltbiicimb.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliY3V0amxuaXV5bHRiaWljaW1iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzg3NzQ3MiwiZXhwIjoyMDk5NDUzNDcyfQ.bFDQQqUoiCJw3dKZsEEThZIwmlh8xktToTeVyUUrACQ";

const BASE = "http://localhost:3000";
const DIR = "../../screenshots";

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── 1. Seed extra vehicles ────────────────────────────────────────
async function seedVehicles() {
  const extras = [
    {
      categorie: "leger", marque: "Hyundai", modele: "Tucson", annee: 2023,
      nb_places: 5, climatisation: true, boite: "automatique", carburant: "Diesel",
      kilometrage: 28000, localisation: "Abidjan, Marcory",
      prix_journalier: 30000, prix_mensuel: 550000, chauffeur_disponible: true,
      description: "Hyundai Tucson 2023 diesel, très économique.", statut: "disponible",
    },
    {
      categorie: "leger", marque: "Mercedes-Benz", modele: "Classe E", annee: 2022,
      nb_places: 5, climatisation: true, boite: "automatique", carburant: "Essence",
      kilometrage: 45000, localisation: "Abidjan, Plateau",
      prix_journalier: 75000, prix_mensuel: 1200000, chauffeur_disponible: true,
      description: "Mercedes Classe E 2022, haut de gamme.", statut: "disponible",
    },
    {
      categorie: "minibus", marque: "Toyota", modele: "HiAce", annee: 2021,
      nb_places: 15, climatisation: true, boite: "manuelle", carburant: "Diesel",
      kilometrage: 62000, localisation: "Abidjan, Yopougon",
      prix_journalier: 50000, prix_mensuel: 900000, chauffeur_disponible: true,
      description: "Toyota HiAce 15 places.", statut: "disponible",
    },
  ];

  const { data: existing } = await serviceClient
    .from("vehicules").select("modele").in("modele", ["Tucson", "Classe E", "HiAce"]);
  if (existing && existing.length >= 3) { console.log("Vehicles already seeded."); return; }
  const { error } = await serviceClient.from("vehicules").insert(extras);
  if (error) console.error("Seed error:", error.message);
  else console.log("Seeded 3 extra vehicles.");
}

// ── 2. Auth via browser navigation (GET sets cookies natively) ────
async function login(page, email, password) {
  const url = `${BASE}/api/test-login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
  try {
    await page.goto(url, { waitUntil: "load", timeout: 15000 });
  } catch {}
  await page.waitForTimeout(1000);
  console.log("  Logged in via GET route, URL:", page.url());
  return true;
}

// ── 3. Screenshot helper ─────────────────────────────────────────
async function take(page, name, path, opts = {}) {
  const { waitFor, waitMs = 4000 } = opts;
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 20000 });
  } catch {}
  await page.waitForTimeout(waitMs);
  if (waitFor)
    await page.waitForSelector(waitFor, { timeout: 8000 }).catch(() => {});
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
  console.log(`  ✓ ${name}`);
}

// ── 4. Main ──────────────────────────────────────────────────────
async function run() {
  await seedVehicles();

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // ── Public pages ────────────────────────────────────────────
  console.log("\n📸 Public pages...");
  await take(page, "00-accueil", "/", { waitFor: "footer" });
  await take(page, "01-catalogue", "/catalogue", { waitFor: ".grid > div", waitMs: 5000 });

  const { data: vehicules } = await serviceClient
    .from("vehicules").select("id").eq("statut", "disponible")
    .order("created_at", { ascending: true }).limit(1);
  const vid = vehicules?.[0]?.id;
  if (vid) {
    await take(page, "02-fiche-vehicule", `/catalogue/${vid}`, { waitMs: 5000 });
    await take(page, "03-formulaire-reservation", `/catalogue/${vid}/reserver`);
  }
  await take(page, "04-connexion", "/connexion", { waitFor: 'button[type="submit"]' });

  // ── Login via GET route (browser processes Set-Cookie natively) ──
  console.log("\n📸 Auth pages (proprietaire)...");
  const ok = await login(page, "proprietaire@test.phoebe.ci", "TestPhoebe2025!");
  if (ok) {
    await take(page, "05-profil", "/profil", { waitMs: 6000 });
    await take(page, "06-reservations", "/profil/reservations", { waitMs: 5000 });
    await take(page, "07-favoris", "/profil/favoris", { waitMs: 5000 });
    await take(page, "08-dashboard", "/admin", { waitMs: 6000 });
    await take(page, "09-vehicules-admin", "/admin/vehicules", { waitMs: 5000 });
    await take(page, "10-nouveau-vehicule", "/admin/vehicules/nouveau", { waitMs: 5000 });
    await take(page, "11-demandes", "/admin/demandes", { waitMs: 5000 });
    await take(page, "12-remboursements", "/admin/remboursements", { waitMs: 5000 });
  }

  await browser.close();
  console.log(`\n✅ Done! 13 screenshots in /screenshots/`);
}

run().catch((e) => { console.error(e); process.exit(1); });
