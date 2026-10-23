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

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test

# End-to-end tests run against a production build
pnpm exec playwright install chromium   # once
pnpm build && pnpm test:e2e
```
