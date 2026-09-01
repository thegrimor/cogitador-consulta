// Final assembly: merges phase1-detachments.json (armyRules/detachments/stratagems/
// enhancements) + datasheets-data.mjs (54 datasheets) into the shape
// public/data/factions/orks.json needs, then cross-references each datasheet against every
// stratagem/enhancement/detachmentAbility by keyword/name matching.
//
// The cross-reference is a best-effort heuristic (regex over <span class="kwb"> keyword
// badges, matched against each datasheet's own keywords + name) -- it does NOT understand
// "excluding X" exclusions or other prose nuance, so treat its output as approximate, not
// authoritative. Flagged in the migration README.
import fs from 'fs'
import { datasheets } from './datasheets-data.mjs'

const ROOT = new URL('../../', import.meta.url)
const phase1 = JSON.parse(fs.readFileSync(new URL('scripts/orks-11th-ed-migration/phase1-detachments.json', ROOT), 'utf8'))

function extractKeywordPhrases(text) {
  const out = []
  const re = /<span class="kwb">([^<]+)<\/span>/g
  let m
  while ((m = re.exec(text))) out.push(m[1])
  return out
}

function datasheetMatchesPhrase(ds, phrase) {
  const tokens = phrase.split(/\s+/).filter(t => t.toUpperCase() !== 'ORKS')
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
  if (!phrases.length) return [] // no keyword badge at all -> can't infer applicability, skip
  return datasheets
    .filter(ds => phrases.some(p => datasheetMatchesPhrase(ds, p)))
    .map(ds => ds.id)
}

const stratagemIdsByDatasheet = new Map()
const enhancementIdsByDatasheet = new Map()
const detachmentAbilityIdsByDatasheet = new Map()
const push = (map, dsId, id) => { if (!map.has(dsId)) map.set(dsId, []); map.get(dsId).push(id) }

for (const s of phase1.stratagems) {
  for (const dsId of matchingDatasheetIds(s.name + ' ' + s.description)) push(stratagemIdsByDatasheet, dsId, s.id)
}
for (const e of phase1.enhancements) {
  for (const dsId of matchingDatasheetIds(e.name + ' ' + e.description)) push(enhancementIdsByDatasheet, dsId, e.id)
}
for (const det of phase1.detachments) {
  for (const da of det.abilities) {
    for (const dsId of matchingDatasheetIds(da.name + ' ' + da.description)) push(detachmentAbilityIdsByDatasheet, dsId, da.id)
  }
}

const finalDatasheets = datasheets.map(ds => ({
  ...ds,
  stratagemIds: stratagemIdsByDatasheet.get(ds.id) || [],
  enhancementIds: enhancementIdsByDatasheet.get(ds.id) || [],
  detachmentAbilityIds: detachmentAbilityIdsByDatasheet.get(ds.id) || [],
}))

const final = {
  id: 'orks',
  name: 'Orks',
  armyRules: phase1.armyRules,
  detachments: phase1.detachments,
  stratagems: phase1.stratagems,
  enhancements: phase1.enhancements,
  datasheets: finalDatasheets,
}

const outPath = new URL('public/data/factions/orks.json', ROOT)
fs.writeFileSync(outPath, JSON.stringify(final, null, 2) + '\n')
console.log('wrote', outPath.pathname)
console.log('datasheets:', finalDatasheets.length)
console.log('avg stratagemIds/datasheet:', (finalDatasheets.reduce((n, d) => n + d.stratagemIds.length, 0) / finalDatasheets.length).toFixed(1))
console.log('avg enhancementIds/datasheet:', (finalDatasheets.reduce((n, d) => n + d.enhancementIds.length, 0) / finalDatasheets.length).toFixed(1))
console.log('avg detachmentAbilityIds/datasheet:', (finalDatasheets.reduce((n, d) => n + d.detachmentAbilityIds.length, 0) / finalDatasheets.length).toFixed(1))
