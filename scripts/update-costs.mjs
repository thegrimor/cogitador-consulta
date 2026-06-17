/**
 * Update Datasheets_models_cost.csv with fresh points from mfm-data.json
 *
 * Usage: node scripts/update-costs.mjs
 *
 * Strategy:
 * - Match MFM unit names to datasheet IDs via case-insensitive name lookup
 * - Use the primary (first) cost section per unit (YOUR UNIT COSTS or YOUR 1ST TO 2ND UNITS COST)
 * - Update `cost` column in-place; preserve description text and row order
 * - Warn on unmatched units; never delete existing rows
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'public', 'data');

// MFM slug → CSV faction_id(s)
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
  const rawHeaders = lines[0].split('|');
  const headers = rawHeaders.map(h => h.trim().replace(/^﻿/, ''));
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
    .replace(/[''`]/g, "'")   // normalize apostrophes
    .replace(/\s+/g, ' ')
    .trim();
}

/** Try to find a datasheet by name, handling singular/plural variations */
function findMatches(nameToSheets, rawName, factionIds) {
  const norm = normalName(rawName);

  // Try exact match
  let candidates = (nameToSheets.get(norm) ?? []).filter(ds => factionIds.includes(ds.faction_id));
  if (candidates.length > 0) return candidates;

  // Try removing trailing 's' (plural → singular)
  if (norm.endsWith('s')) {
    const singular = norm.slice(0, -1);
    candidates = (nameToSheets.get(singular) ?? []).filter(ds => factionIds.includes(ds.faction_id));
    if (candidates.length > 0) return candidates;
  }

  // Try adding 's' (singular → plural)
  const plural = norm + 's';
  candidates = (nameToSheets.get(plural) ?? []).filter(ds => factionIds.includes(ds.faction_id));
  if (candidates.length > 0) return candidates;

  // Try removing common suffixes like " with heavy bolters", " squad", etc.
  const stripped = norm.replace(/ with [^)]+$/, '').replace(/ squad$/, '').trim();
  if (stripped !== norm) {
    candidates = (nameToSheets.get(stripped) ?? []).filter(ds => factionIds.includes(ds.faction_id));
    if (candidates.length > 0) return candidates;
    // also try stripped + s
    candidates = (nameToSheets.get(stripped + 's') ?? []).filter(ds => factionIds.includes(ds.faction_id));
    if (candidates.length > 0) return candidates;
  }

  return [];
}

function main() {
  // Load data
  const mfmData = JSON.parse(fs.readFileSync(path.join(__dirname, 'mfm-data.json'), 'utf8'));
  const { headers: dsHeaders, rows: datasheets } = parseCSV(fs.readFileSync(path.join(ROOT, 'Datasheets.csv'), 'utf8'));
  const { headers: costHeaders, rows: costs } = parseCSV(fs.readFileSync(path.join(ROOT, 'Datasheets_models_cost.csv'), 'utf8'));

  // Build lookup: normalName → [datasheet]
  const nameToSheets = new Map();
  for (const ds of datasheets) {
    const key = normalName(ds.name || '');
    if (!nameToSheets.has(key)) nameToSheets.set(key, []);
    nameToSheets.get(key).push(ds);
  }

  // Build cost rows indexed by datasheet_id → sorted rows
  const costByDs = new Map();
  for (const row of costs) {
    const id = row.datasheet_id;
    if (!costByDs.has(id)) costByDs.set(id, []);
    costByDs.get(id).push(row);
  }
  // Sort each unit's rows by line number
  for (const [, rows] of costByDs) {
    rows.sort((a, b) => parseInt(a.line) - parseInt(b.line));
  }

  // Track stats
  let updated = 0;
  let skipped = 0;
  let unmatched = 0;
  const unmatchedUnits = [];

  // For each MFM faction, process units
  for (const factionData of mfmData) {
    const factionIds = FACTION_MAP[factionData.slug] ?? [];
    if (factionIds.length === 0) continue;

    for (const unit of factionData.units) {
      if (unit.costSections.length === 0) continue;

      // Use primary cost section (first one)
      const primarySection = unit.costSections[0];
      if (!primarySection || primarySection.costs.length === 0) continue;

      const mfmCosts = primarySection.costs; // [{ size, pts }]
      const normUnitName = normalName(unit.name);

      // Find matching datasheets (with singular/plural fallback)
      const matches = findMatches(nameToSheets, unit.name, factionIds);

      if (matches.length === 0) {
        unmatched++;
        unmatchedUnits.push(`${factionData.faction}: ${unit.name}`);
        continue;
      }

      // Deduplicate matches by datasheet ID (possible with multi-faction mappings)
      const seenIds = new Set();
      const dedupedMatches = matches.filter(ds => {
        if (seenIds.has(ds.id)) return false;
        seenIds.add(ds.id);
        return true;
      });

      for (const ds of dedupedMatches) {
        const existingRows = costByDs.get(ds.id) ?? [];

        if (existingRows.length === 0) {
          // No existing cost rows - create new ones
          for (let i = 0; i < mfmCosts.length; i++) {
            const newRow = {
              datasheet_id: ds.id,
              line: String(i + 1),
              description: mfmCosts[i].size,
              cost: String(mfmCosts[i].pts),
            };
            costs.push(newRow);
            costByDs.set(ds.id, [...(costByDs.get(ds.id) ?? []), newRow]);
          }
          updated += mfmCosts.length;
        } else {
          // Update existing rows in order
          const count = Math.min(existingRows.length, mfmCosts.length);
          for (let i = 0; i < count; i++) {
            const oldCost = existingRows[i].cost;
            existingRows[i].cost = String(mfmCosts[i].pts);
            if (oldCost !== String(mfmCosts[i].pts)) updated++;
          }

          if (existingRows.length !== mfmCosts.length) {
            // Size mismatch - warn but don't remove
            console.warn(
              `  [SIZE MISMATCH] ${factionData.faction}: ${unit.name} — ` +
              `CSV has ${existingRows.length} size(s), MFM has ${mfmCosts.length} size(s). ` +
              `Updated first ${count}.`
            );
            skipped++;
          }
        }
      }
    }
  }

  // Serialize updated CSV
  const csvLines = [costHeaders.join('|')];
  // Rebuild from original costs array (which was mutated in-place)
  for (const row of costs) {
    csvLines.push(costHeaders.map(h => row[h] ?? '').join('|'));
  }
  const outputPath = path.join(ROOT, 'Datasheets_models_cost.csv');
  fs.writeFileSync(outputPath, csvLines.join('\n') + '\n', 'utf8');

  console.log('\n=== Update Complete ===');
  console.log(`Updated costs:    ${updated}`);
  console.log(`Size mismatches:  ${skipped}`);
  console.log(`Unmatched units:  ${unmatched}`);
  if (unmatchedUnits.length > 0) {
    console.log('\nUnmatched units (first 20):');
    unmatchedUnits.slice(0, 20).forEach(u => console.log('  -', u));
  }
  console.log(`\nSaved to ${outputPath}`);
}

main();
