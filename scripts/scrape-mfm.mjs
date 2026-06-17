/**
 * Scraper for https://mfm.warhammer-community.com/en
 * Extracts unit points from the RSC (React Server Components) payload embedded in HTML.
 *
 * Each faction page embeds RSC data in self.__next_f.push([1, "..."]) fragments.
 * The RSC payload contains:
 *   - Hex-keyed entries: "89:["$","span",null,{"children":"50 pts"}]"
 *   - Size+cost patterns: [false,"N model(s)"]}],"$L{hexId}"
 *   - Unit name patterns: bg-slate-500 ... text-xl text-white","children":"UNIT NAME"
 *
 * Output: scripts/mfm-data.json
 *
 * Usage: node scripts/scrape-mfm.mjs
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FACTIONS = [
  { slug: 'adepta-sororitas', name: 'Adepta Sororitas' },
  { slug: 'adeptus-custodes', name: 'Adeptus Custodes' },
  { slug: 'adeptus-mechanicus', name: 'Adeptus Mechanicus' },
  { slug: 'aeldari', name: 'Aeldari' },
  { slug: 'astra-militarum', name: 'Astra Militarum' },
  { slug: 'black-templars', name: 'Black Templars' },
  { slug: 'blood-angels', name: 'Blood Angels' },
  { slug: 'chaos-daemons', name: 'Chaos Daemons' },
  { slug: 'chaos-knights', name: 'Chaos Knights' },
  { slug: 'chaos-space-marines', name: 'Chaos Space Marines' },
  { slug: 'chaos-titan-legions', name: 'Chaos Titan Legions' },
  { slug: 'dark-angels', name: 'Dark Angels' },
  { slug: 'death-guard', name: 'Death Guard' },
  { slug: 'deathwatch', name: 'Deathwatch' },
  { slug: 'drukhari', name: 'Drukhari' },
  { slug: 'emperors-children', name: "Emperor's Children" },
  { slug: 'genestealer-cults', name: 'Genestealer Cults' },
  { slug: 'grey-knights', name: 'Grey Knights' },
  { slug: 'imperial-agents', name: 'Imperial Agents' },
  { slug: 'imperial-knights', name: 'Imperial Knights' },
  { slug: 'leagues-of-votann', name: 'Leagues of Votann' },
  { slug: 'necrons', name: 'Necrons' },
  { slug: 'orks', name: 'Orks' },
  { slug: 'space-marines', name: 'Space Marines' },
  { slug: 'space-wolves', name: 'Space Wolves' },
  { slug: 'tau-empire', name: "T'au Empire" },
  { slug: 'thousand-sons', name: 'Thousand Sons' },
  { slug: 'titan-legions', name: 'Titan Legions' },
  { slug: 'tyranids', name: 'Tyranids' },
  { slug: 'world-eaters', name: 'World Eaters' },
];

function fetchPage(slug) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mfm.warhammer-community.com',
      path: `/en/${slug}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; scraper)',
        'Accept': 'text/html',
      },
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function extractRscPayload(html) {
  const matches = [...html.matchAll(/self\.__next_f\.push\(\[(\d+),(.*?)\]\)/gs)];
  return matches
    .filter(m => m[1] === '1')
    .map(m => { try { return JSON.parse(m[2]); } catch { return m[2]; } })
    .join('');
}

/**
 * Build a map of rscId → points value (number)
 * RSC entries look like: 89:["$","span",null,{"children":"50 pts"}]
 */
function buildCostMap(payload) {
  const costMap = new Map();
  const lines = payload.split('\n');
  for (const line of lines) {
    const m = line.match(/^([0-9a-f]+):.*"children":"(\d+) pts"/);
    if (m) {
      costMap.set(m[1], parseInt(m[2], 10));
    }
  }
  return costMap;
}

/**
 * Parse unit data from the RSC payload.
 *
 * Unit names appear in: bg-slate-500...text-xl text-white","children":"UNIT NAME"
 * Size+cost pairs appear as: [false,"N model(s)"]}],"$L{hexId}"
 *
 * We find all unit names with their positions, then for each unit's section
 * extract the size+cost pairs using the costMap.
 */
