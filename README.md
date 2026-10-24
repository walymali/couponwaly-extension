# Couponwaly browser extension (Chrome / Edge, Manifest V3)

Shows Couponwaly's working codes on the store sites (badge + a small dismissible card), and a searchable list in the toolbar popup.
Data: the public feed `https://couponwaly.com/wp-json/coupon-core/v1/extension/stores?lang=ar|en&cc=sa|ae|kw|eg`
(Coupon Core module `extension.php`), refreshed every 6 h; matching happens in the browser, nothing about the user is sent.

- Build: `python3 tools/build.py <version>` → writes `src/manifest.json` (content script + host permissions only for the shops in the feed) and `dist/couponwaly-extension-<version>.zip`
- Test: `node test/smoke.mjs` (Playwright Chromium with the unpacked extension; screenshots in test/)
- Try it in Chrome: chrome://extensions → Developer mode → Load unpacked → `src/`
- Store listing, privacy answers and publishing steps: `store/LISTING.md`; privacy policy: https://couponwaly.com/extension-privacy/
