#!/usr/bin/env python3
"""One-time Chrome Web Store authorisation.

Opens Google's consent screen in the browser, catches the redirect on localhost and saves a refresh token to
~/.config/couponwaly/cws.json (mode 600). Run it once; after that tools/publish.py works on its own.

Usage:
  python3 tools/cws_auth.py ~/Downloads/client_secret_*.json   read the client straight from Google's download
  python3 tools/cws_auth.py                                    type the client id and secret instead

The client comes from a Desktop app OAuth client (see tools/CWS-API-SETUP.md). Nothing is written anywhere else,
and the credentials file never goes near the repo.
"""
import getpass
import http.server
import json
import os
import pathlib
import secrets
import ssl
import sys
import threading
import urllib.parse
import urllib.request
import webbrowser

import certifi

AUTH = 'https://accounts.google.com/o/oauth2/v2/auth'
TOKEN = 'https://oauth2.googleapis.com/token'
SCOPE = 'https://www.googleapis.com/auth/chromewebstore'
CONF = pathlib.Path.home() / '.config' / 'couponwaly' / 'cws.json'
PORT = 8731
REDIRECT = f'http://127.0.0.1:{PORT}/'
ctx = ssl.create_default_context(cafile=certifi.where())

got = {}
done = threading.Event()


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        got.update({k: v[0] for k, v in q.items()})
        done.set()
        body = 'تمام، ارجع للترمينال.' if 'code' in got else 'Authorisation failed.'
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(f'<!doctype html><meta charset="utf-8"><body style="font:16px system-ui;padding:40px">{body}</body>'.encode())

    def log_message(self, *a):
        pass


def main():
    print('Chrome Web Store API — one-time authorisation.\n')
    if len(sys.argv) > 1:
        src = pathlib.Path(sys.argv[1]).expanduser()
        if not src.exists():
            raise SystemExit(f'{src} not found')
        blob = json.loads(src.read_text())
        node = blob.get('installed') or blob.get('web') or blob
        client_id, client_secret = node.get('client_id', ''), node.get('client_secret', '')
        print(f'read the client from {src.name}')
    else:
        client_id = input('OAuth client ID: ').strip()
        client_secret = getpass.getpass('OAuth client secret (hidden): ').strip()
    if not client_id or not client_secret:
        raise SystemExit('both values are required')

    state = secrets.token_urlsafe(16)
    url = AUTH + '?' + urllib.parse.urlencode({
        'client_id': client_id, 'redirect_uri': REDIRECT, 'response_type': 'code',
        'scope': SCOPE, 'access_type': 'offline', 'prompt': 'consent', 'state': state,
    })

    srv = http.server.HTTPServer(('127.0.0.1', PORT), Handler)
    threading.Thread(target=srv.handle_request, daemon=True).start()
    print('\nOpening the consent screen. Sign in with the account that owns the extension.')
    print('If the browser does not open, paste this:\n' + url + '\n')
    webbrowser.open(url)

    if not done.wait(timeout=300):
        raise SystemExit('timed out waiting for the consent screen')
    srv.server_close()
    if 'error' in got:
        raise SystemExit('Google returned: ' + got['error'])
    if got.get('state') != state:
        raise SystemExit('state mismatch, nothing saved')

    data = urllib.parse.urlencode({
        'code': got['code'], 'client_id': client_id, 'client_secret': client_secret,
        'redirect_uri': REDIRECT, 'grant_type': 'authorization_code',
    }).encode()
    with urllib.request.urlopen(urllib.request.Request(TOKEN, data=data), context=ctx, timeout=60) as r:
        tok = json.load(r)
    if 'refresh_token' not in tok:
        raise SystemExit('no refresh token came back; remove the app at myaccount.google.com/permissions and retry')

    CONF.parent.mkdir(parents=True, exist_ok=True)
    CONF.write_text(json.dumps({
        'client_id': client_id, 'client_secret': client_secret, 'refresh_token': tok['refresh_token'],
    }, indent=1))
    os.chmod(CONF, 0o600)
    print(f'\nSaved to {CONF} (mode 600). You can now run tools/publish.py.')


if __name__ == '__main__':
    main()
