// Couponwaly extension — service worker.
// Keeps a copy of the site's public code feed (refreshed every 6 hours), tells each tab how many codes its shop has
// (toolbar badge) and answers the content script and the popup. No browsing data leaves the browser: the only
// network request is the feed download, the same for every user. With no network and no cache (a fresh install
// offline) it falls back to snapshot.json, the copy of the feed bundled at build time.
const API = 'https://couponwaly.com/wp-json/coupon-core/v1/extension/stores';
const REFRESH_MIN = 360;

const uiLang = () => ((chrome.i18n.getUILanguage() || 'ar').startsWith('ar') ? 'ar' : 'en');

async function settings() {
  const s = await chrome.storage.local.get(['cc', 'lang']);
  return { cc: s.cc || 'sa', lang: s.lang || uiLang() };
}

async function refresh() {
  const { cc, lang } = await settings();
  try {
    const r = await fetch(`${API}?lang=${lang}&cc=${cc}`, { cache: 'no-cache' });
    if (!r.ok) throw new Error(r.status);
    const feed = await r.json();
    await chrome.storage.local.set({ feed, feedAt: Date.now(), feedKey: `${lang}|${cc}` });
    return feed;
  } catch (e) {
    const { feed } = await chrome.storage.local.get('feed');
    return feed || await snapshot();
  }
}

async function snapshot() {
  try { return await (await fetch(chrome.runtime.getURL('snapshot.json'))).json(); } catch (e) { return { stores: [] }; }
}

async function getFeed() {
  const { cc, lang } = await settings();
  const s = await chrome.storage.local.get(['feed', 'feedAt', 'feedKey']);
  if (s.feed && s.feedKey === `${lang}|${cc}` && Date.now() - (s.feedAt || 0) < REFRESH_MIN * 60000) return s.feed;
  return refresh();
}

// «www.namshi.com» → the store whose domains include namshi.com (or a parent domain of the host).
function storeFor(feed, host) {
  if (!host || !feed) return null;
  host = host.replace(/^www\./, '').toLowerCase();
  for (const st of feed.stores || []) {
    for (const d of st.domains || []) {
      if (host === d || host.endsWith('.' + d)) return st;
    }
  }
  return null;
}

async function badge(tabId, url) {
  let host = '';
  try { host = new URL(url).hostname; } catch (e) { /* chrome:// etc. */ }
  const st = storeFor(await getFeed(), host);
  const n = st ? st.codes.length : 0;
  await chrome.action.setBadgeText({ tabId, text: n ? String(n) : '' });
  if (n) await chrome.action.setBadgeBackgroundColor({ tabId, color: '#2563eb' });
}

chrome.runtime.onInstalled.addListener(async (d) => {
  chrome.alarms.create('refresh', { periodInMinutes: REFRESH_MIN });
  await refresh();
  if (d.reason === 'install') chrome.tabs.create({ url: 'https://couponwaly.com/?utm_source=extension&utm_medium=install' });
});
chrome.runtime.onStartup.addListener(() => chrome.alarms.create('refresh', { periodInMinutes: REFRESH_MIN }));
chrome.alarms.onAlarm.addListener((a) => { if (a.name === 'refresh') refresh(); });

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === 'complete' && tab.url) badge(tabId, tab.url);
});
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try { const t = await chrome.tabs.get(tabId); if (t.url) badge(tabId, t.url); } catch (e) {}
});

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  (async () => {
    if (msg.type === 'store') {
      reply({ store: storeFor(await getFeed(), msg.host) });
    } else if (msg.type === 'feed') {
      reply({ feed: await getFeed(), settings: await settings() });
    } else if (msg.type === 'settings') {
      await chrome.storage.local.set(msg.settings);
      reply({ feed: await refresh(), settings: await settings() });
    } else if (msg.type === 'activate' && /^https:\/\/couponwaly\.com\//.test(msg.url || '')) {
      // The visitor pressed «Copy & open the store» (popup) or «Copy & activate» (card on the shop, background tab so
      // they stay on their basket): the code is already on the clipboard.
      chrome.tabs.create({ url: msg.url, active: !msg.background });
      reply({ ok: true });
    } else {
      reply({});
    }
  })();
  return true;
});
