import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { NOC, guessNoc } from './data';
import {
  load,
  subscribe,
  allJobs,
  getJob,
  upsertJob,
  addJobs,
  deleteJob,
  setStatus,
  markApplied,
  toggleRequirement,
  normalizeJob,
  exportJSON,
  importJSON,
  getRoutine,
  setRoutine,
  ROUTINE_ITEMS,
} from './store';
import { track, verdict, isArchived, isIncomeOnly } from './triage';
import { jobsListHTML, tagFor, pill } from './components';
import { generateCoverLetter } from './coverletter';
import { escapeHtml, copyText, downloadText, openPdf, toast } from './util';
import type { Job, Status, Channel, Commute, Track } from './types';

registerSW({ immediate: true });

// ---------------- App state ----------------
type Tab = 'jobs' | 'today' | 'materials';
let currentTab: Tab = 'jobs';
let jobsSeg: 'active' | 'applied' | 'all' = 'active';
let editingId: string | null = null; // job currently in the add/edit sheet
let coverState = { jobId: '', employer: '', title: '', track: 'A' as Track, extra: '', text: '' };

const STATUS_LABELS: Record<Status, string> = {
  toapply: 'To apply',
  lead: 'Lead',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  closed: 'Closed',
};

const CHANNEL_LABELS: Record<Channel, string> = {
  indeed: 'Indeed',
  email: 'Email',
  career: 'Career site',
  assess: 'Assessment',
};

// ---------------- Shell ----------------
const app = document.getElementById('app')!;
app.innerHTML = `
  <div class="topbar" id="topbar">Jobs</div>
  <button class="addbtn" id="addBtn" aria-label="Add job" data-action="add-job">+</button>

  <section class="view" id="v-jobs"></section>
  <section class="view" id="v-today"></section>
  <section class="view" id="v-materials"></section>

  <nav class="tabbar">
    <button data-action="tab" data-tab="jobs"><span class="ic">▤</span>Jobs</button>
    <button data-action="tab" data-tab="today"><span class="ic">◷</span><span class="badgewrap" id="todayBadge"></span>Today</button>
    <button data-action="tab" data-tab="materials"><span class="ic">✦</span>Materials</button>
  </nav>

  <div id="detail"></div>
  <div class="scrim" id="scrim" data-action="close-sheet"></div>
  <div class="sheet" id="sheet"></div>
`;

const views: Record<Tab, HTMLElement> = {
  jobs: document.getElementById('v-jobs')!,
  today: document.getElementById('v-today')!,
  materials: document.getElementById('v-materials')!,
};
const topbar = document.getElementById('topbar')!;
const tabbar = document.querySelector('.tabbar')!;
const detailEl = document.getElementById('detail')!;
const sheetEl = document.getElementById('sheet')!;
const scrimEl = document.getElementById('scrim')!;
const addBtn = document.getElementById('addBtn')!;

// ---------------- Derived helpers ----------------
function activeJobs(): Job[] {
  return allJobs().filter((j) => !isArchived(j));
}

// "Ready to apply now": To-apply, Apply-now verdict, not income-only (docs/02).
function readyToApply(): Job[] {
  return activeJobs().filter(
    (j) => j.status === 'toapply' && verdict(j) === 'apply' && !isIncomeOnly(j)
  );
}

// Applied 5+ days ago (docs/02).
function needsFollowUp(): Job[] {
  const cutoff = Date.now() - 5 * 24 * 3600 * 1000;
  return allJobs()
    .filter((j) => j.status === 'applied' && j.appliedAt > 0 && j.appliedAt <= cutoff)
    .sort((a, b) => a.appliedAt - b.appliedAt);
}

function trackCount(t: Track): number {
  return activeJobs().filter((j) => track(j) === t).length;
}

