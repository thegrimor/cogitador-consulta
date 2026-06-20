import type { PointsCost, Datasheet, RosterEntry } from '@/types'

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

export function resolveSelectedWeaponNames(entry: RosterEntry, datasheet: Datasheet): Set<string> {
  if (entry.selectedWeaponNames !== undefined) return new Set(entry.selectedWeaponNames)
  return new Set(datasheet.defaultWeaponNames)
}
