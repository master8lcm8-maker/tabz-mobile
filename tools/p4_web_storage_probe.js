const os = require("os");
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const url = process.argv[2] || "http://localhost:8081";
  const userDataDir = path.join(os.tmpdir(), "tabz-pw-userdata");
  const context = await chromium.launchPersistentContext(userDataDir, { headless: true });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(500);

  const out = await page.evaluate(() => {
    const token = localStorage.getItem("TABZ_AUTH_TOKEN");
    const base = localStorage.getItem("TABZ_API_BASE_URL");
    return {
      href: location.href,
      token: token ? { len: token.length, prefix: token.slice(0,20) } : null,
      baseUrl: base ? base : null,
      allKeys: Object.keys(localStorage).sort(),
    };
  });

  console.log(JSON.stringify(out, null, 2));
  await context.close();
})().catch(e => {
  console.error("PROBE_ERROR", e && e.stack ? e.stack : e);
  process.exit(1);
});
