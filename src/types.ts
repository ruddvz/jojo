export type Channel = 'indeed' | 'email' | 'career' | 'assess';
export type Commute = 'in' | 'far' | 'remote';
export type Status = 'toapply' | 'lead' | 'applied' | 'interview' | 'offer' | 'closed';
export type Track = 'A' | 'B' | 'N';
export type Verdict = 'apply' | 'prep' | 'backup';

export interface Requirement {
  text: string;
  done: boolean;
}

export interface Job {
  id: string;
  title: string;
  employer: string;
  location: string;
  noc: string;
  channel: Channel;
  wage: string;
  url: string;
  commute: Commute;
  gap: boolean;
  ready: boolean;
  status: Status;
  requirements: Requirement[];
  notes: string;
  // Optional hand-written (or Claude-written) tailored résumé summary line.
  // When present it overrides the auto-composed summary. Always Rudra's own facts.
  summary: string;
  added: number;
  appliedAt: number;
}

export interface NocEntry {
  code: string;
  name: string;
  teer: number;
  track: Track;
  sowp: boolean;
  pr: string;
}

export interface Profile {
  name: string;
  location: string;
  commute_km: string;
  phone: string;
  email: string;
  education: {
    program: string;
    school: string;
    dates: string;
    detail: string;
  }[];
  experience: {
    title: string;
    company: string;
    location: string;
    dates: string;
    bullets: string[];
  }[];
  skill_bank: Record<string, string>;
  rules: Record<string, unknown>;
}
