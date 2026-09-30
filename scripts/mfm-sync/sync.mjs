#!/usr/bin/env node
// Deterministic MFM sync: matches rendered MFM dump text (see README.md / parse.mjs) against
// public/data/factions/<slug>.json and applies points / detachment dp+disposition /
// enhancement-cost / canBeLedBy fixes directly, no LLM involved.
//
// Usage:
//   node scripts/mfm-sync/sync.mjs --dumps=<dir> [--faction=slug1,slug2,...] [--dry]
//
// <dir> must contain one <slug>.txt per faction, rendered per README.md Step 1
// (adeptus-titanicus is special: it reads chaos-titan-legions.txt + titan-legions.txt instead).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseDump } from './parse.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const FACTIONS_DIR = path.join(REPO_ROOT, 'public', 'data', 'factions');

const args = process.argv.slice(2);
const dumpsDirArg = args.find(a => a.startsWith('--dumps='));
const factionArg = args.find(a => a.startsWith('--faction='));
const dryRun = args.includes('--dry');
if (!dumpsDirArg) {
  console.error('Usage: node sync.mjs --dumps=<dir> [--faction=slug1,slug2] [--dry]');
  process.exit(1);
}
const DUMPS_DIR = path.resolve(dumpsDirArg.slice('--dumps='.length));
const onlyFactions = factionArg ? factionArg.slice('--faction='.length).split(',') : null;

// ---------- name normalization ----------

function norm(s) {
  return s
    .toUpperCase()
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- tier parsing ----------

// Canonicalizes a tier phrase (from either the JSON description's "(...)" suffix or the
// dump's "YOUR ... COST(S)" header) to a comparable key, e.g. "1-2", "3+", "1", "2+", null.
function tierFromJsonDescription(desc) {
  const m = /\(([^)]+)\)/.exec(desc);
  if (!m) return null;
  const t = m[1].toLowerCase();
  if (/assigned agent/.test(t)) return tierFromJsonDescription(desc.replace(m[0], '')); // strip and recheck for a second paren group
  const range = /(\d)(?:st|nd|rd|th)\s*(?:to|-)\s*(\d)(?:st|nd|rd|th)/.exec(t);
  if (range) return `${range[1]}-${range[2]}`;
  const plus = /(\d)(?:st|nd|rd|th)\s*\+/.exec(t);
  if (plus) return `${plus[1]}+`;
  const single = /(\d)(?:st|nd|rd|th)/.exec(t);
  if (single) return single[1];
  return null;
}

function tierFromDumpHeader(header) {
  const h = header.toUpperCase();
  const range = /(\d)(?:ST|ND|RD|TH)\s*TO\s*(\d)(?:ST|ND|RD|TH)/.exec(h);
  if (range) return `${range[1]}-${range[2]}`;
  const plus = /(\d)(?:ST|ND|RD|TH)\s*\+/.exec(h);
  if (plus) return `${plus[1]}+`;
  const single = /(\d)(?:ST|ND|RD|TH)/.exec(h);
  if (single) return single[1];
  return null; // "YOUR UNIT COSTS"
}

function modelCountFromLabel(label) {
  const m = /^(\d+)/.exec(label.trim());
  return m ? parseInt(m[1], 10) : null;
}

function isAssignedAgent(desc) {
  return /assigned agent/i.test(desc);
}

// ---------- dump lookup helpers ----------

function findUnit(dump, name) {
  const target = norm(name);
  return dump.units.find(u => norm(u.name) === target);
}

function allDumpPriceEntries(unit) {
  const out = [];
  for (const block of unit.costBlocks) {
    const tier = tierFromDumpHeader(block.header);
    for (const entry of block.entries) {
      out.push({ tier, modelCount: modelCountFromLabel(entry.label), label: entry.label, points: entry.points });
    }
  }
  return out;
}

// ---------- per-faction sync ----------

