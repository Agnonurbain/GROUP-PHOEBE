import { chromium } from "playwright";

const BASE = "http://localhost:3000";

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // Method: context.request.post
  const resp = await context.request.post(`${BASE}/api/test-login`, {
    data: { email: "proprietaire@test.phoebe.ci", password: "TestPhoebe2025!" },
  });

  console.log("Status:", resp.status());
  console.log("Body:", await resp.json());

  // Check response headers
  const headers = resp.headers();
  console.log("\nSet-Cookie headers:");
  const setCookies = resp.headersArray().filter(h => h.name.toLowerCase() === "set-cookie");
  setCookies.forEach((h, i) => {
    console.log(`  [${i}]: ${h.value.substring(0, 150)}...`);
  });

  // Check cookies in context
  const cookies = await context.cookies();
  console.log(`\nCookies in context (${cookies.length}):`);
  cookies.forEach(c => {
    console.log(`  ${c.name}: len=${c.value.length} domain=${c.domain} path=${c.path} secure=${c.secure} httpOnly=${c.httpOnly}`);
  });

  // Navigate to profil
  const page = await context.newPage();

  // Listen for request cookies
  page.on("request", (req) => {
    if (req.url().includes("/profil") && req.resourceType() === "document") {
      const cookie = req.headers()["cookie"];
      console.log(`\nCookie header to /profil: ${cookie ? `length=${cookie.length}` : "NONE"}`);
    }
  });

  await page.goto(`${BASE}/profil`, { waitUntil: "load", timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);
  console.log("\nFinal URL:", page.url());

  await browser.close();
}

run().catch(console.error);
