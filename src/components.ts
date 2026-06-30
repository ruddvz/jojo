import { lookupNoc } from './data';
import {
  verdict,
  verdictLabel,
  reqCounter,
  isFar,
  groupedActive,
  isArchived,
} from './triage';
import { escapeHtml } from './util';
import { icon } from './icons';
import type { Job } from './types';

const STATUS_LABEL: Record<Job['status'], string> = {
  toapply: 'To apply',
  lead: 'Lead',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  closed: 'Closed',
};

export function pill(job: Job): string {
  const v = verdict(job);
  return `<span class="pill ${v}"><span class="dot"></span>${verdictLabel(v)}</span>`;
}

function statusPill(job: Job): string {
  return `<span class="pill status">${STATUS_LABEL[job.status]}</span>`;
}

function daysAgo(ts: number): number {
  return Math.floor((Date.now() - ts) / (24 * 3600 * 1000));
}

// Single, ellipsised secondary line. Active: employer · wage · reqs · Far.
// Archived: employer · Applied Nd ago.
function subLine(job: Job): string {
  if (isArchived(job)) {
    const parts: string[] = [];
    if (job.employer) parts.push(escapeHtml(job.employer));
    if (job.appliedAt > 0) {
      const d = daysAgo(job.appliedAt);
      parts.push(d === 0 ? 'today' : `${d}d ago`);
    }
    return parts.join('<span class="sep">·</span>') || '—';
  }
  const parts: string[] = [];
  if (job.employer) parts.push(escapeHtml(job.employer));
  if (job.wage) parts.push(escapeHtml(job.wage));
  const { done, total } = reqCounter(job);
  if (total > 0) parts.push(`${done}/${total} reqs`);
  let html = parts.join('<span class="sep">·</span>');
  if (isFar(job)) {
    html += `${parts.length ? '<span class="sep">·</span>' : ''}<span class="far">Far</span>`;
  }
  return html || '—';
}

function applyButton(job: Job): string {
  const isEmail = job.url.includes('@');
  const label = isEmail ? 'Email application' : 'Open application';
  return `<button class="row-apply" data-action="row-apply" data-id="${job.id}" aria-label="${label}" title="${label}">${
    isEmail ? icon.mail({ size: 18 }) : icon.link({ size: 18 })
  }</button>`;
}

export function jobRow(job: Job): string {
  const badge = isArchived(job) ? statusPill(job) : pill(job);
  // Active jobs with a link/email get an instant Apply button; otherwise a chevron.
  const trailing =
    !isArchived(job) && job.url
      ? applyButton(job)
      : `<span class="chev">${icon.chevronRight({ size: 18 })}</span>`;
  return `<div class="jrow">
    <button class="jrow-hit" data-action="open-job" data-id="${job.id}">
      <div class="row-main">
        <div class="row-title">${escapeHtml(job.title || 'Untitled')}</div>
        <div class="row-sub">${subLine(job)}</div>
      </div>
      ${badge}
    </button>
    ${trailing}
  </div>`;
}

function sectionBlock(title: string, jobs: Job[]): string {
  return `<div class="section-header">${escapeHtml(title)}</div>
    <div class="card">${jobs.map(jobRow).join('')}</div>`;
}

function emptyState(title: string, sub: string): string {
  return `<div class="empty">
    <div class="ico">${icon.inbox({ size: 24 })}</div>
    <div><div class="ttl">${escapeHtml(title)}</div><div>${escapeHtml(sub)}</div></div>
  </div>`;
}

export function jobsListHTML(jobs: Job[], seg: 'active' | 'applied' | 'all'): string {
  if (seg === 'active') {
    const active = jobs.filter((j) => !isArchived(j));
    const sections = groupedActive(active);
    if (sections.length === 0) return emptyState('All clear', 'No active jobs in the pipeline.');
    return sections.map((s) => sectionBlock(s.title, s.jobs)).join('');
  }
  if (seg === 'applied') {
    const applied = jobs.filter((j) => isArchived(j)).sort((a, b) => b.appliedAt - a.appliedAt);
    if (applied.length === 0) return emptyState('Nothing applied yet', 'Jobs you apply to land here.');
    return `<div class="card">${applied.map(jobRow).join('')}</div>`;
  }
  const all = [...jobs].sort((a, b) => b.added - a.added);
  if (all.length === 0) return emptyState('No jobs yet', 'Tap + or paste a block to add jobs.');
  return `<div class="card">${all.map(jobRow).join('')}</div>`;
}

// Detail chips: NOC/TEER (strong), SOWP, PR pathway, wage, Far.
export function chipsFor(job: Job): string {
  const noc = lookupNoc(job.noc);
  const chips: string[] = [];
  chips.push(`<span class="chip strong">NOC ${escapeHtml(noc.code)} · TEER ${noc.teer}</span>`);
  chips.push(`<span class="chip">${noc.sowp ? 'SOWP eligible' : 'No SOWP'}</span>`);
  chips.push(`<span class="chip">${escapeHtml(noc.pr)}</span>`);
  if (job.wage) chips.push(`<span class="chip">${escapeHtml(job.wage)}</span>`);
  if (isFar(job)) chips.push(`<span class="chip muted">Far / relocate</span>`);
  return chips.join('');
}
