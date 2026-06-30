import nocRaw from './data/noc.json';
import profileRaw from './data/profile.json';
import seedRaw from './data/seed-jobs.json';
import type { NocEntry, Profile } from './types';

export const NOC = nocRaw as NocEntry[];
export const PROFILE = profileRaw as Profile;
export const SEED = seedRaw as unknown[];

const byCode = new Map(NOC.map((n) => [n.code, n]));
export const OTHER_NOC: NocEntry = byCode.get('other')!;

export function lookupNoc(code: string): NocEntry {
  return byCode.get(code) ?? OTHER_NOC;
}

// Keyword -> NOC code map for Paste-add / manual guessing (docs/04).
const KEYWORD_MAP: [RegExp, string][] = [
  [/architect/i, '22210'],
  [/draft|cad/i, '22212'],
  [/civil/i, '22300'],
  [/estimat/i, '22303'],
  [/inspector/i, '22234'],
  [/cnc|machinist/i, '72100'],
  [/weld|fabricat/i, '72106'],
  [/carpenter/i, '72310'],
  [/cabinet/i, '72311'],
  [/electric/i, '72200'],
  [/plumb/i, '72300'],
  [/hvac/i, '72401'],
  [/millwright|mechanic|maintenance/i, '72400'],
  [/painter/i, '73112'],
  [/drywall|plaster/i, '73102'],
  [/warehouse|picker/i, '75101'],
  [/labour|labor/i, '75110'],
];

export function guessNoc(text: string): string {
  const code = text.match(/\b(\d{5})\b/);
  if (code && byCode.has(code[1])) return code[1];
  for (const [re, mapped] of KEYWORD_MAP) {
    if (re.test(text)) return mapped;
  }
  return 'other';
}
