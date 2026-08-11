import type { CombatModifiers, CombatType } from '@/types'

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`
}

/** Compact bracket-vocabulary summary of a rule's raw effect object (e.g. "[Sustained 1]",
 * "[+1 herir]"), matching the labels DamageCalculator already prints in its single-weapon
 * context panel. Used to tell apart mutually-exclusive options of the same ability (e.g. the
 * Ka'tah stances under Martial Ka'tah) whose shared `description` text is identical for every
 * option and whose GW-flavour option names (e.g. "Ka'tah Dacatarai" vs "Ka'tah Rendax") don't
 * say what they actually do. */
export function describeEffects(effects: Partial<CombatModifiers>, combatType?: CombatType): string {
  const parts: string[] = []

  if (effects.hitMod)              parts.push(`[${signed(effects.hitMod)} impactar]`)
  if (effects.bsMod)                parts.push(`[BS ${signed(effects.bsMod)}]`)
  if (effects.wsMod)                parts.push(`[WS ${signed(effects.wsMod)}]`)
  if (effects.rerollHitsOf1)       parts.push('[RR impactos 1]')
  if (effects.rerollAllHits)       parts.push('[RR impactos]')
  if (effects.critThreshold !== undefined && effects.critThreshold !== 6)
    parts.push(`[Crítico ${effects.critThreshold}+]`)
  if (effects.strengthMod)         parts.push(`[${signed(effects.strengthMod)} F]`)
  if (effects.woundMod)            parts.push(`[${signed(effects.woundMod)} herir]`)
  if (effects.rerollWoundsOf1)     parts.push('[RR heridas 1]')
  if (effects.rerollAllWounds)     parts.push('[RR heridas]')
  if (effects.lethalHitsBonus)     parts.push('[Lethal Hits]')
  if (effects.sustainedHitsBonus)  parts.push(`[Sustained ${effects.sustainedHitsBonus}]`)
  if (effects.cleaveBonus)         parts.push(`[Cleave ${effects.cleaveBonus}]`)
  if (effects.devastatingWoundsBonus) parts.push('[Devastating Wounds]')
  if (effects.apMod)               parts.push(`[${signed(effects.apMod)} PA]`)
  if (effects.saveMod)             parts.push(`[${signed(effects.saveMod)} Salv.]`)
  if (effects.attacksMod)          parts.push(`[${signed(effects.attacksMod)}A]`)
  if (effects.damageMod)           parts.push(`[${signed(effects.damageMod)}D]`)
  if (effects.damageReduction)     parts.push(`[-${effects.damageReduction}D recibido]`)
  if (effects.rerollDamageOf1)     parts.push('[RR daño 1]')
  if (effects.rerollAllDamage)     parts.push('[RR daño]')
  if (effects.feelNoPainThreshold != null) parts.push(`[FNP ${effects.feelNoPainThreshold}+]`)
  if (effects.woundCritThreshold !== undefined && effects.woundCritThreshold !== 6)
    parts.push(`[Crítico herir ${effects.woundCritThreshold}+]`)

  if (parts.length === 0) return ''
  const suffix = combatType === 'melee' ? ' (CaC)' : combatType === 'ranged' ? ' (Disparo)' : ''
  return parts.join(' ') + suffix
}
