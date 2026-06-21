import type { PointsCost, Datasheet, Detachment, RosterEntry, WeaponOptionRule } from '@/types'
import { ruleEligibleCount } from '@/core/utils/weaponOptions'

export const DETACHMENT_POINTS_BUDGET = 3
export const MULTI_DETACHMENT_THRESHOLD = 2000

export function isMultiDetachmentAllowed(pointsLimit: number | null): boolean {
  return pointsLimit !== null && pointsLimit >= MULTI_DETACHMENT_THRESHOLD
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

export function ruleSelectionCap(
  rule: WeaponOptionRule,
  roleCounts: Record<string, number>,
  totalModelCount: number,
): number {
  const eligible = ruleEligibleCount(rule, roleCounts, totalModelCount)
  return rule.exclusive ? eligible : eligible * rule.maxStack
}

/** Max value the stepper for a given choice can reach, given the rule's overall budget and repeat rules. */
export function ruleChoiceMax(rule: WeaponOptionRule, choiceIndex: number, selection: number[], cap: number): number {
  const remaining = cap - ruleSelectionTotal(selection) + selection[choiceIndex]
  if (!rule.exclusive && !rule.allowRepeatChoice) return Math.max(0, Math.min(1, remaining))
  return Math.max(0, remaining)
}

/** Resolves the unit's actual weapon loadout as instance counts, decrementing replaced weapons
 * by however many picks were made rather than dropping them entirely (other models in the unit
 * may still carry the unmodified weapon). */
export function resolveWeaponQuantities(datasheet: Datasheet, entry: RosterEntry): Map<string, number> {
  const counts = new Map<string, number>()
  datasheet.defaultWeaponNames.forEach(name => counts.set(name, entry.modelCount))

  for (const rule of datasheet.weaponOptionRules) {
    if (rule.scope === 'unparsed' || rule.choices.length === 0) continue
    const selection = getRuleSelection(entry, rule)
    const total = ruleSelectionTotal(selection)
    if (total === 0) continue

    if (rule.kind === 'replace') {
      rule.fromWeapons.forEach(w => {
        const key = w.toLowerCase()
        const remaining = Math.max(0, (counts.get(key) ?? 0) - total)
        if (remaining === 0) counts.delete(key)
        else counts.set(key, remaining)
      })
    }

    selection.forEach((qty, i) => {
      if (qty <= 0) return
      rule.choices[i].forEach(w => {
        const key = w.toLowerCase()
        counts.set(key, (counts.get(key) ?? 0) + qty)
      })
    })
  }

  return counts
}
