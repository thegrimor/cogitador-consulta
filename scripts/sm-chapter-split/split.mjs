// Splits public/data/factions/space-marines.json into a parent faction (core Codex +
// successor-chapter named characters) and one child faction file per "chapter with its own
// detachments" (Black Templars, Blood Angels, Dark Angels, Deathwatch, Space Wolves).
//
// The child file holds ONLY what that chapter adds — it never copies the parent's content.
// Inheritance (core + own) is applied at read time by src/core/constants/factionFamily.ts.
// That's what keeps a Captain's points in exactly one place.
//
// Usage: node scripts/sm-chapter-split/split.mjs [--dry]
//
// Refuses to run twice: once the parent holds no chapter-keyworded datasheets there is
// nothing left to split, and a second run would only empty the children.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')
const FACTIONS_DIR = path.join(ROOT, 'public', 'data', 'factions')
const CATALOG_FACTIONS = path.join(ROOT, 'public', 'data', 'catalog', 'factions.json')
const GENERATED_CONSTANT = path.join(ROOT, 'src', 'core', 'constants', 'smChapterDatasheets.ts')

const PARENT_ID = 'space-marines'

/** keyword in a datasheet's factionKeywords / a detachment's `chapters` -> child faction id. */
const CHILDREN = [
  { keyword: 'Black Templars', id: 'black-templars', name: 'Black Templars' },
  { keyword: 'Blood Angels', id: 'blood-angels', name: 'Blood Angels' },
  { keyword: 'Dark Angels', id: 'dark-angels', name: 'Dark Angels' },
  { keyword: 'Deathwatch', id: 'deathwatch', name: 'Deathwatch' },
  { keyword: 'Space Wolves', id: 'space-wolves', name: 'Space Wolves' },
]

const dry = process.argv.includes('--dry')
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'))
const childByKeyword = new Map(CHILDREN.map(c => [c.keyword, c]))

const parent = readJson(path.join(FACTIONS_DIR, `${PARENT_ID}.json`))

// ── 1. Datasheets ───────────────────────────────────────────────────────────────────────
// A datasheet belongs to a child when it carries that chapter's faction keyword. Everything
// else — including the successor-chapter characters (Ultramarines, Salamanders, ...) which
// have no detachments of their own — stays with the parent.
const datasheetsFor = new Map(CHILDREN.map(c => [c.id, []]))
const parentDatasheets = []
for (const ds of parent.datasheets) {
  const owners = (ds.factionKeywords ?? []).filter(k => childByKeyword.has(k))
  if (owners.length > 1) {
    throw new Error(`Datasheet ${ds.id} carries two chapter keywords (${owners.join(', ')}) — needs a manual call`)
  }
  if (owners.length === 1) datasheetsFor.get(childByKeyword.get(owners[0]).id).push(ds)
  else parentDatasheets.push(ds)
}

const movedDatasheets = parent.datasheets.length - parentDatasheets.length
if (movedDatasheets === 0) {
  throw new Error('Nothing to split: space-marines.json holds no chapter-keyworded datasheets. Already split?')
}

// ── 2. Detachments ──────────────────────────────────────────────────────────────────────
// `chapters` listing the parent ("Space Marines") means it is available to everyone, so it
// stays put and is inherited. Anything else is that chapter's own.
const detachmentsFor = new Map(CHILDREN.map(c => [c.id, []]))
const parentDetachments = []
/** detachmentId -> child faction id (or null when it stays with the parent) */
const detachmentOwner = new Map()
for (const det of parent.detachments) {
  if (det.chapters.includes('Space Marines')) {
    parentDetachments.push(det)
    detachmentOwner.set(det.id, null)
    continue
  }
  const owners = det.chapters.filter(c => childByKeyword.has(c))
  if (owners.length !== 1) {
    throw new Error(`Detachment ${det.id} has chapters [${det.chapters.join(', ')}] — needs a manual call`)
  }
  const childId = childByKeyword.get(owners[0]).id
  detachmentsFor.get(childId).push(det)
  detachmentOwner.set(det.id, childId)
}

// ── 3. Stratagems + enhancements follow their detachment ────────────────────────────────
const stratagemsFor = new Map(CHILDREN.map(c => [c.id, []]))
const enhancementsFor = new Map(CHILDREN.map(c => [c.id, []]))
const parentStratagems = []
const parentEnhancements = []
for (const s of parent.stratagems) {
  const owner = detachmentOwner.get(s.detachmentId)
  if (owner) stratagemsFor.get(owner).push(s)
  else parentStratagems.push(s)
}
for (const e of parent.enhancements) {
  const owner = detachmentOwner.get(e.detachmentId)
  if (owner) enhancementsFor.get(owner).push(e)
  else parentEnhancements.push(e)
}

// ── 4. Army rules go to a child only when every datasheet carrying them is that child's ──
// Matched the same way useGameData.ts tags them: a datasheet's Faction-type ability whose
// name matches an army rule. A rule carried by core units (Combat Doctrines) stays shared.
const armyRuleIdByName = new Map(parent.armyRules.map(ar => [ar.name, ar.id]))
/** armyRuleId -> Set of owning faction ids ('space-marines' for a core bearer) */
const armyRuleOwners = new Map(parent.armyRules.map(ar => [ar.id, new Set()]))
for (const ds of parent.datasheets) {
  const chapterKeyword = (ds.factionKeywords ?? []).find(k => childByKeyword.has(k))
  const ownerId = chapterKeyword ? childByKeyword.get(chapterKeyword).id : PARENT_ID
  for (const ab of ds.abilities ?? []) {
    if (ab.type !== 'Faction') continue
    const ruleId = armyRuleIdByName.get(ab.name)
    if (ruleId) armyRuleOwners.get(ruleId).add(ownerId)
  }
}

