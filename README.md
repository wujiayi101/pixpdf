# Img2PDF

Upload images and export them as a single PDF — entirely in the browser.

## Features

- **Drag & drop or file picker** — add JPEG, PNG, WebP, GIF, or BMP images
- **Reorder pages** — move images up or down before exporting
- **Page options** — A4 or Letter, with optional margins
- **Private** — all processing runs locally; nothing is uploaded

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

Pushes to `main` run CI (lint + build) and deploy to Cloudflare Pages.

Required GitHub **repository** secrets:

```bash
gh secret set CLOUDFLARE_API_TOKEN --repo wujiayi101/img2pdf
gh secret set CLOUDFLARE_ACCOUNT_ID --repo wujiayi101/img2pdf
```

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | [API token](https://dash.cloudflare.com/profile/api-tokens) with **Cloudflare Pages Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
