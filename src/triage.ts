import { lookupNoc } from './data';
import type { Job, Track, Verdict } from './types';

const ARCHIVED: Job['status'][] = ['applied', 'interview', 'offer', 'closed'];

export function track(job: Job): Track {
  return lookupNoc(job.noc).track;
}

export function isIncomeOnly(job: Job): boolean {
  return track(job) === 'N';
}

export function isArchived(job: Job): boolean {
  return ARCHIVED.includes(job.status);
}

// docs/04 — Derived verdict.
export function verdict(job: Job): Verdict {
  if (isIncomeOnly(job)) return 'backup';
  const needsWork =
    job.gap ||
    job.requirements.some((r) => !r.done) ||
    !job.ready ||
    job.channel === 'email' ||
    job.channel === 'career' ||
    job.channel === 'assess';
  return needsWork ? 'prep' : 'apply';
}

export function verdictLabel(v: Verdict): string {
  return v === 'apply' ? 'Apply now' : v === 'prep' ? 'Prep' : 'Backup';
}

// docs/04 — Priority score for sorting (descending).
export function score(job: Job): number {
  const t = track(job);
  let s = t === 'A' ? 100 : t === 'B' ? 70 : 30;
  if (job.channel === 'indeed') s += 8;
  if (job.commute === 'in') s += 8;
  else if (job.commute === 'remote') s += 4;
  else if (job.commute === 'far') s -= 6;
  if (!job.gap && t !== 'N') s += 4;
  return s;
}

export type SectionKey = 'A' | 'B' | 'income';

export interface Section {
  key: SectionKey;
  title: string;
  jobs: Job[];
}

export function sectionFor(job: Job): SectionKey {
  const t = track(job);
  return t === 'A' ? 'A' : t === 'B' ? 'B' : 'income';
}

const SECTION_TITLES: Record<SectionKey, string> = {
  A: 'Track A · TEER 2 · SOWP + PR',
  B: 'Track B · TEER 3 · Skilled Trades',
  income: 'Income / other',
};

// Group active jobs into the three sections, each sorted by score desc.
export function groupedActive(jobs: Job[]): Section[] {
  const order: SectionKey[] = ['A', 'B', 'income'];
  return order
    .map((key) => ({
      key,
      title: SECTION_TITLES[key],
      jobs: jobs
        .filter((j) => sectionFor(j) === key)
        .sort((a, b) => score(b) - score(a)),
    }))
    .filter((sec) => sec.jobs.length > 0);
}

export function reqCounter(job: Job): { done: number; total: number } {
  return {
    done: job.requirements.filter((r) => r.done).length,
    total: job.requirements.length,
  };
}

export function isFar(job: Job): boolean {
  return job.commute === 'far';
}
