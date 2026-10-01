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
//
// Two passes: (1) sync every datasheet/detachment against its OWN faction's MFM page; (2) for
// any datasheet whose own page doesn't list it (a cross-faction ally copy — e.g. Genestealer
// Cults' Astra Militarum vehicles), find the same-named datasheet in another faction file
// (already corrected by pass 1) and copy its pointsCosts/wargearCosts over. space-marines.json
// additionally gets its pointsCosts *rebuilt* from the dump when the tier structure itself
// changed (a split added/removed) rather than just having a value patched, per explicit
// instruction to always trust the MFM's current structure for that file.

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
    .replace(/[–—‑]/g, '-') // em/en-dash and U+2011 non-breaking hyphen all treated as a plain hyphen
    .replace(/,/g, '') // MFM sometimes writes a detachment name with a comma our JSON doesn't (e.g. "ORDO XENOS, ALIEN HUNTERS")
    .replace(/-/g, ' ') // and sometimes a hyphen where our JSON has a space, or vice versa (e.g. "Priority Drop Beacon" vs "Priority-drop Beacon")
    .replace(/\s+/g, ' ')
    .trim();
}

// Strips a leading article ("The"/"A"/"One") and a trailing plural 's' — the MFM frequently
// shortens an enhancement's stored name this way (e.g. "The Ephemeral Tome" -> "Ephemeral
// Tome", "A Foot in the Future" -> "One Foot in the Future", "Panoply of the Cursed Knight" ->
// "...Knights"). Used only as a fallback when an exact norm() match fails, and only within the
// enhancement list of a single already name-matched detachment, so the false-positive risk of
// such a loose comparison is low — the candidate pool is already narrowed to a handful of names.
function looseName(s) {
  return norm(s)
    .replace(/^(THE|A|ONE)\s+/, '')
    .replace(/S$/, '');
}

// Strips a trailing 's' off every word, not just the last — catches a mid-name pluralization
// drift like "Brood Brother Auxilia" vs the MFM's "Brood Brothers Auxilia".
function looseWordsName(s) {
  return norm(s).split(' ').map(w => w.replace(/S$/, '')).join(' ');
}

// Strips a leading "per " (this app's own wargear-cost naming convention — see
// RosterEntryRow's `wc.name.replace(/^per /i, '')` — a few stored wargear names omit it).
function looseWargearName(s) {
  return norm(s).replace(/^PER\s+/, '');
}

// ---------- tier parsing ----------

function tierFromJsonDescription(desc) {
  const m = /\(([^)]+)\)/.exec(desc);
  if (!m) return null;
  const t = m[1].toLowerCase();
  if (/assigned agent/.test(t)) return tierFromJsonDescription(desc.replace(m[0], ''));
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
  return null;
}

function modelCountFromLabel(label) {
  const m = /^(\d+)/.exec(label.trim());
  return m ? parseInt(m[1], 10) : null;
}

function tierToDescriptionSuffix(tier) {
  if (tier === null) return '';
  if (/^\d-\d$/.test(tier)) {
    const [a, b] = tier.split('-');
    return ` (${ordinal(a)}-${ordinal(b)} units)`;
  }
  if (/^\d\+$/.test(tier)) return ` (${ordinal(tier[0])}+ unit)`;
  return ` (${ordinal(tier)} unit)`;
}
function ordinal(n) {
  n = String(n);
  return n === '1' ? '1st' : n === '2' ? '2nd' : n === '3' ? '3rd' : `${n}th`;
}

// ---------- dump lookup helpers ----------

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

// ---------- load all faction files up front (needed for the cross-faction-copy pass) ----------

const FACTION_DUMP_MAP = {
  'adeptus-titanicus': ['chaos-titan-legions', 'titan-legions'],
};

