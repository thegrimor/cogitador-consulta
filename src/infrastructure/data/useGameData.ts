import { useState, useEffect } from 'react'
import type {
  GameData, Faction, Detachment, DetachmentAbility, Stratagem,
  Enhancement, Source, CoreRule, UnitOption,
  PointsCost, WargearCost,
  RawFaction, RawDatasheet, RawDatasheetModel, RawDatasheetWargear,
  RawDatasheetAbility, RawAbility, RawDetachment, RawDetachmentChapter, RawDetachmentAbility,
  RawStratagem, RawDatasheetStratagem, RawDatasheetKeyword, RawDatasheetUnitComposition,
  RawModelCost, RawWargearCost, RawDatasheetLeader, RawEnhancement, RawDatasheetEnhancement,
  RawDatasheetOption, RawDatasheetDetachmentAbility, RawSource, RawCoreRule,
} from '@/types'
import { parseCsvRaw, groupBy, enrichDatasheet } from './csvParsers'
import { SM_CHAPTERS } from '@/core/constants/chapters'

const CSV_FILES = [
  'Factions',
  'Datasheets',
  'Datasheets_models',
  'Datasheets_wargear',
  'Datasheets_abilities',
  'Abilities',
  'Detachments',
  'Detachments_chapters',
  'Detachment_abilities',
  'Stratagems',
  'Datasheets_stratagems',
  'Datasheets_keywords',
  'Datasheets_unit_composition',
  'Datasheets_models_cost',
  'Datasheets_wargear_cost',
  'Datasheets_leader',
  'Enhancements',
  'Datasheets_enhancements',
  'Datasheets_options',
  'Datasheets_detachment_abilities',
  'Source',
  'Last_update',
  'CoreRules',
]

