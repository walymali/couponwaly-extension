// One extra capture: the card on the shop's real basket page, where it opens by itself.
import { chromium } from '/Users/walysmac/GitHub/quire/node_modules/playwright/index.mjs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const ext = path.join(root, 'src');
const url = process.argv[2] || 'https://www.mumzworld.com/sa-ar/checkout/cart';
const ctx = await chromium.launchPersistentContext('', {
  headless: true, channel: 'chromium', locale: 'ar-SA', viewport: { width: 1280, height: 800 },
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--lang=ar'],
  permissions: ['clipboard-read', 'clipboard-write'],
});
let [sw] = ctx.serviceWorkers();
if (!sw) sw = await ctx.waitForEvent('serviceworker');
await sw.evaluate(() => chrome.storage.local.set({ lang: 'ar', cc: 'sa' }));
await new Promise((r) => setTimeout(r, 5000));
const page = ctx.pages()[0] || (await ctx.newPage());
for (const p of ctx.pages()) if (p !== page) await p.close();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(8000);
await page.keyboard.press('Escape').catch(() => {});
await page.waitForTimeout(1500);
const box = await page.evaluate(() => {
  const e = [...document.documentElement.children].find((x) => x.tagName === 'DIV' && x.style.zIndex === '2147483647');
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
console.log('card:', !!box);
await page.screenshot({ path: path.join(root, 'test', 'raw', '2.png') });
if (box) { await page.mouse.click(box.x + 65, box.y + 148); await page.waitForTimeout(900); }
await page.screenshot({ path: path.join(root, 'test', 'raw', '3.png') });
await ctx.close();
