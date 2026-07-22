/**
 * Adds/refreshes `disposition` and `dp` columns on public/data/Detachments.csv
 * using data scraped from mfm-data.json. Safe to run repeatedly — the base
 * column set is fixed rather than read off the file's current header, so a
 * prior run's appended columns are replaced, not appended to again.
 *
 * Usage: node scripts/update-detachments.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'public', 'data');

// Same faction slug → CSV faction_id mapping as update-costs.mjs
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
  return name.toLowerCase().replace(/[''`]/g, "'").replace(/\s+/g, ' ').trim();
}

function main() {
  const mfmData = JSON.parse(fs.readFileSync(path.join(__dirname, 'mfm-data.json'), 'utf8'));

  // Read the CSV raw (preserve trailing pipe)
  const raw = fs.readFileSync(path.join(ROOT, 'Detachments.csv'), 'utf8');
  const lines = raw.split('\n');

  // Fixed base columns — deliberately not derived from the file's current
  // header, so re-running this script never re-appends disposition/dp.
  const BASE_HEADERS = ['id', 'faction_id', 'name', 'legend', 'type'];

  // Parse rows into objects
  const rows = lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const parts = line.split('|');
      return {
        id: parts[0] ?? '',
        faction_id: parts[1] ?? '',
        name: parts[2] ?? '',
        legend: parts[3] ?? '',
        type: parts[4] ?? '',
        disposition: '',
        dp: '',
      };
    });

  // Build lookup: (factionId, normalName) → row index
  const lookup = new Map();
  rows.forEach((row, idx) => {
    const key = `${row.faction_id}::${normalName(row.name)}`;
    lookup.set(key, idx);
  });

  let updated = 0;
  let unmatched = 0;
  const unmatchedList = [];

  for (const factionData of mfmData) {
    const factionIds = FACTION_MAP[factionData.slug] ?? [];
    for (const det of factionData.detachments) {
      const normDet = normalName(det.name);
      let matched = false;

      for (const fId of factionIds) {
        const key = `${fId}::${normDet}`;
        if (lookup.has(key)) {
          const idx = lookup.get(key);
          rows[idx].disposition = det.disposition ?? '';
          rows[idx].dp = String(det.dp ?? '');
          updated++;
          matched = true;
          break;
        }
      }

      if (!matched) {
        unmatched++;
        unmatchedList.push(`${factionData.faction}: ${det.name}`);
      }
    }
  }

  // Serialize: (re)add disposition and dp columns
  const newHeaders = [...BASE_HEADERS, 'disposition', 'dp'];
  const csvLines = [newHeaders.join('|') + '|'];
  for (const row of rows) {
    csvLines.push(
      [row.id, row.faction_id, row.name, row.legend, row.type, row.disposition, row.dp].join('|') + '|'
    );
  }

  fs.writeFileSync(path.join(ROOT, 'Detachments.csv'), csvLines.join('\n') + '\n', 'utf8');

  console.log(`Updated: ${updated}, Unmatched: ${unmatched}`);
  if (unmatchedList.length) {
    console.log('Unmatched:');
    unmatchedList.slice(0, 20).forEach(u => console.log(' -', u));
  }
}

main();
