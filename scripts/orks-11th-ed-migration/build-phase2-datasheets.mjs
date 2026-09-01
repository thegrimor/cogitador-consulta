// Builds Phase 2 (datasheets) of the new 11th-ed Orks codex JSON, transcribed from
// public/pdf/11th Codex Orks.pdf pages 142-179 (PDF page numbers) via
// scripts/orks-11th-ed-migration/datasheet-notes-raw.md.
//
// Compact per-line formats (parsed below) keep this file from being 5000 lines of object
// literals -- see parseWeapon/parseModel.
import fs from 'fs'

const ROOT = new URL('../../', import.meta.url)
const oldOrks = JSON.parse(fs.readFileSync(new URL('public/data/factions/orks.json', ROOT), 'utf8'))
const coreAbilities = JSON.parse(fs.readFileSync(new URL('scripts/orks-11th-ed-migration/core-abilities-lookup.json', ROOT), 'utf8'))
const phase1 = JSON.parse(fs.readFileSync(new URL('scripts/orks-11th-ed-migration/phase1-detachments.json', ROOT), 'utf8'))

const kwb = (s) => `<span class="kwb">${s}</span>`
const slug = (s) => s.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const normName = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

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
    // else: CLOSE-QUARTERS, HUNTER: ..., SUPA-HAZARDOUS, etc. -- kept in description text only,
    // no matching CombatModifiers-adjacent flag in the schema.
  }
  const rangeTrim = range.trim()
  return {
    line: idx, name: name.trim(), description: descParts.join(', '),
    range: rangeTrim.replace(/"$/, ''), type: rangeTrim.toLowerCase() === 'melee' ? 'Melee' : 'Ranged',
    A: A.trim(), bsWs: bsWs.trim().replace('+', ''), S: Number(S), AP: Number(AP), D: D.trim(),
    rules,
  }
}
function weapons(...lines) { return lines.map((l, i) => parseWeapon(l, i + 1)) }

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
function models(...lines) { return lines.map((l, i) => parseModel(l, i + 1)) }

// ── ability helpers ─────────────────────────────────────────────────────────
function core(name) {
  const found = coreAbilities[name]
  if (found) return { id: slug(name), name: found.name, description: found.description, type: 'Core' }
  console.warn('MISSING core ability:', name)
  return { id: slug(name), name, description: `[[TODO: core ability text for "${name}" not found in lookup]]`, type: 'Core' }
}
function armyRule(name) {
  const found = phase1.armyRules.find(r => r.name === name)
  if (!found) throw new Error('unknown army rule: ' + name)
  return { id: found.id, name: found.name, description: found.description, type: 'Faction', ...(found.options ? { options: found.options } : {}) }
}
function ability(name, description, effect) {
  return { id: slug(name), name, description, type: 'Datasheet', ...(effect ? { effect } : {}) }
}
// Not in the Core lookup (it's stored as type:'Faction', duplicated per-faction, in every
// faction that has a super-heavy walker -- imperial-knights.json/chaos-knights.json/
// adeptus-titanicus.json all carry an identical copy). Copied verbatim from imperial-knights.json.
function superHeavyWalker() {
  return {
    id: 'super-heavy-walker', name: 'Super-heavy Walker',
    description: `Each time a model with this ability makes a Normal, Advance or Fall Back move, it can move through models (excluding ${kwb('TITANIC')} models) and sections of terrain features that are 4" or less in height. When doing so:<br><ul><li>It can move within Engagement Range of enemy models, but cannot end that move within Engagement Range of them.</li><li>It can also move through sections of terrain features that are more than 4" in height, but if it does, after it has moved, roll one D6: on a 1, that model is Battle-shocked.</li></ul>`,
    type: 'Faction',
  }
}

// ── points backfill (known-stale, name match against old codex -- see README) ──────────────
const oldDsByName = new Map(oldOrks.datasheets.map(d => [normName(d.name), d]))
function withPoints(ds) {
  const old = oldDsByName.get(normName(ds.name))
  return {
    ...ds,
    pointsCosts: old ? old.pointsCosts : [],
    wargearCosts: old ? old.wargearCosts : [],
  }
}

function datasheet(opts) {
  return withPoints({
    id: slug(opts.name),
    name: opts.name,
    role: opts.role,
    sourceId: '',
    isVirtual: false,
    loadout: opts.loadout,
    damagedW: opts.damagedW || 0,
    damagedDescription: '',
    models: opts.models,
    weapons: opts.weapons,
    abilities: opts.abilities,
    keywords: opts.keywords,
    factionKeywords: ['Orks'],
    unitComposition: opts.unitComposition,
    modelCountMin: opts.modelCountMin,
    modelCountMax: opts.modelCountMax,
    defaultWeaponNames: opts.defaultWeaponNames,
    options: opts.options || [],
    stratagemIds: [], enhancementIds: [], detachmentAbilityIds: [], // filled by cross-ref pass below
    canBeLedBy: [], // GAP: not printed per-character in this codex format, see README
  })
}

export { weapons, models, core, armyRule, ability, superHeavyWalker, datasheet, kwb, slug, phase1, oldOrks }
