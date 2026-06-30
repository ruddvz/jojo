# 10 — Build plan (do in order)

1. **Scaffold** a Vite project (vanilla TS or React). Set up the PWA: `vite-plugin-pwa` with manifest (name "Jobs", standalone, theme #FFFFFF, monochrome icon) and a service worker that caches the app shell.
2. **Design system**: implement the tokens and components from `docs/03` (grouped lists, segmented control, pills, buttons, translucent bars, tab bar). Build the empty shell of the 3 tabs.
3. **Data layer**: implement the Job model, `noc.json` lookup, triage (verdict + score), storage (local-first), and import/export. Load `data/seed-jobs.json` on first run.
4. **Jobs tab**: Active/Applied/All segmented, grouped-by-track Active list, rows with verdict pill + meta, sorted by score. Empty states.
5. **Job detail**: tags, actions, requirements checklist, notes, visible cover letter + copy, status, mark-applied-archives. Slide-in transition.
6. **Résumé generation** (`docs/07`): build the pdf-lib generator for Templates A and B from `data/profile.json`, with per-track tailoring and the green-accent style. Wire "View / save résumé" to open a Blob URL in a new tab. Verify one-page output for several jobs.
7. **Cover letters** (`docs/08`): generator with the two templates, merge fields, the empty-title/empty-extra handling, on-screen view + one-tap copy. Wire it both in the job detail and the Materials tab.
8. **Today tab**: daily routine that resets by date; "Ready to apply now" and "Needs follow-up (5+ days)" lists; tab badge.
9. **Add/Edit and Paste-add** sheets, including NOC guessing.
10. **Polish + QA**: iOS Safari download/copy behaviour, reduced motion, focus states, offline test, backup round-trip. Compare against `assets/prototype.html`.
11. **Deploy** per `docs/09` and confirm install-to-home-screen on an iPhone.

## Verification checklist
- [ ] Installs as a PWA, opens offline.
- [ ] Tailored PDF opens/saves on iOS for Track A and Track B jobs; always one page; honest content.
- [ ] Cover letter visible + copies in one tap.
- [ ] Apply link opens when present.
- [ ] Mark applied archives; job never returns to Active.
- [ ] Paste-add and manual add work; triage correct.
- [ ] Backup export/import works.
- [ ] No colour beyond black/white/grey (+ one red for delete).
