/**
 * Genera public/data/factions/<slug>.json + public/data/catalog/*.json a partir de los
 * CSV actuales (public/data/*.csv, ya con las correcciones de MFM aplicadas) y de las
 * reglas de combate hoy en src/features/mathhammer/data/modifiers.ts.
 *
 * Piloto: solo procesa la facción Adeptus Custodes (AC) + las entradas universales
 * (sin faction_id) que van al catálogo compartido. No toca useGameData.ts ni ningún
 * archivo consumido por la app — solo produce JSON nuevo para revisión.
 *
 * Usage: npm run generate:faction-data
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCsvRaw, groupBy, enrichDatasheet } from '../src/infrastructure/data/csvParsers'
import type {
  RawFaction, RawDatasheet, RawDatasheetModel, RawDatasheetWargear, RawDatasheetAbility,
  RawAbility, RawDetachment, RawDetachmentChapter, RawDetachmentAbility, RawStratagem,
  RawDatasheetStratagem, RawDatasheetKeyword, RawDatasheetUnitComposition, RawModelCost,
  RawWargearCost, RawDatasheetLeader, RawEnhancement, RawDatasheetEnhancement,
  RawDatasheetOption, RawDatasheetDetachmentAbility, RawSource, RawCoreRule,
  Datasheet, UnitOption, Ability, Weapon,
} from '../src/types'
import { MODIFIER_RULES } from '../src/features/mathhammer/data/modifiers'
import type { ModifierRule, CombatModifiers } from '../src/features/mathhammer/types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'public', 'data')
const OUT_DIR = process.env.FACTION_DATA_OUT_DIR ?? DATA_DIR
const OUT_FACTIONS_DIR = path.join(OUT_DIR, 'factions')
const OUT_CATALOG_DIR = path.join(OUT_DIR, 'catalog')

const TARGET_FACTION = 'AC'

// ── CSV loading (mirrors useGameData.ts's CSV_FILES list, minus Last_update) ──────────

function readCsv<T>(name: string): T[] {
  const text = fs.readFileSync(path.join(DATA_DIR, `${name}.csv`), 'utf-8')
  return parseCsvRaw(text) as unknown as T[]
}

const rawFactions           = readCsv<RawFaction>('Factions')
const rawDatasheets          = readCsv<RawDatasheet>('Datasheets')
const rawModels              = readCsv<RawDatasheetModel>('Datasheets_models')
const rawWargear             = readCsv<RawDatasheetWargear>('Datasheets_wargear')
const rawDsAbilities         = readCsv<RawDatasheetAbility>('Datasheets_abilities')
const rawAbilities           = readCsv<RawAbility>('Abilities')
const rawDetachments         = readCsv<RawDetachment>('Detachments')
const rawDetachmentChapters  = readCsv<RawDetachmentChapter>('Detachments_chapters')
const rawDetachAbils         = readCsv<RawDetachmentAbility>('Detachment_abilities')
const rawStratagems          = readCsv<RawStratagem>('Stratagems')
const rawDsStratagems        = readCsv<RawDatasheetStratagem>('Datasheets_stratagems')
const rawKeywords            = readCsv<RawDatasheetKeyword>('Datasheets_keywords')
const rawCompositions        = readCsv<RawDatasheetUnitComposition>('Datasheets_unit_composition')
const rawModelCosts          = readCsv<RawModelCost>('Datasheets_models_cost')
const rawWargearCosts        = readCsv<RawWargearCost>('Datasheets_wargear_cost')
const rawLeaders             = readCsv<RawDatasheetLeader>('Datasheets_leader')
const rawEnhancements        = readCsv<RawEnhancement>('Enhancements')
const rawDsEnhancements      = readCsv<RawDatasheetEnhancement>('Datasheets_enhancements')
const rawDsOptions           = readCsv<RawDatasheetOption>('Datasheets_options')
const rawDsDetachAbils       = readCsv<RawDatasheetDetachmentAbility>('Datasheets_detachment_abilities')
const rawSources             = readCsv<RawSource>('Source')
const rawCoreRules           = readCsv<RawCoreRule>('CoreRules')

// ── Same enrichment pipeline useGameData.ts runs, kept identical on purpose ───────────

const abilitiesMap: Record<string, RawAbility> = {}
rawAbilities.forEach(a => { abilitiesMap[a.id] = a })

const datasheetFactionMap: Record<string, string> = {}
rawDatasheets.forEach(ds => { datasheetFactionMap[ds.id] = ds.faction_id })

const modelsByDs   = groupBy(rawModels, 'datasheet_id')
const wargearByDs  = groupBy(rawWargear, 'datasheet_id')
const abilsByDs    = groupBy(rawDsAbilities, 'datasheet_id')
const keywordsByDs = groupBy(rawKeywords, 'datasheet_id')
const compByDs     = groupBy(rawCompositions, 'datasheet_id')

const validDsOptions = rawDsOptions.filter(r => r.description?.trim().toLowerCase() !== 'none')
const optionsByDs: Record<string, UnitOption[]> = {}
validDsOptions.forEach(r => {
  if (!optionsByDs[r.datasheet_id]) optionsByDs[r.datasheet_id] = []
  optionsByDs[r.datasheet_id].push({ line: parseInt(r.line) || 0, button: r.button, description: r.description })
})

const legendSourceIds = new Set(rawSources.filter(s => /legends/i.test(s.name)).map(s => s.id))
const allDatasheets: Datasheet[] = rawDatasheets
  .filter(ds => !legendSourceIds.has(ds.source_id))
  .map(ds => enrichDatasheet(ds, modelsByDs, wargearByDs, abilsByDs, keywordsByDs, compByDs, abilitiesMap, optionsByDs))

// ── Slugs ──────────────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const usedSlugs = new Set<string>()

/** Deterministic slug with collision resolution: base -> base-<faction> -> base-<faction>-N. */
function makeSlug(name: string, factionSlug: string): string {
  const base = slugify(name)
  if (!usedSlugs.has(base)) { usedSlugs.add(base); return base }
  const withFaction = `${base}-${factionSlug}`
  if (!usedSlugs.has(withFaction)) { usedSlugs.add(withFaction); return withFaction }
  let n = 2
  while (usedSlugs.has(`${withFaction}-${n}`)) n++
  const finalSlug = `${withFaction}-${n}`
  usedSlugs.add(finalSlug)
  return finalSlug
}