function syncFaction(slug, dumps) {
  const filePath = path.join(FACTIONS_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);

  const changes = { points: [], wargear: [], detachments: [], enhancements: [], leaders: [] };
  const unmatched = { points: [], detachments: [], enhancementDetachments: [] };

  // Union of all units/detachments across the (1 or 2) dumps for this faction.
  const allUnits = dumps.flatMap(d => d.units);
  const allDetachments = dumps.flatMap(d => d.detachments);

  function findUnitAcrossDumps(name) {
    const target = norm(name);
    return allUnits.find(u => norm(u.name) === target);
  }

  // ----- points -----
  for (const ds of data.datasheets ?? []) {
    const unit = findUnitAcrossDumps(ds.name);
    if (!unit) { unmatched.points.push(`${ds.id}: no MFM unit named "${ds.name}"`); continue; }
    const dumpEntries = allDumpPriceEntries(unit);

    for (const p of ds.pointsCosts ?? []) {
      const tier = tierFromJsonDescription(p.description);
      const modelCount = modelCountFromLabel(p.description);
      if (modelCount === null) { unmatched.points.push(`${ds.id}: can't parse model count from "${p.description}"`); continue; }
      const candidates = dumpEntries.filter(e => e.modelCount === modelCount && e.tier === tier);
      let match = candidates[0];
      if (!match && dumpEntries.length === 1 && ds.pointsCosts.length === 1) match = dumpEntries[0]; // trivial 1:1 fallback
      if (!match) {
        unmatched.points.push(`${ds.id}: no MFM price entry matching "${p.description}" (tier=${tier ?? 'none'}, count=${modelCount}) among [${dumpEntries.map(e => `${e.label}${e.tier ? ` tier=${e.tier}` : ''}=${e.points}`).join('; ')}]`);
        continue;
      }
      if (match.points !== p.points) {
        changes.points.push(`${ds.id} "${p.description}": ${p.points} -> ${match.points}`);
        p.points = match.points;
      }
    }

    for (const w of ds.wargearCosts ?? []) {
      const wTarget = norm(w.name);
      const dw = unit.wargear.find(x => norm(x.name) === wTarget);
      if (!dw) { unmatched.points.push(`${ds.id}: no MFM wargear entry named "${w.name}"`); continue; }
      if (dw.points !== w.points) {
        changes.wargear.push(`${ds.id} "${w.name}": ${w.points} -> ${dw.points}`);
        w.points = dw.points;
      }
    }
  }

  // ----- detachments (dp + disposition) -----
  for (const det of data.detachments ?? []) {
    const target = norm(det.name);
    const dumpDet = allDetachments.find(d => norm(d.name) === target);
    if (!dumpDet) { unmatched.detachments.push(`${det.id}: no MFM detachment named "${det.name}"`); continue; }

    if (det.dp !== dumpDet.dp) {
      changes.detachments.push(`${det.id} dp: ${det.dp} -> ${dumpDet.dp}`);
      det.dp = dumpDet.dp;
    }
    const currentDisp = Array.isArray(det.disposition) ? det.disposition : [det.disposition];
    const dumpDisp = dumpDet.disposition;
    const same = currentDisp.length === dumpDisp.length && currentDisp.every((v, idx) => v === dumpDisp[idx]);
    if (!same) {
      const newVal = dumpDisp.length > 1 ? dumpDisp : dumpDisp[0];
      changes.detachments.push(`${det.id} disposition: ${JSON.stringify(det.disposition)} -> ${JSON.stringify(newVal)}`);
      det.disposition = newVal;
    }

    // enhancement costs for this detachment
    const detEnhancements = (data.enhancements ?? []).filter(e => e.detachmentId === det.id);
    for (const e of detEnhancements) {
      const eTarget = norm(e.name);
      const stripParen = s => norm(s).replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+(UPGRADE|AURA)$/, '').trim();
      const de = dumpDet.enhancements.find(x => norm(x.name) === eTarget || stripParen(x.name) === stripParen(e.name));
      if (!de) { unmatched.enhancementDetachments.push(`${det.id}/${e.id}: no MFM enhancement named "${e.name}"`); continue; }
      if (de.cost !== e.cost) {
        changes.enhancements.push(`${e.id} (${det.name}) "${e.name}": ${e.cost} -> ${de.cost}`);
        e.cost = de.cost;
      }
    }
  }

  // ----- canBeLedBy (same-file only — cross-faction chapter leadership is a separate manual pass) -----
  const byName = new Map((data.datasheets ?? []).map(ds => [norm(ds.name), ds]));
  for (const unit of allUnits) {
    if (!unit.tag || unit.bodyguards.length === 0) continue;
    const leaderDs = byName.get(norm(unit.name));
    if (!leaderDs) continue; // leader itself not in this file (cross-faction case), skip
    for (const bgName of unit.bodyguards) {
      const bgDs = byName.get(norm(bgName));
      if (!bgDs) continue; // bodyguard not in this file, skip (cross-file case)
      bgDs.canBeLedBy = bgDs.canBeLedBy ?? [];
      if (!bgDs.canBeLedBy.includes(leaderDs.id)) {
        changes.leaders.push(`${bgDs.id}.canBeLedBy += "${leaderDs.id}"`);
        bgDs.canBeLedBy.push(leaderDs.id);
      }
    }
  }

  const anyChange = Object.values(changes).some(a => a.length > 0);
  if (anyChange && !dryRun) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  }

  return { slug, changes, unmatched };
}

