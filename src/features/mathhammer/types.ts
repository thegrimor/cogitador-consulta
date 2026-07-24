import type { CombatType, CombatModifiers } from '@/types'

// CombatModifiers now lives in @/types (it's stored directly on abilities/stratagems/
// enhancements as part of CombatEffect, not just used within mathhammer) — re-exported here
// so existing imports from this module keep working unchanged.
export type { CombatModifiers }

export interface ModifierRule {
  id: string
  label: string
  description?: string
  factionId?: string
  detachmentId?: string
  enhancementId?: string      // solo aplica si esta Mejora está seleccionada en el panel
  datasheetId?: string        // ability de esta unidad concreta
  leaderDatasheetId?: string  // ability de un líder adjunto a la unidad
  followerDatasheetIds?: string[] // restricción: solo aparece para estas unidades (si ausente = toda la facción)
  sourceDatasheetId?: string  // aura de una unidad de soporte (no adjunta)
  /** true = el efecto solo aplica a las armas propias del portador, no al resto de la unidad
   * a la que esté adjunto (p.ej. "this model's melee attacks have +1 A"). */
  bearerOnly?: boolean
  combatType?: CombatType
  target?: 'attacker' | 'defender'
  isStratagem?: boolean
  cpCost?: number
  effects: Partial<CombatModifiers>
  requiresAntiKeyword?: string      // regla solo aparece si el arma tiene ANTI-<keyword>
  requiresTargetKeyword?: string    // regla solo aparece si el defensor tiene esta keyword
  requiresAttackerKeyword?: string  // regla solo aparece si la unidad atacante tiene esta keyword
}

export interface PanelSelection {
  factionId: string | null
  detachmentIds: string[]
  datasheetId: string | null
  characterId: string | null
  enhancementId: string | null
}

export interface DamageBreakdown {
  weaponName: string
  avgAttacks: number
  blastBonusAttacks?: number
  cleaveBonusAttacks?: number
  hitProbability: number
  expectedHits: number
  sustainedExtraHits: number
  woundProbability: number
  expectedWounds: number
  autoWoundsFromCrits: number
  antiCritWounds: number
  saveFailProbability: number
  expectedFailedSaves: number
  avgDamagePerWound: number
  damageBeforeFNP: number
  feelNoPainThreshold: number | null
  fnpProbability: number
  expectedTotalDamage: number
  expectedKills: number
  effectiveAP: number
  standardDeviation: number
  percentile10: number
  percentile90: number
  killProbability: number
}
