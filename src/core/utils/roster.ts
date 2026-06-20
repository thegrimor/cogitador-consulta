import type { PointsCost, Datasheet } from '@/types'

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
