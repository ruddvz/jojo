import { PROFILE } from './data';
import type { Track } from './types';

export interface CoverInput {
  employer: string;
  title: string;
  track: Track; // 'A' technical, 'B' trades; 'N' falls back to B-style trades
  extra?: string;
}

const SIGNOFF = `Sincerely,\n${PROFILE.name}\n${PROFILE.phone} | ${PROFILE.email}`;

// docs/08 — clean merge: empty title -> "this position"; empty extra -> omit cleanly.
export function generateCoverLetter(input: CoverInput): string {
  const employer = input.employer.trim() || 'your team';
  const title = input.title.trim();
  const rolePhrase = title ? `the ${title} position` : 'this position';
  const extra = (input.extra || '').trim();
  const extraSentence = extra ? ` ${extra}` : '';

  if (input.track === 'A') {
    return [
      'Dear Hiring Manager,',
      `I am applying for ${rolePhrase} at ${employer}. My Architecture: Construction Engineering Technology diploma gave me hands-on AutoCAD and Revit experience across three semesters of design projects, and I pair that drafting foundation with a careful, detail-focused approach that fits this role.${extraSentence}`,
      'Across my diploma I produced 2D drawings, 3D models, and full construction documentation, and I reviewed drawings for conformity and coordination. Alongside my studies I built four years of manufacturing and warehouse experience where dimensional precision, accurate documentation, and following set specifications were part of every shift. That mix means I can read technical drawings, keep records organised, and work accurately within structured processes from day one.',
      'My Interior Decorating diploma added further AutoCAD and space planning practice, and I am comfortable communicating clearly with a project team. I learn quickly and take ownership of the work in front of me.',
      `I would welcome the chance to discuss how I can contribute to ${employer}. Thank you for your time and consideration.`,
      SIGNOFF,
    ].join('\n\n');
  }

  // Track B (and income-only) — trades / manufacturing.
  return [
    'Dear Hiring Manager,',
    `I am applying for ${rolePhrase} at ${employer}. I bring over four years of hands-on manufacturing and production experience, and I am ready to contribute safely and reliably from my first shift.${extraSentence}`,
    'At Linamar I operated CNC and mechanical equipment on a high-speed automotive line, used an overhead hand crane to position raw engine parts, and ran precision quality checks with micrometers, calipers, and gauges against engineering specifications. I am comfortable reading blueprints, following strict SOPs, and keeping output and quality consistent under sustained physical work. My warehouse roles at Organigram and Domain Logistics added GMP compliance, accurate documentation, and a clean safety record.',
    'My Construction Engineering Technology diploma gives me a solid grounding in blueprints and technical drawings, which helps me pick up shop drawings and specifications quickly.',
    `I would welcome the chance to discuss how I can support the team at ${employer}. Thank you for your time and consideration.`,
    SIGNOFF,
  ].join('\n\n');
}
