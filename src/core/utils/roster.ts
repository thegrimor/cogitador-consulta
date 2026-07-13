import type { PointsCost, Datasheet, Detachment, RosterEntry, WeaponOptionRule } from '@/types'
import { ruleEligibleCount } from '@/core/utils/weaponOptions'

export const DETACHMENT_POINTS_BUDGET = 3
export const MULTI_DETACHMENT_THRESHOLD = 2000

export function isMultiDetachmentAllowed(pointsLimit: number | null): boolean {
  return pointsLimit !== null && pointsLimit >= MULTI_DETACHMENT_THRESHOLD
}

/** Battle size tiers, by points-limit upper bound, and how many copies of a single
 * (non-Epic Hero) datasheet are allowed at each one. Incursion 2 / Strike Force 3 / Onslaught 4. */
const BATTLE_SIZE_COPY_CAPS: { maxPoints: number; cap: number }[] = [
  { maxPoints: 1000, cap: 2 },
  { maxPoints: 2000, cap: 3 },
  { maxPoints: Infinity, cap: 4 },
]

export function isEpicHero(datasheet: Datasheet): boolean {
  return datasheet.keywords.some(k => k.toUpperCase() === 'EPIC HERO')
}

/** How many copies of `datasheet` the roster may contain. Epic Heroes are always
 * capped at 1 (unique named characters); everything else scales with battle size.
 * Returns Infinity if no points limit is set (battle size can't be determined). */
export function maxCopiesAllowed(datasheet: Datasheet, pointsLimit: number | null): number {
  if (isEpicHero(datasheet)) return 1
  if (pointsLimit === null) return Infinity
  return (BATTLE_SIZE_COPY_CAPS.find(t => pointsLimit <= t.maxPoints) ?? BATTLE_SIZE_COPY_CAPS.at(-1)!).cap
}

export function sumDetachmentPoints(detachments: Detachment[], detachmentIds: string[]): number {
  const byId = new Map(detachments.map(d => [d.id, d]))
  return detachmentIds.reduce((sum, id) => sum + (byId.get(id)?.dp ?? 0), 0)
}

