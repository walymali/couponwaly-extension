// Couponwaly extension — toolbar popup: the codes of the shop in the current tab, and a searchable store list.
// Texts follow the language chosen in the popup (not only the browser's), from _locales/<lang>/messages.json.
let M = {};
const t = (k, s = []) => { const m = M[k]; if (!m) return chrome.i18n.getMessage(k, s) || k; return m.message.replace('$A$', s[0] ?? '').replace('$B$', s[1] ?? ''); };
async function loadLang(lang) {
  M = await (await fetch(chrome.runtime.getURL(`_locales/${lang}/messages.json`))).json();
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
}

const send = (m) => new Promise((r) => chrome.runtime.sendMessage(m, r));
let feed = { stores: [] };

function codeItem(c, store) {
  const it = document.createElement('div');
  it.className = 'it';
  it.innerHTML = '<p></p><small></small><div class="row"><span class="code"></span><button class="copy"></button></div>';
  it.querySelector('p').textContent = c.title;
  const sm = it.querySelector('small');
  c.terms ? (sm.textContent = c.terms) : sm.remove();
  it.querySelector('.code').textContent = c.code;
  const b = it.querySelector('.copy');
  b.textContent = store.app || !c.go ? t('copy') : t('copyOpen');
  b.addEventListener('click', async () => {
    await navigator.clipboard.writeText(c.code);
    b.textContent = t('copied'); b.classList.add('ok');
    // «Copy & open the store»: only on a click, only from the browse list (on the shop itself the code is just copied).
    if (!store.app && c.go && it.dataset.open === '1') send({ type: 'activate', url: c.go });
  });
  return it;
}

function showStore(store, intoHere) {
  const box = intoHere ? document.getElementById('hereList') : document.getElementById('stores');
  box.innerHTML = '';
  if (!intoHere) {
    const back = document.createElement('button');
    back.className = 'ghost'; back.textContent = t('back');
    back.addEventListener('click', () => list(document.getElementById('q').value));
    box.appendChild(back);
    const h = document.createElement('h2'); h.textContent = store.name; box.appendChild(h);
  }
  for (const c of store.codes) {
    const it = codeItem(c, store);
    if (!intoHere) it.dataset.open = '1';
    box.appendChild(it);
  }
}

function list(q = '') {
  const box = document.getElementById('stores');
  box.innerHTML = '';
  const n = q.trim().toLowerCase();
  const rows = feed.stores.filter((s) => !n || s.name.toLowerCase().includes(n) || s.domains.some((d) => d.includes(n)));
  if (!rows.length) { box.innerHTML = `<div class="empty">${t('noStore')}</div>`; return; }
  for (const s of rows.slice(0, 80)) {
    const r = document.createElement('div');
    r.className = 'st';
    r.innerHTML = `${s.logo ? '<img alt="">' : ''}<span></span><em></em>`;
    if (s.logo) r.querySelector('img').src = s.logo;
    r.querySelector('span').textContent = s.name;
    r.querySelector('em').textContent = t('nCodes', [String(s.codes.length)]);
    r.addEventListener('click', () => showStore(s, false));
    box.appendChild(r);
  }
}

(async () => {
  const res = await send({ type: 'feed' });
  feed = res.feed || feed;
  await loadLang(res.settings.lang);
  const cc = document.getElementById('cc');
  cc.value = res.settings.cc;
  cc.addEventListener('change', async () => { feed = (await send({ type: 'settings', settings: { cc: cc.value } })).feed; init(); });
  const lang = document.getElementById('lang');
  lang.value = res.settings.lang;
  lang.addEventListener('change', async () => { feed = (await send({ type: 'settings', settings: { lang: lang.value } })).feed; await loadLang(lang.value); init(); });
  document.getElementById('q').addEventListener('input', (e) => list(e.target.value));
  init();
})();

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let host = '';
  try { host = new URL(tab.url).hostname; } catch (e) {}
  const here = host ? (await send({ type: 'store', host })).store : null;
  document.getElementById('here').hidden = !here;
  if (here) {
    document.getElementById('hereTitle').textContent = t('cardTitle', [String(here.codes.length), here.name]);
    showStore(here, true);
  }
  list('');
}