const factionSlugByOldId = new Map<string, string>()
function factionSlugFor(oldFactionId: string): string {
  const cached = factionSlugByOldId.get(oldFactionId)
  if (cached) return cached
  const f = rawFactions.find(x => x.id === oldFactionId)
  const slug = f ? makeSlug(f.name, slugify(f.name)) : makeSlug(oldFactionId, oldFactionId.toLowerCase())
  factionSlugByOldId.set(oldFactionId, slug)
  return slug
}

const acFaction = rawFactions.find(f => f.id === TARGET_FACTION)
if (!acFaction) throw new Error(`No se encontró la facción ${TARGET_FACTION} en Factions.csv`)
export const acSlug = factionSlugFor(TARGET_FACTION)

// datasheet/detachment/stratagem/enhancement slugs, scoped to AC for this pilot
export const datasheetSlugByOldId = new Map<string, string>()
const detachmentSlugByOldId = new Map<string, string>()
const stratagemSlugByOldId = new Map<string, string>()
const enhancementSlugByOldId = new Map<string, string>()
const detachmentAbilitySlugByOldId = new Map<string, string>()

export const acDatasheets = allDatasheets.filter(d => d.factionId === TARGET_FACTION)
acDatasheets.forEach(d => datasheetSlugByOldId.set(d.id, makeSlug(d.name, acSlug)))

const acDetachments = rawDetachments.filter(d => d.faction_id === TARGET_FACTION && d.type === '')
acDetachments.forEach(d => detachmentSlugByOldId.set(d.id, makeSlug(d.name, acSlug)))

