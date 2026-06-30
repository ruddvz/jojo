import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { PROFILE } from './data';
import type { Job, Track } from './types';
import { track as trackOf } from './triage';

// ---- Page geometry (US Letter, points) ----
const PAGE_W = 612;
const PAGE_H = 792;
const M_LEFT = 0.62 * 72;
const M_RIGHT = 0.62 * 72;
const M_TOP = 0.55 * 72;
const CONTENT_W = PAGE_W - M_LEFT - M_RIGHT;

// ---- Colours (docs/07) ----
const ACCENT = rgb(15 / 255, 90 / 255, 55 / 255);
const MID = rgb(70 / 255, 70 / 255, 70 / 255);
const SOFT = rgb(130 / 255, 130 / 255, 130 / 255);
const INK = rgb(0.05, 0.05, 0.05);

// ---- Type sizes ----
const S_NAME = 16;
const S_CONTACT = 9;
const S_SECTION = 9.5;
const S_BODY = 9.6;
const S_SMALL = 8.7;

interface Fonts {
  reg: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
}

// Cache the raw font bytes (browser/SW also caches the request); embed per-document.
let bytesCache: ArrayBuffer[] | null = null;

async function loadFontBytes(file: string): Promise<ArrayBuffer> {
  const res = await fetch(`${import.meta.env.BASE_URL}fonts/${file}`);
  if (!res.ok) throw new Error(`font ${file} ${res.status}`);
  return res.arrayBuffer();
}

async function getFonts(doc: PDFDocument): Promise<Fonts> {
  try {
    if (!bytesCache) {
      bytesCache = await Promise.all([
        loadFontBytes('IBMPlexSerif-Regular.ttf'),
        loadFontBytes('IBMPlexSerif-Bold.ttf'),
        loadFontBytes('IBMPlexSerif-Italic.ttf'),
        loadFontBytes('IBMPlexSerif-BoldItalic.ttf'),
      ]);
    }
    const [reg, bold, italic, boldItalic] = bytesCache;
    return {
      reg: await doc.embedFont(reg, { subset: true }),
      bold: await doc.embedFont(bold, { subset: true }),
      italic: await doc.embedFont(italic, { subset: true }),
      boldItalic: await doc.embedFont(boldItalic, { subset: true }),
    };
  } catch {
    // docs/07 fallback: never block the build.
    return {
      reg: await doc.embedFont(StandardFonts.TimesRoman),
      bold: await doc.embedFont(StandardFonts.TimesRomanBold),
      italic: await doc.embedFont(StandardFonts.TimesRomanItalic),
      boldItalic: await doc.embedFont(StandardFonts.TimesRomanBoldItalic),
    };
  }
}

// ---- Content tailoring (honest; never invent — docs/05, docs/07) ----

interface SkillRow {
  label: string;
  value: string;
  keys: string[];
}

const SKILLS_A: SkillRow[] = [
  {
    label: 'Drafting and Design',
    value:
      'AutoCAD, Revit, Building Information Modelling (BIM), Technical Drawing, Construction Documentation',
    keys: ['autocad', 'revit', 'bim', 'draft', 'cad', 'drawing', 'design', 'document', 'architect'],
  },
  {
    label: 'Coordination',
    value:
      'Drawing Review and Conformity Checking, Conflict and Clarification Identification, Stakeholder Communication',
    keys: ['review', 'coordination', 'conformity', 'stakeholder', 'communication', 'rfi'],
  },
  {
    label: 'Technical Precision',
    value: 'Dimensional Accuracy, Engineering Specifications, Micrometers, Calipers, Gauges',
    keys: ['precision', 'dimension', 'measure', 'tolerance', 'spec', 'inspection', 'quality'],
  },
  {
    label: 'Software and Tools',
    value: 'Microsoft Office (Excel, Word), Adobe Creative Suite',
    keys: ['office', 'excel', 'word', 'adobe', 'software'],
  },
];

const SKILLS_B: SkillRow[] = [
  {
    label: 'Machining and Equipment',
    value: 'CNC Machine Operation, Overhead Hand Crane, Set-up Support, Routine Equipment Maintenance',
    keys: ['cnc', 'machin', 'crane', 'equipment', 'set-up', 'setup', 'operat', 'mill', 'lathe'],
  },
  {
    label: 'Quality and Measurement',
    value: 'Micrometers, Calipers, Gauges, Dimensional Inspection, Engineering Specifications',
    keys: ['quality', 'measure', 'micrometer', 'caliper', 'gauge', 'inspection', 'tolerance', 'dimension'],
  },
  {
    label: 'Blueprints',
    value: 'Blueprint and Schematic Reading, Technical Drawing, Construction Documentation',
    keys: ['blueprint', 'schematic', 'drawing', 'spec', 'read'],
  },
  {
    label: 'Safety and Workplace',
    value: 'PPE, SOPs, Lockout/Tagout, Documentation, Team Collaboration',
    keys: ['safety', 'ppe', 'sop', 'lockout', 'wsib', 'team', 'lift'],
  },
];

