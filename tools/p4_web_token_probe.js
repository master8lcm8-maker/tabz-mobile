const os = require("os");
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const url = process.argv[2] || "http://localhost:8081";
  const key = "TABZ_AUTH_TOKEN";

  const userDataDir = path.join(os.tmpdir(), "tabz-pw-userdata");
const context = await chromium.launchPersistentContext(userDataDir, { headless: true });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });

  const token = await page.evaluate((k) => {
    try { return localStorage.getItem(k); } catch { return null; }
  }, key);

  console.log(JSON.stringify({
    url,
    key,
    hasToken: !!(token && String(token).trim().length > 0),
    tokenPrefix: token ? String(token).slice(0, 20) : null,
    tokenLen: token ? String(token).length : 0
  }, null, 2));

  await context.close();
})().catch(e => {
  console.error("PLAYWRIGHT_ERROR", e && e.stack ? e.stack : e);
  process.exit(1);
});

