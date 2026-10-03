import type { Ability } from '@/types'

export interface ArmyRuleGroup { group: string; rules: Ability[] }

/** Splits army rules into the sections authored in the data via `Ability.group` (every Ka'tah
 * stance under "Ka'tah", say) and the ungrouped rest — no per-rule exceptions in code. Groups
 * and ungrouped rules are both alphabetical (Spanish collation). */
export function groupArmyRules(rules: Ability[]): { groups: ArmyRuleGroup[]; ungrouped: Ability[] } {
  const byName = (a: string, b: string) => a.localeCompare(b, 'es')
  const groupNames = Array.from(new Set(rules.filter(r => r.group).map(r => r.group!))).sort(byName)
  return {
    groups: groupNames.map(group => ({ group, rules: rules.filter(r => r.group === group) })),
    ungrouped: rules.filter(r => !r.group).sort((a, b) => byName(a.name, b.name)),
  }
}