const SUMMARY_A =
  'Architectural and construction technology graduate with hands-on AutoCAD and Revit experience developed across three semesters of design projects covering 2D drawings, 3D modelling, and full construction documentation. Comfortable reviewing drawings for conformity and coordination and communicating clearly with a project team. Backed by over four years of manufacturing and warehouse experience where dimensional precision, documentation accuracy, and adherence to specifications were part of every shift.';

const SUMMARY_B =
  'Production professional with direct CNC machine operation experience on a high-speed automotive line, paired with precision inspection using micrometers, calipers, and gauges. Comfortable reading blueprints, holding dimensional tolerances, and following strict SOPs across full shifts. Reliable and safety-focused, with a Construction Engineering Technology diploma adding solid blueprint and technical-drawing knowledge.';

function jobKeywords(job: Job): string {
  return (
    job.title +
    ' ' +
    job.requirements.map((r) => r.text).join(' ') +
    ' ' +
    job.notes
  ).toLowerCase();
}

// Reorder skill rows so the most relevant category for this job comes first.
function tailorSkills(rows: SkillRow[], kw: string): SkillRow[] {
  return rows
    .map((row, i) => {
      const hits = row.keys.reduce((n, k) => (kw.includes(k) ? n + 1 : n), 0);
      return { row, hits, i };
    })
    .sort((a, b) => b.hits - a.hits || a.i - b.i)
    .map((r) => r.row);
}

// Fixed experience from profile.json, ordered Linamar-first (most demonstrative),
// with a relevant bullet subset to hold one page.
function experienceBlocks() {
  const find = (frag: string) => PROFILE.experience.find((e) => e.company.includes(frag))!;
  const linamar = find('Linamar');
  const organigram = find('Organigram');
  const domain = find('Domain');
  return [
    { exp: linamar, bullets: linamar.bullets.slice(0, 4) },
    { exp: organigram, bullets: [organigram.bullets[0], organigram.bullets[2], organigram.bullets[3]] },
    { exp: domain, bullets: [domain.bullets[0], domain.bullets[1], domain.bullets[3]] },
  ];
}

// ---- Drawing engine ----

class Layout {
  y: number; // baseline cursor from top
  constructor(private page: PDFPage, private f: Fonts) {
    this.y = M_TOP;
  }

  private at(): number {
    return PAGE_H - this.y;
  }

  gap(pts: number) {
    this.y += pts;
  }

  wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const trial = cur ? cur + ' ' + w : w;
      if (font.widthOfTextAtSize(trial, size) > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = trial;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  text(
    text: string,
    opts: { x?: number; size?: number; font?: PDFFont; color?: typeof MID; maxW?: number; lead?: number } = {}
  ) {
    const x = opts.x ?? M_LEFT;
    const size = opts.size ?? S_BODY;
    const font = opts.font ?? this.f.reg;
    const color = opts.color ?? MID;
    const maxW = opts.maxW ?? M_LEFT + CONTENT_W - x;
    const lead = opts.lead ?? size * 1.32;
    const lines = this.wrap(text, font, size, maxW);
    for (const line of lines) {
      this.y += size;
      this.page.drawText(line, { x, y: this.at(), size, font, color });
      this.y += lead - size;
    }
  }

  rule(thickness = 0.6, color = ACCENT, topPad = 1.5) {
    this.y += topPad;
    this.page.drawLine({
      start: { x: M_LEFT, y: this.at() },
      end: { x: M_LEFT + CONTENT_W, y: this.at() },
      thickness,
      color,
    });
  }

  section(title: string) {
    this.gap(8);
    this.text(title.toUpperCase(), { font: this.f.bold, size: S_SECTION, color: ACCENT, lead: S_SECTION });
    this.rule(0.6, ACCENT, 2.5);
    this.gap(5);
  }

  // Left bold label + right soft date on one row, with an optional detail line under.
  titleRow(left: string, right: string, detail?: string) {
    const size = S_BODY;
    const rightW = this.f.italic.widthOfTextAtSize(right, S_SMALL);
    this.y += size;
    this.page.drawText(left, { x: M_LEFT, y: this.at(), size, font: this.f.bold, color: INK });
    if (right) {
      this.page.drawText(right, {
        x: M_LEFT + CONTENT_W - rightW,
        y: this.at(),
        size: S_SMALL,
        font: this.f.italic,
        color: SOFT,
      });
    }
    this.y += size * 0.32;
    if (detail) {
      this.gap(2);
      this.text(detail, { size: S_SMALL, color: MID });
    }
  }

  bullet(text: string) {
    const indent = 14;
    const x = M_LEFT + indent;
    const size = S_BODY;
    const maxW = CONTENT_W - indent;
    const lines = this.wrap(text, this.f.reg, size, maxW);
    lines.forEach((line, i) => {
      this.y += size;
      if (i === 0) {
        // open circle marker in accent green
        this.page.drawEllipse({
          x: M_LEFT + 4.5,
          y: this.at() + size * 0.3,
          xScale: 1.6,
          yScale: 1.6,
          borderColor: ACCENT,
          borderWidth: 0.7,
        });
      }
      this.page.drawText(line, { x, y: this.at(), size, font: this.f.reg, color: MID });
      this.y += size * 0.34;
    });
    this.gap(1.2);
  }

  // Two-column skill row: bold label left, value right.
  skillRow(label: string, value: string) {
    const labelW = CONTENT_W * 0.27;
    const valX = M_LEFT + labelW + 6;
    const valMaxW = M_LEFT + CONTENT_W - valX;
    const size = S_BODY;
    const valueLines = this.wrap(value, this.f.reg, size, valMaxW);
    const startY = this.y;
    // label on first line
    this.y += size;
    this.page.drawText(label, { x: M_LEFT, y: this.at(), size, font: this.f.bold, color: INK });
    let vy = startY;
    valueLines.forEach((line) => {
      vy += size;
      this.page.drawText(line, { x: valX, y: PAGE_H - vy, size, font: this.f.reg, color: MID });
      vy += size * 0.34;
    });
    this.y = Math.max(this.y + size * 0.34, vy);
    this.gap(2.5);
  }
}

function drawHeader(L: Layout, f: Fonts) {
  L.text(PROFILE.name, { font: f.bold, size: S_NAME, color: INK, lead: S_NAME });
  L.gap(3);
  const contact = `${PROFILE.location}   |   ${PROFILE.phone}   |   ${PROFILE.email}`;
  L.text(contact, { size: S_CONTACT, color: MID, lead: S_CONTACT });
  L.rule(0.6, ACCENT, 4);
}

function drawSummary(L: Layout, track: Track) {
  L.section('Professional Summary');
  L.text(track === 'A' ? SUMMARY_A : SUMMARY_B, { color: MID });
}

function drawEducation(L: Layout) {
  L.section('Education');
  PROFILE.education.forEach((e, i) => {
    if (i > 0) L.gap(5);
    L.titleRow(`${e.program} – ${e.school}`, e.dates, e.detail);
  });
}

function drawSkills(L: Layout, rows: SkillRow[]) {
  L.section('Core Skills AND Qualifications');
  rows.forEach((r) => L.skillRow(r.label, r.value));
}

function drawExperience(L: Layout) {
  L.section('Professional Experience');
  experienceBlocks().forEach((block, i) => {
    if (i > 0) L.gap(5);
    const e = block.exp;
    L.titleRow(`${e.title} – ${e.company}`, `${e.location}   |   ${e.dates}`);
    L.gap(1);
    block.bullets.forEach((b) => L.bullet(b));
  });
}

export async function generateResume(job: Job): Promise<Uint8Array> {
  const t = trackOf(job);
  // Income-only / unknown jobs still get a sensible template: trades-style B.
  const template: Track = t === 'A' ? 'A' : 'B';
  const kw = jobKeywords(job);

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const f = await getFonts(doc);

  const page = doc.addPage([PAGE_W, PAGE_H]);
  const L = new Layout(page, f);

  drawHeader(L, f);

  if (template === 'A') {
    drawSummary(L, 'A');
    drawEducation(L);
    drawSkills(L, tailorSkills(SKILLS_A, kw));
    drawExperience(L);
  } else {
    drawSummary(L, 'B');
    drawSkills(L, tailorSkills(SKILLS_B, kw));
    drawExperience(L);
    drawEducation(L);
  }

  doc.setTitle('Rudrakumar Patel — Résumé');
  doc.setAuthor(PROFILE.name);
  return doc.save();
}
