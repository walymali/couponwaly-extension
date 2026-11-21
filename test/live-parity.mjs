// Live-parity check: the codes the extension shows on a shop must be the codes the site's feed returns right now.
// Loads src/ unpacked in a real Chromium, waits for the service worker to fetch the feed, then compares the worker's
// cached feed against a fresh fetch of the endpoint made outside the browser, and screenshots the card on the shop.
// Usage: node test/live-parity.mjs [domain]   (default namshi.com)
import { chromium } from '/Users/walysmac/GitHub/quire/node_modules/playwright/index.mjs';
import path from 'node:path';

const API = 'https://couponwaly.com/wp-json/coupon-core/v1/extension/stores?lang=ar&cc=sa';
const target = process.argv[2] || 'namshi.com';
const ext = path.resolve(new URL('../src', import.meta.url).pathname);
const out = path.resolve(new URL('.', import.meta.url).pathname);

const live = await (await fetch(API, { cache: 'no-store' })).json();
const liveStore = live.stores.find((s) => s.domains.includes(target));
if (!liveStore) { console.error('no store for', target); process.exit(1); }
const liveCodes = liveStore.codes.map((c) => c.code);
console.log('feed (curl-side) :', liveStore.name, '→', liveCodes.join(', '));

const ctx = await chromium.launchPersistentContext('', {
  headless: true, channel: 'chromium', locale: 'ar-SA', viewport: { width: 1280, height: 800 },
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--lang=ar'],
});
let [sw] = ctx.serviceWorkers();
if (!sw) sw = await ctx.waitForEvent('serviceworker');
await sw.evaluate(() => chrome.storage.local.set({ lang: 'ar', cc: 'sa' }));
await new Promise((r) => setTimeout(r, 5000));

const inExt = await sw.evaluate(async (d) => {
  const { feed, feedAt } = await chrome.storage.local.get(['feed', 'feedAt']);
  const st = (feed?.stores || []).find((s) => (s.domains || []).includes(d));
  return { ageMin: Math.round((Date.now() - (feedAt || 0)) / 60000), name: st?.name, codes: (st?.codes || []).map((c) => c.code), stores: feed?.stores?.length || 0 };
}, target);
console.log('feed (in browser):', inExt.name, '→', inExt.codes.join(', '));
console.log('stores in cache  :', inExt.stores, '| cache age:', inExt.ageMin, 'min');

const page = ctx.pages()[0] || (await ctx.newPage());
for (const p of ctx.pages()) if (p !== page) await p.close();
const url = process.argv[3] || `https://www.${target}/`;
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((e) => console.log('goto', e.message));
await page.waitForTimeout(6000);
await page.keyboard.press('Escape').catch(() => {}); // the shop's own welcome modal, if any
await page.waitForTimeout(1000);
const box = await page.evaluate(() => {
  const e = [...document.documentElement.children].find((x) => x.tagName === 'DIV' && x.style.zIndex === '2147483647');
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
console.log('card on page     :', !!box);
if (box) { await page.mouse.click(box.x + box.width / 2, box.y + 30); await page.waitForTimeout(1200); }
const shot = path.join(out, `live-parity-${target}.png`);
await page.screenshot({ path: shot });
await ctx.close();

const same = JSON.stringify(liveCodes) === JSON.stringify(inExt.codes);
console.log(same ? 'PARITY OK — identical codes' : 'PARITY FAIL — codes differ');
console.log('screenshot:', shot);
process.exit(same ? 0 : 1);
