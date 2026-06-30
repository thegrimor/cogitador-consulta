import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import type {
  GameData, Faction, Detachment, DetachmentAbility, Stratagem, Datasheet,
  ModelProfile, Weapon, Ability, AntiEntry, Enhancement, UnitOption, Source, CoreRule,
  PointsCost, WargearCost,
  RawFaction, RawDatasheet, RawDatasheetModel, RawDatasheetWargear,
  RawDatasheetAbility, RawAbility, RawDetachment, RawDetachmentAbility,
  RawStratagem, RawDatasheetStratagem, RawDatasheetKeyword, RawDatasheetUnitComposition,
  RawModelCost, RawWargearCost, RawDatasheetLeader, RawEnhancement, RawDatasheetEnhancement,
  RawDatasheetOption, RawDatasheetDetachmentAbility, RawSource, RawCoreRule,
} from '@/types'
import { parseUnitSlots, parseWeaponOptionRules } from '@/core/utils/weaponOptions'

function parseCsvRaw(text: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    delimiter: '|',
    skipEmptyLines: true,
    dynamicTyping: false,
  })
  return result.data
}

function groupBy<T>(rows: T[], key: keyof T): Record<string, T[]> {
  const map: Record<string, T[]> = {}
  for (const row of rows) {
    const k = String(row[key])
    if (!map[k]) map[k] = []
    map[k].push(row)
  }
  return map
}

function splitIds(raw: string): string[] {
  if (!raw) return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '')
}

function parseDefaultWeaponNames(loadout: string): string[] {
  const clean = stripHtml(loadout)
  const names: string[] = []
  const RE = /equipped with:\s*([^.]+)/gi
  let m: RegExpExecArray | null
  while ((m = RE.exec(clean)) !== null) {
    const parts = m[1]
      .split(';')
      .map(s => s.trim().toLowerCase().replace(/^\d+\s+/, ''))
      .filter(Boolean)
    names.push(...parts)
  }
  return [...new Set(names)]
}

function parseUnitCompositionRange(lines: string[]): { min: number; max: number } {
  const orIdx = lines.findIndex(l => stripHtml(l).trim().toUpperCase() === 'OR')
  const relevant = orIdx >= 0 ? lines.slice(0, orIdx) : lines
  let totalMin = 0
  let totalMax = 0
  for (const line of relevant) {
    const clean = stripHtml(line)
    const rangeMatch = clean.match(/(\d+)\s*-\s*(\d+)/)
    if (rangeMatch) {
      totalMin += parseInt(rangeMatch[1])
      totalMax += parseInt(rangeMatch[2])
    } else {
      const nums = clean.match(/\d+/g)
      if (nums) {
        const sum = nums.reduce((s, n) => s + parseInt(n), 0)
        totalMin += sum
        totalMax += sum
      }
    }
  }
  return { min: Math.max(1, totalMin), max: Math.max(1, totalMax) }
}

function parseRapidFire(desc: string): string {
  const m = desc.match(/rapid fire (\d+|d\d+(?:[+\-]\d+)?)/i)
  return m ? m[1].toUpperCase() : ''
}

function parseSustainedHits(desc: string): number {
  const m = desc.match(/sustained hits (\d+|d\d+)/i)
  if (!m) return 0
  const val = parseInt(m[1])
  if (!isNaN(val)) return val
  if (m[1].toUpperCase() === 'D3') return 2
  if (m[1].toUpperCase() === 'D6') return 3.5
  return 0
}

function parseAntiEntries(desc: string): AntiEntry[] {
  const RE = /anti-([\w][\w ]*?)\s+(\d)\+/gi
  const entries: AntiEntry[] = []
  let m: RegExpExecArray | null
  while ((m = RE.exec(desc)) !== null) {
    entries.push({ keyword: m[1].toLowerCase().trim(), threshold: parseInt(m[2]) })
  }
  return entries
}

