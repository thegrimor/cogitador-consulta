// Shared parsing helpers for Phase 2 (datasheets), adapted verbatim from
// scripts/orks-11th-ed-migration/build-phase2-datasheets.mjs -- see that file's comments for
// the compact line-format rationale. Not Orks-specific.
import fs from 'fs'

const ROOT = new URL('../../', import.meta.url)
const currentSM = JSON.parse(fs.readFileSync(new URL('public/data/factions/space-marines.json', ROOT), 'utf8'))

export const kwb = (s) => `<span class="kwb">${s}</span>`
export const slug = (s) => s.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// ── weapon line parser ──────────────────────────────────────────────────────
// "Name [TAG1, TAG2: variant]|RANGE|A|BSWS|S|AP|D"  (bracket optional)
function parseWeapon(line, idx) {
  const m = line.match(/^(.*?)(?:\s*\[(.+?)\])?\|(.*?)\|(.*?)\|(.*?)\|(-?\d+)\|(-?\d+)\|(.*)$/)
  if (!m) throw new Error('bad weapon line: ' + line)
  const [, name, bracket, range, A, bsWs, S, AP, D] = m
  const tags = bracket ? bracket.split(',').map(t => t.trim()) : []
  const rules = {}
  const descParts = []
  for (const tag of tags) {
    descParts.push(tag.toLowerCase())
    let mm
    if ((mm = tag.match(/^ANTI-([\w/]+) (\d)\+$/i))) {
      rules.antiEntries = rules.antiEntries || []
      rules.antiEntries.push({ keyword: mm[1].toLowerCase(), threshold: Number(mm[2]) })
    } else if ((mm = tag.match(/^RAPID FIRE (\d+)$/i))) rules.rapidFireValue = mm[1]
    else if ((mm = tag.match(/^CLEAVE (\d+)$/i))) rules.cleaveValue = Number(mm[1])
    else if ((mm = tag.match(/^SUSTAINED HITS (\d+)$/i))) rules.sustainedHitsValue = Number(mm[1])
    else if ((mm = tag.match(/^MELTA (\d+)$/i))) { rules.isMelta = true; rules.meltaValue = Number(mm[1]) }
    else if (/^DEVASTATING WOUNDS/i.test(tag)) rules.isDevastatingWounds = true
    else if (/^LETHAL HITS/i.test(tag)) rules.isLethalHits = true
    else if (/^HEAVY$/i.test(tag)) rules.isHeavy = true
    else if (/^TWIN-LINKED$/i.test(tag)) rules.isTwinLinked = true
    else if (/^IGNORES COVER$/i.test(tag)) rules.isIgnoresCover = true
    else if (/^HAZARDOUS$/i.test(tag)) rules.isHazardous = true
    else if (/^ASSAULT$/i.test(tag)) rules.isAssault = true
    else if (/^PISTOL$/i.test(tag)) rules.isPistol = true
    else if (/^PSYCHIC$/i.test(tag)) rules.isPsychic = true
    else if (/^PRECISION$/i.test(tag)) rules.isPrecision = true
    else if (/^ONE SHOT$/i.test(tag)) rules.isOneShot = true
    else if (/^INDIRECT FIRE$/i.test(tag)) rules.isIndirectFire = true
    else if (/^EXTRA ATTACKS$/i.test(tag)) rules.isExtraAttacks = true
    else if (/^LANCE$/i.test(tag)) rules.isLance = true
    else if (/^CONVERSION$/i.test(tag)) rules.isConversion = true
    else if (/^TORRENT$/i.test(tag)) rules.isTorrent = true
    else if (/^BLAST/i.test(tag)) rules.isBlast = true
    else if (/^CLOSE-QUARTERS$/i.test(tag)) { /* text-only, no schema flag */ }
    // else: HUNTER: ..., SUPA-HAZARDOUS, etc. -- kept in description text only.
  }
  const rangeTrim = range.trim()
  return {
    line: idx, name: name.trim(), description: descParts.join(', '),
    range: rangeTrim.replace(/"$/, ''), type: rangeTrim.toLowerCase() === 'melee' ? 'Melee' : 'Ranged',
    A: A.trim(), bsWs: bsWs.trim().replace('+', ''), S: Number(S), AP: Number(AP), D: D.trim(),
    rules,
  }
}
export function weapons(...lines) { return lines.map((l, i) => parseWeapon(l, i + 1)) }

// ── model line parser ───────────────────────────────────────────────────────
// "Name|M|T|Sv|InSv|W|Ld|OC|baseSize"  (InSv/baseSize optional, empty string if none)
function parseModel(line, idx) {
  const [name, M, T, Sv, InSv, W, Ld, OC, baseSize] = line.split('|')
  return {
    line: idx, name: name.trim(), M: M.trim(), T: Number(T), Sv: Sv.trim(),
    invSv: (InSv || '').replace('+', '').trim(), W: Number(W), Ld: Ld.trim(),
    OC: Number(OC), baseSize: (baseSize || '').trim(),
  }
}
export function models(...lines) { return lines.map((l, i) => parseModel(l, i + 1)) }

// ── ability helpers ─────────────────────────────────────────────────────────
// Core-ability text (Feel No Pain X+, Leader, Deep Strike, Scouts X", Lone Operative...) is
// edition-wide boilerplate already present verbatim on other datasheets in THIS SAME file
// (the ones being kept as "protected") -- search every ability across every existing datasheet
// (any type, not just 'Core' -- see CODEX-MIGRATION-PROCESS.md's Super-heavy Walker trap)
// rather than re-transcribing it.
const coreAbilityIndex = new Map()
for (const ds of currentSM.datasheets) {
  for (const a of ds.abilities || []) {
    const key = a.name.split('(')[0].trim().toLowerCase() // "Feel No Pain 5+" / "Deep Strike"
    if (!coreAbilityIndex.has(key)) coreAbilityIndex.set(key, a)
  }
}
export function core(name) {
  const found = coreAbilityIndex.get(name.toLowerCase())
  if (found) return { id: slug(name), name, description: found.description, type: 'Core' }
  console.warn('MISSING core ability:', name)
  return { id: slug(name), name, description: `[[TODO: core ability text for "${name}" not found]]`, type: 'Core' }
}
export function ability(name, description, effect) {
  return { id: slug(name), name, description, type: 'Datasheet', ...(effect ? { effect } : {}) }
}

// Army-wide rules (Combat Doctrines, Transhuman Strategist, Librarius) are embedded as a full
// copy on every datasheet that has them, type:'Faction' -- same pattern the existing data uses
// for e.g. oath-of-moment on Marneus Calgar, not a shared reference.
import { newArmyRules } from './phase1-data.mjs'
export function armyRule(name) {
  const found = newArmyRules.find(r => r.name === name)
  if (!found) throw new Error('unknown army rule: ' + name)
  return { id: found.id, name: found.name, description: found.description, type: 'Faction' }
}

export function datasheet(opts) {
  return {
    id: slug(opts.name),
    name: opts.name,
    role: opts.role,
    sourceId: '',
    isVirtual: false,
    loadout: opts.loadout || '',
    damagedW: opts.damagedW || 0,
    damagedDescription: opts.damagedDescription || '',
    models: opts.models,
    weapons: opts.weapons,
    abilities: opts.abilities,
    keywords: opts.keywords,
    factionKeywords: opts.factionKeywords || ['Adeptus Astartes'],
    unitComposition: opts.unitComposition,
    modelCountMin: opts.modelCountMin,
    modelCountMax: opts.modelCountMax,
    defaultWeaponNames: opts.defaultWeaponNames,
    options: opts.options || [],
    // No points source for this printing (confirmed, no sign-off to backfill -- see README) --
    // explicit 0/placeholder, not a name-matched guess from the datasheets being replaced.
    pointsCosts: opts.pointsCosts || [{ description: 'Sin puntos oficiales para esta edición del codex todavía', points: 0 }],
    wargearCosts: opts.wargearCosts || [],
    stratagemIds: [], enhancementIds: [], detachmentAbilityIds: [], // filled by cross-ref pass in build-final.mjs
    canBeLedBy: opts.canBeLedBy || [],
  }
}

export { currentSM }
