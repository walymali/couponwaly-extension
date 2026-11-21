#!/usr/bin/env python3
"""Build the extension: pull the shop domains from the live feed into manifest.json (content script + host
permissions only for those shops), then zip src/ into dist/couponwaly-extension-<version>.zip.
Usage: python3 tools/build.py [version]"""
import json, sys, ssl, urllib.request, zipfile, pathlib, certifi
ROOT = pathlib.Path(__file__).resolve().parent.parent
API = 'https://couponwaly.com/wp-json/coupon-core/v1/extension/stores'
ctx = ssl.create_default_context(cafile=certifi.where())
doms = set()
snap = None
for cc in ['sa', 'ae', 'kw', 'eg']:
    for lang in ['ar', 'en']:
        d = json.load(urllib.request.urlopen(urllib.request.Request(f'{API}?lang={lang}&cc={cc}', headers={'User-Agent': 'Mozilla/5.0 (couponwaly-extension build)'}), context=ctx, timeout=60))
        if cc == 'sa' and lang == 'ar': snap = d
        for s in d['stores']: doms.update(s['domains'])
doms = sorted(doms)
matches = sorted({p for d in doms for p in (f'https://{d}/*', f'https://*.{d}/*')})
with open(ROOT / 'src' / 'snapshot.json', 'w', encoding='utf-8') as f: json.dump(snap, f, ensure_ascii=False, separators=(',', ':'))
version = sys.argv[1] if len(sys.argv) > 1 else '1.0.0'
manifest = {
    'manifest_version': 3,
    'name': '__MSG_appName__',
    'description': '__MSG_appDesc__',
    'version': version,
    'default_locale': 'ar',
    'icons': {s: f'icons/icon-{s}.png' for s in ['16', '32', '48', '128']},
    'action': {'default_popup': 'popup.html', 'default_icon': {s: f'icons/icon-{s}.png' for s in ['16', '32', '48']}},
    'background': {'service_worker': 'background.js'},
    'permissions': ['storage', 'alarms'],
    'host_permissions': ['https://couponwaly.com/*'] + matches,
    'content_scripts': [{'matches': matches, 'js': ['content.js'], 'run_at': 'document_idle'}],
    'web_accessible_resources': [{'resources': ['icons/*', '_locales/*/messages.json'], 'matches': matches}],
    'homepage_url': 'https://couponwaly.com/?utm_source=extension',
}
(ROOT / 'src' / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1))
out = ROOT / 'dist'; out.mkdir(exist_ok=True)
z = out / f'couponwaly-extension-{version}.zip'
with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as f:
    for p in sorted((ROOT / 'src').rglob('*')):
        if p.is_file() and not p.name.startswith('.'): f.write(p, p.relative_to(ROOT / 'src'))
print(len(doms), 'shop domains;', z, z.stat().st_size // 1024, 'KB', (ROOT / 'src' / 'snapshot.json').stat().st_size // 1024, 'KB snapshot')
