// Final assembly for the Space Marines 11th-ed core-codex migration.
//
// Merges the new PDF-derived content (phase1-data.mjs: army rules + 15 detachments;
// phase2-data.mjs: 85 datasheets) with everything from the CURRENT space-marines.json that's
// classified "protected" in classification.json (chapter-locked to Dark Angels, Deathwatch,
// Space Wolves, Black Templars or Blood Angels -- explicit user instruction, see README.md).
// Everything else currently in the file ("core": generic Adeptus Astartes content, plus
// non-"big-5" chapter flavour this app never modeled as its own protected chapter --
// Ultramarines/Iron Hands/Salamanders/Imperial Fists/Raven Guard/White Scars/Blood Ravens) is
// dropped, superseded by the new content.
//
// Cross-referencing every new stratagem/enhancement/detachment-ability against the new
// datasheets is a best-effort keyword heuristic (same approach + same caveats as the Orks
// migration's build-final.mjs) -- it does NOT understand "excluding X" exclusions or other
// prose nuance. Broadened here vs. the Orks version to also match `<b>WORD</b>` (this
// migration's content mixes that with `<span class="kwb">`, unlike Orks' which used kwb
// exclusively) since ruleHtml.ts's auto-highlighter doesn't require pre-wrapped kwb spans for
// styling to work, so there was no reason to force one convention while transcribing.
import fs from 'fs'
import { newArmyRules, newDetachments, newEnhancements, newStratagems } from './phase1-data.mjs'
import { newDatasheets } from './phase2-data.mjs'

const ROOT = new URL('../../', import.meta.url)
const currentSM = JSON.parse(fs.readFileSync(new URL('public/data/factions/space-marines.json', ROOT), 'utf8'))
const classification = JSON.parse(fs.readFileSync(new URL('scripts/space-marines-11th-ed-migration/classification.json', ROOT), 'utf8'))
const { detClasses } = classification
const PROTECTED_CHAPTERS = new Set(classification.PROTECTED)

const isProtectedDatasheet = (ds) => (ds.factionKeywords || []).some(k => PROTECTED_CHAPTERS.has(k))
const isProtectedDetachment = (id) => detClasses[id] === 'protected'

// ── keep the protected slice of the current file ────────────────────────────
const keptDatasheets = currentSM.datasheets.filter(isProtectedDatasheet)
const keptDetachments = currentSM.detachments.filter(d => isProtectedDetachment(d.id))
const keptEnhancements = currentSM.enhancements.filter(e => isProtectedDetachment(e.detachmentId))
const keptStratagems = currentSM.stratagems.filter(s => isProtectedDetachment(s.detachmentId))
// Excludes 'oath-of-moment' (superseded, see README), 'assigned-agents' (explicit user request
// 2026-09-18 -- Inquisition/Agents of the Imperium already has its own faction entry in this
// app, so the "you can ally them into a non-Agents Imperium army" rule doesn't belong on the
// Space Marines page), AND any id this run is about to add -- this script reads from and
// writes to the SAME file, so a second run must not re-keep army rules a prior run already
// appended (unlike detachments/datasheets/etc., army rules have no classification-based
// protected/core split to filter by, so this is the only guard).
const DROPPED_ARMY_RULE_IDS = new Set(['oath-of-moment', 'assigned-agents'])
const newArmyRuleIds = new Set(newArmyRules.map(r => r.id))
const keptArmyRules = currentSM.armyRules.filter(r => !DROPPED_ARMY_RULE_IDS.has(r.id) && !newArmyRuleIds.has(r.id))

console.log('kept (protected):', keptDatasheets.length, 'datasheets,', keptDetachments.length, 'detachments,',
  keptEnhancements.length, 'enhancements,', keptStratagems.length, 'stratagems,', keptArmyRules.length, 'army rules')
console.log('new (from PDF):', newDatasheets.length, 'datasheets,', newDetachments.length, 'detachments,',
  newEnhancements.length, 'enhancements,', newStratagems.length, 'stratagems,', newArmyRules.length, 'army rules')

