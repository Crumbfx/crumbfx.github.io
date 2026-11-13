# Crumb website

Static site (no build step): `index.html`, `styles.css`, `site.js`, `config.js`, `assets/`.
Same theme and motion as the Crumb panel.

## Settings
Edit **`config.js`** only:
- `price` — shown on every buy button
- `checkoutUrl` — your checkout link (until it's set, the buy button says checkout opens soon)
- `version` — shown in the pricing card

## Selling the download (paid)
The `.zxp` must **not** be uploaded to this repo (it would be free for anyone). Instead:
1. Build the installer: in `E:\AE\crumb` run `node tools/package.js` → `dist/crumb-<version>.zxp`.
2. Create a product on **Lemon Squeezy** (or Gumroad), upload that `.zxp` as the product file, set the price.
3. Copy the product's checkout link into `config.js` → `checkoutUrl`.
Buyers get the file and receipt by email; the site's Install section explains the rest.

## Publishing on GitHub Pages
1. Create a new repository on GitHub, e.g. `crumb` (public).
2. In this folder:
   ```
   git init
   git add .
   git commit -m "Crumb website"
   git branch -M main
   git remote add origin https://github.com/<org>/<org>.github.io.git
   git push -u origin main
   ```
3. On GitHub: repository → **Settings → Pages** → Source: *Deploy from a branch*, Branch: `main` / `(root)` → Save.
4. The site goes live at `https://<org>.github.io/` within a minute or two. A custom domain can be added on the same Settings page.

## Preview locally
`ROOT=E:/AE/crumb-site PORT=5180 node E:/AE/crumb/tools/serve.js` then open http://localhost:5180

## Checkout checklist (Lemon Squeezy)
1. Sign up at lemonsqueezy.com and finish the store setup (identity and payout details are entered by you).
2. Products → New product: name **Crumb**, price **$5**, pricing "single payment".
3. Add the file `E:\AE\crumb\dist\crumb-0.1.0.zxp` as the product file.
4. Copy the product's checkout link (Share → Copy link) into `config.js` → `checkoutUrl`, then `git commit -am "Add checkout" && git push`.
