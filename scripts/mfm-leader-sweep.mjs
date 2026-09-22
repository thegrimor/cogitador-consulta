// Audits every datasheet's `canBeLedBy` against the Munitorum Field Manual.
//
//   node scripts/mfm-leader-sweep.mjs [--cache <dir>] [--faction=<id>,...] [--detail] [--apply]
//
// The MFM is a client-rendered SPA, so pages are rendered with the preinstalled headless
// Chromium and cached as text (default ./mfm-cache, gitignored). Re-runs reuse the cache;
// delete a faction's .txt to force a re-render.
//
// --apply writes ONLY additions. Removals are reported and never applied — see the
// "unlisted" note in CLAUDE.md for why absence from the MFM's printed list doesn't prove a
// stored link is wrong.
import fs from 'fs'
import path from 'path'

const FACTION_DIR = 'public/data/factions'
const arg = n => process.argv.find(a => a.startsWith(`--${n}=`))?.split('=')[1]
const CACHE = process.argv.includes('--cache')
  ? process.argv[process.argv.indexOf('--cache') + 1]
  : './mfm-cache'
const ONLY = arg('faction')?.split(',').filter(Boolean)
const APPLY = process.argv.includes('--apply')
const DETAIL = process.argv.includes('--detail')

// Our faction id -> MFM slug. Identical everywhere except Adeptus Titanicus. The MFM's
// /en/chaos-titan-legions has no faction file here.
const SLUGS = { 'adeptus-titanicus': 'titan-legions' }

const PARENT = {
  'black-templars': 'space-marines', 'blood-angels': 'space-marines',
  'dark-angels': 'space-marines', deathwatch: 'space-marines', 'space-wolves': 'space-marines',
}
const FAMILY = ['space-marines', ...Object.keys(PARENT)]
// Imperium armies field Agents of the Imperium as allies, and the Inquisitors lead
// BATTLELINE IMPERIUM INFANTRY across all of them from imperial-agents.json.
const IMPERIUM = new Set([
  'adepta-sororitas', 'adeptus-custodes', 'adeptus-mechanicus', 'astra-militarum',
  'black-templars', 'blood-angels', 'dark-angels', 'deathwatch', 'grey-knights',
  'imperial-agents', 'imperial-knights', 'space-marines', 'space-wolves',
])

const files = {}
for (const f of fs.readdirSync(FACTION_DIR)) {
  if (f.endsWith('.json')) files[f.replace('.json', '')] = JSON.parse(fs.readFileSync(path.join(FACTION_DIR, f), 'utf8'))
}
const factionIds = (ONLY ?? Object.keys(files)).filter(id => files[id]).sort()

fs.mkdirSync(CACHE, { recursive: true })
// Checked by content, not size: Titan Legions is a legitimately tiny page (4 Titans, no
// leaders) and a size threshold reads it as a failed render forever.
const missingCache = factionIds.filter(id => {
  const p = path.join(CACHE, `${id}.txt`)
  return !fs.existsSync(p) || !fs.readFileSync(p, 'utf8').includes('Munitorum Field Manual')
})

if (missingCache.length) {
  // Not a project dependency — see the headless-Chromium note in CLAUDE.md's MFM section; in the
  // agent sandbox resolve it from the global node_modules path.
  const { chromium } = await import('playwright').catch(() => {
    console.error(`No cached page for: ${missingCache.join(', ')}\nRendering needs playwright (not a project dep). Pre-populate ${CACHE}/<faction>.txt or install it.`)
    process.exit(1)
  })
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy
  const browser = await chromium.launch({
    // The outbound proxy's CA isn't in Chromium's trust store.
    args: proxy ? ['--ignore-certificate-errors', `--proxy-server=${proxy}`] : [],
  })
  const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage()
  for (const id of missingCache) {
    const slug = SLUGS[id] ?? id
    try {
      await page.goto(`https://mfm.warhammer-community.com/en/${slug}`, { waitUntil: 'domcontentloaded', timeout: 90000 })
      await page.waitForTimeout(7000)
      fs.writeFileSync(path.join(CACHE, `${id}.txt`), await page.innerText('body'))
      console.error(`rendered ${id}`)
    } catch (e) {
      console.error(`FAILED   ${id}: ${e.message.split('\n')[0]}`)
    }
  }
  await browser.close()
}