// ── cross-reference new stratagems/enhancements/detachment-abilities against new datasheets ──
function extractKeywordPhrases(text) {
  const out = []
  const re = /<span class="kwb">([^<]+)<\/span>|<b>([A-Z][A-Z0-9 /'-]*)<\/b>/g
  let m
  while ((m = re.exec(text))) out.push(m[1] || m[2])
  return out
}

function datasheetMatchesPhrase(ds, phrase) {
  const tokens = phrase.split(/\s+/).filter(t => !['ADEPTUS', 'ASTARTES', 'MODEL', 'ONLY', 'UNIT'].includes(t.toUpperCase()))
  if (!tokens.length) return false
  const dsKeywords = new Set(ds.keywords.map(k => k.toUpperCase()))
  const dsNameUpper = ds.name.toUpperCase()
  return tokens.every(tok => {
    const alts = tok.split('/')
    return alts.some(alt => {
      const a = alt.toUpperCase().replace(/[^A-Z0-9]/g, '')
      if (!a) return true
      return [...dsKeywords].some(k => k.replace(/[^A-Z0-9]/g, '') === a)
        || dsNameUpper.replace(/[^A-Z0-9]/g, '').includes(a)
    })
  })
}

function matchingDatasheetIds(text) {
  const phrases = extractKeywordPhrases(text)
  if (!phrases.length) return []
  return newDatasheets
    .filter(ds => phrases.some(p => datasheetMatchesPhrase(ds, p)))
    .map(ds => ds.id)
}

const stratagemIdsByDatasheet = new Map()
const enhancementIdsByDatasheet = new Map()
const detachmentAbilityIdsByDatasheet = new Map()
const push = (map, dsId, id) => { if (!map.has(dsId)) map.set(dsId, []); map.get(dsId).push(id) }

for (const s of newStratagems) {
  for (const dsId of matchingDatasheetIds(s.name + ' ' + s.description)) push(stratagemIdsByDatasheet, dsId, s.id)
}
for (const e of newEnhancements) {
  for (const dsId of matchingDatasheetIds(e.name + ' ' + e.description)) push(enhancementIdsByDatasheet, dsId, e.id)
}
for (const det of newDetachments) {
  for (const da of det.abilities) {
    for (const dsId of matchingDatasheetIds(da.name + ' ' + da.description)) push(detachmentAbilityIdsByDatasheet, dsId, da.id)
  }
}

const finalNewDatasheets = newDatasheets.map(ds => ({
  ...ds,
  stratagemIds: stratagemIdsByDatasheet.get(ds.id) || [],
  enhancementIds: enhancementIdsByDatasheet.get(ds.id) || [],
  detachmentAbilityIds: detachmentAbilityIdsByDatasheet.get(ds.id) || [],
}))

// ── assemble ─────────────────────────────────────────────────────────────────
const final = {
  id: currentSM.id,
  name: currentSM.name,
  armyRules: [...keptArmyRules, ...newArmyRules],
  detachments: [...keptDetachments, ...newDetachments],
  stratagems: [...keptStratagems, ...newStratagems],
  enhancements: [...keptEnhancements, ...newEnhancements],
  datasheets: [...keptDatasheets, ...finalNewDatasheets],
  combatEffects: currentSM.combatEffects, // dead/unused field (checked -- no src/ reference), carried through unchanged
}

const outPath = new URL('public/data/factions/space-marines.json', ROOT)
fs.writeFileSync(outPath, JSON.stringify(final, null, 2) + '\n')
console.log('\nwrote', outPath.pathname)
console.log('TOTAL:', final.datasheets.length, 'datasheets,', final.detachments.length, 'detachments,',
  final.enhancements.length, 'enhancements,', final.stratagems.length, 'stratagems,', final.armyRules.length, 'army rules')
console.log('avg stratagemIds/new-datasheet:', (finalNewDatasheets.reduce((n, d) => n + d.stratagemIds.length, 0) / finalNewDatasheets.length).toFixed(1))
console.log('avg enhancementIds/new-datasheet:', (finalNewDatasheets.reduce((n, d) => n + d.enhancementIds.length, 0) / finalNewDatasheets.length).toFixed(1))
console.log('avg detachmentAbilityIds/new-datasheet:', (finalNewDatasheets.reduce((n, d) => n + d.detachmentAbilityIds.length, 0) / finalNewDatasheets.length).toFixed(1))

// Sanity: no duplicate ids within each collection (kept + new could theoretically collide on slug)
function checkDupes(label, arr) {
  const seen = new Map()
  for (const x of arr) seen.set(x.id, (seen.get(x.id) || 0) + 1)
  const dupes = [...seen].filter(([, n]) => n > 1).map(([id]) => id)
  if (dupes.length) console.warn(`DUPLICATE ${label} ids:`, dupes.join(', '))
}
checkDupes('datasheet', final.datasheets)
checkDupes('detachment', final.detachments)
checkDupes('enhancement', final.enhancements)
checkDupes('stratagem', final.stratagems)
checkDupes('armyRule', final.armyRules)
