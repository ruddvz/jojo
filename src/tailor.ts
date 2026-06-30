// Honest, deterministic résumé/cover-letter tailoring.
//
// Every phrase below is a skill Rudra genuinely has (sourced from profile.json:
// his diploma, the three jobs, and the skill bank). Tailoring works by matching a
// posting's requirements/title against these skills and FOREGROUNDING the ones
// the job asks for — it never adds a skill that isn't in this list, so it can
// never claim welding hours, tickets, or anything he lacks. Gap requirements
// simply find no match and are left out (not fabricated).

import type { Job, Track } from './types';

type SkillTrack = 'A' | 'B' | 'both';

interface Skill {
  id: string;
  track: SkillTrack;
  phrase: string; // competency noun-phrase, generically true of Rudra
  aliases: string[]; // lowercased substrings to match in a posting
}

const SKILLS: Skill[] = [
  { id: 'autocad', track: 'A', phrase: 'AutoCAD', aliases: ['autocad', 'auto cad'] },
  { id: 'revit', track: 'A', phrase: 'Revit', aliases: ['revit'] },
  {
    id: 'bim',
    track: 'A',
    phrase: 'Building Information Modelling (BIM)',
    aliases: ['bim', 'building information'],
  },
  {
    id: 'techdraw',
    track: 'both',
    phrase: 'technical drawing and drafting',
    aliases: ['technical drawing', 'drafting', 'draft', 'cad', '2d', '3d model', 'modelling', 'modeling'],
  },
  {
    id: 'blueprint',
    track: 'both',
    phrase: 'blueprint and schematic reading',
    aliases: ['blueprint', 'schematic', 'shop drawing', 'read drawings', 'print reading'],
  },
  {
    id: 'constrdoc',
    track: 'A',
    phrase: 'construction documentation',
    aliases: ['construction document', 'documentation', 'specification', 'specs'],
  },
  {
    id: 'review',
    track: 'A',
    phrase: 'drawing review and coordination',
    aliases: ['review', 'conformity', 'coordination', 'clarification', 'rfi'],
  },
  {
    id: 'cnc',
    track: 'B',
    phrase: 'CNC machine operation',
    aliases: ['cnc', 'machinist', 'machining', 'mill', 'lathe', 'turning', 'swiss'],
  },
  {
    id: 'quality',
    track: 'both',
    phrase: 'precision quality inspection with micrometers, calipers, and gauges',
    aliases: ['quality', 'inspection', 'micrometer', 'caliper', 'gauge', 'tolerance', 'dimensional', 'measure', 'qc', 'gd&t'],
  },
  {
    id: 'crane',
    track: 'B',
    phrase: 'overhead crane operation',
    aliases: ['crane', 'overhead crane', 'hoist', 'rigging'],
  },
  {
    id: 'forklift',
    track: 'B',
    phrase: 'order-picker and lift-truck operation',
    aliases: ['forklift', 'order picker', 'lift truck', 'reach truck', 'walkie', 'pallet jack', 'counterbalance'],
  },
  {
    id: 'rfwms',
    track: 'B',
    phrase: 'RF-scanner and WMS inventory tracking',
    aliases: ['rf scanner', 'wms', 'inventory', 'scanner', 'picking', 'sku', 'cycle count'],
  },
  {
    id: 'maintenance',
    track: 'B',
    phrase: 'routine equipment maintenance and basic mechanical checks',
    aliases: ['maintenance', 'mechanical', 'repair', 'preventive', 'facilities', 'millwright'],
  },
  {
    id: 'safety',
    track: 'both',
    phrase: 'SOP, PPE, and safety compliance',
    aliases: ['safety', 'ppe', 'sop', 'lockout', 'tagout', 'gmp', 'sanitation', 'hazard', 'wsib', '5s'],
  },
  {
    id: 'docs',
    track: 'both',
    phrase: 'accurate documentation and recordkeeping',
    aliases: ['records', 'recordkeeping', 'audit', 'report', 'labelling', 'labeling'],
  },
  {
    id: 'production',
    track: 'B',
    phrase: 'high-speed production-line operation',
    aliases: ['production', 'assembly', 'automotive', 'manufacturing', 'fabrication'],
  },
  { id: 'lifting', track: 'B', phrase: 'sustained physical work', aliases: ['lift', 'lbs', 'physical', 'manual handling'] },
  {
    id: 'office',
    track: 'both',
    phrase: 'Microsoft Office (Excel, Word)',
    aliases: ['excel', 'word', 'microsoft office', 'spreadsheet', 'ms office'],
  },
  {
    id: 'adobe',
    track: 'A',
    phrase: 'Adobe Creative Suite',
    aliases: ['adobe', 'photoshop', 'illustrator', 'creative suite', 'indesign'],
  },
  { id: 'space', track: 'A', phrase: 'space planning', aliases: ['space planning', 'interior', 'layout'] },
];

const BY_ID = new Map(SKILLS.map((s) => [s.id, s]));

const A_DEFAULTS = ['autocad', 'revit', 'bim', 'blueprint', 'constrdoc'];
const B_DEFAULTS = ['cnc', 'quality', 'blueprint', 'crane', 'safety'];

function matchScored(job: Job): { skill: Skill; score: number }[] {
  const title = (job.title || '').toLowerCase();
  const reqs = job.requirements.map((r) => r.text).join(' ').toLowerCase();
  const notes = (job.notes || '').toLowerCase();
  const out: { skill: Skill; score: number }[] = [];
  for (const skill of SKILLS) {
    let score = 0;
    for (const a of skill.aliases) {
      if (reqs.includes(a)) score += 3;
      if (title.includes(a)) score += 2;
      if (notes.includes(a)) score += 1;
    }
    if (score > 0) out.push({ skill, score });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

function humanJoin(items: string[]): string {
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

// Ordered, de-duped skill ids: job-matched first, then track defaults to fill.
function rankedIds(job: Job, template: Track, max: number): string[] {
  const matched = matchScored(job)
    .map((m) => m.skill)
    .filter((s) => template === 'B' ? s.track !== 'A' : s.track !== 'B')
    .map((s) => s.id);
  const defaults = template === 'A' ? A_DEFAULTS : B_DEFAULTS;
  const seen = new Set<string>();
  const order: string[] = [];
  for (const id of [...matched, ...defaults]) {
    if (!seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
    if (order.length >= max) break;
  }
  return order;
}

// Résumé Professional Summary — tailored opener list + fixed, vetted evidence.
export function composeSummary(job: Job, template: Track): string {
  if (job.summary && job.summary.trim()) return job.summary.trim();
  const list = humanJoin(rankedIds(job, template, 4).map((id) => BY_ID.get(id)!.phrase));
  if (template === 'A') {
    return (
      `Architectural and construction technology graduate with hands-on experience in ${list}. ` +
      'Produced 2D drawings, 3D models, and full construction documentation across three semesters of design projects, and reviewed drawings for conformity and coordination. ' +
      'Backed by over four years of manufacturing and warehouse experience built on dimensional precision, accurate documentation, and following set specifications.'
    );
  }
  return (
    `Hands-on production and warehouse professional with experience in ${list}. ` +
    'At Linamar, operated CNC and mechanical equipment on a high-speed automotive line and ran precision quality checks with micrometers, calipers, and gauges against engineering specifications. ' +
    'A Construction Engineering Technology diploma adds solid blueprint and technical-drawing knowledge.'
  );
}

// Top matched competencies for a cover-letter "your posting focuses on …" sentence.
export function coverHighlights(job: Job, max = 3): string[] {
  return matchScored(job)
    .slice(0, max)
    .map((m) => m.skill.phrase);
}
