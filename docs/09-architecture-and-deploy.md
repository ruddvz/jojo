# 09 — Architecture, limits, and deployment

## Architecture
- Static, client-side PWA. No backend required.
- State in localStorage (or IndexedDB via idb-keyval). JSON export/import for backup.
- PDF generation in the browser with pdf-lib. Ship a Charter-like .ttf for consistent résumé output.
- Service worker caches the app shell for offline use. Web manifest with name "Jobs", standalone display, monochrome icon, theme colour #FFFFFF.

## What is NOT possible (state this plainly; do not fake it)
- **Auto-discovering new postings**: a static app cannot scrape Indeed/Job Bank (CORS, anti-bot, no server). New jobs are added via **Paste-add** or manual entry. If Rudra wants automated discovery later, that requires a separate backend/scheduled job and must respect each site's Terms of Service — out of scope here.
- **Auto-applying**: the app cannot log into third-party sites and submit applications. It links out to the posting; Rudra applies. Each job keeps a status he sets.

## Deployment (target: iPhone home screen)
1. `npm run build` → static `dist/`.
2. Deploy `dist/` to Netlify (drag-and-drop or CLI) or Vercel. HTTPS is required for service workers and clipboard.
3. On the iPhone: open the deployed URL in Safari → Share → **Add to Home Screen**. It installs with its icon and runs full-screen, offline-capable.
4. Updates: redeploy; the service worker should use a network-first or versioned cache so updates appear.

## Feeding new jobs (the realistic daily flow)
Rudra (with help from an assistant in chat) gathers postings and pastes a block into **Paste-add**:
`Title | Employer | NOC | Channel | Wage | Link | Notes`
The app triages each automatically. He applies, marks them applied, and they archive. Tailored PDFs and cover letters are generated on demand inside the app, so nothing needs regenerating between sessions.
