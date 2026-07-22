import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ibcutjlniuyltbiicimb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliY3V0amxuaXV5bHRiaWljaW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4Nzc0NzIsImV4cCI6MjA5OTQ1MzQ3Mn0.sG-OAV6Io8eckh5eGIuC1I4i4zdsTAKZtHtWY6Y4WZM";

const PROJECT_REF = "ibcutjlniuyltbiicimb";
const COOKIE_KEY = `sb-${PROJECT_REF}-auth-token`;

async function run() {
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data } = await anonClient.auth.signInWithPassword({
    email: "proprietaire@test.phoebe.ci",
    password: "TestPhoebe2025!",
  });

  const sessionJson = JSON.stringify(data.session);
  console.log("Session JSON length:", sessionJson.length);
  console.log("encodeURIComponent length:", encodeURIComponent(sessionJson).length);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.addCookies([{
    name: COOKIE_KEY,
    value: sessionJson,
    domain: "localhost",
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
  }]);

  const page = await context.newPage();

  // Intercept requests to see what Cookie header is sent
  page.on("request", (req) => {
    if (req.url().includes("localhost:3000/profil") && req.resourceType() === "document") {
      const cookieHeader = req.headers()["cookie"];
      console.log("\n--- Cookie header sent to /profil ---");
      console.log("Length:", cookieHeader?.length);
      console.log("First 200:", cookieHeader?.substring(0, 200));
      console.log("Contains JSON braces:", cookieHeader?.includes("{"));
    }
  });

  const resp = await page.goto("http://localhost:3000/profil", {
    waitUntil: "load",
    timeout: 15000,
  });
  console.log("\nResponse status:", resp.status(), "URL:", page.url());

  // Check the actual cookies stored
  const cookies = await context.cookies();
  console.log("\nStored cookies:");
  cookies.forEach((c) => {
    console.log(`  ${c.name}: value length=${c.value.length}, first 100=${c.value.substring(0, 100)}`);
  });

  await browser.close();
}

run().catch(console.error);
