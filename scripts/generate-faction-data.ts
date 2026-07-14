/**
 * Genera public/data/factions/<slug>.json + public/data/catalog/*.json a partir de los
 * CSV fuente (data-source/*.csv, ya con las correcciones de MFM aplicadas) y de las
 * reglas de combate hoy en src/features/mathhammer/data/modifiers.ts.
 *
 * Procesa todas las facciones jugables (excluye "Unaligned Forces" y cualquiera sin
 * datasheets, igual que useGameData.ts hoy) en una sola pasada, con un registro de slugs
 * compartido para que las referencias cross-facción (p. ej. un Inquisidor liderando una
 * unidad de Adeptus Custodes) resuelvan a slugs finales y estables desde el principio.
 *
 * No toca useGameData.ts ni ningún archivo consumido por la app — solo produce JSON
 * nuevo para revisión (ver scripts/verify-faction-data.ts).
 *
 * Usage: npm run generate:faction-data
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCsvRaw, groupBy, enrichDatasheet, slugify } from '../src/infrastructure/data/csvParsers'
import type {
  RawFaction, RawDatasheet, RawDatasheetModel, RawDatasheetWargear, RawDatasheetAbility,
  RawAbility, RawDetachment, RawDetachmentChapter, RawDetachmentAbility, RawStratagem,
  RawDatasheetStratagem, RawDatasheetKeyword, RawDatasheetUnitComposition, RawModelCost,
  RawWargearCost, RawDatasheetLeader, RawEnhancement, RawDatasheetEnhancement,
  RawDatasheetOption, RawDatasheetDetachmentAbility, RawSource, RawCoreRule,
  Datasheet, UnitOption, Ability, Weapon, CombatEffect,
} from '../src/types'
import { MODIFIER_RULES } from '../src/features/mathhammer/data/modifiers'
import type { ModifierRule } from '../src/features/mathhammer/types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data-source')
const OUT_DIR = process.env.FACTION_DATA_OUT_DIR ?? path.join(__dirname, '..', 'public', 'data')
const OUT_FACTIONS_DIR = path.join(OUT_DIR, 'factions')
const OUT_CATALOG_DIR = path.join(OUT_DIR, 'catalog')
const REPORT_DIR = process.env.FACTION_DATA_REPORT_DIR ?? path.join(__dirname, 'reports')

const EXCLUDED_FACTION_IDS = new Set(['UN'])

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
const rawLastUpdate          = readCsv<{ last_update: string }>('Last_update')

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

export const datasheetsByOldId = new Map<string, Datasheet>(allDatasheets.map(d => [d.id, d]))

// Drop factions with no datasheets (empty placeholders) and "Unaligned Forces" — matches
// useGameData.ts's own faction filter today.
const factionIdsWithDatasheets = new Set(allDatasheets.map(d => d.factionId))
const playableFactions = rawFactions
  .filter(f => factionIdsWithDatasheets.has(f.id) && !EXCLUDED_FACTION_IDS.has(f.id))
  .sort((a, b) => a.name.localeCompare(b.name))

// ── Slugs (one shared registry across every faction, so cross-faction references —
//    e.g. an Inquisitor leading an Adeptus Custodes unit — resolve to final, stable
//    slugs immediately instead of needing a later re-run). slugify() itself lives in
//    csvParsers.ts (shared with per-ability ids assigned in enrichDatasheet). ─────────

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

export const datasheetSlugByOldId = new Map<string, string>()
const detachmentSlugByOldId = new Map<string, string>()
const stratagemSlugByOldId = new Map<string, string>()
const enhancementSlugByOldId = new Map<string, string>()
const detachmentAbilitySlugByOldId = new Map<string, string>()

/** Slug for a datasheet, resolving it lazily on first reference regardless of which
 * faction's turn it is in the loop — needed for cross-faction leader/attachment links. */
function datasheetSlugFor(oldId: string): string | undefined {
  const cached = datasheetSlugByOldId.get(oldId)
  if (cached) return cached
  const ds = datasheetsByOldId.get(oldId)
  if (!ds) return undefined
  const slug = makeSlug(ds.name, factionSlugFor(ds.factionId))
  datasheetSlugByOldId.set(oldId, slug)
  return slug
}

