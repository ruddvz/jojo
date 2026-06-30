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
import type { Job } from './types';

export function pill(job: Job): string {
  const v = verdict(job);
  return `<span class="pill ${v}">${verdictLabel(v)}</span>`;
}

function metaLine(job: Job): string {
  const { done, total } = reqCounter(job);
  const bits: string[] = [pill(job)];
  if (job.wage) bits.push(`<span>${escapeHtml(job.wage)}</span>`);
  if (total > 0) bits.push(`<span>${done}/${total} reqs</span>`);
  if (isFar(job)) bits.push(`<span class="tag far">Far</span>`);
  return bits.join('');
}

export function jobRow(job: Job): string {
  return `<button class="row tappable" data-action="open-job" data-id="${job.id}">
    <div class="grow">
      <div class="title">${escapeHtml(job.title || 'Untitled')}</div>
      <div class="emp">${escapeHtml(job.employer || '—')}</div>
      <div class="meta">${metaLine(job)}</div>
    </div>
    <div class="chev">›</div>
  </button>`;
}

function sectionBlock(title: string, jobs: Job[]): string {
  return `<div class="section-header">${escapeHtml(title)}</div>
    <div class="card">${jobs.map(jobRow).join('')}</div>`;
}

export function jobsListHTML(jobs: Job[], seg: 'active' | 'applied' | 'all'): string {
  if (seg === 'active') {
    const active = jobs.filter((j) => !isArchived(j));
    const sections = groupedActive(active);
    if (sections.length === 0) return `<div class="empty">All clear ✓</div>`;
    return sections.map((s) => sectionBlock(s.title, s.jobs)).join('');
  }
  if (seg === 'applied') {
    const applied = jobs
      .filter((j) => isArchived(j))
      .sort((a, b) => b.appliedAt - a.appliedAt);
    if (applied.length === 0) return `<div class="empty">Nothing applied yet</div>`;
    return `<div class="card">${applied.map(jobRow).join('')}</div>`;
  }
  const all = [...jobs].sort((a, b) => b.added - a.added);
  if (all.length === 0) return `<div class="empty">No jobs yet. Tap + to add one.</div>`;
  return `<div class="card">${all.map(jobRow).join('')}</div>`;
}

export function tagFor(job: Job): string {
  const noc = lookupNoc(job.noc);
  const tags: string[] = [];
  tags.push(`<span class="tag">NOC ${escapeHtml(noc.code)} · TEER ${noc.teer}</span>`);
  tags.push(`<span class="tag">${noc.sowp ? 'SOWP eligible' : 'No SOWP'}</span>`);
  tags.push(`<span class="tag">${escapeHtml(noc.pr)}</span>`);
  if (job.wage) tags.push(`<span class="tag">${escapeHtml(job.wage)}</span>`);
  if (isFar(job)) tags.push(`<span class="tag far">Far / relocate</span>`);
  return tags.join('');
}