// MFM uses typographic apostrophes and the odd accented glyph; our data is plain ASCII.
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[‘’ʼ`']/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '')

const isArrow = s => /^[▲▼]+$/.test(s)
const isCostHeader = s => /^YOUR .*COSTS?$/.test(s)
// A tiered-price unit has several "YOUR ... COST" headers and only the first is preceded by the
// unit name; walking back from a later one yields a price line, inventing phantom units.
const isStructural = s => isArrow(s) || s === '' || isCostHeader(s) ||
  /^\d+ models?$/i.test(s) || /^[▲▼]?\s*(\([+-]\d+\)\s*)?[\d,]+ pts$/.test(s) ||
  /^(LEADER|SUPPORT|UPDATED|ENHANCEMENTS|DETACHMENTS|FACTIONS|UNITS|Show Legends)$/.test(s) ||
  /WARGEAR COSTS/.test(s)

function parseDump(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n').map(s => s.trim())
  const cut = lines.findIndex(l => l === 'DETACHMENTS')
  const units = lines.slice(0, cut < 0 ? lines.length : cut)
  const blocks = []
  for (let i = 0; i < units.length; i++) {
    if (!isCostHeader(units[i])) continue
    let j = i - 1
    while (j >= 0 && (isArrow(units[j]) || units[j] === '')) j--
    if (!units[j] || isStructural(units[j])) continue
    if (blocks.length && blocks[blocks.length - 1].name === units[j]) continue
    blocks.push({ name: units[j], start: j, end: units.length })
    if (blocks.length > 1) blocks[blocks.length - 2].end = j
  }
  const out = {}
  for (const b of blocks) {
    const seg = units.slice(b.start, b.end)
    // Both LEADER and SUPPORT feed canBeLedBy; reading only LEADER reports every support
    // character as a spurious extra.
    const i = seg.findIndex(l => l === 'LEADER' || l === 'SUPPORT')
    if (i < 0 || !seg[i + 1] || isStructural(seg[i + 1])) continue
    out[b.name] = seg[i + 1].split(',').map(s => s.trim()).filter(Boolean)
  }
  return out
}

const rows = []
const additions = []
let tOk = 0, tAdd = 0, tUnlisted = 0, tUnres = 0

for (const factionId of factionIds) {
  const dump = path.join(CACHE, `${factionId}.txt`)
  if (!fs.existsSync(dump)) continue
  const mfm = parseDump(dump)

  const base = FAMILY.includes(factionId) ? [factionId, ...FAMILY.filter(f => f !== factionId)] : [factionId]
  const scope = IMPERIUM.has(factionId) ? [...base, 'imperial-agents'] : base
  const index = new Map()
  for (const fid of scope) for (const d of files[fid].datasheets) if (!index.has(norm(d.name))) index.set(norm(d.name), { d, file: fid })
  const resolve = n => index.get(norm(n))

  let ok = 0
  const add = [], unlisted = [], unresolved = []

  for (const [leaderName, led] of Object.entries(mfm)) {
    const L = resolve(leaderName)
    if (!L) { unresolved.push(`leader "${leaderName}"`); continue }
    for (const ledName of led) {
      const U = resolve(ledName)
      if (!U) { unresolved.push(`${leaderName} -> "${ledName}"`); continue }
      if ((U.d.canBeLedBy || []).includes(L.d.id)) ok++
      else { add.push(`${U.d.name} (${U.file}) += ${L.d.id}`); additions.push({ file: U.file, id: U.d.id, leader: L.d.id }) }
    }
  }

  const byNorm = new Map(Object.entries(mfm).map(([k, v]) => [norm(k), v]))
  for (const d of files[factionId].datasheets) {
    for (const leaderId of d.canBeLedBy || []) {
      const leader = scope.map(f => files[f].datasheets.find(x => x.id === leaderId)).find(Boolean)
      if (!leader) { unlisted.push(`${d.name} -> unknown id "${leaderId}"`); continue }
      const led = byNorm.get(norm(leader.name))
      if (led && !led.some(n => norm(n) === norm(d.name))) unlisted.push(`${d.name} -= ${leaderId}`)
    }
  }

  tOk += ok; tAdd += add.length; tUnlisted += unlisted.length; tUnres += unresolved.length
  rows.push({ factionId, ok, add, unlisted, unresolved })
}

console.log('faction                  ok   +add  unlisted  unresolved')
console.log('-'.repeat(58))
for (const r of rows) {
  console.log(r.factionId.padEnd(22) + String(r.ok).padStart(5) + String(r.add.length).padStart(7) +
    String(r.unlisted.length).padStart(10) + String(r.unresolved.length).padStart(12))
}
console.log('-'.repeat(58))
console.log('TOTAL'.padEnd(22) + String(tOk).padStart(5) + String(tAdd).padStart(7) + String(tUnlisted).padStart(10) + String(tUnres).padStart(12))

if (DETAIL) {
  for (const r of rows) {
    if (!r.add.length && !r.unlisted.length && !r.unresolved.length) continue
    console.log(`\n### ${r.factionId}`)
    r.add.forEach(m => console.log('  ADD        ' + m))
    r.unlisted.forEach(m => console.log('  UNLISTED   ' + m))
    r.unresolved.forEach(m => console.log('  UNRESOLVED ' + m))
  }
}

if (APPLY) {
  const touched = new Set()
  for (const a of additions) {
    const d = files[a.file].datasheets.find(x => x.id === a.id)
    if (!d) continue
    d.canBeLedBy = d.canBeLedBy || []
    if (!d.canBeLedBy.includes(a.leader)) { d.canBeLedBy.push(a.leader); touched.add(a.file) }
  }
  for (const f of touched) fs.writeFileSync(path.join(FACTION_DIR, `${f}.json`), JSON.stringify(files[f], null, 2) + '\n')
  console.log(`\napplied ${additions.length} additions to ${touched.size} files: ${[...touched].join(', ')}`)
}