// ---------------- Render: shell ----------------
function render(): void {
  for (const t of Object.keys(views) as Tab[]) {
    views[t].classList.toggle('active', t === currentTab);
  }
  topbar.textContent = currentTab === 'jobs' ? 'Jobs' : currentTab === 'today' ? 'Today' : 'Materials';
  addBtn.style.display = currentTab === 'jobs' ? '' : 'none';

  tabbar.querySelectorAll('button').forEach((b) => {
    b.classList.toggle('on', (b as HTMLElement).dataset.tab === currentTab);
  });

  // Today badge
  const badge = document.getElementById('todayBadge')!;
  const n = readyToApply().length;
  badge.innerHTML = n > 0 ? `<span class="badge">${n}</span>` : '';

  if (currentTab === 'jobs') renderJobs();
  else if (currentTab === 'today') renderToday();
  else renderMaterials();
}

// ---------------- Jobs tab ----------------
function renderJobs(): void {
  const active = activeJobs().length;
  const a = trackCount('A');
  views.jobs.innerHTML = `
    <div class="largetitle">
      <h1>Jobs</h1>
      <div class="sub">${active} active · ${a} Track A</div>
    </div>
    <div class="segmented" id="seg">
      <button data-action="seg" data-seg="active" class="${jobsSeg === 'active' ? 'on' : ''}">Active</button>
      <button data-action="seg" data-seg="applied" class="${jobsSeg === 'applied' ? 'on' : ''}">Applied</button>
      <button data-action="seg" data-seg="all" class="${jobsSeg === 'all' ? 'on' : ''}">All</button>
    </div>
    <div>${jobsListHTML(allJobs(), jobsSeg)}</div>
  `;
}

// ---------------- Today tab ----------------
function renderToday(): void {
  const routine = getRoutine();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const ready = readyToApply();
  const follow = needsFollowUp();

  const routineHTML = ROUTINE_ITEMS.map(
    (item, i) => `
    <div class="checkrow ${routine[i] ? 'done' : ''}" data-action="toggle-routine" data-i="${i}">
      <div class="checkbox">${routine[i] ? '✓' : ''}</div>
      <div class="ctext">${escapeHtml(item)}</div>
    </div>`
  ).join('');

  const readyHTML = ready.length
    ? `<div class="card">${ready
        .map(
          (j) => `<div class="row">
            <div class="grow">
              <div class="title">${escapeHtml(j.title)}</div>
              <div class="meta">${pill(j)}<span>${escapeHtml(j.employer)}</span></div>
            </div>
            ${
              j.url
                ? `<button class="btn line" style="width:auto;padding:8px 14px" data-action="apply-link" data-id="${j.id}">Apply</button>`
                : `<button class="btn line" style="width:auto;padding:8px 14px" data-action="open-job" data-id="${j.id}">Open</button>`
            }
          </div>`
        )
        .join('')}</div>`
    : `<div class="empty">Nothing queued — paste or add jobs</div>`;

  const followHTML = follow.length
    ? `<div class="card">${follow
        .map((j) => {
          const days = Math.floor((Date.now() - j.appliedAt) / (24 * 3600 * 1000));
          return `<button class="row tappable" data-action="open-job" data-id="${j.id}">
            <div class="grow">
              <div class="title">${escapeHtml(j.title)}</div>
              <div class="meta"><span>${escapeHtml(j.employer)}</span><span>${days} days ago</span></div>
            </div><div class="chev">›</div>
          </button>`;
        })
        .join('')}</div>`
    : `<div class="empty">No stale applications</div>`;

  views.today.innerHTML = `
    <div class="largetitle">
      <h1>Today</h1>
      <div class="sub">${escapeHtml(dateStr)}</div>
    </div>
    <div class="section-header">Daily routine</div>
    <div class="card">${routineHTML}</div>
    <div class="btn-stack" style="margin-top:10px">
      <button class="btn" data-action="paste-add">Paste-add new jobs</button>
    </div>
    <div class="section-header">Ready to apply now</div>
    ${readyHTML}
    <div class="section-header">Needs follow-up</div>
    ${followHTML}
  `;
}