const armyRulesFor = new Map(CHILDREN.map(c => [c.id, []]))
const parentArmyRules = []
for (const rule of parent.armyRules) {
  const owners = [...armyRuleOwners.get(rule.id)]
  const soleOwner = owners.length === 1 && owners[0] !== PARENT_ID ? owners[0] : null
  if (soleOwner) armyRulesFor.get(soleOwner).push(rule)
  else parentArmyRules.push(rule)
}

// ── 5. Report ───────────────────────────────────────────────────────────────────────────
console.log(`${PARENT_ID.padEnd(16)} datasheets ${String(parentDatasheets.length).padStart(3)}  ` +
  `detachments ${String(parentDetachments.length).padStart(2)}  stratagems ${String(parentStratagems.length).padStart(3)}  ` +
  `enhancements ${String(parentEnhancements.length).padStart(2)}  armyRules ${parentArmyRules.length}`)
for (const child of CHILDREN) {
  console.log(`${child.id.padEnd(16)} datasheets ${String(datasheetsFor.get(child.id).length).padStart(3)}  ` +
    `detachments ${String(detachmentsFor.get(child.id).length).padStart(2)}  ` +
    `stratagems ${String(stratagemsFor.get(child.id).length).padStart(3)}  ` +
    `enhancements ${String(enhancementsFor.get(child.id).length).padStart(2)}  ` +
    `armyRules ${armyRulesFor.get(child.id).map(r => r.name).join(', ') || 0}`)
}

if (dry) {
  console.log('\n--dry: nothing written.')
  process.exit(0)
}

// ── 6. Write ────────────────────────────────────────────────────────────────────────────
// `combatEffects` (3 vestigial entries, read by nothing in src/ or server/) stays with the
// parent rather than being split — see README.
const writeJson = (p, value) => fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`)

writeJson(path.join(FACTIONS_DIR, `${PARENT_ID}.json`), {
  ...parent,
  armyRules: parentArmyRules,
  detachments: parentDetachments,
  stratagems: parentStratagems,
  enhancements: parentEnhancements,
  datasheets: parentDatasheets,
})

for (const child of CHILDREN) {
  writeJson(path.join(FACTIONS_DIR, `${child.id}.json`), {
    id: child.id,
    name: child.name,
    armyRules: armyRulesFor.get(child.id),
    detachments: detachmentsFor.get(child.id),
    stratagems: stratagemsFor.get(child.id),
    enhancements: enhancementsFor.get(child.id),
    datasheets: datasheetsFor.get(child.id),
    combatEffects: [],
  })
}

// catalog/factions.json — every entry here is fetched as factions/<id>.json by both
// useGameData.ts and the chat backend's gameDataIndex.js, so the files above must exist
// first. The backend reads them with an uncaught readFileSync at module load: a missing
// file takes down auth and rosters too, not just the chat.
const catalogFactions = readJson(CATALOG_FACTIONS)
const withChildren = [...catalogFactions]
for (const child of CHILDREN) {
  if (withChildren.some(f => f.id === child.id)) continue
  withChildren.push({ id: child.id, name: child.name })
}
withChildren.sort((a, b) => a.name.localeCompare(b.name, 'es'))
writeJson(CATALOG_FACTIONS, withChildren)

// The roster migration in authThunks.ts runs before game data is available (rosters are
// fetched on login, datasheets live in GameDataContext), so it reads these generated ids
// instead. Generated here so it cannot drift from the split itself.
const tsList = items => items.map(i => `      '${i}',`).join('\n')
const chapterBlocks = CHILDREN.map(child => {
  const dsIds = datasheetsFor.get(child.id).map(d => d.id).sort()
  const detIds = detachmentsFor.get(child.id).map(d => d.id).sort()
  return `  '${child.id}': {\n    datasheetIds: [\n${tsList(dsIds)}\n    ],\n` +
    `    detachmentIds: [\n${tsList(detIds)}\n    ],\n  },`
}).join('\n')

fs.writeFileSync(GENERATED_CONSTANT,
  `// GENERATED by scripts/sm-chapter-split/split.mjs — do not edit by hand.\n` +
  `//\n` +
  `// Which datasheets and detachments belong to each Space Marines chapter faction, for the\n` +
  `// one-time roster migration in authThunks.ts. That migration runs on rosters fetched at\n` +
  `// login, before GameDataContext has any datasheets to consult, which is why these ids are\n` +
  `// baked in rather than derived at runtime.\n\n` +
  `export const SM_CHAPTER_CONTENT: Record<string, { datasheetIds: string[]; detachmentIds: string[] }> = {\n` +
  `${chapterBlocks}\n}\n`)

console.log(`\nWrote ${CHILDREN.length} child factions, rewrote ${PARENT_ID}.json, ` +
  `updated catalog/factions.json (${catalogFactions.length} -> ${withChildren.length}), ` +
  `generated ${path.relative(ROOT, GENERATED_CONSTANT)}.`)