function parseWeapon(raw: RawDatasheetWargear): Weapon {
  const desc = (raw.description ?? '').toLowerCase()
  return {
    line: parseInt(raw.line) || 0,
    name: raw.name,
    description: raw.description,
    range: raw.range,
    type: raw.type,
    A: raw.A,
    bsWs: raw.BS_WS,
    S: parseInt(raw.S) || 0,
    AP: parseInt(raw.AP) || 0,
    D: raw.D,
    isTorrent: desc.includes('torrent'),
    isBlast: desc.includes('blast'),
    isDevastatingWounds: desc.includes('devastating wounds'),
    isLethalHits: desc.includes('lethal hits'),
    isHeavy: /\bheavy\b/.test(desc),
    isTwinLinked: desc.includes('twin-linked'),
    isMelta: /\bmelta\s+\d+/i.test(desc),
    meltaValue: parseInt(desc.match(/\bmelta\s+(\d+)/i)?.[1] ?? '0') || 0,
    cleaveValue: parseInt(desc.match(/\bcleave\s+(\d+)/i)?.[1] ?? '0') || 0,
    sustainedHitsValue: parseSustainedHits(desc),
    antiEntries: parseAntiEntries(desc),
    isIgnoresCover: desc.includes('ignores cover'),
    isHazardous: desc.includes('hazardous'),
    isAssault: /\bassault\b/.test(desc),
    isPistol: /\bpistol\b/.test(desc),
    isPsychic: /\bpsychic\b/.test(desc),
    isPrecision: desc.includes('precision'),
    isOneShot: desc.includes('one shot'),
    isIndirectFire: desc.includes('indirect fire'),
    isExtraAttacks: desc.includes('extra attacks'),
    isLance: /\blance\b/.test(desc),
    rapidFireValue: parseRapidFire(desc),
  }
}

function parseModel(raw: RawDatasheetModel): ModelProfile {
  return {
    line: parseInt(raw.line) || 0,
    name: raw.name,
    M: raw.M,
    T: parseInt(raw.T) || 0,
    Sv: raw.Sv,
    invSv: raw.inv_sv || '',
    W: parseInt(raw.W) || 0,
    Ld: raw.Ld,
    OC: parseInt(raw.OC) || 0,
    baseSize: raw.base_size,
  }
}

function resolveAbility(
  row: RawDatasheetAbility,
  abilitiesMap: Record<string, RawAbility>,
): Ability | null {
  const type = row.type as 'Core' | 'Faction' | 'Datasheet'
  if (row.name) {
    return { name: row.name, description: row.description, type, model: row.model || undefined }
  }
  const ref = abilitiesMap[row.ability_id]
  if (!ref) return null
  return { name: ref.name, description: ref.description, type }
}

function enrichDatasheet(
  raw: RawDatasheet,
  modelsByDs: Record<string, RawDatasheetModel[]>,
  wargearByDs: Record<string, RawDatasheetWargear[]>,
  abilitiesByDs: Record<string, RawDatasheetAbility[]>,
  keywordsByDs: Record<string, RawDatasheetKeyword[]>,
  compByDs: Record<string, RawDatasheetUnitComposition[]>,
  abilitiesMap: Record<string, RawAbility>,
  optionsByDs: Record<string, UnitOption[]>,
): Datasheet {
  const models = (modelsByDs[raw.id] ?? [])
    .sort((a, b) => parseInt(a.line) - parseInt(b.line))
    .map(parseModel)

  const weapons = (wargearByDs[raw.id] ?? [])
    .sort((a, b) => parseInt(a.line) - parseInt(b.line))
    .map(parseWeapon)

  const abilities: Ability[] = (abilitiesByDs[raw.id] ?? [])
    .sort((a, b) => parseInt(a.line) - parseInt(b.line))
    .map(row => resolveAbility(row, abilitiesMap))
    .filter((a): a is Ability => a !== null)

  const kwRows = keywordsByDs[raw.id] ?? []
  const keywords = kwRows
    .filter(k => k.is_faction_keyword !== 'true' && k.is_faction_keyword !== '1')
    .map(k => k.keyword)
  const factionKeywords = kwRows
    .filter(k => k.is_faction_keyword === 'true' || k.is_faction_keyword === '1')
    .map(k => k.keyword)

  const unitComposition = (compByDs[raw.id] ?? [])
    .sort((a, b) => parseInt(a.line) - parseInt(b.line))
    .map(c => c.description)

  const { min: modelCountMin, max: modelCountMax } = parseUnitCompositionRange(unitComposition)
  const defaultWeaponNames = parseDefaultWeaponNames(raw.loadout || '')

  const unitSlots = parseUnitSlots(unitComposition)
  const weaponOptionRules = parseWeaponOptionRules(optionsByDs[raw.id] ?? [], unitSlots)

  return {
    id: raw.id,
    name: raw.name,
    factionId: raw.faction_id,
    sourceId: raw.source_id || '',
    role: raw.role,
    legend: raw.legend,
    loadout: raw.loadout,
    isVirtual: raw.virtual === 'true' || raw.virtual === '1',
    leaderHead: splitIds(raw.leader_head),
    leaderFooter: splitIds(raw.leader_footer),
    damagedW: parseInt(raw.damaged_w) || 0,
    damagedDescription: raw.damaged_description || '',
    models,
    weapons,
    abilities,
    keywords,
    factionKeywords,
    unitComposition,
    modelCountMin,
    modelCountMax,
    defaultWeaponNames,
    unitSlots,
    weaponOptionRules,
  }
}