// ---------------- Materials tab ----------------
function renderMaterials(): void {
  const savedJobs = allJobs();
  const jobOptions =
    `<option value="">— Type manually —</option>` +
    savedJobs
      .map(
        (j) =>
          `<option value="${j.id}" ${coverState.jobId === j.id ? 'selected' : ''}>${escapeHtml(
            j.title
          )} · ${escapeHtml(j.employer)}</option>`
      )
      .join('');

  views.materials.innerHTML = `
    <div class="largetitle"><h1>Materials</h1></div>

    <div class="section-header"><span class="sparkle">✦</span> Cover letter generator</div>
    <div class="field">
      <label>From a saved job</label>
      <select id="clJob" data-action="cl-job">${jobOptions}</select>
    </div>
    <div class="field">
      <div class="field-row">
        <div><label>Employer</label><input id="clEmp" placeholder="Employer" value="${escapeHtml(coverState.employer)}" /></div>
        <div><label>Title</label><input id="clTitle" placeholder="Job title" value="${escapeHtml(coverState.title)}" /></div>
      </div>
    </div>
    <div class="field">
      <label>Track</label>
      <div class="segmented" style="margin-left:0;margin-right:0">
        <button data-action="cl-track" data-track="A" class="${coverState.track === 'A' ? 'on' : ''}">A · Technical</button>
        <button data-action="cl-track" data-track="B" class="${coverState.track === 'B' ? 'on' : ''}">B · Trades</button>
      </div>
    </div>
    <div class="field">
      <label>Optional custom line</label>
      <input id="clExtra" placeholder="One extra sentence (optional)" value="${escapeHtml(coverState.extra)}" />
    </div>
    <div class="btn-stack" style="margin-top:8px">
      <button class="btn primary gen-btn" id="clGen" data-action="cl-generate">Generate letter</button>
    </div>
    ${
      coverState.text
        ? `<div class="card" style="margin-top:12px"><pre class="covertext">${escapeHtml(
            coverState.text
          )}</pre></div>
           <div class="btn-stack"><button class="btn line" data-action="cl-copy">Copy letter</button></div>`
        : ''
    }

    <div class="section-header">Base résumés</div>
    <div class="card">
      <div class="row">
        <div class="grow"><div class="title">Template A — Technical</div><div class="emp">Drafting / NOC 22XXX</div></div>
        <button class="btn line" style="width:auto;padding:8px 14px" data-action="resume-base" data-track="A">PDF</button>
      </div>
      <div class="row">
        <div class="grow"><div class="title">Template B — Trades</div><div class="emp">Manufacturing / NOC 72–73XXX</div></div>
        <button class="btn line" style="width:auto;padding:8px 14px" data-action="resume-base" data-track="B">PDF</button>
      </div>
    </div>

    <div class="section-header">Backup</div>
    <div class="btn-stack">
      <button class="btn" data-action="export">Export backup (JSON)</button>
      <button class="btn" data-action="import">Import backup (JSON)</button>
      <input type="file" id="importFile" accept="application/json,.json" style="display:none" />
    </div>
    <div class="hint">Local-first. Nothing leaves this device unless you export it.</div>
  `;
}