const allSlugs = fs.readdirSync(FACTIONS_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
const factionData = new Map(); // slug -> parsed JSON (mutated in place)
const factionDumps = new Map(); // slug -> [{units, detachments}]
for (const slug of allSlugs) {
  factionData.set(slug, JSON.parse(fs.readFileSync(path.join(FACTIONS_DIR, `${slug}.json`), 'utf8')));
  const dumpSlugs = FACTION_DUMP_MAP[slug] ?? [slug];
  const dumps = [];
  for (const ds of dumpSlugs) {
    const p = path.join(DUMPS_DIR, `${ds}.txt`);
    if (fs.existsSync(p)) dumps.push(parseDump(fs.readFileSync(p, 'utf8')));
  }
  factionDumps.set(slug, dumps);
}

const targetSlugs = onlyFactions ?? allSlugs;

// ---------- pass 1: sync each faction against its own MFM page(s) ----------

const results = new Map(); // slug -> { changes, unmatched, unmatchedDatasheetIds: Set }

for (const slug of targetSlugs) {
  const data = factionData.get(slug);
  const dumps = factionDumps.get(slug) ?? [];
  if (!data || dumps.length === 0) { console.error(`skip ${slug}: no dump available`); continue; }

  const changes = { points: [], wargear: [], detachments: [], enhancements: [], leaders: [], structural: [] };
  const unmatched = { points: [], detachments: [], enhancementDetachments: [] };
  const unmatchedDatasheetIds = new Set();

  const allUnits = dumps.flatMap(d => d.units);
  const allDetachments = dumps.flatMap(d => d.detachments);
  const findUnitAcrossDumps = name => allUnits.find(u => norm(u.name) === norm(name))
    ?? allUnits.find(u => looseWordsName(u.name) === looseWordsName(name));

  for (const ds of data.datasheets ?? []) {
    const unit = findUnitAcrossDumps(ds.name);
    if (!unit) { unmatched.points.push(`${ds.id}: no MFM unit named "${ds.name}"`); unmatchedDatasheetIds.add(ds.id); continue; }

    // Imperial Agents: every unit's block appears TWICE in the dump — first pass is the native
    // "AGENTS OF THE IMPERIUM Detachment" price, second pass (further down) is the "Assigned
    // Agent" (ally) price, and the two can genuinely differ (see scripts/mfm-sync/README.md).
    // This app encodes that as a "(Detachment)"/"(Assigned Agent)" suffix on the description —
    // match each suffixed entry against the correct dump occurrence instead of the generic
    // single-occurrence path below.
    const hasAgentAnnotation = slug === 'imperial-agents' && (ds.pointsCosts ?? []).some(p => /assigned agent|\(detachment\)/i.test(p.description));
    if (hasAgentAnnotation) {
      const occurrences = allUnits.filter(u => norm(u.name) === norm(ds.name));
      const detachmentEntries = allDumpPriceEntries(occurrences[0]);
      const assignedAgentEntries = allDumpPriceEntries(occurrences[1] ?? occurrences[0]);
      for (const p of ds.pointsCosts ?? []) {
        const isAssignedAgent = /assigned agent/i.test(p.description);
        const pool = isAssignedAgent ? assignedAgentEntries : detachmentEntries;
        const tier = tierFromJsonDescription(p.description);
        const modelCount = modelCountFromLabel(p.description);
        const match = pool.find(e => e.modelCount === modelCount && e.tier === tier) ?? (pool.length === 1 ? pool[0] : null);
        if (!match) { unmatched.points.push(`${ds.id}: no MFM ${isAssignedAgent ? 'Assigned Agent' : 'Detachment'} price matching "${p.description}"`); continue; }
        if (match.points !== p.points) {
          changes.points.push(`${ds.id} "${p.description}": ${p.points} -> ${match.points}`);
          p.points = match.points;
        }
      }
      for (const w of ds.wargearCosts ?? []) {
        const dw = unit.wargear.find(x => norm(x.name) === norm(w.name) || looseWargearName(x.name) === looseWargearName(w.name));
        if (!dw) { unmatched.points.push(`${ds.id}: no MFM wargear entry named "${w.name}"`); continue; }
        if (dw.points !== w.points) {
          changes.wargear.push(`${ds.id} "${w.name}": ${w.points} -> ${dw.points}`);
          w.points = dw.points;
        }
      }
      continue; // fully handled — skip the generic single-occurrence path below
    }

    const dumpEntries = allDumpPriceEntries(unit);

    // Does the JSON's tier structure line up with the dump's, count-for-count? If not (a split
    // was added/removed), rebuild it below when it's safe to (see allSimple).
    const jsonTierCounts = (ds.pointsCosts ?? []).map(p => ({ tier: tierFromJsonDescription(p.description), modelCount: modelCountFromLabel(p.description) }));
    const structureMatches = jsonTierCounts.length === dumpEntries.length
      && jsonTierCounts.every(jt => dumpEntries.some(de => de.tier === jt.tier && de.modelCount === jt.modelCount));

    // A "simple" description is just a model count + optional ordinal-tier phrase — safe to
    // fully rebuild from the dump when the tier structure itself changed. Anything else (a
    // named unit-count label like "10 Gretchin", a multi-role composition like "1 Sword
    // Brother, 5 Initiates and 4 Neophytes", or an Imperial Agents "(Detachment)"/"(Assigned
    // Agent)" annotation — a real price distinction, not a tier, and tierFromJsonDescription
    // correctly returns null for it, which would make two genuinely different-priced entries
    // look like duplicate tier=null/count=N entries and get silently collapsed into one) is
    // left for manual review rather than risk destroying real data.
    const SIMPLE_DESC_RE = /^\d+\s+models?(\s*\([^)]*\))?$/i;
    const allSimple = (ds.pointsCosts ?? []).every(p => {
      if (!SIMPLE_DESC_RE.test(p.description)) return false;
      if (/assigned agent|\(detachment\)/i.test(p.description)) return false;
      const hasParen = /\([^)]*\)/.test(p.description);
      return !hasParen || tierFromJsonDescription(p.description) !== null;
    });

    if (!structureMatches) {
      if (allSimple && dumpEntries.length > 0) {
        const oldStructure = JSON.stringify(ds.pointsCosts);
        ds.pointsCosts = dumpEntries.map(e => ({
          description: `${e.modelCount} model${e.modelCount === 1 ? '' : 's'}${tierToDescriptionSuffix(e.tier)}`,
          points: e.points,
        }));
        changes.structural.push(`${ds.id}: rebuilt pointsCosts to match MFM's current tier structure — ${oldStructure} -> ${JSON.stringify(ds.pointsCosts)}`);
        continue; // already fully rebuilt with current values, skip the value-patch loop below
      }
      unmatched.points.push(`${ds.id}: tier structure differs from MFM (JSON has ${jsonTierCounts.length} entr${jsonTierCounts.length === 1 ? 'y' : 'ies'}, MFM has ${dumpEntries.length}) — needs manual restructuring, not just a value patch`);
    }

    for (const p of ds.pointsCosts ?? []) {
      const tier = tierFromJsonDescription(p.description);
      const modelCount = modelCountFromLabel(p.description);
      if (modelCount === null) { unmatched.points.push(`${ds.id}: can't parse model count from "${p.description}"`); continue; }
      const candidates = dumpEntries.filter(e => e.modelCount === modelCount && e.tier === tier);
      let match = candidates[0];
      if (!match && dumpEntries.length === 1 && ds.pointsCosts.length === 1) match = dumpEntries[0];
      if (!match) continue; // already reported as a structural mismatch above (or truly unmatched — rare)
      if (match.points !== p.points) {
        changes.points.push(`${ds.id} "${p.description}": ${p.points} -> ${match.points}`);
        p.points = match.points;
      }
    }

    for (const w of ds.wargearCosts ?? []) {
      const dw = unit.wargear.find(x => norm(x.name) === norm(w.name) || looseWargearName(x.name) === looseWargearName(w.name));
      if (!dw) { unmatched.points.push(`${ds.id}: no MFM wargear entry named "${w.name}"`); continue; }
      if (dw.points !== w.points) {
        changes.wargear.push(`${ds.id} "${w.name}": ${w.points} -> ${dw.points}`);
        w.points = dw.points;
      }
    }
  }

  for (const det of data.detachments ?? []) {
    const dumpDet = allDetachments.find(d => norm(d.name) === norm(det.name))
      ?? allDetachments.find(d => looseWordsName(d.name) === looseWordsName(det.name));
    if (!dumpDet) { unmatched.detachments.push(`${det.id}: no MFM detachment named "${det.name}"`); continue; }

    if (det.dp !== dumpDet.dp) {
      changes.detachments.push(`${det.id} dp: ${det.dp} -> ${dumpDet.dp}`);
      det.dp = dumpDet.dp;
    }
    const currentDisp = Array.isArray(det.disposition) ? det.disposition : [det.disposition];
    const same = currentDisp.length === dumpDet.disposition.length && currentDisp.every((v, idx) => v === dumpDet.disposition[idx]);
    if (!same) {
      const newVal = dumpDet.disposition.length > 1 ? dumpDet.disposition : dumpDet.disposition[0];
      changes.detachments.push(`${det.id} disposition: ${JSON.stringify(det.disposition)} -> ${JSON.stringify(newVal)}`);
      det.disposition = newVal;
    }

    const detEnhancements = (data.enhancements ?? []).filter(e => e.detachmentId === det.id);
    const stripParen = s => norm(s).replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+(UPGRADE|AURA)$/, '').replace(/[-\s]+/g, ' ').trim();
    for (const e of detEnhancements) {
      const de = dumpDet.enhancements.find(x => norm(x.name) === norm(e.name) || stripParen(x.name) === stripParen(e.name) || looseName(stripParen(x.name)) === looseName(stripParen(e.name)));
      if (!de) { unmatched.enhancementDetachments.push(`${det.id}/${e.id}: no MFM enhancement named "${e.name}"`); continue; }
      if (de.cost !== e.cost) {
        changes.enhancements.push(`${e.id} (${det.name}) "${e.name}": ${e.cost} -> ${de.cost}`);
        e.cost = de.cost;
      }
    }
  }

  const byName = new Map((data.datasheets ?? []).map(ds => [norm(ds.name), ds]));
  for (const unit of allUnits) {
    if (!unit.tag || unit.bodyguards.length === 0) continue;
    const leaderDs = byName.get(norm(unit.name));
    if (!leaderDs) continue;
    for (const bgName of unit.bodyguards) {
      const bgDs = byName.get(norm(bgName));
      if (!bgDs) continue;
      bgDs.canBeLedBy = bgDs.canBeLedBy ?? [];
      if (!bgDs.canBeLedBy.includes(leaderDs.id)) {
        changes.leaders.push(`${bgDs.id}.canBeLedBy += "${leaderDs.id}"`);
        bgDs.canBeLedBy.push(leaderDs.id);
      }
    }
  }

  results.set(slug, { changes, unmatched, unmatchedDatasheetIds });
}