const acStratagems = rawStratagems.filter(s => s.faction_id === TARGET_FACTION)
const universalStratagems = rawStratagems.filter(s => !s.faction_id)
acStratagems.forEach(s => stratagemSlugByOldId.set(s.id, makeSlug(s.name, acSlug)))
universalStratagems.forEach(s => stratagemSlugByOldId.set(s.id, makeSlug(s.name, 'core')))

const acEnhancements = rawEnhancements.filter(e => e.faction_id === TARGET_FACTION)
acEnhancements.forEach(e => enhancementSlugByOldId.set(e.id, makeSlug(e.name, acSlug)))

const acDetachAbils = rawDetachAbils.filter(da => da.faction_id === TARGET_FACTION)
acDetachAbils.forEach(da => detachmentAbilitySlugByOldId.set(da.id, makeSlug(da.name, acSlug)))

// ── Text matching helpers for folding ModifierRule effects into named entities ────────

function normalizeText(s: string): string {
  // Tags like <span class="kwb">CHARACTER</span>, leave a stray space before the following
  // punctuation once stripped ("character , monster") — collapse that back so a rule's
  // hand-typed prose ("character, monster") still lines up with the source HTML.
  return s.replace(/<[^>]+>/g, ' ').replace(/[’]/g, "'").toLowerCase()
    .replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1').trim()
}

interface MatchCandidate { key: string; name: string; description: string }

/** Strips a trailing "— gloss" / "[Detail]" / "(cost)" annotation to recover the real name, e.g.
 * "WITCH HUNTERS [Lethal Hits] (1CP)" -> "witch hunters", "Martial Mastery — crítico 5+ (CaC)" -> "martial mastery". */
function extractRuleName(label: string): string {
  return label
    .split(/—|-{2,}/)[0]
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim()
    .toLowerCase()
}

function tryMatch(rule: ModifierRule, candidates: MatchCandidate[]): string | null {
  const labelPrefix = extractRuleName(rule.label)
  if (labelPrefix) {
    const byName = candidates.find(c => c.name.trim().toLowerCase() === labelPrefix)
    if (byName) return byName.key
  }
  if (rule.description && rule.description.length >= 20) {
    const ruleNorm = normalizeText(rule.description)
    const prefixLen = Math.min(80, ruleNorm.length)
    const rulePrefix = ruleNorm.slice(0, prefixLen)
    const byDesc = candidates.find(c => {
      const candNorm = normalizeText(c.description)
      if (!candNorm) return false
      return candNorm.includes(rulePrefix) || ruleNorm.includes(candNorm.slice(0, Math.min(80, candNorm.length)))
    })
    if (byDesc) return byDesc.key

    // Some hand-authored rules glue together two non-adjacent clauses from a longer ability
    // (e.g. a stance table where GW's own flavour paragraph sits between the stance name and
    // its mechanical effect). Require every clause to appear independently in the candidate,
    // rather than as one contiguous substring.
    const clauses = ruleNorm.split(/[:.]/).map(c => c.trim()).filter(c => c.length >= 12)
    if (clauses.length >= 2) {
      const byClauses = candidates.find(c => {
        const candNorm = normalizeText(c.description)
        return candNorm.length > 0 && clauses.every(clause => candNorm.includes(clause))
      })
      if (byClauses) return byClauses.key
    }
  }
  return null
}

interface EffectShape {
  combatType?: string
  target?: string
  requiresAntiKeyword?: string
  requiresTargetKeyword?: string
  requiresAttackerKeyword?: string
  bearerOnly?: boolean
  isStratagem?: boolean
  cpCost?: number
  effects: Partial<CombatModifiers>
}

function toEffectShape(rule: ModifierRule): EffectShape {
  const shape: EffectShape = { effects: rule.effects }
  if (rule.combatType) shape.combatType = rule.combatType
  if (rule.target) shape.target = rule.target
  if (rule.requiresAntiKeyword) shape.requiresAntiKeyword = rule.requiresAntiKeyword
  if (rule.requiresTargetKeyword) shape.requiresTargetKeyword = rule.requiresTargetKeyword
  if (rule.requiresAttackerKeyword) shape.requiresAttackerKeyword = rule.requiresAttackerKeyword
  if (rule.bearerOnly) shape.bearerOnly = true
  if (rule.isStratagem) shape.isStratagem = true
  if (rule.cpCost !== undefined) shape.cpCost = rule.cpCost
  return shape
}

