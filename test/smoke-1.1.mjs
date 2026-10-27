// 1.1.0 checks: on a basket page the card opens by itself; «Copy & activate» opens the shop through couponwaly.com in a
// background tab once per 30 minutes; after the third copy the rating link shows.
import { chromium } from '/Users/walysmac/GitHub/quire/node_modules/playwright/index.mjs';
import path from 'node:path';
const ext = path.resolve(new URL('../src', import.meta.url).pathname);
const out = path.resolve(new URL('.', import.meta.url).pathname);
const ctx = await chromium.launchPersistentContext('', { headless: true, channel: 'chromium', args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--lang=ar'], locale: 'ar-SA', viewport: { width: 1280, height: 800 } });
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await sw.evaluate(() => chrome.storage.local.set({ lang: 'ar', cc: 'sa' }));
await new Promise(r => setTimeout(r, 4000));
const page = ctx.pages()[0] || await ctx.newPage();
for (const p of ctx.pages()) if (p !== page) await p.close();
await page.goto('https://www.mumzworld.com/sa-ar#basket', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(e => console.log('goto', e.message));
await page.waitForTimeout(6000);
// The card lives in a closed shadow root: read it through the fixed host element's rendered text via screenshot + a
// helper that walks the composed tree is not possible, so check what the page shows by pixels-free signals instead.
const box = await page.evaluate(() => { const e = [...document.documentElement.children].find(e => e.tagName === 'DIV' && e.style.zIndex === '2147483647'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
console.log('card present:', !!box);
await page.screenshot({ path: path.join(out, 'shot-cart-1.1.png') });
// Click the first «Copy & activate» button: closed shadow roots are reachable for clicks by coordinates only.
console.log('card box:', box && Math.round(box.width) + 'x' + Math.round(box.height));
const tabsBefore = ctx.pages().length;
if (box) {
  // First code's button: bottom-left area of the first item in RTL (button is at the start of the row's end side).
  for (let i = 0; i < 3; i++) {
    await page.mouse.click(box.x + 60, box.y + 150); await page.waitForTimeout(1500);
  }
}
await page.waitForTimeout(2000);
const pages = ctx.pages();
console.log('tabs before/after:', tabsBefore, pages.length, '| new tab urls:', pages.slice(tabsBefore).map(p => p.url().slice(0, 80)));
const st = await sw.evaluate(() => chrome.storage.local.get(null));
console.log('cw_uses:', st.cw_uses, '| activated keys:', Object.keys(st).filter(k => k.startsWith('cw_act_')).length);
await page.bringToFront();
await page.screenshot({ path: path.join(out, 'shot-cart-1.1-after.png') });
await ctx.close();
