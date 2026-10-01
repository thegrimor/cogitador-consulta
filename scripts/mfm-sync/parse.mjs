// Parses a rendered MFM faction-page text dump (see README.md) into structured data.
// Deterministic line-based state machine — no LLM involved.

const STRUCTURAL = new Set([
  'DETACHMENTS', 'ENHANCEMENTS', 'WARGEAR OPTIONS', 'LEADER', 'SUPPORT', 'UPDATED',
  'BODYGUARD UNITS UPDATED', "FORCE DISPOSITION(S) CHANGED", 'UNITS', 'FACTIONS',
  'Show Legends', 'Muster Armies',
]);

const PRICE_RE = /^([▲▼])?\s*(\(([+-]\d+)\)\s*)?([\d,]+)\s*pts$/; // NB: [\d,]+ is fine — thousands commas never appear alongside a decimal in "pts" values
const HEADER_COST_RE = /^YOUR .+ COSTS?$/i;
const DP_RE = /^(\d+)DP(?:\s*[▲▼])?$/;
const ARROW_ONLY_RE = /^[▲▼]+$/;
const UNIQUE_RE = /^UNIQUE:/;
const PER_RE = /^per\s+.+/i;

function isBoilerplate(line) {
  if (/^v\d+\.\d+$/.test(line)) return true;
  if (line === 'English' || line === 'Deutsch' || line === 'Español' || line === 'Français'
    || line === 'Italiano' || line === '日本語' || line === '한국어' || line === '中文') return true;
  if (line.startsWith('Welcome to the Munitorum Field Manual')) return true;
  if (line.startsWith('We use cookies')) return true;
  if (line === 'Accept Cookies Reject Cookies' || line === 'Cookies Settings') return true;
  return false;
}

function parsePrice(line) {
  const m = PRICE_RE.exec(line);
  if (!m) return null;
  return {
    changed: !!m[1],
    delta: m[3] ? parseInt(m[3], 10) : 0,
    points: parseInt(m[4].replace(/,/g, ''), 10),
  };
}

export function parseDump(text) {
  const rawLines = text.split('\n').map(l => l.trim());
  const lines = rawLines.filter(l => l.length > 0 && !isBoilerplate(l));

  const units = []; // { name, costBlocks: [{header, entries:[{label, points, changed, delta}]}], wargear:[{name, points, changed, delta}], tag: 'LEADER'|'SUPPORT'|null, bodyguards: [] }
  const detachments = []; // { name, dp, disposition: [], enhancements: [{name, cost, changed, delta}] }
  const unparsed = [];

  let i = 0;
  // Skip header boilerplate up to first real unit or DETACHMENTS
  // (faction name line, v1.x line already stripped as boilerplate; "UNITS" token remains)
  while (i < lines.length && lines[i] !== 'UNITS' && lines[i] !== 'DETACHMENTS') i++;
  if (lines[i] === 'UNITS') i++;

  function looksLikeUnitName(line) {
    if (STRUCTURAL.has(line)) return false;
    if (ARROW_ONLY_RE.test(line)) return false;
    if (DP_RE.test(line)) return false;
    if (HEADER_COST_RE.test(line)) return false;
    if (PRICE_RE.test(line)) return false;
    if (UNIQUE_RE.test(line)) return false;
    if (PER_RE.test(line)) return false;
    return true;
  }

  while (i < lines.length && lines[i] !== 'DETACHMENTS') {
    let name = lines[i];
    i++;
    if (!name) continue;
    if (ARROW_ONLY_RE.test(name)) { continue; } // stray summary arrow, skip
    const unit = { name, costBlocks: [], wargear: [], tag: null, bodyguards: [] };

    while (i < lines.length && lines[i] !== 'DETACHMENTS') {
      const line = lines[i];

      if (ARROW_ONLY_RE.test(line)) { i++; continue; } // summary arrow before a header, ignore

      if (HEADER_COST_RE.test(line)) {
        const block = { header: line, entries: [] };
        i++;
        while (i < lines.length) {
          const label = lines[i];
          if (HEADER_COST_RE.test(label) || label === 'WARGEAR OPTIONS' || label === 'LEADER'
            || label === 'SUPPORT' || label === 'DETACHMENTS' || label.startsWith('+')) break;
          // A "+ N <item>" line (e.g. "+ 1 Tidewall Defence Platform") is a wargear-style
          // add-on tacked onto the unit's base cost block with no "WARGEAR OPTIONS" header of
          // its own — not a normal model-count tier. Stop the cost-block scan here; it's
          // picked up as an addon by whatever consumes the raw block text if needed.
          const priceLine = lines[i + 1];
          const price = priceLine ? parsePrice(priceLine) : null;
          if (!price) break; // next line isn't a price — end of this cost block, not an error
          block.entries.push({ label, ...price });
          i += 2;
        }
        unit.costBlocks.push(block);
        continue;
      }

      if (line === 'WARGEAR OPTIONS') {
        i++;
        while (i < lines.length && PER_RE.test(lines[i])) {
          const wname = lines[i];
          const price = parsePrice(lines[i + 1]);
          if (!price) { unparsed.push(`wargear price parse fail near "${wname}"`); i++; continue; }
          unit.wargear.push({ name: wname, ...price });
          i += 2;
        }
        continue;
      }

      if (line === 'LEADER' || line === 'SUPPORT') {
        unit.tag = line;
        i++;
        if (i < lines.length) {
          unit.bodyguards = lines[i].split(',').map(s => s.trim()).filter(Boolean);
          i++;
        }
        continue;
      }

      if (line === 'UPDATED' || line === 'BODYGUARD UNITS UPDATED' || line === "FORCE DISPOSITION(S) CHANGED") {
        i++; continue;
      }

      // Anything else at this point means we've hit the next unit's name.
      break;
    }

    units.push(unit);
  }

  // DETACHMENTS section
  if (lines[i] === 'DETACHMENTS') {
    i++;
    while (i < lines.length) {
      const name = lines[i];
      if (!name || DP_RE.test(name)) { i++; continue; }
      i++;
      const dpMatch = i < lines.length ? DP_RE.exec(lines[i]) : null;
      if (!dpMatch) { unparsed.push(`expected DP after detachment "${name}", got "${lines[i]}"`); continue; }
      const dp = parseInt(dpMatch[1], 10);
      i++;
      const disposition = [];
      while (i < lines.length && lines[i] !== 'ENHANCEMENTS') {
        if (!UNIQUE_RE.test(lines[i])) disposition.push(lines[i]);
        i++;
      }
      if (lines[i] === 'ENHANCEMENTS') i++;
      const enhancements = [];
      while (i < lines.length) {
        const eline = lines[i];
        if (/^LEADER:/.test(eline) || /^SUPPORT:/.test(eline)) { i++; continue; } // restriction tag before the next enhancement
        if (eline === 'UPDATED' || eline === 'BODYGUARD UNITS UPDATED' || eline === "FORCE DISPOSITION(S) CHANGED") { i++; continue; }
        // Peek: is this actually the start of the next detachment? (NAME immediately followed by a DP line)
        if (i + 1 < lines.length && DP_RE.test(lines[i + 1])) break;
        const price = parsePrice(lines[i + 1]);
        if (!price) break; // not an enhancement name/price pair — end of this detachment's list
        enhancements.push({ name: eline, cost: price.points, changed: price.changed, delta: price.delta });
        i += 2;
      }
      detachments.push({ name, dp, disposition, enhancements });
    }
  }

  return { units, detachments, unparsed };
}