interface FallbackEffect {
  sourceRuleId: string
  label: string
  description?: string
  effect: EffectShape
}

interface MatchReport {
  totalConsidered: number
  mergedIntoAbility: string[]
  mergedIntoDetachmentAbility: string[]
  mergedIntoStratagem: string[]
  mergedIntoEnhancement: string[]
  mergedIntoArmyRule: string[]
  fallback: string[]
  crossFactionLeadersOmitted: number
}

export const report: MatchReport = {
  totalConsidered: 0,
  mergedIntoAbility: [],
  mergedIntoDetachmentAbility: [],
  mergedIntoStratagem: [],
  mergedIntoEnhancement: [],
  mergedIntoArmyRule: [],
  fallback: [],
  crossFactionLeadersOmitted: 0,
}

// ── Army rules (Faction-type abilities), deduped, AC only ─────────────────────────────

interface OutAbility extends Ability {
  effect?: EffectShape
  options?: { name: string; effect?: EffectShape }[]
}

const armyRuleIds = new Set<string>()
const armyRules: OutAbility[] = []
rawDsAbilities
  .filter(a => a.type === 'Faction' && a.ability_id && datasheetFactionMap[a.datasheet_id] === TARGET_FACTION)
  .forEach(a => {
    if (armyRuleIds.has(a.ability_id)) return
    armyRuleIds.add(a.ability_id)
    const ref = abilitiesMap[a.ability_id]
    if (ref) armyRules.push({ name: ref.name, description: ref.description, type: 'Faction' })
  })

// ── Detachments (AC only) ──────────────────────────────────────────────────────────

const chaptersByDetachment: Record<string, string[]> = {}
rawDetachmentChapters.forEach(r => {
  if (!chaptersByDetachment[r.detachment_id]) chaptersByDetachment[r.detachment_id] = []
  chaptersByDetachment[r.detachment_id].push(r.chapter)
})

interface OutDetachmentAbility { id: string; name: string; description: string; effect?: EffectShape }
interface OutDetachment {
  id: string; name: string; disposition: string; dp: number; chapters: string[]
  abilities: OutDetachmentAbility[]
}

const detachments: OutDetachment[] = acDetachments.map(d => ({
  id: detachmentSlugByOldId.get(d.id)!,
  name: d.name,
  disposition: d.disposition ?? '',
  dp: parseInt(d.dp ?? '0', 10) || 0,
  chapters: chaptersByDetachment[d.id] ?? [],
  abilities: acDetachAbils
    .filter(da => da.detachment_id === d.id)
    .map(da => ({ id: detachmentAbilitySlugByOldId.get(da.id)!, name: da.name, description: da.description })),
}))

// ── Stratagems (AC-scoped only; Core ones go to the shared catalog) ───────────────────

interface OutStratagem {
  id: string; name: string; detachmentId: string | null
  cpCost: number; type: string; turn: string; phase: string; description: string
  effect?: EffectShape
}

function toOutStratagem(s: RawStratagem): OutStratagem {
  return {
    id: stratagemSlugByOldId.get(s.id)!,
    name: s.name,
    detachmentId: s.detachment_id ? (detachmentSlugByOldId.get(s.detachment_id) ?? null) : null,
    cpCost: parseInt(s.cp_cost) || 1,
    type: s.type,
    turn: s.turn,
    phase: s.phase,
    description: s.description,
  }
}

const acStratagemsOut: OutStratagem[] = acStratagems.map(s => toOutStratagem(s))
const coreStratagemsOut: OutStratagem[] = universalStratagems.map(s => toOutStratagem(s))

// ── Enhancements (AC only) ─────────────────────────────────────────────────────────

interface OutEnhancement {
  id: string; name: string; cost: number; detachmentId: string | null; detachmentName: string
  description: string; effect?: EffectShape
}