// ---------------- Detail view ----------------
function renderDetail(id: string): void {
  const job = getJob(id);
  if (!job) return;
  const letter = generateCoverLetter({
    employer: job.employer,
    title: job.title,
    track: track(job),
  });
  const reqs = job.requirements
    .map(
      (r, i) => `
      <div class="checkrow ${r.done ? 'done' : ''}" data-action="toggle-req" data-id="${job.id}" data-i="${i}">
        <div class="checkbox">${r.done ? '✓' : ''}</div>
        <div class="ctext">${formatReq(r.text)}</div>
      </div>`
    )
    .join('');

  const statusOptions = (Object.keys(STATUS_LABELS) as Status[])
    .map((s) => `<option value="${s}" ${job.status === s ? 'selected' : ''}>${STATUS_LABELS[s]}</option>`)
    .join('');

  const applyBtn = job.url
    ? job.url.includes('@')
      ? `<button class="btn line" data-action="apply-link" data-id="${job.id}">Email application</button>`
      : `<button class="btn line" data-action="apply-link" data-id="${job.id}">Open application</button>`
    : '';

  detailEl.innerHTML = `
    <div class="detailbar">
      <button class="back" data-action="close-detail">‹ Jobs</button>
      <button class="edit" data-action="edit-job" data-id="${job.id}">Edit</button>
    </div>
    <div class="detailbody">
      <div class="detail-h">
        <h2>${escapeHtml(job.title || 'Untitled')}</h2>
        <div class="emp">${escapeHtml(job.employer || '—')}${
          job.location ? ' · ' + escapeHtml(job.location) : ''
        }</div>
      </div>
      <div class="tagrow">${tagFor(job)}</div>

      <div class="btn-stack" style="margin-top:8px">
        <button class="btn primary" data-action="resume-job" data-id="${job.id}">View / save résumé</button>
        ${applyBtn}
      </div>

      ${
        job.requirements.length
          ? `<div class="section-header">Requirements</div><div class="card">${reqs}</div>`
          : ''
      }

      ${
        job.notes
          ? `<div class="section-header">Notes</div><div class="card"><div class="notes-text">${escapeHtml(
              job.notes
            )}</div></div>`
          : ''
      }

      <div class="section-header"><span class="sparkle">✦</span> Cover letter</div>
      <div class="card"><pre class="covertext" id="detailLetter">${escapeHtml(letter)}</pre></div>
      <div class="btn-stack"><button class="btn line" data-action="copy-letter">Copy letter</button></div>

      <div class="section-header">Status</div>
      <div class="field"><select data-action="set-status" data-id="${job.id}">${statusOptions}</select></div>

      <div class="btn-stack" style="margin-top:14px">
        ${
          isArchived(job)
            ? ''
            : `<button class="btn primary" data-action="mark-applied" data-id="${job.id}">Mark as applied</button>`
        }
      </div>
    </div>
  `;
  detailEl.classList.add('open');
  detailEl.scrollTop = 0;
}

function formatReq(text: string): string {
  const safe = escapeHtml(text);
  return safe.replace(/\(GAP\)/gi, '<span class="gapflag">(GAP)</span>');
}

function closeDetail(): void {
  detailEl.classList.remove('open');
}

// ---------------- Add / Edit sheet ----------------
function openAddEdit(id?: string): void {
  editingId = id ?? null;
  const job = id ? getJob(id) : null;
  const j: Partial<Job> = job ?? { commute: 'in', channel: 'indeed', status: 'toapply', noc: 'other' };

  const nocOptions = renderNocOptions(j.noc || 'other');
  const channelOptions = (Object.keys(CHANNEL_LABELS) as Channel[])
    .map((c) => `<option value="${c}" ${j.channel === c ? 'selected' : ''}>${CHANNEL_LABELS[c]}</option>`)
    .join('');
  const statusOptions = (Object.keys(STATUS_LABELS) as Status[])
    .map((s) => `<option value="${s}" ${j.status === s ? 'selected' : ''}>${STATUS_LABELS[s]}</option>`)
    .join('');
  const commuteOptions = (['in', 'far', 'remote'] as Commute[])
    .map(
      (c) =>
        `<option value="${c}" ${j.commute === c ? 'selected' : ''}>${
          c === 'in' ? 'In range' : c === 'far' ? 'Far' : 'Remote'
        }</option>`
    )
    .join('');

  sheetEl.innerHTML = `
    <div class="sheet-head">
      <button data-action="close-sheet">Cancel</button>
      <span class="t">${id ? 'Edit job' : 'Add job'}</span>
      <button class="save" data-action="save-job">Save</button>
    </div>
    <div class="field"><label>Title</label><input id="f_title" value="${escapeHtml(j.title || '')}" /></div>
    <div class="field"><label>Employer</label><input id="f_emp" value="${escapeHtml(j.employer || '')}" /></div>
    <div class="field"><label>Location</label><input id="f_loc" value="${escapeHtml(j.location || '')}" /></div>
    <div class="field">
      <div class="field-row">
        <div><label>Commute</label><select id="f_commute">${commuteOptions}</select></div>
        <div><label>Channel</label><select id="f_channel">${channelOptions}</select></div>
      </div>
    </div>
    <div class="field"><label>NOC</label><select id="f_noc">${nocOptions}</select></div>
    <div class="field">
      <div class="field-row">
        <div><label>Wage</label><input id="f_wage" placeholder="e.g. $43.48-47.83/hr" value="${escapeHtml(
          j.wage || ''
        )}" /></div>
        <div><label>Status</label><select id="f_status">${statusOptions}</select></div>
      </div>
    </div>
    <div class="field"><label>Apply link or email</label><input id="f_url" value="${escapeHtml(
      j.url || ''
    )}" /></div>

    <div class="field"><label>Requirements</label></div>
    <div id="reqEdit"></div>
    <div class="req-edit-row">
      <input id="reqNew" placeholder="Add a requirement" />
      <button data-action="add-req" style="color:#000;font-size:22px">＋</button>
    </div>

    <div class="checkline"><span>Has a gap to close</span><div class="switch ${
      j.gap ? 'on' : ''
    }" id="f_gap" data-action="toggle-switch" data-key="gap"></div></div>
    <div class="checkline"><span>Materials ready</span><div class="switch ${
      j.ready ? 'on' : ''
    }" id="f_ready" data-action="toggle-switch" data-key="ready"></div></div>

    <div class="field"><label>Notes</label><textarea id="f_note" rows="3">${escapeHtml(
      j.notes || ''
    )}</textarea></div>

    ${
      id
        ? `<div class="btn-stack" style="margin-top:12px"><button class="btn danger" data-action="delete-job" data-id="${id}">Delete job</button></div>`
        : ''
    }
  `;

  // working requirement list state lives in the DOM; seed it
  sheetDraftReqs = (j.requirements || []).map((r) => ({ text: r.text, done: r.done }));
  sheetDraftFlags = { gap: !!j.gap, ready: !!j.ready };
  renderDraftReqs();
  openSheet();
}

