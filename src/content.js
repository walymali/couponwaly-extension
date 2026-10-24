// Couponwaly extension — runs only on the shops listed in manifest.json.
// Shows a small, dismissible card «N Couponwaly codes for <store>» once per shop per day; opening it lists the codes
// with a copy button. Nothing is injected into the shop's own forms and no link is changed.
(() => {
  if (window.__cwExt) return;
  window.__cwExt = true;
  const t = (k, s) => chrome.i18n.getMessage(k, s) || k;
  const rtl = (chrome.i18n.getUILanguage() || 'ar').startsWith('ar');
  const host = location.hostname;

  chrome.runtime.sendMessage({ type: 'store', host }, async (res) => {
    const st = res && res.store;
    if (!st || !st.codes || !st.codes.length) return;
    const key = 'cw_dismiss_' + st.id;
    const today = new Date().toISOString().slice(0, 10);
    const seen = await chrome.storage.local.get(key);
    if (seen[key] === today) return;
    render(st, key, today);
  });

  function render(st, key, today) {
    const root = document.createElement('div');
    root.style.all = 'initial';
    root.style.position = 'fixed';
    root.style.zIndex = '2147483647';
    root.style.insetBlockEnd = '20px';
    root.style[rtl ? 'right' : 'left'] = '20px';
    const sh = root.attachShadow({ mode: 'closed' });
    sh.innerHTML = `
<style>
:host{all:initial}
*{box-sizing:border-box;font-family:"Thmanyah Sans",system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif}
.card{direction:${rtl ? 'rtl' : 'ltr'};width:320px;max-height:70vh;overflow:auto;background:#fff;color:#0f172a;border-radius:18px;box-shadow:0 18px 40px -12px rgba(15,23,42,.35),0 2px 8px rgba(15,23,42,.08);border:1px solid #e2e8f0}
.head{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#2563eb;color:#fff;border-radius:18px 18px 0 0}
.head img{width:28px;height:28px;border-radius:8px;background:#fff}
.head b{flex:1;font-size:14px;line-height:20px}
.x{all:unset;cursor:pointer;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:18px}
.x:hover{background:rgba(255,255,255,.18)}
.mini{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;font-size:14px}
.mini img{width:24px;height:24px;border-radius:6px}
.list{padding:8px 12px 12px;display:grid;gap:8px}
.it{border:1px solid #e2e8f0;border-radius:12px;padding:10px}
.it p{margin:0 0 6px;font-size:13px;line-height:19px;color:#334155}
.it small{display:block;margin:0 0 8px;font-size:12px;color:#64748b}
.row{display:flex;gap:8px;align-items:center}
.code{flex:1;font:700 15px/1 ui-monospace,Menlo,monospace;letter-spacing:.06em;border:2px dashed #93c5fd;background:#eff6ff;border-radius:10px;padding:9px 10px;text-align:center;direction:ltr}
.btn{all:unset;cursor:pointer;background:#2563eb;color:#fff;border-radius:999px;padding:8px 12px;font-size:13px;font-weight:600}
.btn.ok{background:#15803d}
.foot{padding:0 14px 12px;font-size:11px;color:#64748b}
.foot a{color:#2563eb}
.hidden{display:none}
</style>
<div class="card">
  <div class="head"><img alt="" src="${chrome.runtime.getURL('icons/icon-48.png')}"><b></b><button class="x" aria-label="${t('close')}">×</button></div>
  <div class="mini"></div>
  <div class="list hidden"></div>
  <div class="foot hidden"></div>
</div>`;
    const $ = (s) => sh.querySelector(s);
    $('.head b').textContent = t('cardTitle', [String(st.codes.length), st.name]);
    const mini = $('.mini');
    mini.innerHTML = `${st.logo ? `<img alt="" src="${st.logo}">` : ''}<span></span>`;
    mini.querySelector('span').textContent = t('showCodes');
    const list = $('.list');
    for (const c of st.codes) {
      const it = document.createElement('div');
      it.className = 'it';
      it.innerHTML = '<p></p><small></small><div class="row"><span class="code"></span><button class="btn"></button></div>';
      it.querySelector('p').textContent = c.title;
      const sm = it.querySelector('small');
      c.terms ? (sm.textContent = c.terms) : sm.remove();
      it.querySelector('.code').textContent = c.code;
      const b = it.querySelector('.btn');
      b.textContent = t('copy');
      b.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(c.code); } catch (e) {
          const ta = document.createElement('textarea'); ta.value = c.code; sh.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
        }
        b.textContent = t('copied'); b.classList.add('ok');
        setTimeout(() => { b.textContent = t('copy'); b.classList.remove('ok'); }, 2500);
      });
      list.appendChild(it);
    }
    const foot = $('.foot');
    foot.innerHTML = `<span></span> <a target="_blank" rel="noopener"></a>`;
    foot.querySelector('span').textContent = t('footNote');
    const a = foot.querySelector('a');
    a.textContent = t('allCodes');
    a.href = st.url + '?utm_source=extension&utm_medium=card';
    mini.addEventListener('click', () => { mini.classList.add('hidden'); list.classList.remove('hidden'); foot.classList.remove('hidden'); });
    $('.x').addEventListener('click', () => { chrome.storage.local.set({ [key]: today }); root.remove(); });
    document.documentElement.appendChild(root);
  }
})();
