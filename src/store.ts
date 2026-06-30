import { SEED } from './data';
import type { Job, Status } from './types';

const JOBS_KEY = 'jobs.v1';
const SEEDED_KEY = 'jobs.seeded.v1';
const ROUTINE_KEY = 'routine.v1'; // value: { date: 'YYYY-MM-DD', done: boolean[] }

export const ROUTINE_ITEMS = [
  'Open today’s searches or paste a new block',
  'Apply to every Apply-now job',
  'Send one Track A application',
  'Send materials for one Prep job',
  'Follow up on anything 5+ days old',
];

let jobs: Job[] = [];
const listeners = new Set<() => void>();

function uid(): string {
  return 'j' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

export function normalizeJob(raw: Partial<Job>): Job {
  return {
    id: raw.id || uid(),
    title: (raw.title || '').trim(),
    employer: (raw.employer || '').trim(),
    location: raw.location || '',
    noc: raw.noc || 'other',
    channel: raw.channel || 'indeed',
    wage: raw.wage || '',
    url: raw.url || '',
    commute: raw.commute || 'in',
    gap: !!raw.gap,
    ready: !!raw.ready,
    status: raw.status || 'toapply',
    requirements: Array.isArray(raw.requirements)
      ? raw.requirements.map((r) => ({ text: String(r.text || ''), done: !!r.done }))
      : [],
    notes: raw.notes || '',
    added: raw.added || Date.now(),
    appliedAt: raw.appliedAt || 0,
  };
}

function persist(): void {
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

export function load(): void {
  const stored = localStorage.getItem(JOBS_KEY);
  if (stored) {
    try {
      jobs = (JSON.parse(stored) as Partial<Job>[]).map(normalizeJob);
    } catch {
      jobs = [];
    }
  }
  // Seed once on first run.
  if (!localStorage.getItem(SEEDED_KEY)) {
    if (!stored) {
      jobs = (SEED as Partial<Job>[]).map(normalizeJob);
      persist();
    }
    localStorage.setItem(SEEDED_KEY, '1');
  }
}

export function subscribe(fn: () => void): void {
  listeners.add(fn);
}

function emit(): void {
  persist();
  listeners.forEach((fn) => fn());
}

export function allJobs(): Job[] {
  return jobs;
}

export function getJob(id: string): Job | undefined {
  return jobs.find((j) => j.id === id);
}

export function upsertJob(job: Job): void {
  const idx = jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) jobs[idx] = job;
  else jobs.push(job);
  emit();
}

export function addJobs(newJobs: Job[]): void {
  jobs.push(...newJobs);
  emit();
}

export function deleteJob(id: string): void {
  jobs = jobs.filter((j) => j.id !== id);
  emit();
}

export function setStatus(id: string, status: Status): void {
  const job = getJob(id);
  if (!job) return;
  job.status = status;
  emit();
}

export function markApplied(id: string): void {
  const job = getJob(id);
  if (!job) return;
  job.status = 'applied';
  job.appliedAt = Date.now();
  emit();
}

export function toggleRequirement(id: string, index: number): void {
  const job = getJob(id);
  if (!job || !job.requirements[index]) return;
  job.requirements[index].done = !job.requirements[index].done;
  emit();
}

// ---- Backup ----
export function exportJSON(): string {
  return JSON.stringify(jobs, null, 2);
}

export function importJSON(text: string): number {
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error('Backup must be a JSON array of jobs.');
  jobs = parsed.map(normalizeJob);
  emit();
  return jobs.length;
}

// ---- Daily routine (resets by date) ----
export function todayKey(): string {
  // Local date, not UTC, so the routine flips at local midnight.
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getRoutine(): boolean[] {
  const fresh = ROUTINE_ITEMS.map(() => false);
  const raw = localStorage.getItem(ROUTINE_KEY);
  if (!raw) return fresh;
  try {
    const parsed = JSON.parse(raw) as { date: string; done: boolean[] };
    if (parsed.date !== todayKey()) return fresh;
    return ROUTINE_ITEMS.map((_, i) => !!parsed.done[i]);
  } catch {
    return fresh;
  }
}

export function setRoutine(index: number, value: boolean): void {
  const done = getRoutine();
  done[index] = value;
  localStorage.setItem(ROUTINE_KEY, JSON.stringify({ date: todayKey(), done }));
  listeners.forEach((fn) => fn());
}
