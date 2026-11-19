# Crumb website

Static site (no build step): `index.html`, `styles.css`, `demo.css`, `site.js`, `config.js`, `assets/`.

## Settings (`config.js`)
- `downloadUrl`: the one-click download (GitHub release ZIP).
- `payhipUrl`: the free Payhip listing (same ZIP).
- `supportUrl`: the pay-what-you-want donation product on Payhip (supporters get a thank-you letter PDF by email).
- `version`: shown on the page.

## Releasing a new build
1. In `E:\AE\crumb` run `node tools/package.js` and wrap `dist/crumb-<version>.zxp` with START-HERE.txt as `Crumb-V2-Windows.zip`.
2. Upload it as a GitHub release asset, update `downloadUrl` and `version`.
3. Replace the file on the Payhip product.

## Preview locally
`ROOT=E:/AE/crumb-site PORT=5180 node E:/AE/crumb/tools/serve.js`