const enhancementsOut: OutEnhancement[] = acEnhancements.map(e => ({
  id: enhancementSlugByOldId.get(e.id)!,
  name: e.name,
  cost: parseInt(e.cost) || 0,
  detachmentId: e.detachment_id ? (detachmentSlugByOldId.get(e.detachment_id) ?? null) : null,
  detachmentName: e.detachment,
  description: e.description,
}))

// ── Fold MODIFIER_RULES into the entities above ───────────────────────────────────────

const acRules = MODIFIER_RULES.filter(r => r.factionId === TARGET_FACTION)
const universalRules = MODIFIER_RULES.filter(r => !r.factionId)

const armyRuleFallbacks: FallbackEffect[] = []
const pendingArmyRuleOptions = new Map<string, { name: string; effect: EffectShape }[]>()
const detachmentFallbacksById = new Map<string, FallbackEffect[]>()
const datasheetFallbacksById = new Map<string, FallbackEffect[]>()
const factionFallbacks: FallbackEffect[] = []

function pushFallback(list: FallbackEffect[], rule: ModifierRule) {
  list.push({ sourceRuleId: rule.id, label: rule.label, description: rule.description, effect: toEffectShape(rule) })
  report.fallback.push(rule.id)
}

/** Combines two EffectShapes for the "second half of the same ability" case (e.g. modifiers.ts
 * splits one ability into a described rule and a bare-label continuation with no description). */
function mergeEffectShapes(a: EffectShape, b: EffectShape): EffectShape {
  return { ...a, ...b, effects: { ...a.effects, ...b.effects } }
}

const lastMergedAbilityIndexByDatasheet = new Map<string, number>()