export function parseModelCountFromDescription(description: string): number | null {
  const m = description.match(/^(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

export function resolveModelCount(cost: PointsCost, datasheet: Datasheet): number {
  const parsed = parseModelCountFromDescription(cost.description)
  if (parsed !== null) return parsed
  return datasheet.modelCountMin || 1
}

export function sortCostVariants(costs: PointsCost[]): PointsCost[] {
  return [...costs].sort((a, b) => {
    const aCount = parseModelCountFromDescription(a.description) ?? 0
    const bCount = parseModelCountFromDescription(b.description) ?? 0
    return aCount - bCount
  })
}

/** "Nth unit / Nth+ unit / Nth-Mth units" surcharge tiers (e.g. a 2nd Defiler costs
 * more than the 1st) aren't a player choice — they're determined by how many of that
 * datasheet are already in the roster. This range is what `description` encodes. */
export interface CostTierRange { min: number; max: number }

export function parseTierRange(description: string): CostTierRange | null {
  const m = description.match(/\(([^)]+)\)\s*$/)
  if (!m) return null
  const tier = m[1].toLowerCase().trim()

  const plus = tier.match(/^(\d+)(?:st|nd|rd|th)\s*\+\s*units?$/)
  if (plus) return { min: parseInt(plus[1], 10), max: Infinity }

  const range = tier.match(/^1st\s*(?:-|to)\s*(\d+)(?:st|nd|rd|th)\s*units?$/)
  if (range) return { min: 1, max: parseInt(range[1], 10) }

  const exact = tier.match(/^(\d+)(?:st|nd|rd|th)\s*units?$/)
  if (exact) return { min: parseInt(exact[1], 10), max: parseInt(exact[1], 10) }

  return null
}

/** Strips a tier suffix like " (2nd+ unit)" so two tiers of the same squad size compare equal. */
export function stripTierSuffix(description: string): string {
  return description.replace(/\s*\([^)]+\)\s*$/, '').trim()
}

/** Narrows `costs` down to whichever tier applies to the Nth (1-indexed) copy of this
 * datasheet in the roster. Costs with no tier suffix (plain squad-size choices) always pass through. */
export function resolveCostsForUnitIndex(costs: PointsCost[], unitIndex: number): PointsCost[] {
  return costs.filter(c => {
    const range = parseTierRange(c.description)
    return range === null || (unitIndex >= range.min && unitIndex <= range.max)
  })
}

/** 1-indexed position of `entryId` among entries sharing its datasheetId, in roster order.
 * Pass `entryId: null` to get the index the *next* added copy of `datasheetId` would take. */
export function unitIndexInRoster(
  entries: { id: string; datasheetId: string }[],
  datasheetId: string,
  entryId: string | null,
): number {
  const matching = entries.filter(e => e.datasheetId === datasheetId)
  if (entryId === null) return matching.length + 1
  const idx = matching.findIndex(e => e.id === entryId)
  return idx === -1 ? matching.length + 1 : idx + 1
}

const ROLE_PRIORITY: Record<string, number> = {
  Characters: 0,
  Battleline: 1,
  'Dedicated Transports': 2,
  Fortifications: 3,
  Other: 3,
}

function rolePriority(role: string): number {
  return ROLE_PRIORITY[role] ?? 3
}

export function compareByRolePriority(a: { role: string }, b: { role: string }): number {
  return rolePriority(a.role) - rolePriority(b.role)
}

export function getRuleSelection(entry: RosterEntry, rule: WeaponOptionRule): number[] {
  const stored = entry.weaponOptionSelections?.[rule.id]
  if (stored && stored.length === rule.choices.length) return stored
  return new Array(rule.choices.length).fill(0)
}

export function ruleSelectionTotal(selection: number[]): number {
  return selection.reduce((a, b) => a + b, 0)
}

/** Rules whose 'replace' picks draw from the same finite pool of base weapons as `rule`
 * (one instance per model), including `rule` itself. */
function replacePoolRules(rule: WeaponOptionRule, allRules: WeaponOptionRule[]): WeaponOptionRule[] {
  if (rule.kind !== 'replace') return []
  return allRules.filter(r => r.kind === 'replace' && r.fromWeapons.some(w => rule.fromWeapons.includes(w)))
}

/** How many of the shared base weapon remain unreplaced once every rule drawing from the
 * same pool (e.g. two different "replace your guardian spear" options) is accounted for. */
export function replaceWeaponRemaining(
  rule: WeaponOptionRule,
  allRules: WeaponOptionRule[],
  entry: RosterEntry,
  totalModelCount: number,
): number {
  const pool = replacePoolRules(rule, allRules)
  if (pool.length === 0) return totalModelCount
  const used = pool.reduce((sum, r) => sum + ruleSelectionTotal(getRuleSelection(entry, r)), 0)
  return totalModelCount - used
}

export function ruleSelectionCap(
  rule: WeaponOptionRule,
  allRules: WeaponOptionRule[],
  entry: RosterEntry,
  roleCounts: Record<string, number>,
  totalModelCount: number,
): number {
  const eligible = ruleEligibleCount(rule, roleCounts, totalModelCount)
  const structuralCap = rule.exclusive ? eligible : eligible * rule.maxStack

  const pool = replacePoolRules(rule, allRules)
  if (pool.length <= 1) return structuralCap

  const ownTotal = ruleSelectionTotal(getRuleSelection(entry, rule))
  const remaining = replaceWeaponRemaining(rule, allRules, entry, totalModelCount) + ownTotal
  return Math.max(0, Math.min(structuralCap, remaining))
}

/** Max value the stepper for a given choice can reach, given the rule's overall budget and repeat rules. */
export function ruleChoiceMax(rule: WeaponOptionRule, choiceIndex: number, selection: number[], cap: number): number {
  const remaining = cap - ruleSelectionTotal(selection) + selection[choiceIndex]
  if (!rule.exclusive && !rule.allowRepeatChoice) return Math.max(0, Math.min(1, remaining))
  return Math.max(0, remaining)
}

/** Weapons with multiple firing modes (e.g. "Plasma pistol – standard" / "– supercharge") are
 * listed as separate profile rows in the wargear table but share one physical instance per
 * model, and wargear-option text only ever names the weapon once, without a profile suffix.
 * Stripping the suffix lets quantity lookups match every profile row to the same pick. */
export function weaponBaseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+[-–—]\s+\S.*$/, '')
}

/** Resolves the unit's actual weapon loadout as instance counts, decrementing replaced weapons
 * by however many picks were made rather than dropping them entirely (other models in the unit
 * may still carry the unmodified weapon). */
export function resolveWeaponQuantities(datasheet: Datasheet, entry: RosterEntry): Map<string, number> {
  const counts = new Map<string, number>()

  // Free-text loadout/option descriptions pluralize a weapon's name when a model carries
  // more than one (e.g. "2 twin bolt cannons"), but the datasheet's own weapon profile is
  // always named in the singular ("Twin bolt cannon"). Resolve to whichever form actually
  // matches a real profile so counts land on the same key WeaponSelector looks up.
  const profileBases = new Set(datasheet.weapons.map(w => weaponBaseName(w.name)))
  const canonicalKey = (name: string): string => {
    const base = weaponBaseName(name)
    if (profileBases.has(base)) return base
    const singular = base.replace(/s$/, '')
    return profileBases.has(singular) ? singular : base
  }

  datasheet.defaultWeaponNames.forEach(({ name, count }) =>
    counts.set(canonicalKey(name), count * entry.modelCount),
  )

  for (const rule of datasheet.weaponOptionRules) {
    if (rule.scope === 'unparsed' || rule.choices.length === 0) continue
    const selection = getRuleSelection(entry, rule)
    const total = ruleSelectionTotal(selection)
    if (total === 0) continue

    if (rule.kind === 'replace') {
      rule.fromWeapons.forEach(w => {
        const key = canonicalKey(w)
        const remaining = Math.max(0, (counts.get(key) ?? 0) - total)
        if (remaining === 0) counts.delete(key)
        else counts.set(key, remaining)
      })
    }

    selection.forEach((qty, i) => {
      if (qty <= 0) return
      rule.choices[i].forEach(w => {
        const key = canonicalKey(w)
        counts.set(key, (counts.get(key) ?? 0) + qty)
      })
    })
  }

  return counts
}