/** Drops embedded flavour-text paragraphs (wahapedia marks these with a "ShowFluff" CSS class,
 * e.g. `<p class="ShowFluff legend2">Some units make their way to battle...</p>`) so only the
 * mechanical rules text remains. Separate `legend` CSV columns (pure flavour text) are never
 * read into any output field in the first place, so this only needs to catch text mixed inline. */
function stripLore(html: string): string {
  return html.replace(/<p[^>]*\bclass="[^"]*ShowFluff[^"]*"[^>]*>[\s\S]*?<\/p>/gi, '')
}

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
    .replace(/[’]/g, "'")
    .trim()
    .toLowerCase()
}

function tryMatch(rule: ModifierRule, candidates: MatchCandidate[]): string | null {
  const labelPrefix = extractRuleName(rule.label)
  if (labelPrefix) {
    const byName = candidates.find(c => c.name.trim().replace(/[’]/g, "'").toLowerCase() === labelPrefix)
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

function toEffectShape(rule: ModifierRule): CombatEffect {
  const shape: CombatEffect = { effects: rule.effects }
  if (rule.combatType) shape.combatType = rule.combatType
  if (rule.target) shape.target = rule.target
  if (rule.requiresAntiKeyword) shape.requiresAntiKeyword = rule.requiresAntiKeyword
  if (rule.requiresTargetKeyword) shape.requiresTargetKeyword = rule.requiresTargetKeyword
  if (rule.requiresAttackerKeyword) shape.requiresAttackerKeyword = rule.requiresAttackerKeyword
  if (rule.bearerOnly) shape.bearerOnly = true
  if (rule.isStratagem) shape.isStratagem = true
  if (rule.cpCost !== undefined) shape.cpCost = rule.cpCost
  // sourceDatasheetId means this ability is an aura for OTHER nearby units, not its own bearer —
  // only set this when sourceDatasheetId is the one actually resolving the ability owner (not
  // merely present alongside a datasheetId/leaderDatasheetId, which take priority in the fold-in).
  if (rule.sourceDatasheetId && !rule.datasheetId && !rule.leaderDatasheetId) shape.appliesToNearby = true
  return shape
}

/** Combines two CombatEffects for the "second half of the same ability" case (e.g. modifiers.ts
 * splits one ability into a described rule and a bare-label continuation with no description). */
function mergeEffectShapes(a: CombatEffect, b: CombatEffect): CombatEffect {
  return { ...a, ...b, effects: { ...a.effects, ...b.effects } }
}

interface FallbackEffect {
  sourceRuleId: string
  label: string
  description?: string
  effect: CombatEffect
}

interface MatchReport {
  totalConsidered: number
  mergedIntoAbility: string[]
  mergedIntoDetachmentAbility: string[]
  mergedIntoStratagem: string[]
  mergedIntoEnhancement: string[]
  mergedIntoArmyRule: string[]
  fallback: string[]
  excludedGameMode: string[]
  excludedLegends: string[]
}

interface OutAbility extends Ability {
  effect?: CombatEffect
  options?: { name: string; effect?: CombatEffect }[]
}

function stripWeaponRuleDefaults(w: Weapon) {
  const { line, name, description, range, type, A, bsWs, S, AP, D, ...rest } = w
  const rules: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(rest)) {
    if (v === false || v === 0 || v === '' || (Array.isArray(v) && v.length === 0)) continue
    rules[k] = v
  }
  return { line, name, description, range, type, A, bsWs, S, AP, D, rules }
}

export interface FactionGenerationResult {
  slug: string
  factionId: string
  acDatasheets: Datasheet[]
  report: MatchReport
}

export const results: FactionGenerationResult[] = []

// ── Per-faction generation ──────────────────────────────────────────────────────────

function generateForFaction(targetFaction: string): void {
  const faction = rawFactions.find(f => f.id === targetFaction)
  if (!faction) throw new Error(`No se encontró la facción ${targetFaction} en Factions.csv`)
  const factionSlug = factionSlugFor(targetFaction)

  const report: MatchReport = {
    totalConsidered: 0,
    mergedIntoAbility: [],
    mergedIntoDetachmentAbility: [],
    mergedIntoStratagem: [],
    mergedIntoEnhancement: [],
    mergedIntoArmyRule: [],
    fallback: [],
    excludedGameMode: [],
    excludedLegends: [],
  }

  const factionDatasheets = allDatasheets.filter(d => d.factionId === targetFaction)
  factionDatasheets.forEach(d => { if (!datasheetSlugByOldId.has(d.id)) datasheetSlugByOldId.set(d.id, makeSlug(d.name, factionSlug)) })

  // Excludes non-standard game modes (Boarding Actions, Combat Patrol, or any future `type`
  // wahapedia adds) — those play by their own separate ruleset, out of scope for this app.
  const factionDetachments = rawDetachments.filter(d => d.faction_id === targetFaction && d.type === '')
  factionDetachments.forEach(d => detachmentSlugByOldId.set(d.id, makeSlug(d.name, factionSlug)))
  const includedDetachmentIds = new Set(factionDetachments.map(d => d.id))

  const factionStratagems = rawStratagems.filter(s => s.faction_id === targetFaction && includedDetachmentIds.has(s.detachment_id))
  factionStratagems.forEach(s => stratagemSlugByOldId.set(s.id, makeSlug(s.name, factionSlug)))

  const factionEnhancements = rawEnhancements.filter(e => e.faction_id === targetFaction && includedDetachmentIds.has(e.detachment_id))
  factionEnhancements.forEach(e => enhancementSlugByOldId.set(e.id, makeSlug(e.name, factionSlug)))

  const factionDetachAbils = rawDetachAbils.filter(da => da.faction_id === targetFaction && includedDetachmentIds.has(da.detachment_id))
  factionDetachAbils.forEach(da => detachmentAbilitySlugByOldId.set(da.id, makeSlug(da.name, factionSlug)))

  // ── Army rules (Faction-type abilities), deduped ──────────────────────────────────
  const armyRuleIds = new Set<string>()
  const armyRules: OutAbility[] = []
  rawDsAbilities
    .filter(a => a.type === 'Faction' && a.ability_id && datasheetFactionMap[a.datasheet_id] === targetFaction)
    .forEach(a => {
      if (armyRuleIds.has(a.ability_id)) return
      armyRuleIds.add(a.ability_id)
      const ref = abilitiesMap[a.ability_id]
      if (ref) armyRules.push({ id: slugify(ref.name), name: ref.name, description: stripLore(ref.description), type: 'Faction' })
    })

  // ── Detachments ────────────────────────────────────────────────────────────────────
  const chaptersByDetachment: Record<string, string[]> = {}
  rawDetachmentChapters.forEach(r => {
    if (!chaptersByDetachment[r.detachment_id]) chaptersByDetachment[r.detachment_id] = []
    chaptersByDetachment[r.detachment_id].push(r.chapter)
  })

  interface OutDetachmentAbility { id: string; name: string; description: string; effect?: CombatEffect }
  interface OutDetachment {
    id: string; name: string; disposition: string; dp: number; chapters: string[]
    abilities: OutDetachmentAbility[]
  }

  const detachments: OutDetachment[] = factionDetachments.map(d => ({
    id: detachmentSlugByOldId.get(d.id)!,
    name: d.name,
    disposition: d.disposition ?? '',
    dp: parseInt(d.dp ?? '0', 10) || 0,
    chapters: chaptersByDetachment[d.id] ?? [],
    abilities: factionDetachAbils
      .filter(da => da.detachment_id === d.id)
      .map(da => ({ id: detachmentAbilitySlugByOldId.get(da.id)!, name: da.name, description: stripLore(da.description) })),
  }))

  // ── Stratagems (faction-scoped only; Core ones live in the shared catalog) ────────
  interface OutStratagem {
    id: string; name: string; detachmentId: string | null
    cpCost: number; type: string; turn: string; phase: string; description: string
    effect?: CombatEffect
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
      description: stripLore(s.description),
    }
  }

  const stratagemsOut: OutStratagem[] = factionStratagems.map(s => toOutStratagem(s))

  // ── Enhancements ───────────────────────────────────────────────────────────────────
  interface OutEnhancement {
    id: string; name: string; cost: number; detachmentId: string | null; detachmentName: string
    description: string; effect?: CombatEffect
  }

  const enhancementsOut: OutEnhancement[] = factionEnhancements.map(e => ({
    id: enhancementSlugByOldId.get(e.id)!,
    name: e.name,
    cost: parseInt(e.cost) || 0,
    detachmentId: e.detachment_id ? (detachmentSlugByOldId.get(e.detachment_id) ?? null) : null,
    detachmentName: e.detachment,
    description: stripLore(e.description),
  }))

  // ── Fold this faction's MODIFIER_RULES into the entities above ───────────────────
  const factionRules = MODIFIER_RULES.filter(r => r.factionId === targetFaction)

  const armyRuleFallbacks: FallbackEffect[] = []
  const pendingArmyRuleOptions = new Map<string, { name: string; effect: CombatEffect }[]>()
  const detachmentFallbacksById = new Map<string, FallbackEffect[]>()
  const datasheetFallbacksById = new Map<string, FallbackEffect[]>()
  const factionFallbacks: FallbackEffect[] = []

  function pushFallback(list: FallbackEffect[], rule: ModifierRule) {
    list.push({ sourceRuleId: rule.id, label: rule.label, description: rule.description, effect: toEffectShape(rule) })
    report.fallback.push(rule.id)
  }

  function pushArmyRuleOption(matchKey: string, name: string, effect: CombatEffect) {
    if (!pendingArmyRuleOptions.has(matchKey)) pendingArmyRuleOptions.set(matchKey, [])
    pendingArmyRuleOptions.get(matchKey)!.push({ name, effect })
  }

  /** Same as pushArmyRuleOption, but merges into an existing same-named option instead of
   * appending a duplicate — only for the DOCTRINA_IMPERATIVES_OPTIONS override below, where
   * several ModifierRule ids deliberately describe the same scoped bundle of effects (e.g.
   * Protector Imperative's two ranged buffs). NOT used for the generic tryMatch path: there,
   * two matches sharing a label (e.g. Orks' "WAAAGH!" split into a melee-attacker rule and a
   * defender-save rule) are genuinely separate simultaneous effects, not one combined effect —
   * merging them would wrongly force one's combatType/target onto the other. */
  function pushArmyRuleOptionMerged(matchKey: string, name: string, effect: CombatEffect) {
    if (!pendingArmyRuleOptions.has(matchKey)) pendingArmyRuleOptions.set(matchKey, [])
    const options = pendingArmyRuleOptions.get(matchKey)!
    const existing = options.find(o => o.name === name)
    if (existing) existing.effect = mergeEffectShapes(existing.effect, effect)
    else options.push({ name, effect })
  }

  // Rules that fail tryMatch purely because modifiers.ts paraphrases the real ability's wording
  // (e.g. Doctrina Imperatives' "ranged weapons... by 1" vs the source HTML's "ranged weapons
  // equipped by models in this unit... by 1", or Oath of Moment's differently-structured sentence)
  // rather than because the ability doesn't exist or isn't real — mapped directly by hand to the
  // ability they belong to, with an option name that names the actual effect (not just a vague
  // scope tag) so it reads informatively in the mathhammer panel. `merge: true` combines several
  // ids into one option's `effects` when they're genuinely the same scoped bundle (Protector
  // Imperative's two ranged buffs); omitted, each id keeps its own independent toggle (Oath of
  // Moment's re-roll and its conditional +1 to wound are two separate, stackable bonuses, not one
  // combined effect — the wound bonus doesn't apply for chapters with their own Vows/Doctrines).
  interface ArmyRuleOverride { abilityName: string; optionName: string; merge?: boolean }
  const ARMY_RULE_OVERRIDES: Record<string, ArmyRuleOverride> = {
    adm_protector_doctrina_bs: { abilityName: 'Doctrina Imperatives', optionName: 'Protector Imperative — +1 BS, [HEAVY] (disparo)', merge: true },
    adm_protector_doctrina_heavy: { abilityName: 'Doctrina Imperatives', optionName: 'Protector Imperative — +1 BS, [HEAVY] (disparo)', merge: true },
    adm_protector_doctrina_def: { abilityName: 'Doctrina Imperatives', optionName: 'Protector Imperative — −1 impactar recibido en CaC' },
    adm_conqueror_doctrina: { abilityName: 'Doctrina Imperatives', optionName: 'Conqueror Imperative — +1 WS, +1 PA (CaC)', merge: true },
    adm_conqueror_doctrina_ap: { abilityName: 'Doctrina Imperatives', optionName: 'Conqueror Imperative — +1 WS, +1 PA (CaC)', merge: true },
    adm_conqueror_doctrina_ap_mech: { abilityName: 'Doctrina Imperatives', optionName: 'Conqueror Imperative — +1 PA adicional' },
    qi_protector_doctrina_bs: { abilityName: 'Doctrina Imperatives', optionName: 'Protector Imperative — +1 BS, [HEAVY] (disparo)', merge: true },
    qi_protector_doctrina_heavy: { abilityName: 'Doctrina Imperatives', optionName: 'Protector Imperative — +1 BS, [HEAVY] (disparo)', merge: true },
    qi_protector_doctrina_def: { abilityName: 'Doctrina Imperatives', optionName: 'Protector Imperative — −1 impactar recibido en CaC' },
    qi_conqueror_doctrina: { abilityName: 'Doctrina Imperatives', optionName: 'Conqueror Imperative — +1 WS, +1 PA (CaC)', merge: true },
    qi_conqueror_doctrina_ap: { abilityName: 'Doctrina Imperatives', optionName: 'Conqueror Imperative — +1 WS, +1 PA (CaC)', merge: true },
    sm_oath_of_moment: { abilityName: 'Oath of Moment', optionName: 'Repetir impactos vs objetivo' },
    sm_oath_of_moment_wound: { abilityName: 'Oath of Moment', optionName: '+1 herir vs objetivo (sin capítulo especial)' },
    sm_templar_vows_wound: { abilityName: 'Templar Vows', optionName: 'Accept Any Challenge — +1 herir (F≤T, CaC)' },
  }

  const lastMergedAbilityIndexByDatasheet = new Map<string, number>()

  for (const rule of factionRules) {
    report.totalConsidered++

    // 1. datasheetId (or leaderDatasheetId — an aura printed on the leading character's own
    //    sheet — or sourceDatasheetId — an aura printed on a nearby support unit's own sheet,
    //    not attached as a leader) → attach to a named ability on that datasheet, else
    //    datasheet.combatEffects[]
    const ownerDatasheetId = rule.datasheetId ?? rule.leaderDatasheetId ?? rule.sourceDatasheetId
    if (ownerDatasheetId) {
      const ds = factionDatasheets.find(d => d.id === ownerDatasheetId)
      if (!ds) {
        // Not a matching failure if the referenced unit is Legends (excluded from this app's
        // data entirely, same as Boarding Actions detachments) — genuinely nowhere to attach it.
        const rawDs = rawDatasheets.find(d => d.id === ownerDatasheetId)
        if (rawDs && legendSourceIds.has(rawDs.source_id)) {
          report.excludedLegends.push(rule.id)
        } else {
          pushFallback(factionFallbacks, rule)
        }
        continue
      }
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
      const rawEnh = rawEnhancements.find(e => e.id === rule.enhancementId)
      if (rawEnh && !includedDetachmentIds.has(rawEnh.detachment_id)) {
        report.excludedGameMode.push(rule.id)
        continue
      }
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
      if (!includedDetachmentIds.has(rule.detachmentId)) {
        // Belongs to a Boarding Actions / Combat Patrol / other non-standard detachment we don't
        // carry at all — not a matching failure, deliberately out of scope.
        report.excludedGameMode.push(rule.id)
        continue
      }
      const detSlug = detachmentSlugByOldId.get(rule.detachmentId)
      if (rule.isStratagem) {
        const candidates: MatchCandidate[] = stratagemsOut
          .filter(s => s.detachmentId === detSlug)
          .map(s => ({ key: s.id, name: s.name, description: s.description }))
        const matchKey = tryMatch(rule, candidates)
        if (matchKey) {
          const strat = stratagemsOut.find(s => s.id === matchKey)!
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

    // 4. isStratagem, only factionId → match against this faction's stratagems, no detachment scope
    if (rule.isStratagem) {
      const candidates: MatchCandidate[] = stratagemsOut.map(s => ({ key: s.id, name: s.name, description: s.description }))
      const matchKey = tryMatch(rule, candidates)
      if (matchKey) {
        const strat = stratagemsOut.find(s => s.id === matchKey)!
        strat.effect = toEffectShape(rule)
        report.mergedIntoStratagem.push(strat.id)
      } else {
        pushFallback(factionFallbacks, rule)
      }
      continue
    }

    // 5. only factionId → army rule (possibly one of several mutually-exclusive options, e.g. Ka'tah stances)
    const override = ARMY_RULE_OVERRIDES[rule.id]
    if (override) {
      const arIndex = armyRules.findIndex(a => a.name === override.abilityName)
      if (arIndex !== -1) {
        if (override.merge) pushArmyRuleOptionMerged(String(arIndex), override.optionName, toEffectShape(rule))
        else pushArmyRuleOption(String(arIndex), override.optionName, toEffectShape(rule))
        report.mergedIntoArmyRule.push(`${override.abilityName}::${override.optionName}`)
        continue
      }
    }
    const candidates: MatchCandidate[] = armyRules.map((a, i) => ({ key: String(i), name: a.name, description: a.description }))
    const matchKey = tryMatch(rule, candidates)
    if (matchKey !== null) {
      const ar = armyRules[Number(matchKey)]
      const optionName = rule.label.split(/—|-{2,}/)[0]?.replace(/\s*\([^)]*\)/g, '').trim() || rule.label
      pushArmyRuleOption(matchKey, optionName, toEffectShape(rule))
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

  // ── canBeLedBy ─────────────────────────────────────────────────────────────────────
  const datasheetsOut = factionDatasheets.map(ds => {
    const dsSlug = datasheetSlugByOldId.get(ds.id)!
    const leaderOldIds = rawLeaders.filter(l => l.attached_id === ds.id).map(l => l.leader_id)
    const canBeLedBy = leaderOldIds
      .map(leaderId => datasheetSlugFor(leaderId))
      .filter((s): s is string => !!s)

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
      loadout: ds.loadout,
      damagedW: ds.damagedW,
      damagedDescription: ds.damagedDescription,
      models: ds.models,
      weapons: ds.weapons.map(stripWeaponRuleDefaults),
      abilities: ds.abilities.map(a => ({ ...a, description: stripLore(a.description) })),
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

  const factionOut = {
    id: factionSlug,
    name: faction.name,
    armyRules: armyRules.map(ar => ({ id: ar.id, name: ar.name, description: ar.description, effect: ar.effect, options: ar.options })),
    armyRuleCombatEffects: armyRuleFallbacks.length ? armyRuleFallbacks : undefined,
    detachments: detachments.map(d => ({
      ...d,
      combatEffects: detachmentFallbacksById.get(d.id),
    })),
    stratagems: stratagemsOut,
    enhancements: enhancementsOut,
    datasheets: datasheetsOut,
    combatEffects: factionFallbacks.length ? factionFallbacks : undefined,
  }

  fs.writeFileSync(path.join(OUT_FACTIONS_DIR, `${factionSlug}.json`), JSON.stringify(factionOut, null, 2))
  fs.writeFileSync(path.join(REPORT_DIR, `${factionSlug}.json`), JSON.stringify(report, null, 2))

  results.push({ slug: factionSlug, factionId: targetFaction, acDatasheets: factionDatasheets, report })

  const merged = report.totalConsidered - report.fallback.length - report.excludedGameMode.length - report.excludedLegends.length
  console.log(`${faction.name.padEnd(28)} (${factionSlug}): ${factionDatasheets.length} datasheets, ` +
    `${report.totalConsidered} reglas (${merged} fusionadas, ${report.fallback.length} fallback, ` +
    `${report.excludedGameMode.length} excl. modo de juego, ${report.excludedLegends.length} excl. Legends)`)
}

fs.mkdirSync(OUT_FACTIONS_DIR, { recursive: true })
fs.mkdirSync(OUT_CATALOG_DIR, { recursive: true })
fs.mkdirSync(REPORT_DIR, { recursive: true })

console.log(`\n== Generando ${playableFactions.length} facciones ==\n`)
for (const f of playableFactions) generateForFaction(f.id)

// ── Shared catalog (faction index + universal core rules/stratagems) ─────────────────

const universalStratagems = rawStratagems.filter(s => !s.faction_id)
universalStratagems.forEach(s => stratagemSlugByOldId.set(s.id, makeSlug(s.name, 'core')))

function toOutStratagem(s: RawStratagem) {
  return {
    id: stratagemSlugByOldId.get(s.id)!,
    name: s.name,
    detachmentId: null,
    cpCost: parseInt(s.cp_cost) || 1,
    type: s.type,
    turn: s.turn,
    phase: s.phase,
    description: stripLore(s.description),
    effect: undefined as CombatEffect | undefined,
  }
}
const coreStratagemsOut = universalStratagems.map(toOutStratagem)

const universalRules = MODIFIER_RULES.filter(r => !r.factionId)
interface CoreRuleOut { id: string; name: string; description?: string; effect: CombatEffect }
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

const factionsCatalog = playableFactions.map(f => ({ id: factionSlugFor(f.id), name: f.name }))

const coreRulesOut = rawCoreRules.map(r => ({
  id: r.id, name: r.name, category: r.category, summary: r.summary, description: stripLore(r.description),
}))
const coreRuleNameSet = new Set(coreRulesOut.map(r => r.name.toLowerCase()))
rawAbilities
  .filter(a => !a.faction_id && !coreRuleNameSet.has(a.name.toLowerCase()))
  .forEach(a => coreRulesOut.push({ id: a.id, name: a.name, category: 'unit_ability', summary: '', description: stripLore(a.description) }))

const sourcesOut = rawSources.map(s => ({
  id: s.id,
  name: s.name,
  type: s.type,
  edition: parseInt(s.edition) || 10,
  version: s.version,
  errataDate: s.errata_date,
  errataLink: s.errata_link,
}))

const catalogOut = {
  coreRules: coreRulesOut,
  coreStratagems: coreStratagemsOut,
  coreRuleEffects,
  sources: sourcesOut,
  lastUpdate: rawLastUpdate[0]?.last_update ?? '',
}

fs.writeFileSync(path.join(OUT_CATALOG_DIR, 'factions.json'), JSON.stringify(factionsCatalog, null, 2))
fs.writeFileSync(path.join(OUT_CATALOG_DIR, 'core-rules.json'), JSON.stringify(catalogOut, null, 2))

// ── Aggregate report ─────────────────────────────────────────────────────────────────

const totals = results.reduce((acc, r) => ({
  totalConsidered: acc.totalConsidered + r.report.totalConsidered,
  merged: acc.merged + r.report.totalConsidered - r.report.fallback.length - r.report.excludedGameMode.length - r.report.excludedLegends.length,
  fallback: acc.fallback + r.report.fallback.length,
  excludedGameMode: acc.excludedGameMode + r.report.excludedGameMode.length,
  excludedLegends: acc.excludedLegends + r.report.excludedLegends.length,
}), { totalConsidered: 0, merged: 0, fallback: 0, excludedGameMode: 0, excludedLegends: 0 })

console.log(`\n== Totales (${playableFactions.length} facciones, ${MODIFIER_RULES.length} reglas en modifiers.ts) ==`)
console.log(`Reglas con factionId de una facción jugable: ${totals.totalConsidered}`)
console.log(`  Fusionadas: ${totals.merged}`)
console.log(`  Excluidas por modo de juego: ${totals.excludedGameMode}`)
console.log(`  Excluidas por ser Legends: ${totals.excludedLegends}`)
console.log(`  Fallback (revisar): ${totals.fallback}`)
console.log(`\nEscrito: ${path.relative(process.cwd(), OUT_FACTIONS_DIR)}/*.json (${results.length} facciones)`)
console.log(`Escrito: ${path.relative(process.cwd(), OUT_CATALOG_DIR)}/factions.json`)
console.log(`Escrito: ${path.relative(process.cwd(), OUT_CATALOG_DIR)}/core-rules.json`)
console.log(`Informes de fusión: ${path.relative(process.cwd(), REPORT_DIR)}/*.json`)