for (const rule of acRules) {
  report.totalConsidered++

  // 1. datasheetId (or leaderDatasheetId — an aura printed on the leading character's own
  //    sheet) → attach to a named ability on that datasheet, else datasheet.combatEffects[]
  const ownerDatasheetId = rule.datasheetId ?? rule.leaderDatasheetId
  if (ownerDatasheetId) {
    const ds = acDatasheets.find(d => d.id === ownerDatasheetId)
    if (!ds) { pushFallback(factionFallbacks, rule); continue }
    const dsSlug = datasheetSlugByOldId.get(ds.id)!
    const candidates: MatchCandidate[] = ds.abilities.map((a, i) => ({ key: String(i), name: a.name, description: a.description }))
    const matchKey = tryMatch(rule, candidates)
    if (matchKey !== null) {
      (ds.abilities[Number(matchKey)] as OutAbility).effect = toEffectShape(rule)
      report.mergedIntoAbility.push(`${dsSlug}::${ds.abilities[Number(matchKey)].name}`)
      lastMergedAbilityIndexByDatasheet.set(dsSlug, Number(matchKey))
    } else if (!rule.description && lastMergedAbilityIndexByDatasheet.has(dsSlug)) {
      // No description of its own — almost certainly the second half of the ability we just
      // matched for this same datasheet (e.g. a below-half-strength bonus tacked onto an aura).
      const priorIdx = lastMergedAbilityIndexByDatasheet.get(dsSlug)!
      const ability = ds.abilities[priorIdx] as OutAbility
      ability.effect = mergeEffectShapes(ability.effect!, toEffectShape(rule))
      report.mergedIntoAbility.push(`${dsSlug}::${ability.name} (continuación)`)
    } else {
      if (!datasheetFallbacksById.has(dsSlug)) datasheetFallbacksById.set(dsSlug, [])
      pushFallback(datasheetFallbacksById.get(dsSlug)!, rule)
    }
    continue
  }

  // 2. enhancementId → attach effect to that Enhancement directly (hard id match)
  if (rule.enhancementId) {
    const enh = enhancementsOut.find(e => e.id === enhancementSlugByOldId.get(rule.enhancementId!))
    if (enh) {
      enh.effect = toEffectShape(rule)
      report.mergedIntoEnhancement.push(enh.id)
    } else {
      pushFallback(factionFallbacks, rule)
    }
    continue
  }

  // 3. detachmentId, no datasheetId → try stratagem first (if isStratagem), else detachment ability
  if (rule.detachmentId) {
    const detSlug = detachmentSlugByOldId.get(rule.detachmentId)
    if (rule.isStratagem) {
      const candidates: MatchCandidate[] = acStratagemsOut
        .filter(s => s.detachmentId === detSlug)
        .map(s => ({ key: s.id, name: s.name, description: s.description }))
      const matchKey = tryMatch(rule, candidates)
      if (matchKey) {
        const strat = acStratagemsOut.find(s => s.id === matchKey)!
        strat.effect = toEffectShape(rule)
        report.mergedIntoStratagem.push(strat.id)
      } else {
        pushFallback(factionFallbacks, rule)
      }
      continue
    }
    const det = detachments.find(d => d.id === detSlug)
    if (det) {
      const candidates: MatchCandidate[] = det.abilities.map(a => ({ key: a.id, name: a.name, description: a.description }))
      const matchKey = tryMatch(rule, candidates)
      if (matchKey) {
        const ab = det.abilities.find(a => a.id === matchKey)!
        ab.effect = toEffectShape(rule)
        report.mergedIntoDetachmentAbility.push(ab.id)
      } else {
        if (!detachmentFallbacksById.has(det.id)) detachmentFallbacksById.set(det.id, [])
        pushFallback(detachmentFallbacksById.get(det.id)!, rule)
      }
    } else {
      pushFallback(factionFallbacks, rule)
    }
    continue
  }

  // 4. isStratagem, only factionId → match against AC stratagems with no detachment scope requirement
  if (rule.isStratagem) {
    const candidates: MatchCandidate[] = acStratagemsOut.map(s => ({ key: s.id, name: s.name, description: s.description }))
    const matchKey = tryMatch(rule, candidates)
    if (matchKey) {
      const strat = acStratagemsOut.find(s => s.id === matchKey)!
      strat.effect = toEffectShape(rule)
      report.mergedIntoStratagem.push(strat.id)
    } else {
      pushFallback(factionFallbacks, rule)
    }
    continue
  }

  // 5. only factionId → army rule (possibly one of several mutually-exclusive options, e.g. Ka'tah stances)
  const candidates: MatchCandidate[] = armyRules.map((a, i) => ({ key: String(i), name: a.name, description: a.description }))
  const matchKey = tryMatch(rule, candidates)
  if (matchKey !== null) {
    const ar = armyRules[Number(matchKey)]
    const optionName = rule.label.split(/—|-{2,}/)[0]?.replace(/\s*\([^)]*\)/g, '').trim() || rule.label
    if (!pendingArmyRuleOptions.has(matchKey)) pendingArmyRuleOptions.set(matchKey, [])
    pendingArmyRuleOptions.get(matchKey)!.push({ name: optionName, effect: toEffectShape(rule) })
    report.mergedIntoArmyRule.push(`${ar.name}::${optionName}`)
  } else {
    pushFallback(armyRuleFallbacks, rule)
  }
}

// A single matched rule becomes the army rule's own `effect`; two or more (mutually-exclusive
// stances, e.g. Martial Ka'tah) become `options[]`, each keeping its own real name.
for (const [key, options] of pendingArmyRuleOptions) {
  const ar = armyRules[Number(key)]
  if (options.length === 1) ar.effect = options[0].effect
  else ar.options = options
}

// Universal rules (no factionId at all) → shared core-rules catalog
interface CoreRuleOut { id: string; name: string; description?: string; effect: EffectShape }
const coreRuleEffects: CoreRuleOut[] = []
for (const rule of universalRules) {
  if (rule.isStratagem) {
    const candidates: MatchCandidate[] = coreStratagemsOut.map(s => ({ key: s.id, name: s.name, description: s.description }))
    const matchKey = tryMatch(rule, candidates)
    if (matchKey) {
      coreStratagemsOut.find(s => s.id === matchKey)!.effect = toEffectShape(rule)
      continue
    }
  }
  coreRuleEffects.push({
    id: rule.id.replace(/_/g, '-'),
    name: rule.label,
    description: rule.description,
    effect: toEffectShape(rule),
  })
}

