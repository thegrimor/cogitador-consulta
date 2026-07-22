/**
 * Scraper for https://mfm.warhammer-community.com/en
 *
 * Uses a headless browser (Puppeteer) to load each faction page and read the
 * fully-hydrated DOM directly. The site renders via React Suspense streaming,
 * so a plain HTTP fetch returns raw SSR markup full of unresolved <template>
 * placeholders and duplicate print/screen layout copies — a real browser
 * hydrates it into a single clean DOM, which is far more robust to scrape
 * than reverse-engineering the streaming payload with regex.
 *
 * Cost values are sometimes decorated with a balance-update indicator, e.g.
 * "▼ (-5) 70 pts" or "▲ (+10) 50 pts" — we always take the trailing number.
 *
 * Both unit cards and detachment cards use the same container class
 * (div.flex.flex-col.space-y-1.m-1); we tell them apart by whether the
 * header contains a "NDP" span. Enhancements are scoped to the detachment
 * card they appear in, since the same enhancement name can recur across
 * different detachments with different costs (e.g. Astra Militarum's
 * "Grand Strategist" is 15pts in one detachment and 25pts in another).
 *
 * Output: scripts/mfm-data.json
 *
 * Usage: node scripts/scrape-mfm.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

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

const DISPOSITIONS = new Set([
  'TAKE AND HOLD',
  'PURGE THE FOE',
  'DISRUPTION',
  'RECONNAISSANCE',
  'PRIORITY ASSETS',
]);

async function scrapeFactionPage(page, faction) {
  await page.goto(`https://mfm.warhammer-community.com/en/${faction.slug}`, {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });

  return page.evaluate((dispositionList) => {
    const DISPOSITIONS = new Set(dispositionList);

    function extractPts(text) {
      const m = (text || '').trim().match(/(\d+)\s*pts?\s*$/i);
      return m ? parseInt(m[1], 10) : NaN;
    }

    const units = [];
    const detachments = [];
    const enhancements = [];

    const containers = [...document.querySelectorAll('div.flex.flex-col.space-y-1.m-1')];
    for (const c of containers) {
      const headerDiv = c.querySelector(':scope > div:first-child');
      if (!headerDiv) continue;
      const dpSpan = headerDiv.querySelector('span');
      const dpText = dpSpan ? dpSpan.textContent.trim() : '';
      const nameSpan = headerDiv.querySelector('span.keep-all') || headerDiv.querySelector('span.text-xl') || headerDiv.querySelector('span:first-child');
      const name = (nameSpan ? nameSpan.textContent : headerDiv.textContent).trim();
      if (!name) continue;

      // Detect detachment cards by the "NDP" span anywhere in the header.
      // The DP text can be decorated with a balance-update arrow (e.g.
      // "2DP ▼" with an HTML comment in between), so match the leading
      // digits rather than anchoring the whole string.
      const allHeaderSpansText = [...headerDiv.querySelectorAll('span')].map(s => s.textContent.trim());
      const dpSpanText = allHeaderSpansText.find(t => /^\d+DP\b/.test(t));

      if (dpSpanText) {
        const dp = parseInt(dpSpanText, 10);
        const dispositionEl = headerDiv.nextElementSibling;
        const dispositionText = dispositionEl?.textContent?.trim() ?? '';
        const disposition = DISPOSITIONS.has(dispositionText) ? dispositionText : '';
        detachments.push({ name, dp, disposition });

        const enhHeaders = [...c.querySelectorAll('div')].filter(d => d.textContent.trim() === 'ENHANCEMENTS' && d.children.length === 0);
        for (const h of enhHeaders) {
          const ul = h.nextElementSibling;
          if (!ul || ul.tagName !== 'UL') continue;
          for (const li of ul.querySelectorAll('li')) {
            const spans = li.querySelectorAll('span');
            const enhName = spans[0]?.textContent.trim();
            const pts = extractPts(spans[spans.length - 1]?.textContent ?? '');
            if (enhName && !isNaN(pts)) enhancements.push({ name: enhName, pts, detachment: name });
          }
        }
        continue;
      }

      // Otherwise treat as a unit card.
      const costSections = [];
      const headers = [...c.querySelectorAll('div')].filter(d => /^YOUR .*COSTS?$/.test(d.textContent.trim()));
      for (const h of headers) {
        const ul = h.nextElementSibling;
        if (!ul || ul.tagName !== 'UL') continue;
        const costs = [...ul.querySelectorAll('li')]
          .map(li => {
            const spans = li.querySelectorAll('span');
            const size = spans[0]?.textContent.trim();
            const pts = extractPts(spans[spans.length - 1]?.textContent ?? '');
            return { size, pts };
          })
          .filter(x => x.size && !isNaN(x.pts));
        if (costs.length) costSections.push({ header: h.textContent.trim(), costs });
      }
      if (costSections.length === 0) continue;

      const wargearCosts = [];
      for (const li of c.querySelectorAll('ul:not(.bg-yellow) li')) {
        const spans = li.querySelectorAll('span');
        const text = spans[0]?.textContent.trim() ?? '';
        const pts = extractPts(spans[spans.length - 1]?.textContent ?? '');
        if (text.toLowerCase().startsWith('per ') && !isNaN(pts)) wargearCosts.push({ name: text, pts });
      }

      units.push({ name, costSections, wargearCosts });
    }

    return { units, detachments, enhancements };
  }, [...DISPOSITIONS]);
}

async function main() {
  const outputPath = path.join(__dirname, 'mfm-data.json');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const results = [];
  for (const faction of FACTIONS) {
    console.log(`Scraping ${faction.name}...`);
    try {
      const data = await scrapeFactionPage(page, faction);
      console.log(`  Found ${data.units.length} units, ${data.detachments.length} detachments, ${data.enhancements.length} enhancements`);
      results.push({ faction: faction.name, slug: faction.slug, ...data });
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`Error scraping ${faction.name}:`, err.message);
      results.push({ faction: faction.name, slug: faction.slug, units: [], detachments: [], enhancements: [], error: err.message });
    }
  }

  await browser.close();

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nDone! Saved to ${outputPath}`);

  const totalUnits = results.reduce((s, r) => s + r.units.length, 0);
  const totalEnh = results.reduce((s, r) => s + r.enhancements.length, 0);
  console.log(`Total: ${totalUnits} unit entries, ${totalEnh} enhancements across ${results.length} factions`);
}

main().catch(console.error);