const CSV_FILES = [
  'Factions',
  'Datasheets',
  'Datasheets_models',
  'Datasheets_wargear',
  'Datasheets_abilities',
  'Abilities',
  'Detachments',
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
        const rawDetachAbils               = rows[7]  as unknown as RawDetachmentAbility[]
        const rawStratagems                = rows[8]  as unknown as RawStratagem[]
        const rawDsStratagems              = rows[9]  as unknown as RawDatasheetStratagem[]
        const rawKeywords                  = rows[10] as unknown as RawDatasheetKeyword[]
        const rawCompositions              = rows[11] as unknown as RawDatasheetUnitComposition[]
        const rawModelCosts                = rows[12] as unknown as RawModelCost[]
        const rawWargearCosts              = rows[13] as unknown as RawWargearCost[]
        const rawLeaders                   = rows[14] as unknown as RawDatasheetLeader[]
        const rawEnhancements              = rows[15] as unknown as RawEnhancement[]
        const rawDsEnhancements            = rows[16] as unknown as RawDatasheetEnhancement[]
        const rawDsOptions                 = rows[17] as unknown as RawDatasheetOption[]
        const rawDsDetachAbils             = rows[18] as unknown as RawDatasheetDetachmentAbility[]
        const rawSources                   = rows[19] as unknown as RawSource[]
        const rawLastUpdate                = rows[20] as unknown as { last_update: string }[]
        const rawCoreRules                 = rows[21] as unknown as RawCoreRule[]

        // ── abilitiesMap (last-write-wins per id, used for datasheet ability lookup) ──
        const abilitiesMap: Record<string, RawAbility> = {}
        rawAbilities.forEach(a => { abilitiesMap[a.id] = a })

        // ── armyRulesByFaction: derived from Datasheets_abilities type=Faction ──
        const datasheetFactionMap: Record<string, string> = {}
        rawDatasheets.forEach(ds => { datasheetFactionMap[ds.id] = ds.faction_id })

        const armyRulesByFaction: Record<string, RawAbility[]> = {}
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
        const detachments: Detachment[] = rawDetachments
          .filter(d => d.type === '')
          .map(d => ({
            id: d.id,
            factionId: d.faction_id,
            name: d.name,
            legend: d.legend,
            type: d.type,
            disposition: d.disposition ?? '',
            dp: parseInt(d.dp ?? '0', 10) || 0,
          }))

        // ── detachmentAbilities ───────────────────────────────────────────────
        const detachmentAbilities: DetachmentAbility[] = rawDetachAbils.map(da => ({
          id: da.id, detachmentId: da.detachment_id, name: da.name,
          description: da.description, legend: da.legend,
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
          legend: e.legend,
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

        if (!cancelled) {
          setState({
            factions, datasheets, detachments, detachmentAbilities,
            stratagems, datasheetStratagems, abilitiesMap, armyRulesByFaction,
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
