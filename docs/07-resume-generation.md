# 07 — Résumé generation (client-side)

The app generates a **tailored one-page PDF résumé in the browser** for any job, so Rudra never has to wait for one to be produced elsewhere. Use `pdf-lib` (preferred) or `jsPDF`.

## Inputs
- `data/profile.json` — all fixed facts (header, education, the three jobs and their bullets, the skill bank). This is the only source of truth. Never invent.
- The job's **track** (A or B) and its requirement keywords, used to pick the template and front-load matching skills.

## Two templates
**Template A — Technical / Drafting** (NOC 22XXX). Section order: Header → Summary → Education → Skills → Experience. Emphasis: AutoCAD, Revit, BIM, technical drawing, construction documentation, precision.

**Template B — Trades / Manufacturing** (NOC 72XXX/73XXX). Section order: Header → Summary → Skills → Experience → Education. Emphasis: equipment operation, blueprint reading, CNC/crane, quality measurement, safety, physical output.

## Tailoring rules
- **Summary**: rewrite to match the role and mirror language from the job (the app can take a short "role summary" string per job, or compose from track defaults). Keep it honest. Do NOT claim skills Rudra lacks. Example: for a welding job, lead with blueprint reading and shop aptitude and state interest in building welding skills — never claim MIG/TIG hours he does not have.
- **Skills**: reorder the skill rows so the most relevant category for the job is first.
- **Experience bullets**: keep the fixed bullets from `profile.json`; you may select the most relevant subset to stay on one page.
- **One page, always.** ATS-safe: single column, no images, no multi-column, plain section labels, live text, use "AND" not "&" in section titles.

## Visual style (match the .tex references in assets/)
- Serif body face. A ready-to-embed serif is bundled at `assets/fonts/IBMPlexSerif-*.ttf` (Regular/Bold/Italic/BoldItalic, OFL licensed) - load these with pdf-lib + fontkit. Charter is the original brand face shown in the `.tex` references; IBM Plex Serif is the bundled web-safe substitute. If you ever cannot load a font file, fall back to pdf-lib built-in `Times-Roman` (no file needed) so the build never blocks. 10.5pt base.
- Accent colour deep green **RGB(15,90,55)** for the name rule and section headers; section headers are small, bold, uppercase, followed by a 0.6pt rule.
- Dark grey (RGB 70,70,70) body, light grey (130,130,130) for dates/locations.
- Bullets: small open circle in accent green.
- Use en dashes for ranges, never em dashes.

## Implementation notes
- Build the layout with pdf-lib text drawing and measured wrapping (register fontkit and embed the bundled IBM Plex Serif TTFs). This gives the cleanest, most reliable single file and works offline. Do NOT depend on fetching a font over the network at runtime - the fonts are in `assets/fonts/`.
- Open the result via a Blob URL in a new tab so iOS Safari can save it (Share ▸ Save to Files). Also attempt an `<a download>`.

The `.tex` files in `assets/` show the exact spacing hierarchy and content. Reproduce that look; you do not need LaTeX at runtime.