// ── canBeLedBy (AC-only leaders; cross-faction leaders omitted for this pilot) ────────

function stripWeaponRuleDefaults(w: Weapon) {
  const { line, name, description, range, type, A, bsWs, S, AP, D, ...rest } = w
  const rules: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(rest)) {
    if (v === false || v === 0 || v === '' || (Array.isArray(v) && v.length === 0)) continue
    rules[k] = v
  }
  return { line, name, description, range, type, A, bsWs, S, AP, D, rules }
}

const datasheetsOut = acDatasheets.map(ds => {
  const dsSlug = datasheetSlugByOldId.get(ds.id)!
  const leaderOldIds = rawLeaders.filter(l => l.attached_id === ds.id).map(l => l.leader_id)
  const canBeLedBy: string[] = []
  for (const leaderId of leaderOldIds) {
    if (datasheetFactionMap[leaderId] === TARGET_FACTION && datasheetSlugByOldId.has(leaderId)) {
      canBeLedBy.push(datasheetSlugByOldId.get(leaderId)!)
    } else {
      report.crossFactionLeadersOmitted++
    }
  }

  const stratIds = (rawDsStratagems.filter(r => r.datasheet_id === ds.id).map(r => r.stratagem_id))
    .map(id => stratagemSlugByOldId.get(id)).filter((s): s is string => !!s)
  const enhIds = (rawDsEnhancements.filter(r => r.datasheet_id === ds.id).map(r => r.enhancement_id))
    .map(id => enhancementSlugByOldId.get(id)).filter((s): s is string => !!s)
  const detAbilIds = (rawDsDetachAbils.filter(r => r.datasheet_id === ds.id).map(r => r.detachment_ability_id))
    .map(id => detachmentAbilitySlugByOldId.get(id)).filter((s): s is string => !!s)
  const pointsCosts = rawModelCosts.filter(r => r.datasheet_id === ds.id)
    .map(r => ({ description: r.description, points: parseInt(r.cost) || 0 }))
  const wargearCosts = rawWargearCosts.filter(r => r.datasheet_id === ds.id)
    .map(r => ({ name: r.name, points: parseInt(r.cost) || 0 }))

  return {
    id: dsSlug,
    name: ds.name,
    role: ds.role,
    sourceId: ds.sourceId,
    isVirtual: ds.isVirtual,
    damagedW: ds.damagedW,
    damagedDescription: ds.damagedDescription,
    models: ds.models,
    weapons: ds.weapons.map(stripWeaponRuleDefaults),
    abilities: ds.abilities,
    keywords: ds.keywords,
    factionKeywords: ds.factionKeywords,
    unitComposition: ds.unitComposition,
    modelCountMin: ds.modelCountMin,
    modelCountMax: ds.modelCountMax,
    defaultWeaponNames: ds.defaultWeaponNames,
    options: (optionsByDs[ds.id] ?? []).map(o => ({ button: o.button, description: o.description })),
    pointsCosts,
    wargearCosts,
    stratagemIds: stratIds,
    enhancementIds: enhIds,
    detachmentAbilityIds: detAbilIds,
    canBeLedBy,
    combatEffects: datasheetFallbacksById.get(dsSlug),
  }
})

// ── Faction JSON output ───────────────────────────────────────────────────────────────

const factionOut = {
  id: acSlug,
  name: acFaction.name,
  armyRules: armyRules.map(ar => ({ name: ar.name, description: ar.description, effect: ar.effect, options: ar.options })),
  armyRuleCombatEffects: armyRuleFallbacks.length ? armyRuleFallbacks : undefined,
  detachments: detachments.map(d => ({
    ...d,
    combatEffects: detachmentFallbacksById.get(d.id),
  })),
  stratagems: acStratagemsOut,
  enhancements: enhancementsOut,
  datasheets: datasheetsOut,
  combatEffects: factionFallbacks.length ? factionFallbacks : undefined,
}

// ── Catalog output ─────────────────────────────────────────────────────────────────────

