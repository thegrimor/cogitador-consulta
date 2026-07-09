/**
 * Scraper for https://gdmissions.app/11th/primary-missions/*
 * Fills in the "action" field (back-of-card text) for each Primary Mission
 * card in public/data/missions.json, which was missing it from the original
 * scrape (only secondary missions had "action" data).
 *
 * Each card page embeds RSC data in self.__next_f.push([1, "..."]) fragments;
 * one fragment contains a `primaryBack` object with {title, rows:[{k,v}]}.
 *
 * Usage: node scripts/scrape-mission-actions.mjs
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MISSIONS_PATH = path.join(__dirname, '..', 'public', 'data', 'missions.json');

function fetchPage(urlPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'gdmissions.app',
      path: urlPath,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    };
    https.get(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`${urlPath} -> HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractPrimaryBack(html) {
  // RSC flight data may split one logical string across multiple
  // self.__next_f.push([1,"...\"])</script> chunks. Concatenate the raw
  // (still JSON-string-escaped) inner text of every chunk before searching,
  // rather than JSON.parse-ing each chunk independently.
  const re = /self\.__next_f\.push\(\[\d+,"(.*?)"\]\)\s*<\/script>/gs;
  let m;
  let raw = '';
  while ((m = re.exec(html)) !== null) {
    raw += m[1];
  }

  // Only match when the value is an object ("primaryBack":{...}); cards with
  // no back-of-card action serialize it as "primaryBack":"$undefined".
  const marker = '\\"primaryBack\\":{';
  const idx = raw.indexOf(marker);
  if (idx === -1) return null;

  const braceStart = idx + marker.length - 1; // position of the `{`
  let depth = 0;
  for (let i = braceStart; i < raw.length; i++) {
    if (raw[i] === '{') depth++;
    else if (raw[i] === '}') {
      depth--;
      if (depth === 0) {
        // raw is escaped as a JSON string literal (one extra layer of
        // escaping on top of the JSON content itself); unwrap both layers.
        const escapedJsonStr = raw.slice(braceStart, i + 1);
        const jsonStr = JSON.parse(`"${escapedJsonStr}"`);
        return JSON.parse(jsonStr);
      }
    }
  }
  return null;
}

async function main() {
  const missions = JSON.parse(fs.readFileSync(MISSIONS_PATH, 'utf-8'));

  let total = 0;
  let filled = 0;
  let noAction = 0;
  const failures = [];

  for (const deck of missions.primaryMissions) {
    for (const card of deck.cards) {
      total++;
      const urlPath = new URL(card.url).pathname;
      process.stdout.write(`Fetching ${card.name} (${urlPath})... `);
      try {
        const html = await fetchPage(urlPath);
        const primaryBack = extractPrimaryBack(html);
        delete card.action;
        if (!primaryBack) {
          console.log('no back-of-card action for this mission');
          noAction++;
          continue;
        }
        card.action = primaryBack;
        filled++;
        console.log('ok');
      } catch (err) {
        console.log(`error: ${err.message}`);
        failures.push(card.name);
      }
      // Be polite to the server.
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  fs.writeFileSync(MISSIONS_PATH, JSON.stringify(missions, null, 2) + '\n');
  console.log(`\nDone. ${filled}/${total} cards have an action, ${noAction}/${total} have none (by design).`);
  if (failures.length) {
    console.log('Failures (network/parse errors):', failures.join(', '));
  }
}

main();
