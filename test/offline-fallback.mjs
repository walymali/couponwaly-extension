// Offline fallback check: a fresh install with no cache and no network must still have codes, from the bundled
// snapshot.json. Runs the service worker's own refresh path with fetch forced to fail.
import { chromium } from '/Users/walysmac/GitHub/quire/node_modules/playwright/index.mjs';
import path from 'node:path';

const ext = path.resolve(new URL('../src', import.meta.url).pathname);
const ctx = await chromium.launchPersistentContext('', {
  headless: true, channel: 'chromium', locale: 'ar-SA',
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--lang=ar'],
});
let [sw] = ctx.serviceWorkers();
if (!sw) sw = await ctx.waitForEvent('serviceworker');
await new Promise((r) => setTimeout(r, 4000));

const res = await sw.evaluate(async () => {
  await chrome.storage.local.clear(); // a brand-new install
  const real = self.fetch;
  self.fetch = (u, o) => (String(u).startsWith('http') ? Promise.reject(new Error('offline')) : real(u, o));
  const feed = await refresh(); // the worker's own feed path: network, then cache, then bundled snapshot
  self.fetch = real;
  const st = (feed.stores || []).find((s) => (s.codes || []).length);
  return { stores: feed.stores?.length || 0, sample: st && { name: st.name, code: st.codes[0].code } };
});
await ctx.close();

console.log('stores available offline:', res.stores, '| sample:', res.sample ? `${res.sample.name} → ${res.sample.code}` : 'none');
console.log(res.stores > 0 ? 'FALLBACK OK' : 'FALLBACK FAIL — empty feed offline');
process.exit(res.stores > 0 ? 0 : 1);