let sheetDraftReqs: { text: string; done: boolean }[] = [];
let sheetDraftFlags = { gap: false, ready: false };

function renderDraftReqs(): void {
  const box = document.getElementById('reqEdit');
  if (!box) return;
  box.innerHTML = sheetDraftReqs
    .map(
      (r, i) => `<div class="req-edit-row">
        <input value="${escapeHtml(r.text)}" data-action="req-text" data-i="${i}" />
        <button data-action="del-req" data-i="${i}">✕</button>
      </div>`
    )
    .join('');
}

function renderNocOptions(selected: string): string {
  const groups: Record<string, string> = { A: 'Track A · TEER 2', B: 'Track B · TEER 3', N: 'Income / other' };
  let html = '';
  for (const g of ['A', 'B', 'N'] as Track[]) {
    const items = NOC.filter((n) => n.track === g);
    html += `<optgroup label="${groups[g]}">`;
    for (const n of items) {
      html += `<option value="${n.code}" ${n.code === selected ? 'selected' : ''}>${escapeHtml(
        n.code === 'other' ? 'Other / confirm NOC' : `${n.code} — ${n.name}`
      )}</option>`;
    }
    html += `</optgroup>`;
  }
  return html;
}

// ---------------- Paste-add sheet ----------------
function openPasteAdd(): void {
  sheetEl.innerHTML = `
    <div class="sheet-head">
      <button data-action="close-sheet">Cancel</button>
      <span class="t">Paste-add jobs</span>
      <button class="save" data-action="paste-save">Add</button>
    </div>
    <div class="hint">One job per line. Fields separated by <b>|</b>. Only Title is required.</div>
    <div class="fmt">Title | Employer | NOC | Channel | Wage | Link | Notes</div>
    <div class="field"><textarea id="pText" rows="8" placeholder="Architectural Technician | a+LiNK | 22210 | email | | | High priority"></textarea></div>
  `;
  openSheet();
}

function parsePaste(text: string): Job[] {
  const out: Job[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split('|').map((p) => p.trim());
    const [title, employer, nocRaw, channelRaw, wage, link, notes] = parts;
    if (!title) continue;
    const noc = guessNoc(`${nocRaw || ''} ${title}`);
    const channel = normalizeChannel(channelRaw);
    out.push(
      normalizeJob({
        title,
        employer: employer || '',
        noc,
        channel,
        wage: wage || '',
        url: link || '',
        notes: notes || '',
        commute: 'in',
        status: 'toapply',
      })
    );
  }
  return out;
}

