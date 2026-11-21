#!/usr/bin/env python3
"""Upload a built zip to the Chrome Web Store, and optionally submit it for review.

Usage:
  python3 tools/publish.py 1.2.0            upload only, the draft waits in the dev console
  python3 tools/publish.py 1.2.0 --submit   upload and submit for review
  python3 tools/publish.py --submit-only    submit the draft already in the store, no upload
  python3 tools/publish.py --status         what the store currently holds for this item

Credentials come from ~/.config/couponwaly/cws.json, written once by tools/cws_auth.py. Nothing is read from the
repo and no secret is ever printed.
"""
import json
import pathlib
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request

import certifi

ITEM = 'pmjcoipeiaccobnefeempbicfacffpaf'
TOKEN = 'https://oauth2.googleapis.com/token'
BASE = 'https://www.googleapis.com'
CONF = pathlib.Path.home() / '.config' / 'couponwaly' / 'cws.json'
ROOT = pathlib.Path(__file__).resolve().parent.parent
ctx = ssl.create_default_context(cafile=certifi.where())


def call(req):
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=300) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', 'replace')[:600]
        raise SystemExit(f'HTTP {e.code} from {req.full_url.split("?")[0]}\n{body}')


def access_token():
    if not CONF.exists():
        raise SystemExit(f'no credentials at {CONF} — run: python3 tools/cws_auth.py')
    c = json.loads(CONF.read_text())
    data = urllib.parse.urlencode({
        'client_id': c['client_id'], 'client_secret': c['client_secret'],
        'refresh_token': c['refresh_token'], 'grant_type': 'refresh_token',
    }).encode()
    return call(urllib.request.Request(TOKEN, data=data))['access_token']


def headers(tok, extra=None):
    h = {'Authorization': f'Bearer {tok}', 'x-goog-api-version': '2'}
    h.update(extra or {})
    return h


def status(tok):
    url = f'{BASE}/chromewebstore/v1.1/items/{ITEM}?projection=DRAFT'
    return call(urllib.request.Request(url, headers=headers(tok)))


def upload(tok, zip_path):
    blob = zip_path.read_bytes()
    url = f'{BASE}/upload/chromewebstore/v1.1/items/{ITEM}'
    req = urllib.request.Request(url, data=blob, method='PUT',
                                 headers=headers(tok, {'Content-Type': 'application/zip', 'Content-Length': str(len(blob))}))
    return call(req)


def submit(tok):
    url = f'{BASE}/chromewebstore/v1.1/items/{ITEM}/publish'
    return call(urllib.request.Request(url, data=b'', method='POST',
                                       headers=headers(tok, {'Content-Length': '0'})))


def main():
    args = list(sys.argv[1:])
    version = next((a for a in args if not a.startswith('-')), None)
    if not version and not {'--status', '--submit-only'} & set(args):
        raise SystemExit(__doc__)
    zip_path = ROOT / 'dist' / f'couponwaly-extension-{version}.zip' if version else None
    if zip_path and not zip_path.exists():
        raise SystemExit(f'{zip_path} not found — build it first: python3 tools/build.py {version}')

    tok = access_token()
    if '--status' in args:
        print(json.dumps(status(tok), ensure_ascii=False, indent=1))
        return

    if '--submit-only' in args:
        res = submit(tok)
        print('submit:', ', '.join(res.get('status', [])) or res)
        for d in res.get('statusDetail', []):
            print('  ', d)
        return

    print(f'uploading {zip_path.name} ({zip_path.stat().st_size // 1024} KB) …')
    res = upload(tok, zip_path)
    state = res.get('uploadState')
    print('upload:', state)
    if res.get('itemError'):
        for e in res['itemError']:
            print('  ', e.get('error_detail') or e)
    if state != 'SUCCESS':
        raise SystemExit('upload did not succeed, nothing submitted')

    if '--submit' not in args:
        print('draft updated. Review it in the dev console, then: python3 tools/publish.py %s --submit' % version)
        return

    res = submit(tok)
    print('submit:', ', '.join(res.get('status', [])) or res)
    for d in res.get('statusDetail', []):
        print('  ', d)


if __name__ == '__main__':
    main()
