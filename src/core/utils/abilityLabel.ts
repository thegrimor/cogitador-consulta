import type { Ability } from '@/types'

/**
 * Badge text for a Core ability. "Damaged" carries its threshold only in the description
 * ("While this model has 4 or fewer wounds remaining..."), so surface it as "Damaged 1-4".
 * Other Core abilities (Deadly Demise D3, Feel No Pain 5+...) already hold their value in the name.
 */
export function coreAbilityLabel(ab: Ability): string {
  if (/^damaged\b/i.test(ab.name) && !/\d/.test(ab.name)) {
    const m = /(\d+)\s+or\s+fewer\s+wounds/i.exec(ab.description)
    if (m) return `${ab.name} 1-${m[1]}`
  }
  return ab.name
}