function parseUnits(payload, costMap) {
  const units = [];

  // Unit names are in dark slate-500 header divs
  const unitNameRegex = /bg-slate-500[^"]*text-xl text-white","children":"([^"]+)"/g;
  const unitPositions = [];
  let match;
  while ((match = unitNameRegex.exec(payload)) !== null) {
    unitPositions.push({ name: match[1], pos: match.index });
  }

  // The size+cost pattern in the RSC:
  // [false,"SIZE"]}],"$L{hexId}"
  // Where ]}] closes children array, span element, and span's parent
  const sizeRegex = /\[false,"([^"]+)"\]}\],"?\$L([0-9a-f]+)"?/g;

  // Collect ALL size+cost pairs with their positions
  const allPairs = [];
  let pairMatch;
  while ((pairMatch = sizeRegex.exec(payload)) !== null) {
    const size = pairMatch[1];
    const refId = pairMatch[2];
    const pts = costMap.get(refId);
    if (pts !== undefined) {
      allPairs.push({ size, pts, pos: pairMatch.index });
    }
  }

  // Also collect cost section headers ("YOUR UNIT COSTS", "YOUR 1ST TO 2ND UNITS COST", etc.)
  // to group multi-size units properly
  const headerRegex = /"children":"(YOUR [^"]+COST[S]?)"/g;
  const allHeaders = [];
  let hMatch;
  while ((hMatch = headerRegex.exec(payload)) !== null) {
    allHeaders.push({ header: hMatch[1], pos: hMatch.index });
  }

  // For each unit, find the pairs that fall within its section
  for (let i = 0; i < unitPositions.length; i++) {
    const { name, pos } = unitPositions[i];
    const nextUnitPos = unitPositions[i + 1]?.pos ?? payload.length;

    // Find cost headers within this unit's section
    const unitHeaders = allHeaders.filter(h => h.pos > pos && h.pos < nextUnitPos);

    if (unitHeaders.length === 0) {
      // No cost sections for this unit (maybe Legends-only or no points)
      units.push({ name, costSections: [] });
      continue;
    }

    const costSections = [];
    for (let j = 0; j < unitHeaders.length; j++) {
      const { header, pos: hPos } = unitHeaders[j];
      const nextHPos = unitHeaders[j + 1]?.pos ?? nextUnitPos;

      // Find pairs within this cost section
      const sectionPairs = allPairs.filter(p => p.pos > hPos && p.pos < nextHPos);
      if (sectionPairs.length > 0) {
        costSections.push({ header, costs: sectionPairs.map(p => ({ size: p.size, pts: p.pts })) });
      }
    }

    units.push({ name, costSections });
  }

  return units.filter(u => u.costSections.some(s => s.costs.length > 0));
}

// The 5 official 10th-edition battle dispositions shown on the MFM
const DISPOSITIONS = new Set([
  'TAKE AND HOLD',
  'PURGE THE FOE',
  'DISRUPTION',
  'RECONNAISSANCE',
  'PRIORITY ASSETS',
]);

/**
 * Parse detachments with their DP cost and battle disposition from RSC payload.
 * Text-children sequence: DETACHMENT_NAME → XDP → DISPOSITION
 */
function parseDetachments(payload) {
  const detachments = [];
  const textChildren = [];
  const textRegex = /"children":"([^"$\\]+)"/g;
  let m;
  while ((m = textRegex.exec(payload)) !== null) {
    textChildren.push(m[1]);
  }

  for (let i = 0; i < textChildren.length - 1; i++) {
    const dpMatch = textChildren[i + 1]?.match(/^(\d+)DP$/);
    if (dpMatch && textChildren[i].length > 2 && textChildren[i] === textChildren[i].toUpperCase()) {
      const disposition = DISPOSITIONS.has(textChildren[i + 2]) ? textChildren[i + 2] : '';
      detachments.push({
        name: textChildren[i],
        dp: parseInt(dpMatch[1], 10),
        disposition,
      });
    }
  }

  return detachments;
}

/**
 * Parse enhancements with their cost.
 * Enhancement entries have the name as text followed by a pts span.
 * Pattern in RSC: "children":"Enhancement Name"...}],"$L{hexId}"
 */
function parseEnhancements(payload, costMap) {
  const enhancements = [];
  // Enhancement li items: span with name text, then cost ref
  // Structure: {"children":"Name"}],"$L{hexId}"
  const enhRegex = /"children":"([^"]+)"\}],"?\$L([0-9a-f]+)"?/g;
  let m;
  while ((m = enhRegex.exec(payload)) !== null) {
    const name = m[1];
    const refId = m[2];
    const pts = costMap.get(refId);
    // Filter: title case (not all-caps), not a CSS class, not pts content
    if (pts !== undefined && name !== name.toUpperCase() && name.length < 80 && !name.includes(':') && !name.includes('px-')) {
      enhancements.push({ name, pts });
    }
  }

  return enhancements;
}

async function scrapeFaction(faction) {
  console.log(`Scraping ${faction.name}...`);
  const html = await fetchPage(faction.slug);
  const payload = extractRscPayload(html);

  if (payload.length < 100) {
    console.warn(`  Warning: very short payload for ${faction.name} (${payload.length} chars)`);
    return { faction: faction.name, units: [], detachments: [], enhancements: [] };
  }

  const costMap = buildCostMap(payload);
  const units = parseUnits(payload, costMap);
  const detachments = parseDetachments(payload);
  const enhancements = parseEnhancements(payload, costMap);

  console.log(`  Found ${units.length} units, ${detachments.length} detachments, ${enhancements.length} enhancements`);

  return {
    faction: faction.name,
    slug: faction.slug,
    units,
    detachments,
    enhancements,
  };
}

async function main() {
  const outputPath = path.join(__dirname, 'mfm-data.json');
  const results = [];

  for (const faction of FACTIONS) {
    try {
      const data = await scrapeFaction(faction);
      results.push(data);
      // Small delay to be polite
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`Error scraping ${faction.name}:`, err.message);
      results.push({ faction: faction.name, slug: faction.slug, units: [], detachments: [], enhancements: [], error: err.message });
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nDone! Saved to ${outputPath}`);

  // Summary
  const totalUnits = results.reduce((s, r) => s + r.units.length, 0);
  const totalEnh = results.reduce((s, r) => s + r.enhancements.length, 0);
  console.log(`Total: ${totalUnits} unit entries, ${totalEnh} enhancements across ${results.length} factions`);
}

main().catch(console.error);
