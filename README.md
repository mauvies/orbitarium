# Orbitarium

Learn Newton's law of universal gravitation by playing with it, with an AI tutor, and explore the three-body problem through six of its periodic solutions.

**Live:** https://orbitarium-app.vercel.app

> Work in progress. Technical decisions are recorded in [`docs/specs/`](docs/specs/) while the app is built, and will be summarised here.

## Run locally

Requirements: Node 24 and pnpm 10.

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

## The tutor

The lesson at `/gravitation` has an AI tutor that explains, answers questions and operates the cannon. It runs on Google's Gemini free tier and needs a key:

1. Get a free key at [Google AI Studio](https://aistudio.google.com/apikey).
2. Copy `.env.example` to `.env.local` and set `GOOGLE_GENERATIVE_AI_API_KEY`.
3. Restart the server. `TUTOR_MODEL` is optional: it names the model as `google:<model>` and defaults to `google:gemini-3.5-flash-lite`.

**Without a key** the app works as usual. The tutor's panel opens and says that the tutor is not set up and points here, with its input disabled; the lesson, the cannon and the gallery do not depend on it. The key is read when each request arrives, so a container can receive it when it starts.

**Data:** the tutor is an AI and can be wrong. What you write to it is sent to Google, whose free tier may use it to improve its products. Do not write personal data.

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
