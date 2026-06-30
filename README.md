# Jobs — personal job-search command centre

A black-and-white, iOS-style **installable PWA** that runs Rudra's daily job hunt:
see today's jobs → open one → download a **tailored one-page résumé PDF** (generated
in the browser) + copy a ready **cover letter** → tap through to apply → mark it
applied so it archives and never shows again.

Built from the brief in [`docs/`](docs/) and [`data/`](data/). Local-first, no login,
no analytics, no scraping, no auto-apply.

## Features

- **Jobs** tab — Active / Applied / All, grouped by immigration track (A / B / income),
  sorted by a priority score, each row showing a verdict pill, wage, requirement
  counter and a "Far" tag.
- **Job detail** — NOC/TEER/SOWP/PR tags, one-tap résumé PDF, apply link or email,
  tappable requirements checklist (with `(GAP)` flags), visible + copyable cover letter,
  status picker, and *Mark as applied* (archives the job).
- **Today** tab — a daily routine checklist that resets each day, a "Ready to apply now"
  list, and "Needs follow-up" (applications 5+ days old). Tab badge shows how many are
  ready to apply.
- **Materials** tab — cover-letter generator, base résumé PDFs (Template A / B), and
  JSON backup export / import.
- **Résumé generation** — `pdf-lib` + embedded IBM Plex Serif, two templates picked by
  the job's NOC track, skills front-loaded to match the posting, deep-green accent,
  always one page. Honest by construction: never claims skills Rudra lacks.
- **Installable + offline** — web manifest + service worker (via `vite-plugin-pwa`).

## Tech

Vite + vanilla TypeScript · `pdf-lib` + `@pdf-lib/fontkit` · `localStorage` ·
`vite-plugin-pwa`.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173/jojo/
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

## Deploy (GitHub Pages)

This repo ships a GitHub Actions workflow at
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) that builds the app and
publishes `dist/` to GitHub Pages on every push to `main` (and to the development
branch).

One-time setup in the repository: **Settings → Pages → Build and deployment →
Source: GitHub Actions**. After that, each push deploys automatically to
`https://<user>.github.io/<repo>/`.

The build sets the correct base path from the repo name automatically
(`BASE_PATH=/<repo>/`), so service-worker scope and asset URLs resolve under the
project subpath.

### Install on iPhone

Open the deployed URL in Safari → **Share → Add to Home Screen**. It installs with its
own icon, runs full-screen, and works offline.

## Honesty & limits

The app cannot discover postings or submit applications — a static client-side app
can't scrape job boards or log into third-party sites. New jobs come in via **Paste-add**
or manual entry; the app triages them and links out to apply. See
[`docs/09-architecture-and-deploy.md`](docs/09-architecture-and-deploy.md).

`data/profile.json` is the single source of truth for Rudra's facts. The résumé and
cover-letter generators never invent experience or claim certifications he does not hold;
missing requirements are flagged as gaps instead.
