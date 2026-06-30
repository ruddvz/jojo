# 04 — Data model and logic

## Job object
```json
{
  "id": "string",
  "title": "string",
  "employer": "string",
  "location": "string",
  "noc": "22210 | 72100 | ... | other",
  "channel": "indeed | email | career | assess",
  "wage": "string (optional, e.g. $43.48-47.83/hr)",
  "url": "string (apply link OR email)",
  "commute": "in | far | remote",
  "gap": false,
  "ready": false,
  "status": "toapply | lead | applied | interview | offer | closed",
  "requirements": [{ "text": "string", "done": false }],
  "notes": "string",
  "added": 0,
  "appliedAt": 0
}
```
NOC determines **track**, **TEER**, **SOWP eligibility**, and **PR pathway** via `data/noc.json`. Track A = NOC 22XXX (TEER 2). Track B = NOC 72XXX/73XXX (TEER 3). Income-only = 75XXX / unknown.

## Derived: verdict
- If track is income-only → **Backup**.
- Else if `gap` OR any requirement not done OR `ready` is false OR channel is email/career/assess → **Prep** (needs work before applying).
- Else → **Apply now**.

## Derived: priority score (for sorting)
Start: Track A = 100, Track B = 70, income = 30.
+8 if channel is indeed; +8 if commute "in", +4 if "remote", −6 if "far"; +4 if no gap and not income-only.
Sort descending.

## Archived
Statuses applied/interview/offer/closed are **archived**: excluded from the Active list and from "Ready to apply". They appear only under Applied/All.

## Storage
Local-first (localStorage or IndexedDB). Provide export (download JSON of all jobs) and import (restore from JSON). Daily-routine completion is stored separately keyed by date and resets when the date changes.

## NOC guessing (for Paste-add)
If a 5-digit NOC code is present in the text, use it. Otherwise map role keywords to a code (architect→22210, drafting/cad→22212, civil→22300, estimator→22303, inspector→22234, cnc/machinist→72100, weld/fabricator→72106, carpenter→72310, cabinet→72311, electrician→72200, plumber→72300, hvac→72401, millwright/mechanic/maintenance→72400, painter→73112, drywall→73102, warehouse/picker→75101, labour→75110). Default "other".