function normalizeChannel(raw: string): Channel {
  const r = (raw || '').toLowerCase();
  if (r.startsWith('email')) return 'email';
  if (r.startsWith('career')) return 'career';
  if (r.startsWith('assess')) return 'assess';
  return 'indeed';
}

// ---------------- Sheet open/close ----------------
function openSheet(): void {
  scrimEl.classList.add('open');
  requestAnimationFrame(() => sheetEl.classList.add('open'));
}
function closeSheet(): void {
  sheetEl.classList.remove('open');
  scrimEl.classList.remove('open');
}

// ---------------- Resume generation ----------------
async function doResume(job: Job): Promise<void> {
  toast('Generating résumé…');
  try {
    const { generateResume } = await import('./resume');
    const bytes = await generateResume(job);
    openPdf(bytes, 'Rudrakumar Patel.pdf');
  } catch (e) {
    console.error(e);
    toast('Could not generate PDF');
  }
}

function baseResumeJob(t: Track): Job {
  // A throwaway job used only to pick a template for the base résumé.
  return normalizeJob({
    title: t === 'A' ? 'Architectural Technician' : 'CNC Machine Operator',
    noc: t === 'A' ? '22210' : '72100',
  });
}

// ---------------- Event delegation ----------------
document.addEventListener('click', async (ev) => {
  const target = (ev.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
  if (!target) return;
  const action = target.dataset.action!;
  const id = target.dataset.id;

  switch (action) {
    case 'tab':
      currentTab = target.dataset.tab as Tab;
      render();
      break;
    case 'seg':
      jobsSeg = target.dataset.seg as typeof jobsSeg;
      renderJobs();
      break;
    case 'open-job':
      if (id) renderDetail(id);
      break;
    case 'close-detail':
      closeDetail();
      break;
    case 'add-job':
      openAddEdit();
      break;
    case 'edit-job':
      if (id) {
        closeDetail();
        openAddEdit(id);
      }
      break;
    case 'close-sheet':
      closeSheet();
      break;
    case 'paste-add':
      openPasteAdd();
      break;
    case 'toggle-routine':
      {
        const i = Number(target.dataset.i);
        setRoutine(i, !getRoutine()[i]);
      }
      break;
    case 'toggle-req':
      if (id) {
        toggleRequirement(id, Number(target.dataset.i));
        renderDetail(id);
      }
      break;
    case 'set-status':
      break; // handled by change listener
    case 'mark-applied':
      if (id) {
        markApplied(id);
        closeDetail();
        toast('Applied — archived');
      }
      break;
    case 'apply-link':
      if (id) openApply(id);
      break;
    case 'resume-job':
      if (id) {
        const j = getJob(id);
        if (j) await doResume(j);
      }
      break;
    case 'resume-base':
      await doResume(baseResumeJob(target.dataset.track as Track));
      break;
    case 'copy-letter':
      {
        const letterEl = document.getElementById('detailLetter');
        if (letterEl) {
          const ok = await copyText(letterEl.textContent || '');
          toast(ok ? 'Cover letter copied' : 'Copy failed');
        }
      }
      break;
    // Cover letter generator (materials)
    case 'cl-track':
      coverState.track = target.dataset.track as Track;
      renderMaterials();
      break;
    case 'cl-generate':
      syncCoverInputs();
      coverState.text = generateCoverLetter({
        employer: coverState.employer,
        title: coverState.title,
        track: coverState.track,
        extra: coverState.extra,
      });
      renderMaterials();
      target.classList?.add('shimmer');
      break;
    case 'cl-copy':
      {
        const ok = await copyText(coverState.text);
        toast(ok ? 'Cover letter copied' : 'Copy failed');
      }
      break;
    case 'export':
      downloadText(exportJSON(), 'jobs-backup.json');
      toast('Backup downloaded');
      break;
    case 'import':
      (document.getElementById('importFile') as HTMLInputElement)?.click();
      break;
    // Add/Edit sheet
    case 'save-job':
      saveJobFromSheet();
      break;
    case 'delete-job':
      if (id) {
        deleteJob(id);
        closeSheet();
        toast('Deleted');
      }
      break;
    case 'add-req':
      {
        const input = document.getElementById('reqNew') as HTMLInputElement;
        const v = input.value.trim();
        if (v) {
          sheetDraftReqs.push({ text: v, done: false });
          input.value = '';
          renderDraftReqs();
        }
      }
      break;
    case 'del-req':
      sheetDraftReqs.splice(Number(target.dataset.i), 1);
      renderDraftReqs();
      break;
    case 'toggle-switch':
      {
        const key = target.dataset.key as 'gap' | 'ready';
        sheetDraftFlags[key] = !sheetDraftFlags[key];
        target.classList.toggle('on', sheetDraftFlags[key]);
      }
      break;
    case 'paste-save':
      {
        const text = (document.getElementById('pText') as HTMLTextAreaElement).value;
        const parsed = parsePaste(text);
        if (parsed.length === 0) {
          toast('Nothing to add');
        } else {
          addJobs(parsed);
          closeSheet();
          currentTab = 'jobs';
          jobsSeg = 'active';
          render();
          toast(`Added ${parsed.length} job${parsed.length > 1 ? 's' : ''}`);
        }
      }
      break;
  }
});

// change events (selects, file input, requirement text)
document.addEventListener('change', (ev) => {
  const t = ev.target as HTMLElement;
  const action = t.closest('[data-action]')?.getAttribute('data-action');
  if (action === 'set-status') {
    const sel = t as HTMLSelectElement;
    const id = t.closest('[data-action]')!.getAttribute('data-id')!;
    setStatus(id, sel.value as Status);
    renderDetail(id);
    return;
  }
  if (action === 'cl-job') {
    const sel = t as HTMLSelectElement;
    coverState.jobId = sel.value;
    const job = getJob(sel.value);
    if (job) {
      coverState.employer = job.employer;
      coverState.title = job.title;
      coverState.track = track(job) === 'A' ? 'A' : 'B';
    }
    renderMaterials();
    return;
  }
  if (t.id === 'importFile') {
    const file = (t as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const n = importJSON(String(reader.result));
          currentTab = 'jobs';
          render();
          toast(`Imported ${n} jobs`);
        } catch {
          toast('Invalid backup file');
        }
      };
      reader.readAsText(file);
    }
  }
});

