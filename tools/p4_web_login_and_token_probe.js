const os = require("os");
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const base = process.argv[2] || "http://localhost:8081";
  const email = process.argv[3] || "buyer@tabz.app";
  const password = process.argv[4] || "password";
  const key = "TABZ_AUTH_TOKEN";

  const userDataDir = path.join(os.tmpdir(), "tabz-pw-userdata");
const context = await chromium.launchPersistentContext(userDataDir, { headless: true });
  const page = await context.newPage();

  await page.goto(base + "/login", { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(800);

  const candidates = [
    page.locator("input"),
    page.locator("[role='textbox']"),
    page.locator("textarea"),
  ];

  let inputs = null;
  for (const loc of candidates) {
    const c = await loc.count();
    if (c >= 2) { inputs = loc; break; }
  }

  if (!inputs) {
    const url = page.url();
    const title = await page.title().catch(() => "");
    const bodyText = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 800) : "");
    console.log(JSON.stringify({
      base,
      url,
      title,
      bodyTextPreview: bodyText
    }, null, 2));
    throw new Error("LOGIN_UI: could not find 2 text fields on /login");
  }

  await inputs.nth(0).fill(email);
  await inputs.nth(1).fill(password);

  const clickers = [
    page.getByText("Log in", { exact: false }),
    page.locator("button").filter({ hasText: "Log" }),
    page.locator("text=Log in"),
  ];

  let clicked = false;
  for (const c of clickers) {
    try {
      if (await c.count() > 0) {
        await c.first().click({ timeout: 3000 });
        clicked = true;
        break;
      }
    } catch {}
  }
  if (!clicked) throw new Error("LOGIN_UI: could not find a Log in button");

  await page.waitForTimeout(1500);

  const token = await page.evaluate((k) => {
    try { return localStorage.getItem(k); } catch { return null; }
  }, key);

  console.log(JSON.stringify({
    base,
    loginUrl: base + "/login",
    key,
    hasToken: !!(token && String(token).trim().length > 0),
    tokenPrefix: token ? String(token).slice(0, 20) : null,
    tokenLen: token ? String(token).length : 0,
    currentUrl: page.url()
  }, null, 2));

  await context.close();
})().catch(e => {
  console.error("WEB_LOGIN_PROBE_ERROR", e && e.stack ? e.stack : e);
  process.exit(1);
});

