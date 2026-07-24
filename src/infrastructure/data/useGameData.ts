import { useState, useEffect } from 'react'
import type {
  GameData, Faction, Detachment, DetachmentAbility, Stratagem, Datasheet,
  Enhancement, Source, CoreRule, UnitOption, PointsCost, WargearCost, Ability,
  ModelProfile, Weapon, DefaultWeaponQuantity, CoreCombatEffect,
} from '@/types'
import { parseUnitSlots, parseWeaponOptionRules } from '@/core/utils/weaponOptions'
import { SM_CHAPTERS } from '@/core/constants/chapters'

// ── Shapes written to public/data/factions/*.json, public/data/catalog/*.json ──────────

type WeaponRulesJson = Partial<Omit<Weapon, 'line' | 'name' | 'description' | 'range' | 'type' | 'A' | 'bsWs' | 'S' | 'AP' | 'D'>>

/** Defaults for the weapon-rule flags trimmed off the JSON when falsy, to keep the payload small. */
const WEAPON_RULE_DEFAULTS: Omit<Weapon, 'line' | 'name' | 'description' | 'range' | 'type' | 'A' | 'bsWs' | 'S' | 'AP' | 'D'> = {
  isTorrent: false, isBlast: false, isDevastatingWounds: false, isLethalHits: false, isHeavy: false,
  isTwinLinked: false, isMelta: false, meltaValue: 0, cleaveValue: 0, sustainedHitsValue: 0, antiEntries: [],
  isIgnoresCover: false, isHazardous: false, isAssault: false, isPistol: false, isPsychic: false,
  isPrecision: false, isOneShot: false, isIndirectFire: false, isExtraAttacks: false, isLance: false,
  isConversion: false, rapidFireValue: '',
}

interface WeaponJson {
  line: number; name: string; description: string; range: string; type: string
  A: string; bsWs: string; S: number; AP: number; D: string
  rules: WeaponRulesJson
}

interface DatasheetJson {
  id: string; name: string; role: string; sourceId: string; isVirtual: boolean
  loadout: string; damagedW: number; damagedDescription: string
  models: ModelProfile[]; weapons: WeaponJson[]; abilities: Ability[]
  keywords: string[]; factionKeywords: string[]; unitComposition: string[]
  modelCountMin: number; modelCountMax: number
  defaultWeaponNames: DefaultWeaponQuantity[]
  options: { button: string; description: string }[]
  pointsCosts: { description: string; points: number }[]
  wargearCosts: { name: string; points: number }[]
  stratagemIds: string[]; enhancementIds: string[]; detachmentAbilityIds: string[]
  canBeLedBy: string[]
}

interface DetachmentJson {
  id: string; name: string; disposition: string; dp: number; chapters: string[]
  abilities: DetachmentAbility[]
}

interface FactionJson {
  id: string; name: string
  armyRules: Ability[]
  detachments: DetachmentJson[]
  stratagems: Stratagem[]
  enhancements: Enhancement[]
  datasheets: DatasheetJson[]
}

interface CatalogJson {
  coreRules: CoreRule[]
  coreStratagems: Stratagem[]
  coreRuleEffects: CoreCombatEffect[]
  sources: Source[]
  lastUpdate: string
}

