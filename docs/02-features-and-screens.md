# 02 — Features and screens

Three tabs in a bottom tab bar: **Jobs**, **Today**, **Materials**. Plus a pushed **Job detail** view and two bottom sheets (Add/Edit, Paste-add).

## Jobs (home)
- Large title "Jobs" with a small subtitle: "N active · M Track A".
- Segmented control: **Active / Applied / All**.
- **Active** shows only non-archived jobs, grouped into sections: "Track A · TEER 2 · SOWP + PR", "Track B · TEER 3 · Skilled Trades", "Income / other". Within each section, sort by priority score (see data model). Empty state: "All clear".
- Each row: job title, employer, and a sub-line with a **verdict pill** + wage + a "x/y reqs" counter + a "Far" tag if out of commute range. Tapping a row opens the detail.
- "+" button opens the Add/Edit sheet.

## Job detail (pushed full-screen)
Top: back to Jobs, and an "Edit" link. Then:
- Title + employer.
- Tag row: NOC + TEER, SOWP eligible / no SOWP, PR pathway, wage, "Far / relocate" if applicable.
- **Primary actions** (stacked buttons):
  - **View / save résumé** — generates and opens the tailored PDF (Blob URL → new tab; also attempt download). Filename "Rudrakumar Patel.pdf".
  - **Open application** / **Email application** — only if a link/email exists.
- **Requirements** — a tappable checklist; tapping toggles done. Items flagged "(GAP)" mean Rudra lacks that requirement.
- **Notes**.
- **Cover letter** — the full letter shown on screen (selectable) with a one-tap **Copy** button.
- **Status** picker.
- **Mark as applied** — sets status to applied, stamps the date, archives it, returns to Jobs.

## Today
- Large title "Today" + the date.
- **Daily routine**: a fixed checklist (5 items) that **resets every day**. Items: open today's searches / paste a new block; apply to every Apply-now job; send one Track A application; send materials for one Prep job; follow up on anything 5+ days old.
- A "Paste-add new jobs" button.
- **Ready to apply now**: jobs that are To-apply, Apply-now verdict, not income-only. Each links straight out to apply.
- **Needs follow-up**: jobs in Applied for 5+ days. Each opens the job.
- The Today tab shows a small badge with how many jobs are ready to apply.

## Materials
- **Cover letter generator** (sparkle ✦ accent): pick a saved job (autofills employer/title/track) or type manually, choose track A/B, add one optional custom line, Generate → letter shown with one-tap copy.
- **Base résumés**: Template A and Template B shown as text with a "PDF" (generate/open) and a copy button.
- **Backup**: export to a JSON file; import from a JSON file.

## Add/Edit sheet
Fields: title, employer, commute (in/far/remote), channel (indeed/email/career/assessment), NOC (grouped dropdown), wage, status, apply link or email, requirements (add/remove/toggle), "has a gap to close", "materials ready", notes. Save / Cancel. Delete on edit.

## Paste-add sheet
A textarea. One job per line, fields separated by `|`:
`Title | Employer | NOC | Channel | Wage | Link | Notes`
NOC accepts a code (e.g. 22210) or a role word (the app guesses the code). Channel: indeed/email/career/assess. Only Title is required.
