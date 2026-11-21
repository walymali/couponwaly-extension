// Frame each raw capture (test/raw) as a 1280x800 Chrome Web Store screenshot with an Arabic caption.
// Output: store/images/01..05-*.png. Usage: node tools/compose.mjs
import { chromium } from '/Users/walysmac/GitHub/quire/node_modules/playwright/index.mjs';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const raw = path.join(root, 'test', 'raw');
const out = path.join(root, 'store', 'images');
fs.mkdirSync(out, { recursive: true });
const tpl = fs.readFileSync(path.join(root, 'tools', 'frame.html'), 'utf8');

const shots = [
  { src: '1.png', name: '01-card-on-store', cap: 'الأكواد الشغالة بتظهر لك وانت على موقع المتجر' },
  { src: '2.png', name: '02-card-on-cart', cap: 'وعلى صفحة السلة بتفتح لوحدها قبل ما تدفع' },
  { src: '3.png', name: '03-code-copied', cap: 'ضغطة واحدة والكود يتنسخ جاهز للصق' },
  { src: '4.png', name: '04-popup-stores', cap: 'كل المتاجر في مكان واحد — دوّر على اللي انت عايزه' },
  { src: '5.png', name: '05-popup-store-codes', cap: 'كل كود مكتوب معاه شرطه الحقيقي' },
];

const browser = await chromium.launch({ channel: 'chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
for (const s of shots) {
  const file = path.join(raw, s.src);
  const img = fs.readFileSync(file);
  const narrow = img.readUInt32BE(16) < 1000; // the popup captures are 380px wide
  const html = tpl
    .replace('CAPTION_TEXT', s.cap)
    .replace('SHOT_SRC', `data:image/png;base64,${img.toString('base64')}`)
    .replace('FIT_BG', narrow ? '#eef2ff' : '#ffffff')
    .replace('FIT_MODE', narrow ? 'contain' : 'cover');
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const dest = path.join(out, `${s.name}.png`);
  await page.screenshot({ path: dest });
  console.log(dest);
}
await browser.close();