// keep requirement-text edits in the draft
document.addEventListener('input', (ev) => {
  const t = ev.target as HTMLElement;
  if (t.getAttribute('data-action') === 'req-text') {
    const i = Number(t.getAttribute('data-i'));
    if (sheetDraftReqs[i]) sheetDraftReqs[i].text = (t as HTMLInputElement).value;
  }
});

function syncCoverInputs(): void {
  const emp = document.getElementById('clEmp') as HTMLInputElement | null;
  const title = document.getElementById('clTitle') as HTMLInputElement | null;
  const extra = document.getElementById('clExtra') as HTMLInputElement | null;
  if (emp) coverState.employer = emp.value;
  if (title) coverState.title = title.value;
  if (extra) coverState.extra = extra.value;
}

function saveJobFromSheet(): void {
  const val = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement).value;
  const title = val('f_title').trim();
  if (!title) {
    toast('Title is required');
    return;
  }
  const existing = editingId ? getJob(editingId) : null;
  const job = normalizeJob({
    ...(existing || {}),
    id: editingId || undefined,
    title,
    employer: val('f_emp'),
    location: val('f_loc'),
    commute: val('f_commute') as Commute,
    channel: val('f_channel') as Channel,
    noc: val('f_noc'),
    wage: val('f_wage'),
    status: val('f_status') as Status,
    url: val('f_url'),
    notes: (document.getElementById('f_note') as HTMLTextAreaElement).value,
    requirements: sheetDraftReqs.filter((r) => r.text.trim()),
    gap: sheetDraftFlags.gap,
    ready: sheetDraftFlags.ready,
  });
  upsertJob(job);
  closeSheet();
  toast(editingId ? 'Saved' : 'Job added');
  editingId = null;
}

function openApply(id: string): void {
  const job = getJob(id);
  if (!job || !job.url) return;
  const url = job.url.includes('@') && !job.url.startsWith('mailto:') ? `mailto:${job.url}` : job.url;
  window.open(url, '_blank');
}

// ---------------- Boot ----------------
load();
subscribe(render);
render();
