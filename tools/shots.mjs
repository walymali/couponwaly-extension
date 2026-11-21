// Capture the raw Chrome Web Store screenshots from the real extension running on a real shop, into test/raw.
// Frame them afterwards with tools/compose.mjs. Usage: node tools/shots.mjs
import { chromium } from '/Users/walysmac/GitHub/quire/node_modules/playwright/index.mjs';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const ext = path.join(root, 'src');
const raw = path.join(root, 'test', 'raw');
const outDir = path.join(root, 'store', 'images');
fs.mkdirSync(raw, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const SHOP = 'https://www.mumzworld.com/sa-ar';
const ctx = await chromium.launchPersistentContext('', {
  headless: true, channel: 'chromium', locale: 'ar-SA', viewport: { width: 1280, height: 800 },
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--lang=ar'],
  permissions: ['clipboard-read', 'clipboard-write'],
});
let [sw] = ctx.serviceWorkers();
if (!sw) sw = await ctx.waitForEvent('serviceworker');
const extId = new URL(sw.url()).host;
await sw.evaluate(() => chrome.storage.local.set({ lang: 'ar', cc: 'sa' }));
await new Promise((r) => setTimeout(r, 5000));

const page = ctx.pages()[0] || (await ctx.newPage());
for (const p of ctx.pages()) if (p !== page) await p.close();

async function card() {
  return page.evaluate(() => {
    const e = [...document.documentElement.children].find((x) => x.tagName === 'DIV' && x.style.zIndex === '2147483647');
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}

// 1 + 2: the card on the shop, and the card on the basket page where it opens by itself.
await page.goto(SHOP, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(7000);
await page.keyboard.press('Escape').catch(() => {});
await page.waitForTimeout(1500);
let b = await card();
if (b) { await page.mouse.click(b.x + b.width / 2, b.y + b.height - 20); await page.waitForTimeout(1500); }
await page.screenshot({ path: path.join(raw, '1.png') });

await page.goto(`${SHOP}#basket`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(7000);
await page.keyboard.press('Escape').catch(() => {});
await page.waitForTimeout(1500);
b = await card();
await page.screenshot({ path: path.join(raw, '2.png') });

// 3: the copy button right after it is pressed — the card is in a closed shadow root, so click by coordinates.
if (b) { await page.mouse.click(b.x + 65, b.y + 148); await page.waitForTimeout(900); }
await page.screenshot({ path: path.join(raw, '3.png') });

// 4 + 5: the toolbar popup, as its own page at the popup's real size.
const pop = await ctx.newPage();
await pop.setViewportSize({ width: 380, height: 600 });
await pop.goto(`chrome-extension://${extId}/popup.html`, { waitUntil: 'domcontentloaded' });
await pop.waitForTimeout(3000);
await pop.screenshot({ path: path.join(raw, '4.png') });
await pop.locator('#stores .st').first().click().catch(() => {});
await pop.waitForTimeout(1200);
await pop.screenshot({ path: path.join(raw, '5.png') });
await ctx.close();

console.log('raw shots in', raw);
