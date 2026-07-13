import Papa from 'papaparse'
import type {
  Ability, AntiEntry, Datasheet, ModelProfile, UnitOption, Weapon,
  RawAbility, RawDatasheet, RawDatasheetAbility, RawDatasheetModel, RawDatasheetUnitComposition,
  RawDatasheetWargear, RawDatasheetKeyword, DefaultWeaponQuantity,
} from '@/types'
import { parseUnitSlots, parseWeaponOptionRules } from '@/core/utils/weaponOptions'

export function parseCsvRaw(text: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    delimiter: '|',
    skipEmptyLines: true,
    dynamicTyping: false,
  })
  return result.data
}

export function groupBy<T>(rows: T[], key: keyof T): Record<string, T[]> {
  const map: Record<string, T[]> = {}
  for (const row of rows) {
    const k = String(row[key])
    if (!map[k]) map[k] = []
    map[k].push(row)
  }
  return map
}

export function splitIds(raw: string): string[] {
  if (!raw) return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

export function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '')
}

export function parseDefaultWeaponNames(loadout: string): DefaultWeaponQuantity[] {
  const clean = stripHtml(loadout)
  const counts = new Map<string, number>()
  const RE = /equipped with:\s*([^.]+)/gi
  let m: RegExpExecArray | null
  while ((m = RE.exec(clean)) !== null) {
    const parts = m[1].split(';').map(s => s.trim()).filter(Boolean)
    for (const part of parts) {
      // "2 shieldbreaker missile launchers" — a single model can carry more than one of the
      // same weapon by default; a bare "titanic feet" with no leading number means 1.
      const countMatch = part.match(/^(\d+)\s+(.+)$/)
      const name = (countMatch ? countMatch[2] : part).trim().toLowerCase()
      if (!name) continue
      counts.set(name, countMatch ? parseInt(countMatch[1], 10) : 1)
    }
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count }))
}

export function parseUnitCompositionRange(lines: string[]): { min: number; max: number } {
  const orIdx = lines.findIndex(l => stripHtml(l).trim().toUpperCase() === 'OR')
  const relevant = orIdx >= 0 ? lines.slice(0, orIdx) : lines
  let totalMin = 0
  let totalMax = 0
  for (const line of relevant) {
    const clean = stripHtml(line)
    const rangeMatch = clean.match(/(\d+)\s*-\s*(\d+)/)
    if (rangeMatch) {
      totalMin += parseInt(rangeMatch[1])
      totalMax += parseInt(rangeMatch[2])
    } else {
      const nums = clean.match(/\d+/g)
      if (nums) {
        const sum = nums.reduce((s, n) => s + parseInt(n), 0)
        totalMin += sum
        totalMax += sum
      }
    }
  }
  return { min: Math.max(1, totalMin), max: Math.max(1, totalMax) }
}

export function parseRapidFire(desc: string): string {
  const m = desc.match(/rapid fire (\d+|d\d+(?:[+-]\d+)?)/i)
  return m ? m[1].toUpperCase() : ''
}

export function parseSustainedHits(desc: string): number {
  const m = desc.match(/sustained hits (\d+|d\d+)/i)
  if (!m) return 0
  const val = parseInt(m[1])
  if (!isNaN(val)) return val
  if (m[1].toUpperCase() === 'D3') return 2
  if (m[1].toUpperCase() === 'D6') return 3.5
  return 0
}

export function parseAntiEntries(desc: string): AntiEntry[] {
  const RE = /anti-([\w][\w ]*?)\s+(\d)\+/gi
  const entries: AntiEntry[] = []
  let m: RegExpExecArray | null
  while ((m = RE.exec(desc)) !== null) {
    entries.push({ keyword: m[1].toLowerCase().trim(), threshold: parseInt(m[2]) })
  }
  return entries
}

/** Defaults for the weapon-rule flags the generator trims off when they're falsy (see
 * stripWeaponRuleDefaults in scripts/generate-faction-data.ts) — shared so anything
 * reconstructing a full Weapon from the trimmed `rules` JSON fills the same gaps. */
export const WEAPON_RULE_DEFAULTS: Omit<Weapon, 'line' | 'name' | 'description' | 'range' | 'type' | 'A' | 'bsWs' | 'S' | 'AP' | 'D'> = {
  isTorrent: false, isBlast: false, isDevastatingWounds: false, isLethalHits: false, isHeavy: false,
  isTwinLinked: false, isMelta: false, meltaValue: 0, cleaveValue: 0, sustainedHitsValue: 0, antiEntries: [],
  isIgnoresCover: false, isHazardous: false, isAssault: false, isPistol: false, isPsychic: false,
  isPrecision: false, isOneShot: false, isIndirectFire: false, isExtraAttacks: false, isLance: false,
  isConversion: false, rapidFireValue: '',
}

export function parseWeapon(raw: RawDatasheetWargear): Weapon {
  const desc = (raw.description ?? '').toLowerCase()
  return {
    line: parseInt(raw.line) || 0,
    name: raw.name,
    description: raw.description,
    range: raw.range,
    type: raw.type,
    A: raw.A,
    bsWs: raw.BS_WS,
    S: parseInt(raw.S) || 0,
    AP: parseInt(raw.AP) || 0,
    D: raw.D,
    isTorrent: desc.includes('torrent'),
    isBlast: desc.includes('blast'),
    isDevastatingWounds: desc.includes('devastating wounds'),
    isLethalHits: desc.includes('lethal hits'),
    isHeavy: /\bheavy\b/.test(desc),
    isTwinLinked: desc.includes('twin-linked'),
    isMelta: /\bmelta\s+\d+/i.test(desc),
    meltaValue: parseInt(desc.match(/\bmelta\s+(\d+)/i)?.[1] ?? '0') || 0,
    cleaveValue: parseInt(desc.match(/\bcleave\s+(\d+)/i)?.[1] ?? '0') || 0,
    sustainedHitsValue: parseSustainedHits(desc),
    antiEntries: parseAntiEntries(desc),
    isIgnoresCover: desc.includes('ignores cover'),
    isHazardous: desc.includes('hazardous'),
    isAssault: /\bassault\b/.test(desc),
    isPistol: /\bpistol\b/.test(desc),
    isPsychic: /\bpsychic\b/.test(desc),
    isPrecision: desc.includes('precision'),
    isOneShot: desc.includes('one shot'),
    isIndirectFire: desc.includes('indirect fire'),
    isExtraAttacks: desc.includes('extra attacks'),
    isLance: /\blance\b/.test(desc),
    isConversion: /\bconversion\b/.test(desc),
    rapidFireValue: parseRapidFire(desc),
  }
}

