import type { CombatType } from '@/types'

export interface CombatModifiers {
  hitMod: number           // modificador al dado (cap neto ±1)
  bsMod: number            // modificador a la característica BS ranged (cobertura: +1; no tiene cap)
  wsMod: number            // modificador a la característica WS melee (sin cap)
  rerollHitsOf1: boolean
  rerollAllHits: boolean
  critThreshold: number
  overwatchHit: boolean        // true = modo Overwatch; threshold base dado por overwatchThreshold
  overwatchThreshold: number   // umbral de impacto en overwatch (6 por defecto; 5 si una regla lo permite)
  strengthMod: number
  woundMod: number
  rerollWoundsOf1: boolean
  rerollAllWounds: boolean
  lethalHitsBonus: boolean
  sustainedHitsBonus: number
  cleaveBonus: number          // X de [CLEAVE X]: ataques extra por cada 5 modelos del objetivo (igual que Blast)
  apMod: number
  saveMod: number
  attacksMod: number
  damageMod: number
  damageReduction: number
  rerollDamageOf1: boolean
  rerollAllDamage: boolean
  feelNoPainThreshold: number | null
  woundCritThreshold: number  // 7 = desactivado; valores activos 2–6 (paralelo a critThreshold)
  devastatingWoundsBonus: boolean  // [DEVASTATING WOUNDS] otorgado por una regla (no inherente al arma)
}

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
  expectedTotalDamage: number
  expectedKills: number
  effectiveAP: number
  standardDeviation: number
  percentile10: number
  percentile90: number
  killProbability: number
}