function reconstructWeapon(w: WeaponJson): Weapon {
  return {
    line: w.line, name: w.name, description: w.description, range: w.range, type: w.type,
    A: w.A, bsWs: w.bsWs, S: w.S, AP: w.AP, D: w.D,
    ...WEAPON_RULE_DEFAULTS,
    ...w.rules,
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const r = await fetch(path)
  if (!r.ok) throw new Error(`Error cargando ${path}: ${r.status}`)
  return r.json() as Promise<T>
}

const EMPTY_STATE: GameData = {
  factions: [],
  datasheets: [],
  detachments: [],
  detachmentAbilities: [],
  stratagems: [],
  datasheetStratagems: {},
  armyRulesByFaction: {},
  armyRuleChaptersMap: {},
  pointsCosts: [],
  pointsCostMap: {},
  wargearCostMap: {},
  leaderMap: {},
  attachedMap: {},
  enhancements: [],
  datasheetEnhancements: {},
  datasheetOptions: {},
  datasheetDetachmentAbilities: {},
  sources: [],
  sourceMap: {},
  lastUpdate: '',
  coreRules: [],
  coreRulesMap: {},
  coreCombatEffects: [],
  loading: true,
  error: null,
}

export function useGameData(): GameData {
  const [state, setState] = useState<GameData>(EMPTY_STATE)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const factionsIndex = await fetchJson<{ id: string; name: string }[]>('/data/catalog/factions.json')
        const [catalog, ...factionJsons] = await Promise.all([
          fetchJson<CatalogJson>('/data/catalog/core-rules.json'),
          ...factionsIndex.map(f => fetchJson<FactionJson>(`/data/factions/${f.id}.json`)),
        ])
        if (cancelled) return

        const factions: Faction[] = factionsIndex

        const datasheets: Datasheet[] = []
        const detachments: Detachment[] = []
        const detachmentAbilities: DetachmentAbility[] = []
        const stratagems: Stratagem[] = [...catalog.coreStratagems]
        const enhancements: Enhancement[] = []
        const armyRulesByFaction: Record<string, Ability[]> = {}
        const armyRuleChapters: Record<string, Set<string>> = {}
        const datasheetStratagems: Record<string, string[]> = {}
        const datasheetEnhancements: Record<string, string[]> = {}
        const datasheetOptions: Record<string, UnitOption[]> = {}
        const datasheetDetachmentAbilities: Record<string, string[]> = {}
        const leaderMap: Record<string, string[]> = {}
        const attachedMap: Record<string, string[]> = {}
        const pointsCosts: PointsCost[] = []
        const pointsCostMap: Record<string, PointsCost[]> = {}
        const wargearCostMap: Record<string, WargearCost[]> = {}

        for (const fj of factionJsons) {
          armyRulesByFaction[fj.id] = fj.armyRules
          const armyRuleIdByName = new Map(fj.armyRules.map(ar => [ar.name, ar.id]))

          for (const det of fj.detachments) {
            detachments.push({
              id: det.id, factionId: fj.id, name: det.name, type: '',
              disposition: det.disposition, dp: det.dp, chapters: det.chapters,
            })
            for (const da of det.abilities) detachmentAbilities.push({ ...da, detachmentId: det.id })
          }
          for (const s of fj.stratagems) stratagems.push({ ...s, factionId: fj.id })
          for (const e of fj.enhancements) enhancements.push({ ...e, factionId: fj.id })

          for (const dsj of fj.datasheets) {
            const unitSlots = parseUnitSlots(dsj.unitComposition)
            const weaponOptionRules = parseWeaponOptionRules(dsj.options, unitSlots)

            datasheets.push({
              id: dsj.id,
              name: dsj.name,
              factionId: fj.id,
              sourceId: dsj.sourceId,
              role: dsj.role,
              loadout: dsj.loadout,
              isVirtual: dsj.isVirtual,
              // leader_head/leader_footer (the legacy CSV fallback these once mirrored) never
              // resolved to real datasheet ids even in the CSV pipeline — Datasheets_leader.csv
              // (canBeLedBy below) is the only source that actually works.
              leaderHead: [],
              leaderFooter: [],
              damagedW: dsj.damagedW,
              damagedDescription: dsj.damagedDescription,
              models: dsj.models,
              weapons: dsj.weapons.map(reconstructWeapon),
              abilities: dsj.abilities,
              keywords: dsj.keywords,
              factionKeywords: dsj.factionKeywords,
              unitComposition: dsj.unitComposition,
              modelCountMin: dsj.modelCountMin,
              modelCountMax: dsj.modelCountMax,
              defaultWeaponNames: dsj.defaultWeaponNames,
              unitSlots,
              weaponOptionRules,
            })

            datasheetOptions[dsj.id] = dsj.options
            if (dsj.stratagemIds.length) datasheetStratagems[dsj.id] = dsj.stratagemIds
            if (dsj.enhancementIds.length) datasheetEnhancements[dsj.id] = dsj.enhancementIds
            if (dsj.detachmentAbilityIds.length) datasheetDetachmentAbilities[dsj.id] = dsj.detachmentAbilityIds

            attachedMap[dsj.id] = dsj.canBeLedBy
            dsj.canBeLedBy.forEach(leaderId => {
              if (!leaderMap[leaderId]) leaderMap[leaderId] = []
              leaderMap[leaderId].push(dsj.id)
            })

            dsj.pointsCosts.forEach(p => {
              const entry: PointsCost = { datasheetId: dsj.id, description: p.description, points: p.points }
              pointsCosts.push(entry)
              if (!pointsCostMap[dsj.id]) pointsCostMap[dsj.id] = []
              pointsCostMap[dsj.id].push(entry)
            })
            dsj.wargearCosts.forEach(w => {
              if (!wargearCostMap[dsj.id]) wargearCostMap[dsj.id] = []
              wargearCostMap[dsj.id].push({ datasheetId: dsj.id, name: w.name, points: w.points })
            })

            // Chapter tagging for the SM army-rules filter (e.g. Templar Vows -> Black Templars):
            // any datasheet whose own Faction-type ability matches a known army rule gets that
            // rule tagged with its chapter keyword, defaulting to 'Space Marines' if it's a
            // plain Adeptus Astartes unit with no specific chapter keyword.
            const chapterKeyword = dsj.factionKeywords.find(k => (SM_CHAPTERS as readonly string[]).includes(k))
            for (const ab of dsj.abilities) {
              if (ab.type !== 'Faction') continue
              const arId = armyRuleIdByName.get(ab.name)
              if (!arId) continue
              if (!armyRuleChapters[arId]) armyRuleChapters[arId] = new Set()
              armyRuleChapters[arId].add(chapterKeyword ?? 'Space Marines')
            }
          }
        }

        const armyRuleChaptersMap: Record<string, string[]> = {}
        Object.entries(armyRuleChapters).forEach(([id, chapters]) => { armyRuleChaptersMap[id] = [...chapters] })

        const sources = catalog.sources
        const sourceMap: Record<string, Source> = {}
        sources.forEach(s => { sourceMap[s.id] = s })

        const coreRules = catalog.coreRules
        const coreRulesMap: Record<string, CoreRule> = {}
        coreRules.forEach(r => { coreRulesMap[r.name.toLowerCase()] = r })

        if (!cancelled) {
          setState({
            factions, datasheets, detachments, detachmentAbilities,
            stratagems, datasheetStratagems, armyRulesByFaction, armyRuleChaptersMap,
            pointsCosts, pointsCostMap, wargearCostMap,
            leaderMap, attachedMap,
            enhancements, datasheetEnhancements,
            datasheetOptions,
            datasheetDetachmentAbilities,
            sources, sourceMap,
            lastUpdate: catalog.lastUpdate,
            coreRules, coreRulesMap,
            coreCombatEffects: catalog.coreRuleEffects,
            loading: false, error: null,
          })
        }
      } catch (err) {
        if (!cancelled) setState(s => ({ ...s, loading: false, error: String(err) }))
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return state
}