// ---------- main ----------

const FACTION_DUMP_MAP = {
  'adeptus-titanicus': ['chaos-titan-legions', 'titan-legions'],
};

const factionSlugs = onlyFactions ?? fs.readdirSync(FACTIONS_DIR)
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace('.json', ''));

const results = [];
for (const slug of factionSlugs) {
  const dumpSlugs = FACTION_DUMP_MAP[slug] ?? [slug];
  const dumps = [];
  for (const ds of dumpSlugs) {
    const p = path.join(DUMPS_DIR, `${ds}.txt`);
    if (!fs.existsSync(p)) { console.error(`skip ${slug}: missing dump ${p}`); continue; }
    dumps.push(parseDump(fs.readFileSync(p, 'utf8')));
  }
  if (dumps.length === 0) continue;
  const r = syncFaction(slug, dumps);
  if (r) results.push(r);
}

// ---------- report ----------

let report = `# MFM sync report\n\nGenerated ${new Date().toISOString()}${dryRun ? ' (DRY RUN — nothing written)' : ''}\n\n`;
let totalChanges = 0;
let totalUnmatched = 0;
for (const { slug, changes, unmatched } of results) {
  const changeCount = Object.values(changes).reduce((a, c) => a + c.length, 0);
  const unmatchedCount = Object.values(unmatched).reduce((a, c) => a + c.length, 0);
  totalChanges += changeCount;
  totalUnmatched += unmatchedCount;
  if (changeCount === 0 && unmatchedCount === 0) continue;
  report += `## ${slug}\n\n`;
  for (const [cat, items] of Object.entries(changes)) {
    if (items.length === 0) continue;
    report += `### Applied — ${cat} (${items.length})\n${items.map(i => `- ${i}`).join('\n')}\n\n`;
  }
  for (const [cat, items] of Object.entries(unmatched)) {
    if (items.length === 0) continue;
    report += `### Needs manual review — ${cat} (${items.length})\n${items.map(i => `- ${i}`).join('\n')}\n\n`;
  }
}
report += `\n---\nTotal changes applied: ${totalChanges}\nTotal needing manual review: ${totalUnmatched}\n`;

const reportsDir = path.join(__dirname, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });
const reportPath = path.join(reportsDir, `sync-report-${Date.now()}.md`);
fs.writeFileSync(reportPath, report, 'utf8');
console.log(report);
console.log(`\nReport written to ${reportPath}`);