const factionIdsWithDatasheets = new Set(allDatasheets.map(d => d.factionId))
const EXCLUDED_FACTION_IDS = new Set(['UN'])
const factionsCatalog = rawFactions
  .filter(f => factionIdsWithDatasheets.has(f.id) && !EXCLUDED_FACTION_IDS.has(f.id))
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(f => ({ id: f.id === TARGET_FACTION ? acSlug : slugify(f.name), name: f.name }))

const coreRulesOut = rawCoreRules.map(r => ({
  id: r.id, name: r.name, category: r.category, summary: r.summary, description: r.description,
}))
const coreRuleNameSet = new Set(coreRulesOut.map(r => r.name.toLowerCase()))
rawAbilities
  .filter(a => !a.faction_id && !coreRuleNameSet.has(a.name.toLowerCase()))
  .forEach(a => coreRulesOut.push({ id: a.id, name: a.name, category: 'unit_ability', summary: '', description: a.description }))

const catalogOut = {
  coreRules: coreRulesOut,
  coreStratagems: coreStratagemsOut,
  coreRuleEffects,
}

// ── Write files ─────────────────────────────────────────────────────────────────────

fs.mkdirSync(OUT_FACTIONS_DIR, { recursive: true })
fs.mkdirSync(OUT_CATALOG_DIR, { recursive: true })
fs.writeFileSync(path.join(OUT_FACTIONS_DIR, `${acSlug}.json`), JSON.stringify(factionOut, null, 2))
fs.writeFileSync(path.join(OUT_CATALOG_DIR, 'factions.json'), JSON.stringify(factionsCatalog, null, 2))
fs.writeFileSync(path.join(OUT_CATALOG_DIR, 'core-rules.json'), JSON.stringify(catalogOut, null, 2))

// Dev-only sidecar report (not app data — read by scripts/verify-faction-data.ts).
const REPORT_DIR = process.env.FACTION_DATA_REPORT_DIR ?? path.join(__dirname, 'reports')
fs.mkdirSync(REPORT_DIR, { recursive: true })
fs.writeFileSync(path.join(REPORT_DIR, `${acSlug}.json`), JSON.stringify(report, null, 2))

// ── Report ──────────────────────────────────────────────────────────────────────────

console.log(`\n== Generación completa: ${acFaction.name} (${acSlug}) ==`)
console.log(`Datasheets: ${acDatasheets.length}`)
console.log(`Detachments: ${acDetachments.length}`)
console.log(`Stratagems propias: ${acStratagems.length} · universales: ${universalStratagems.length}`)
console.log(`Enhancements: ${acEnhancements.length}`)
console.log(`\n-- Fusión de modifiers.ts (${report.totalConsidered} reglas con factionId=AC) --`)
console.log(`  Fusionadas en ability de datasheet:        ${report.mergedIntoAbility.length}`)
console.log(`  Fusionadas en detachment ability:            ${report.mergedIntoDetachmentAbility.length}`)
console.log(`  Fusionadas en stratagem:                     ${report.mergedIntoStratagem.length}`)
console.log(`  Fusionadas en enhancement:                   ${report.mergedIntoEnhancement.length}`)
console.log(`  Fusionadas en army rule (options incluidas):  ${report.mergedIntoArmyRule.length}`)
console.log(`  Sin match de alta confianza (combatEffects[] de respaldo): ${report.fallback.length}`)
console.log(`  Líderes de otra facción omitidos en canBeLedBy: ${report.crossFactionLeadersOmitted}`)
if (report.fallback.length) {
  console.log('\n  Reglas en fallback (revisar):')
  for (const id of report.fallback) console.log(`    - ${id}`)
}
console.log(`\nEscrito: ${path.relative(process.cwd(), path.join(OUT_FACTIONS_DIR, `${acSlug}.json`))}`)
console.log(`Escrito: ${path.relative(process.cwd(), path.join(OUT_CATALOG_DIR, 'factions.json'))}`)
console.log(`Escrito: ${path.relative(process.cwd(), path.join(OUT_CATALOG_DIR, 'core-rules.json'))}`)
