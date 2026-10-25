# Orbitarium

Learn Newton's law of universal gravitation by playing with it, with an AI tutor and a gallery of periodic three-body orbits.

**Live:** https://orbitarium-app.vercel.app

> Work in progress. Technical decisions are recorded in [`docs/specs/`](docs/specs/) while the app is built, and will be summarised here.

## Run locally

Requirements: Node 24 and pnpm 12.

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

## Known limitations

- **Yin-yang I plays at about 2.3× when 4× is chosen,** on a 60 Hz display. Each frame runs at most 1,100 simulation substeps, to keep within its time budget, and yin-yang I at 4× needs 1,924. On a 120 Hz display it plays at 4×. See [spec 03, Decision 7](docs/specs/03-gallery.md).

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test

# End-to-end tests run against a production build
pnpm exec playwright install chromium   # once
pnpm build && pnpm test:e2e
```