export function useGameData(): GameData {
  const [state, setState] = useState<GameData>({
    factions: [],
    datasheets: [],
    detachments: [],
    detachmentAbilities: [],
    stratagems: [],
    datasheetStratagems: {},
    abilitiesMap: {},
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
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const texts = await Promise.all(
          CSV_FILES.map(f =>
            fetch(`/data/${f}.csv`).then(r => {
              if (!r.ok) throw new Error(`Error cargando ${f}.csv: ${r.status}`)
              return r.text()
            }),
          ),
        )
        if (cancelled) return

        const rows = texts.map(parseCsvRaw)
        const rawFactions                  = rows[0]  as unknown as RawFaction[]
        const rawDatasheets                = rows[1]  as unknown as RawDatasheet[]
        const rawModels                    = rows[2]  as unknown as RawDatasheetModel[]
        const rawWargear                   = rows[3]  as unknown as RawDatasheetWargear[]
        const rawDsAbilities               = rows[4]  as unknown as RawDatasheetAbility[]
        const rawAbilities                 = rows[5]  as unknown as RawAbility[]
        const rawDetachments               = rows[6]  as unknown as RawDetachment[]
        const rawDetachmentChapters        = rows[7]  as unknown as RawDetachmentChapter[]
        const rawDetachAbils               = rows[8]  as unknown as RawDetachmentAbility[]
        const rawStratagems                = rows[9]  as unknown as RawStratagem[]
        const rawDsStratagems              = rows[10] as unknown as RawDatasheetStratagem[]
        const rawKeywords                  = rows[11] as unknown as RawDatasheetKeyword[]
        const rawCompositions              = rows[12] as unknown as RawDatasheetUnitComposition[]
        const rawModelCosts                = rows[13] as unknown as RawModelCost[]
        const rawWargearCosts              = rows[14] as unknown as RawWargearCost[]
        const rawLeaders                   = rows[15] as unknown as RawDatasheetLeader[]
        const rawEnhancements              = rows[16] as unknown as RawEnhancement[]
        const rawDsEnhancements            = rows[17] as unknown as RawDatasheetEnhancement[]
        const rawDsOptions                 = rows[18] as unknown as RawDatasheetOption[]
        const rawDsDetachAbils             = rows[19] as unknown as RawDatasheetDetachmentAbility[]
        const rawSources                   = rows[20] as unknown as RawSource[]
        const rawLastUpdate                = rows[21] as unknown as { last_update: string }[]
        const rawCoreRules                 = rows[22] as unknown as RawCoreRule[]

        // ── abilitiesMap (last-write-wins per id, used for datasheet ability lookup) ──
        const abilitiesMap: Record<string, RawAbility> = {}
        rawAbilities.forEach(a => { abilitiesMap[a.id] = a })

        // ── armyRulesByFaction: derived from Datasheets_abilities type=Faction ──
        const datasheetFactionMap: Record<string, string> = {}
        rawDatasheets.forEach(ds => { datasheetFactionMap[ds.id] = ds.faction_id })

        // Quick chapter lookup per datasheet (SM only) so army rules can be tagged
        // with which chapter(s) actually use them (e.g. Templar Vows -> Black Templars).
        const chapterByDatasheet: Record<string, string> = {}
        rawKeywords.forEach(k => {
          if (k.is_faction_keyword !== 'true' && k.is_faction_keyword !== '1') return
          if ((SM_CHAPTERS as readonly string[]).includes(k.keyword)) chapterByDatasheet[k.datasheet_id] = k.keyword
        })

        const armyRulesByFaction: Record<string, RawAbility[]> = {}
        const armyRuleChapters: Record<string, Set<string>> = {}
        const seenByFaction: Record<string, Set<string>> = {}
        rawDsAbilities
          .filter(a => a.type === 'Faction' && a.ability_id)
          .forEach(a => {
            const factionId = datasheetFactionMap[a.datasheet_id]
            if (!factionId) return
            if (!seenByFaction[factionId]) {
              seenByFaction[factionId] = new Set()
              armyRulesByFaction[factionId] = []
            }
            if (!seenByFaction[factionId].has(a.ability_id)) {
              seenByFaction[factionId].add(a.ability_id)
              const ability = abilitiesMap[a.ability_id]
              if (ability) armyRulesByFaction[factionId].push(ability)
            }
            if (!armyRuleChapters[a.ability_id]) armyRuleChapters[a.ability_id] = new Set()
            armyRuleChapters[a.ability_id].add(chapterByDatasheet[a.datasheet_id] ?? 'Space Marines')
          })

        // ── group helpers ─────────────────────────────────────────────────────
        const modelsByDs   = groupBy(rawModels, 'datasheet_id')
        const wargearByDs  = groupBy(rawWargear, 'datasheet_id')
        const abilsByDs    = groupBy(rawDsAbilities, 'datasheet_id')
        const keywordsByDs = groupBy(rawKeywords, 'datasheet_id')
        const compByDs     = groupBy(rawCompositions, 'datasheet_id')

        // ── datasheetOptions (filtering out wahapedia's "None" placeholder rows) ──
        const validDsOptions = rawDsOptions.filter(r => r.description?.trim().toLowerCase() !== 'none')
        const optionsByDs: Record<string, UnitOption[]> = {}
        validDsOptions.forEach(r => {
          if (!optionsByDs[r.datasheet_id]) optionsByDs[r.datasheet_id] = []
          optionsByDs[r.datasheet_id].push({
            line: parseInt(r.line) || 0,
            button: r.button,
            description: r.description,
          })
        })

        // ── datasheetStratagems ───────────────────────────────────────────────
        const datasheetStratagems: Record<string, string[]> = {}
        rawDsStratagems.forEach(row => {
          if (!datasheetStratagems[row.datasheet_id]) datasheetStratagems[row.datasheet_id] = []
          datasheetStratagems[row.datasheet_id].push(row.stratagem_id)
        })

        // ── datasheets (Legends units excluded — not used in matched play) ────
        const legendSourceIds = new Set(
          rawSources.filter(s => /legends/i.test(s.name)).map(s => s.id),
        )
        const datasheets = rawDatasheets
          .filter(ds => !legendSourceIds.has(ds.source_id))
          .map(ds =>
            enrichDatasheet(ds, modelsByDs, wargearByDs, abilsByDs, keywordsByDs, compByDs, abilitiesMap, optionsByDs),
          )

        // ── factions ──────────────────────────────────────────────────────────
        // Drop factions with no datasheets (empty placeholders) and "Unaligned
        // Forces" (generic terrain/fortifications, not a playable army).
        const factionIdsWithDatasheets = new Set(datasheets.map(d => d.factionId))
        const EXCLUDED_FACTION_IDS = new Set(['UN'])
        const factions: Faction[] = [...rawFactions]
          .filter(f => factionIdsWithDatasheets.has(f.id) && !EXCLUDED_FACTION_IDS.has(f.id))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(f => ({ id: f.id, name: f.name }))

        // ── detachments ───────────────────────────────────────────────────────
        const chaptersByDetachment: Record<string, string[]> = {}
        rawDetachmentChapters.forEach(r => {
          if (!chaptersByDetachment[r.detachment_id]) chaptersByDetachment[r.detachment_id] = []
          chaptersByDetachment[r.detachment_id].push(r.chapter)
        })

        const detachments: Detachment[] = rawDetachments
          .filter(d => d.type === '')
          .map(d => ({
            id: d.id,
            factionId: d.faction_id,
            name: d.name,
            type: d.type,
            disposition: d.disposition ?? '',
            dp: parseInt(d.dp ?? '0', 10) || 0,
            chapters: chaptersByDetachment[d.id] ?? [],
          }))

        // ── detachmentAbilities ───────────────────────────────────────────────
        const detachmentAbilities: DetachmentAbility[] = rawDetachAbils.map(da => ({
          id: da.id, detachmentId: da.detachment_id, name: da.name,
          description: da.description,
        }))

        // ── stratagems ────────────────────────────────────────────────────────
        const stratagems: Stratagem[] = rawStratagems.map(s => ({
          id: s.id, name: s.name, factionId: s.faction_id, detachmentId: s.detachment_id,
          cpCost: parseInt(s.cp_cost) || 1, type: s.type, turn: s.turn,
          phase: s.phase, description: s.description,
        }))

        // ── points costs ──────────────────────────────────────────────────────
        const pointsCosts: PointsCost[] = rawModelCosts.map(r => ({
          datasheetId: r.datasheet_id,
          description: r.description,
          points: parseInt(r.cost) || 0,
        }))
        const pointsCostMap: Record<string, PointsCost[]> = {}
        pointsCosts.forEach(p => {
          if (!pointsCostMap[p.datasheetId]) pointsCostMap[p.datasheetId] = []
          pointsCostMap[p.datasheetId].push(p)
        })

        // ── wargear surcharges (per-weapon point costs) ─────────────────────────
        const wargearCostMap: Record<string, WargearCost[]> = {}
        rawWargearCosts.forEach(r => {
          const w: WargearCost = { datasheetId: r.datasheet_id, name: r.name, points: parseInt(r.cost) || 0 }
          if (!wargearCostMap[w.datasheetId]) wargearCostMap[w.datasheetId] = []
          wargearCostMap[w.datasheetId].push(w)
        })

        // ── leader maps ───────────────────────────────────────────────────────
        const leaderMap: Record<string, string[]> = {}
        const attachedMap: Record<string, string[]> = {}
        rawLeaders.forEach(r => {
          if (!leaderMap[r.leader_id]) leaderMap[r.leader_id] = []
          leaderMap[r.leader_id].push(r.attached_id)
          if (!attachedMap[r.attached_id]) attachedMap[r.attached_id] = []
          attachedMap[r.attached_id].push(r.leader_id)
        })

        // ── enhancements ──────────────────────────────────────────────────────
        const enhancements: Enhancement[] = rawEnhancements.map(e => ({
          id: e.id,
          factionId: e.faction_id,
          name: e.name,
          cost: parseInt(e.cost) || 0,
          detachmentId: e.detachment_id,
          detachmentName: e.detachment,
          description: e.description,
        }))
        const datasheetEnhancements: Record<string, string[]> = {}
        rawDsEnhancements.forEach(r => {
          if (!datasheetEnhancements[r.datasheet_id]) datasheetEnhancements[r.datasheet_id] = []
          datasheetEnhancements[r.datasheet_id].push(r.enhancement_id)
        })

        // ── datasheetDetachmentAbilities ──────────────────────────────────────
        const datasheetDetachmentAbilities: Record<string, string[]> = {}
        rawDsDetachAbils.forEach(r => {
          if (!datasheetDetachmentAbilities[r.datasheet_id]) datasheetDetachmentAbilities[r.datasheet_id] = []
          datasheetDetachmentAbilities[r.datasheet_id].push(r.detachment_ability_id)
        })

        // ── sources ───────────────────────────────────────────────────────────
        const sources: Source[] = rawSources.map(s => ({
          id: s.id,
          name: s.name,
          type: s.type,
          edition: parseInt(s.edition) || 10,
          version: s.version,
          errataDate: s.errata_date,
          errataLink: s.errata_link,
        }))
        const sourceMap: Record<string, Source> = {}
        sources.forEach(s => { sourceMap[s.id] = s })

        // ── lastUpdate ────────────────────────────────────────────────────────
        const lastUpdate = rawLastUpdate[0]?.last_update ?? ''

        // ── coreRules ─────────────────────────────────────────────────────────
        const coreRules: CoreRule[] = rawCoreRules.map(r => ({
          id: r.id,
          name: r.name,
          category: r.category as CoreRule['category'],
          summary: r.summary,
          description: r.description,
        }))

        // Also fold in Core unit abilities from Abilities.csv (faction_id empty),
        // skipping any whose name is already covered by CoreRules.csv entries above.
        const coreRuleNameSet = new Set(coreRules.map(r => r.name.toLowerCase()))
        rawAbilities
          .filter(a => !a.faction_id && !coreRuleNameSet.has(a.name.toLowerCase()))
          .forEach(a => {
            coreRules.push({
              id: a.id,
              name: a.name,
              category: 'unit_ability',
              summary: '',
              description: a.description,
            })
          })

        const coreRulesMap: Record<string, CoreRule> = {}
        coreRules.forEach(r => {
          coreRulesMap[r.name.toLowerCase()] = r
        })

        const armyRuleChaptersMap: Record<string, string[]> = {}
        Object.entries(armyRuleChapters).forEach(([abilityId, chapters]) => {
          armyRuleChaptersMap[abilityId] = [...chapters]
        })

        if (!cancelled) {
          setState({
            factions, datasheets, detachments, detachmentAbilities,
            stratagems, datasheetStratagems, abilitiesMap, armyRulesByFaction, armyRuleChaptersMap,
            pointsCosts, pointsCostMap, wargearCostMap,
            leaderMap, attachedMap,
            enhancements, datasheetEnhancements,
            datasheetOptions: optionsByDs,
            datasheetDetachmentAbilities,
            sources, sourceMap,
            lastUpdate,
            coreRules, coreRulesMap,
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
