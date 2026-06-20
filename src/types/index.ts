// ── Raw CSV row types ──────────────────────────────────────────────────────────

export interface RawFaction {
  id: string
  name: string
  link: string
}

export interface RawDatasheet {
  id: string
  name: string
  faction_id: string
  source_id: string
  legend: string
  role: string
  loadout: string
  transport: string
  virtual: string
  leader_head: string
  leader_footer: string
  damaged_w: string
  damaged_description: string
  link: string
}

export interface RawDatasheetModel {
  datasheet_id: string
  line: string
  name: string
  M: string
  T: string
  Sv: string
  inv_sv: string
  inv_sv_descr: string
  W: string
  Ld: string
  OC: string
  base_size: string
  base_size_descr: string
}

export interface RawDatasheetWargear {
  datasheet_id: string
  line: string
  line_in_wargear: string
  dice: string
  name: string
  description: string
  range: string
  type: string
  A: string
  BS_WS: string
  S: string
  AP: string
  D: string
}

export interface RawDatasheetAbility {
  datasheet_id: string
  line: string
  ability_id: string
  model: string
  name: string
  description: string
  type: string
  parameter: string
}

export interface RawAbility {
  id: string
  name: string
  legend: string
  faction_id: string
  description: string
}

export interface RawDetachment {
  id: string
  faction_id: string
  name: string
  legend: string
  type: string
  disposition: string
  dp: string
}

export interface RawDetachmentAbility {
  id: string
  faction_id: string
  name: string
  legend: string
  description: string
  detachment: string
  detachment_id: string
}

export interface RawStratagem {
  faction_id: string
  name: string
  id: string
  type: string
  cp_cost: string
  legend: string
  turn: string
  phase: string
  detachment: string
  detachment_id: string
  description: string
}

export interface RawDatasheetStratagem {
  datasheet_id: string
  stratagem_id: string
}

export interface RawDatasheetKeyword {
  datasheet_id: string
  keyword: string
  model: string
  is_faction_keyword: string
}

export interface RawDatasheetUnitComposition {
  datasheet_id: string
  line: string
  description: string
}

export interface RawModelCost {
  datasheet_id: string
  line: string
  description: string
  cost: string
}

export interface RawDatasheetLeader {
  leader_id: string
  attached_id: string
}

export interface RawEnhancement {
  faction_id: string
  id: string
  name: string
  cost: string
  detachment: string
  detachment_id: string
  legend: string
  description: string
}

export interface RawDatasheetEnhancement {
  datasheet_id: string
  enhancement_id: string
}

export interface RawDatasheetOption {
  datasheet_id: string
  line: string
  button: string
  description: string
}

export interface RawDatasheetDetachmentAbility {
  datasheet_id: string
  detachment_ability_id: string
}

export interface RawSource {
  id: string
  name: string
  type: string
  edition: string
  version: string
  errata_date: string
  errata_link: string
}

export interface RawCoreRule {
  id: string
  name: string
  category: string
  summary: string
  description: string
}

// ── Domain types ───────────────────────────────────────────────────────────────

export interface Faction {
  id: string
  name: string
}

export interface Detachment {
  id: string
  factionId: string
  name: string
  legend: string
  type: string
  disposition: string
  dp: number
}

export interface DetachmentAbility {
  id: string
  detachmentId: string
  name: string
  description: string
  legend: string
}

export interface ModelProfile {
  line: number
  name: string
  M: string
  T: number
  Sv: string
  invSv: string
  W: number
  Ld: string
  OC: number
  baseSize: string
}

export interface AntiEntry {
  keyword: string
  threshold: number
}

export interface Weapon {
  line: number
  name: string
  description: string
  range: string
  type: string
  A: string
  bsWs: string
  S: number
  AP: number
  D: string
  isTorrent: boolean
  isBlast: boolean
  isDevastatingWounds: boolean
  isLethalHits: boolean
  isHeavy: boolean
  isTwinLinked: boolean
  isMelta: boolean
  meltaValue: number
  sustainedHitsValue: number
  antiEntries: AntiEntry[]
  isIgnoresCover: boolean
  isHazardous: boolean
  isAssault: boolean
  isPistol: boolean
  isPsychic: boolean
  isPrecision: boolean
  isOneShot: boolean
  isIndirectFire: boolean
  isExtraAttacks: boolean
  isLance: boolean
  rapidFireValue: string
}

export type CombatType = 'ranged' | 'melee' | 'any'

export interface Ability {
  name: string
  description: string
  type: 'Core' | 'Faction' | 'Datasheet'
  model?: string
}

export interface Stratagem {
  id: string
  name: string
  factionId: string
  detachmentId: string
  cpCost: number
  type: string
  turn: string
  phase: string
  description: string
}

export interface Datasheet {
  id: string
  name: string
  factionId: string
  sourceId: string
  role: string
  legend: string
  loadout: string
  isVirtual: boolean
  leaderHead: string[]
  leaderFooter: string[]
  damagedW: number
  damagedDescription: string
  models: ModelProfile[]
  weapons: Weapon[]
  abilities: Ability[]
  keywords: string[]
  factionKeywords: string[]
  unitComposition: string[]
  modelCountMin: number
  modelCountMax: number
  defaultWeaponNames: string[]
}

export interface GameData {
  factions: Faction[]
  datasheets: Datasheet[]
  detachments: Detachment[]
  detachmentAbilities: DetachmentAbility[]
  stratagems: Stratagem[]
  datasheetStratagems: Record<string, string[]>
  abilitiesMap: Record<string, RawAbility>
  armyRulesByFaction: Record<string, RawAbility[]>
  pointsCosts: PointsCost[]
  pointsCostMap: Record<string, PointsCost[]>
  leaderMap: Record<string, string[]>
  attachedMap: Record<string, string[]>
  enhancements: Enhancement[]
  datasheetEnhancements: Record<string, string[]>
  datasheetOptions: Record<string, UnitOption[]>
  datasheetDetachmentAbilities: Record<string, string[]>
  sources: Source[]
  sourceMap: Record<string, Source>
  lastUpdate: string
  coreRules: CoreRule[]
  coreRulesMap: Record<string, CoreRule>
  loading: boolean
  error: string | null
}

// ── Roster types ───────────────────────────────────────────────────────────────

export interface RosterEntry {
  id: string
  datasheetId: string
  modelCount: number
  pointsCost: number | null
  customName?: string
  enhancementId?: string
}

export interface RosterList {
  id: string
  name: string
  factionId: string
  detachmentId: string | null
  entries: RosterEntry[]
  totalPoints: number | null
  pointsLimit: number | null
  createdAt: string
  updatedAt: string
}

export interface PointsCost {
  datasheetId: string
  description: string
  points: number
}

export interface Enhancement {
  id: string
  factionId: string
  name: string
  cost: number
  detachmentId: string
  detachmentName: string
  legend: string
  description: string
}

export interface UnitOption {
  line: number
  button: string
  description: string
}

export interface Source {
  id: string
  name: string
  type: string
  edition: number
  version: string
  errataDate: string
  errataLink: string
}

export type CoreRuleCategory = 'weapon_ability' | 'unit_ability' | 'concept' | 'phase'

export interface CoreRule {
  id: string
  name: string
  category: CoreRuleCategory
  summary: string
  description: string
}
