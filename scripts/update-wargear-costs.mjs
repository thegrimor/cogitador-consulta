/**
 * Populate Datasheets_wargear_cost.csv with per-weapon point surcharges
 * ("per Hades lascannon: 10pts", etc.) from mfm-data.json.
 *
 * Usage: node scripts/update-wargear-costs.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'public', 'data');

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

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split('|').map(h => h.trim().replace(/^﻿/, ''));
  return {
    headers,
    rows: lines.slice(1).map(line => {
      const values = line.split('|');
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
    }),
  };
}

function normalName(name) {
  return name
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function findMatches(nameToSheets, rawName, factionIds) {
  const norm = normalName(rawName);
  let candidates = (nameToSheets.get(norm) ?? []).filter(ds => factionIds.includes(ds.faction_id));
  if (candidates.length > 0) return candidates;

  if (norm.endsWith('s')) {
    const singular = norm.slice(0, -1);
    candidates = (nameToSheets.get(singular) ?? []).filter(ds => factionIds.includes(ds.faction_id));
    if (candidates.length > 0) return candidates;
  }
  const plural = norm + 's';
  candidates = (nameToSheets.get(plural) ?? []).filter(ds => factionIds.includes(ds.faction_id));
  if (candidates.length > 0) return candidates;

  const stripped = norm.replace(/ with [^)]+$/, '').replace(/ squad$/, '').trim();
  if (stripped !== norm) {
    candidates = (nameToSheets.get(stripped) ?? []).filter(ds => factionIds.includes(ds.faction_id));
    if (candidates.length > 0) return candidates;
    candidates = (nameToSheets.get(stripped + 's') ?? []).filter(ds => factionIds.includes(ds.faction_id));
    if (candidates.length > 0) return candidates;
  }
  return [];
}

function main() {
  const mfmData = JSON.parse(fs.readFileSync(path.join(__dirname, 'mfm-data.json'), 'utf8'));
  const { rows: datasheets } = parseCSV(fs.readFileSync(path.join(ROOT, 'Datasheets.csv'), 'utf8'));

  const nameToSheets = new Map();
  for (const ds of datasheets) {
    const key = normalName(ds.name || '');
    if (!nameToSheets.has(key)) nameToSheets.set(key, []);
    nameToSheets.get(key).push(ds);
  }

  const rows = [];
  let unmatched = 0;
  const unmatchedUnits = [];

  for (const factionData of mfmData) {
    const factionIds = FACTION_MAP[factionData.slug] ?? [];
    if (factionIds.length === 0) continue;

    for (const unit of factionData.units) {
      if (!unit.wargearCosts || unit.wargearCosts.length === 0) continue;

      const matches = findMatches(nameToSheets, unit.name, factionIds);
      if (matches.length === 0) {
        unmatched++;
        unmatchedUnits.push(`${factionData.faction}: ${unit.name}`);
        continue;
      }

      const seenIds = new Set();
      const deduped = matches.filter(ds => {
        if (seenIds.has(ds.id)) return false;
        seenIds.add(ds.id);
        return true;
      });

      for (const ds of deduped) {
        for (const w of unit.wargearCosts) {
          rows.push({ datasheet_id: ds.id, name: w.name, cost: String(w.pts) });
        }
      }
    }
  }

  // De-dupe (datasheet_id, name) pairs - the same Space Marines datasheet is
  // shared by several MFM faction pages (Black Templars, Blood Angels, ...)
  // and each independently reports the same wargear surcharge.
  const seen = new Set();
  const dedupedRows = rows.filter(r => {
    const key = `${r.datasheet_id}::${r.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const csvLines = ['datasheet_id|name|cost|'];
  for (const row of dedupedRows) {
    csvLines.push(`${row.datasheet_id}|${row.name}|${row.cost}|`);
  }
  const outputPath = path.join(ROOT, 'Datasheets_wargear_cost.csv');
  fs.writeFileSync(outputPath, csvLines.join('\n') + '\n', 'utf8');

  console.log(`Wrote ${rows.length} wargear cost rows.`);
  console.log(`Unmatched units: ${unmatched}`);
  if (unmatchedUnits.length) unmatchedUnits.slice(0, 20).forEach(u => console.log('  -', u));
  console.log(`Saved to ${outputPath}`);
}

main();
