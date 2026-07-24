/**
 * Sync Enhancements.csv `cost` column from mfm-data.json.
 * Only updates cost for rows that already exist. Matched by faction +
 * detachment + normalized name first (the same enhancement name can recur
 * across different detachments at different costs, e.g. Astra Militarum's
 * "Grand Strategist" is 15pts in one detachment and 25pts in another); falls
 * back to faction + name only when that's unambiguous (a single CSV row, or
 * the detachment isn't present in this run's scrape — e.g. a retired
 * detachment no longer listed on the MFM page).
 * Never creates new rows (rules text isn't in the MFM source, only name + cost).
 *
 * Usage: node scripts/sync-enhancement-costs.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'data-source');

const FACTION_MAP = {
  'adepta-sororitas':    ['AS'],
  'adeptus-custodes':    ['AC'],
  'adeptus-mechanicus':  ['AdM'],
  'aeldari':             ['AE'],
  'astra-militarum':     ['AM'],
  'black-templars':      ['SM'],
  'blood-angels':        ['SM'],
  'chaos-daemons':       ['CD'],
  'chaos-knights':       ['QT'],
  'chaos-space-marines': ['CSM'],
  'chaos-titan-legions': ['TL'],
  'dark-angels':         ['SM'],
  'death-guard':         ['DG'],
  'deathwatch':          ['SM', 'AoI'],
  'drukhari':            ['DRU'],
  'emperors-children':   ['EC'],
  'genestealer-cults':   ['GC'],
  'grey-knights':        ['GK'],
  'imperial-agents':     ['AoI', 'SM'],
  'imperial-knights':    ['QI'],
  'leagues-of-votann':   ['LoV'],
  'necrons':             ['NEC'],
  'orks':                ['ORK'],
  'space-marines':       ['SM'],
  'space-wolves':        ['SM'],
  'tau-empire':          ['TAU'],
  'thousand-sons':       ['TS'],
  'titan-legions':       ['TL'],
  'tyranids':            ['TYR'],
  'world-eaters':        ['WE'],
};

function normalName(name) {
  return name
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/\(upgrade\)/g, '')
    .replace(/\(aura\)/g, '')
    .replace(/\bupgrade\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const mfmData = JSON.parse(fs.readFileSync(path.join(__dirname, 'mfm-data.json'), 'utf8'));
const raw = fs.readFileSync(path.join(ROOT, 'Enhancements.csv'), 'utf8');
const lines = raw.split('\n');
const header = lines[0];
const bodyLines = lines.slice(1).filter(l => l.trim());

const rows = bodyLines.map(line => {
  const p = line.split('|');
  return { faction_id: p[0], id: p[1], name: p[2], cost: p[3], detachment: p[4], detachment_id: p[5], legend: p[6], description: p[7] };
});

// Primary lookup: faction + detachment + name (disambiguates same-name
// enhancements that cost differently across detachments).
const detachmentLookup = new Map();
// Secondary lookup: faction + name only, used when a row's detachment
// doesn't appear in this scrape, or only one row shares that faction+name.
const nameLookup = new Map();
rows.forEach((row, idx) => {
  const nameKey = `${row.faction_id}::${normalName(row.name)}`;
  if (!nameLookup.has(nameKey)) nameLookup.set(nameKey, []);
  nameLookup.get(nameKey).push(idx);

  const detKey = `${row.faction_id}::${normalName(row.detachment)}::${normalName(row.name)}`;
  detachmentLookup.set(detKey, idx);
});

let updated = 0;
let skippedAmbiguous = 0;
const changes = [];

for (const factionData of mfmData) {
  const factionIds = FACTION_MAP[factionData.slug] ?? [];
  for (const enh of factionData.enhancements ?? []) {
    if (/^per\s/i.test(enh.name.trim())) continue;
    const norm = normalName(enh.name);
    const detNorm = normalName(enh.detachment ?? '');
    for (const fId of factionIds) {
      const detKey = `${fId}::${detNorm}::${norm}`;
      let idxs;
      if (detachmentLookup.has(detKey)) {
        idxs = [detachmentLookup.get(detKey)];
      } else {
        const nameKey = `${fId}::${norm}`;
        const candidates = nameLookup.get(nameKey) ?? [];
        if (candidates.length > 1) {
          // Ambiguous: multiple CSV rows share this name but none match this
          // detachment. Don't guess which one to update.
          skippedAmbiguous++;
          continue;
        }
        idxs = candidates;
      }
      for (const idx of idxs) {
        const row = rows[idx];
        if (String(row.cost) !== String(enh.pts)) {
          changes.push(`${factionData.faction} / ${row.detachment} / ${row.name}: ${row.cost} -> ${enh.pts}`);
          row.cost = String(enh.pts);
          updated++;
        }
      }
    }
  }
}

const csvLines = [header];
for (const row of rows) {
  csvLines.push([row.faction_id, row.id, row.name, row.cost, row.detachment, row.detachment_id, row.legend, row.description].join('|') + '|');
}
fs.writeFileSync(path.join(ROOT, 'Enhancements.csv'), csvLines.join('\n') + '\n', 'utf8');

console.log(`Updated ${updated} enhancement costs.`);
if (skippedAmbiguous > 0) console.log(`Skipped ${skippedAmbiguous} ambiguous same-name matches (no detachment match, multiple candidates).`);
changes.forEach(c => console.log(' -', c));