export function parseModel(raw: RawDatasheetModel): ModelProfile {
  return {
    line: parseInt(raw.line) || 0,
    name: raw.name,
    M: raw.M,
    T: parseInt(raw.T) || 0,
    Sv: raw.Sv,
    invSv: raw.inv_sv || '',
    W: parseInt(raw.W) || 0,
    Ld: raw.Ld,
    OC: parseInt(raw.OC) || 0,
    baseSize: raw.base_size,
  }
}

// The scraped source mislabels some unit-specific abilities, either with the name of
// the page layout column they appeared in (in Russian), or with a wargear/primarch
// sub-category instead of an actual ability type. These are always datasheet-specific
// rules, so normalize them to 'Datasheet' to keep them out of the generic/faction bucket.
export const NON_STANDARD_TYPE_LABELS = new Set([
  'Fortification (левая колонка)', 'Special (правая колонка)', 'Без заголовка',
  'Wargear', 'Wargear profile', 'Primarch',
])

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function resolveAbility(
  row: RawDatasheetAbility,
  abilitiesMap: Record<string, RawAbility>,
): Omit<Ability, 'id'> | null {
  const rawType = NON_STANDARD_TYPE_LABELS.has(row.type) ? 'Datasheet' : row.type
  const type = rawType as 'Core' | 'Faction' | 'Datasheet'
  if (row.name) {
    return { name: row.name, description: row.description, type, model: row.model || undefined }
  }
  const ref = abilitiesMap[row.ability_id]
  if (!ref) return null
  const name = row.parameter ? `${ref.name} ${row.parameter}` : ref.name
  return { name, description: ref.description, type }
}

export function enrichDatasheet(
  raw: RawDatasheet,
  modelsByDs: Record<string, RawDatasheetModel[]>,
  wargearByDs: Record<string, RawDatasheetWargear[]>,
  abilitiesByDs: Record<string, RawDatasheetAbility[]>,
  keywordsByDs: Record<string, RawDatasheetKeyword[]>,
  compByDs: Record<string, RawDatasheetUnitComposition[]>,
  abilitiesMap: Record<string, RawAbility>,
  optionsByDs: Record<string, UnitOption[]>,
): Datasheet {
  const models = (modelsByDs[raw.id] ?? [])
    .sort((a, b) => parseInt(a.line) - parseInt(b.line))
    .map(parseModel)

  const weapons = (wargearByDs[raw.id] ?? [])
    .sort((a, b) => parseInt(a.line) - parseInt(b.line))
    .map(parseWeapon)

  const abilityIdCounts = new Map<string, number>()
  function nextAbilityId(name: string): string {
    const base = slugify(name)
    const count = abilityIdCounts.get(base) ?? 0
    abilityIdCounts.set(base, count + 1)
    return count === 0 ? base : `${base}-${count + 1}`
  }

  const abilities: Ability[] = (abilitiesByDs[raw.id] ?? [])
    .sort((a, b) => parseInt(a.line) - parseInt(b.line))
    .map(row => resolveAbility(row, abilitiesMap))
    .filter((a): a is Omit<Ability, 'id'> => a !== null)
    .map(a => ({ id: nextAbilityId(a.name), ...a }))

  const kwRows = keywordsByDs[raw.id] ?? []
  const keywords = kwRows
    .filter(k => k.is_faction_keyword !== 'true' && k.is_faction_keyword !== '1')
    .map(k => k.keyword)
  const factionKeywords = kwRows
    .filter(k => k.is_faction_keyword === 'true' || k.is_faction_keyword === '1')
    .map(k => k.keyword)

  const unitComposition = (compByDs[raw.id] ?? [])
    .sort((a, b) => parseInt(a.line) - parseInt(b.line))
    .map(c => c.description)

  const { min: modelCountMin, max: modelCountMax } = parseUnitCompositionRange(unitComposition)
  const defaultWeaponNames = parseDefaultWeaponNames(raw.loadout || '')

  const unitSlots = parseUnitSlots(unitComposition)
  const weaponOptionRules = parseWeaponOptionRules(optionsByDs[raw.id] ?? [], unitSlots)

  return {
    id: raw.id,
    name: raw.name,
    factionId: raw.faction_id,
    sourceId: raw.source_id || '',
    role: raw.role,
    loadout: raw.loadout,
    isVirtual: raw.virtual === 'true' || raw.virtual === '1',
    leaderHead: splitIds(raw.leader_head),
    leaderFooter: splitIds(raw.leader_footer),
    damagedW: parseInt(raw.damaged_w) || 0,
    damagedDescription: raw.damaged_description || '',
    models,
    weapons,
    abilities,
    keywords,
    factionKeywords,
    unitComposition,
    modelCountMin,
    modelCountMax,
    defaultWeaponNames,
    unitSlots,
    weaponOptionRules,
  }
}