// ---------- pass 2: cross-faction ally copies (name match against every OTHER faction's data) ----------

// Global index: normalized datasheet name -> [{slug, ds}] across every faction file.
const globalNameIndex = new Map();
for (const [slug, data] of factionData) {
  for (const ds of data.datasheets ?? []) {
    const key = norm(ds.name);
    if (!globalNameIndex.has(key)) globalNameIndex.set(key, []);
    globalNameIndex.get(key).push({ slug, ds });
  }
}

for (const slug of targetSlugs) {
  const r = results.get(slug);
  if (!r || r.unmatchedDatasheetIds.size === 0) continue;
  const data = factionData.get(slug);

  for (const ds of data.datasheets ?? []) {
    if (!r.unmatchedDatasheetIds.has(ds.id)) continue;
    let candidates = (globalNameIndex.get(norm(ds.name)) ?? []).filter(c => c.slug !== slug);
    // Generic Chaos Space Marines units/characters are reused verbatim by several other Chaos
    // books (Chaos Daemons/Chaos Knights via "Thralls of the First Prince", legion books that
    // still field the plain non-legion-specific version) — when ambiguous, the generic CSM book
    // is always the real source, never another borrower.
    if (candidates.length > 1 && candidates.some(c => c.slug === 'chaos-space-marines')) {
      candidates = candidates.filter(c => c.slug === 'chaos-space-marines');
    }
    if (candidates.length !== 1) {
      if (candidates.length > 1) r.unmatched.points.push(`${ds.id}: ambiguous cross-faction match for "${ds.name}" in [${candidates.map(c => c.slug).join(', ')}], skipped`);
      continue;
    }
    const home = candidates[0].ds;
    // Only copy if the home copy actually differs — and only replace pointsCosts/wargearCosts
    // wholesale (structure + values), since a cross-faction copy should mirror its source exactly.
    const beforePoints = JSON.stringify(ds.pointsCosts);
    const beforeWargear = JSON.stringify(ds.wargearCosts);
    // Preserve this copy's own "(Assigned Agent)"-style annotations if present and the home
    // doesn't have them (Imperial Agents' own distinction) — otherwise take the home verbatim.
    const hasAssignedAgentAnnotation = (ds.pointsCosts ?? []).some(p => /assigned agent/i.test(p.description));
    if (!hasAssignedAgentAnnotation) {
      ds.pointsCosts = JSON.parse(JSON.stringify(home.pointsCosts ?? []));
    }
    ds.wargearCosts = JSON.parse(JSON.stringify(home.wargearCosts ?? []));
    const changed = JSON.stringify(ds.pointsCosts) !== beforePoints || JSON.stringify(ds.wargearCosts) !== beforeWargear;
    r.changes.points.push(`${ds.id}: ${changed ? 'copied' : 'confirmed already matching'} pointsCosts/wargearCosts from ${candidates[0].slug}'s "${home.name}" (cross-faction ally copy)`);
    r.unmatchedDatasheetIds.delete(ds.id);
    r.unmatched.points = r.unmatched.points.filter(m => !m.startsWith(`${ds.id}:`));
  }
}

// ---------- write files ----------

if (!dryRun) {
  for (const slug of targetSlugs) {
    const r = results.get(slug);
    if (!r) continue;
    const changeCount = Object.values(r.changes).reduce((a, c) => a + c.length, 0);
    if (changeCount === 0) continue;
    const filePath = path.join(FACTIONS_DIR, `${slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(factionData.get(slug), null, 2) + '\n', 'utf8');
  }
}

// ---------- report ----------

let report = `# MFM sync report\n\nGenerated ${new Date().toISOString()}${dryRun ? ' (DRY RUN — nothing written)' : ''}\n\n`;
let totalChanges = 0;
let totalUnmatched = 0;
for (const slug of targetSlugs) {
  const r = results.get(slug);
  if (!r) continue;
  const { changes, unmatched } = r;
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
