// Load the unpacked extension in Chromium, open a shop page, check the card appears, screenshot it and the popup.
import { chromium } from '/Users/walysmac/GitHub/quire/node_modules/playwright/index.mjs';
import path from 'node:path';
const ext = path.resolve(new URL('../src', import.meta.url).pathname);
const out = path.resolve(new URL('.', import.meta.url).pathname);
const ctx = await chromium.launchPersistentContext('', { headless: true, channel: 'chromium', args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--lang=ar'], locale: 'ar-SA', viewport: { width: 1280, height: 800 } });
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
const id = sw.url().split('/')[2];
await sw.evaluate(() => chrome.storage.local.set({ lang: 'ar', cc: 'sa' }));
await new Promise(r => setTimeout(r, 4000)); // feed download
const page = ctx.pages()[0] || await ctx.newPage();
for (const p of ctx.pages()) if (p !== page) await p.close();
await page.goto('https://www.mumzworld.com/sa-ar', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(e => console.log('goto', e.message));
await page.waitForTimeout(6000);
const hasCard = await page.evaluate(() => [...document.documentElement.children].some(e => e.shadowRoot === null && e.tagName === 'DIV' && e.style.zIndex === '2147483647'));
console.log('card on mumzworld:', hasCard);
await page.screenshot({ path: path.join(out, 'shot-store.png') });
const pop = await ctx.newPage();
await pop.setViewportSize({ width: 360, height: 560 });
await pop.goto(`chrome-extension://${id}/popup.html`);
await pop.waitForTimeout(1500);
console.log('popup stores:', await pop.locator('.st').count());
await pop.screenshot({ path: path.join(out, 'shot-popup.png') });
await pop.locator('.st').first().click(); await pop.waitForTimeout(500);
await pop.screenshot({ path: path.join(out, 'shot-popup-store.png') });
await ctx.close();
