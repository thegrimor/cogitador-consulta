import type {
  PointsCost, Datasheet, Detachment, Enhancement, RosterEntry, RosterList, WargearCost, WeaponOptionRule,
} from '@/types'
import { ruleEligibleCount, parseUnitSlots, resolveRoleCounts, parseLoadoutWeaponRoles } from '@/core/utils/weaponOptions'
import { isSameFactionFamily } from '@/core/constants/factionFamily'

export const DETACHMENT_POINTS_BUDGET = 3
export const MULTI_DETACHMENT_THRESHOLD = 2000

export function isMultiDetachmentAllowed(pointsLimit: number | null): boolean {
  return pointsLimit !== null && pointsLimit >= MULTI_DETACHMENT_THRESHOLD
}

/** Battle size tiers, by points-limit upper bound, and how many copies of a single
 * (non-Epic Hero) datasheet are allowed at each one - `cap` for an ordinary datasheet,
 * `battlelineCap` for one with the Battleline or Dedicated Transports role (core rules:
 * "twice at Incursion, three times at Strike Force and Onslaught", doubled for Battleline/
 * Dedicated Transport). */
const BATTLE_SIZE_COPY_CAPS: { maxPoints: number; cap: number; battlelineCap: number }[] = [
  { maxPoints: 1000, cap: 2, battlelineCap: 4 },
  { maxPoints: Infinity, cap: 3, battlelineCap: 6 },
]

export function isEpicHero(datasheet: Datasheet): boolean {
  return datasheet.keywords.some(k => k.toUpperCase() === 'EPIC HERO')
}

export type AttachmentKind = 'leader' | 'support'

/** Whether a datasheet attaches to a bodyguard unit through the Core `Leader` or `Support`
 * ability. A bodyguard unit may carry one of each at once (never two of the same kind) — the
 * rule text lives in `catalog/core-rules.json` (`UA012` Support, `000008346` Leader, `CO054`
 * Attached Units).
 * Characters that only attach via an Enhancement (ENHANCEMENT_ATTACHMENTS) carry neither
 * ability and count as a leader. */
export function attachmentKind(datasheet: Datasheet): AttachmentKind {
  return datasheet.abilities.some(a => a.type === 'Core' && a.name.toLowerCase() === 'support')
    ? 'support'
    : 'leader'
}

/** Bodyguard datasheets whose own rules raise the one-leader cap. T'au Kroot Carnivores'
 * BODYGUARD ability: "If this unit has a Starting Strength of 20, you can attach up to two
 * Leader units to it instead of one, provided those Leaders are not duplicates". The support
 * cap stays at one. */
const EXTRA_LEADER_SLOTS: Record<string, { minModels: number; leaders: number }> = {
  'kroot-carnivores': { minModels: 20, leaders: 2 },
}

/** True when `bodyguard` can't take `candidate` because its slot for the candidate's kind is
 * already full (ignoring `excludeEntryId`, the entry being attached). Where a bodyguard allows
 * more than one leader (EXTRA_LEADER_SLOTS), a second copy of an already-attached datasheet is
 * still refused. */
export function isAttachmentSlotTaken(
  entries: RosterEntry[],
  bodyguard: RosterEntry,
  candidate: Datasheet,
  excludeEntryId: string,
  datasheetById: Map<string, Datasheet>,
): boolean {
  const kind = attachmentKind(candidate)
  const sameKind = entries.filter(other => {
    if (other.id === excludeEntryId || other.attachedToEntryId !== bodyguard.id) return false
    const ds = datasheetById.get(other.datasheetId)
    return !!ds && attachmentKind(ds) === kind
  })
  const extra = kind === 'leader' ? EXTRA_LEADER_SLOTS[bodyguard.datasheetId] : undefined
  const capacity = extra && bodyguard.modelCount >= extra.minModels ? extra.leaders : 1
  if (capacity > 1 && sameKind.some(other => other.datasheetId === candidate.id)) return true
  return sameKind.length >= capacity
}

function isBattlelineRole(role: string): boolean {
  return role === 'Battleline' || role === 'Dedicated Transports'
}

/** How many copies of `datasheet` the roster may contain. Epic Heroes are always
 * capped at 1 (unique named characters); Battleline/Dedicated Transports datasheets get
 * double the ordinary cap; everything else scales with battle size.
 * Returns Infinity if no points limit is set (battle size can't be determined). */
export function maxCopiesAllowed(datasheet: Datasheet, pointsLimit: number | null): number {
  if (isEpicHero(datasheet)) return 1
  if (pointsLimit === null) return Infinity
  const tier = BATTLE_SIZE_COPY_CAPS.find(t => pointsLimit <= t.maxPoints) ?? BATTLE_SIZE_COPY_CAPS.at(-1)!
  return isBattlelineRole(datasheet.role) ? tier.battlelineCap : tier.cap
}

export function sumDetachmentPoints(detachments: Detachment[], detachmentIds: string[]): number {
  const byId = new Map(detachments.map(d => [d.id, d]))
  return detachmentIds.reduce((sum, id) => sum + (byId.get(id)?.dp ?? 0), 0)
}

export function parseModelCountFromDescription(description: string): number | null {
  const m = description.match(/^(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

export function resolveModelCount(cost: PointsCost, datasheet: Datasheet): number {
  const parsed = parseModelCountFromDescription(cost.description)
  if (parsed !== null) return parsed
  return datasheet.modelCountMin || 1
}

export function sortCostVariants(costs: PointsCost[]): PointsCost[] {
  return [...costs].sort((a, b) => {
    const aCount = parseModelCountFromDescription(a.description) ?? 0
    const bCount = parseModelCountFromDescription(b.description) ?? 0
    return aCount - bCount
  })
}

/** "Nth unit / Nth+ unit / Nth-Mth units" surcharge tiers (e.g. a 2nd Defiler costs
 * more than the 1st) aren't a player choice — they're determined by how many of that
 * datasheet are already in the roster. This range is what `description` encodes. */
export interface CostTierRange { min: number; max: number }

/** A description can carry more than one trailing "(...)" annotation at once (e.g. a per-copy
 * surcharge tier *and* an Assigned Agent context, on the one datasheet that needs both —
 * Sisters of Battle Immolator) — each parenthetical is checked independently against the tier
 * patterns below rather than assuming the tier is always the last (or only) one. */
export function parseTierRange(description: string): CostTierRange | null {
  for (const m of description.matchAll(/\(([^)]+)\)/g)) {
    const tier = m[1].toLowerCase().trim()

    const plus = tier.match(/^(\d+)(?:st|nd|rd|th)\s*\+\s*units?$/)
    if (plus) return { min: parseInt(plus[1], 10), max: Infinity }

    const range = tier.match(/^1st\s*(?:-|to)\s*(\d+)(?:st|nd|rd|th)\s*units?$/)
    if (range) return { min: 1, max: parseInt(range[1], 10) }

    const exact = tier.match(/^(\d+)(?:st|nd|rd|th)\s*units?$/)
    if (exact) return { min: parseInt(exact[1], 10), max: parseInt(exact[1], 10) }
  }
  return null
}

/** Strips every trailing "(...)" annotation (tier suffix, Assigned Agent context, or both) so
 * variants that only differ by one of those annotations compare/display equal. */
export function stripTierSuffix(description: string): string {
  let s = description.trim()
  while (/\s*\([^)]+\)\s*$/.test(s)) s = s.replace(/\s*\([^)]+\)\s*$/, '')
  return s.trim()
}

/** Narrows `costs` down to whichever tier applies to the Nth (1-indexed) copy of this
 * datasheet in the roster. Costs with no tier suffix (plain squad-size choices) always pass through. */
export function resolveCostsForUnitIndex(costs: PointsCost[], unitIndex: number): PointsCost[] {
  return costs.filter(c => {
    const range = parseTierRange(c.description)
    return range === null || (unitIndex >= range.min && unitIndex <= range.max)
  })
}

/** Imperial Agents datasheets are the only ones that get taken as an ally into a foreign
 * faction's roster, and GW prices that "Assigned Agent" use differently from fielding the same
 * unit in a native AGENTS OF THE IMPERIUM army — encoded as a "(Assigned Agent)" annotation
 * alongside the native "(...Detachment)" one, same convention as the "(2nd+ unit)" tier suffix
 * `parseTierRange` reads above (and, on the one datasheet needing both, a separate parenthetical
 * from the tier one — matched anywhere in the description, not just at the very end). */
export function isAssignedAgentCost(description: string): boolean {
  return /\(assigned agent\)/i.test(description)
}

/** Narrows `costs` to whichever of the two price tiers above applies — the ally price when
 * `datasheet` isn't native to the roster's own faction, the native price otherwise. A no-op for
 * every datasheet that doesn't carry this second price tier at all (i.e. everything outside
 * Imperial Agents). */
export function resolveCostsForFactionContext(
  costs: PointsCost[],
  datasheetFactionId: string,
  rosterFactionId: string,
): PointsCost[] {
  if (!costs.some(c => isAssignedAgentCost(c.description))) return costs
  // Family, not string equality: a core Space Marines datasheet inside a Dark Angels roster is
  // inherited content, not an ally, and pricing it as one would pick the wrong tier.
  const isAlly = !isSameFactionFamily(datasheetFactionId, rosterFactionId)
  return costs.filter(c => isAssignedAgentCost(c.description) === isAlly)
}

/** 1-indexed position of `entryId` among entries sharing its datasheetId, in roster order.
 * Pass `entryId: null` to get the index the *next* added copy of `datasheetId` would take. */
export function unitIndexInRoster(
  entries: { id: string; datasheetId: string }[],
  datasheetId: string,
  entryId: string | null,
): number {
  const matching = entries.filter(e => e.datasheetId === datasheetId)
  if (entryId === null) return matching.length + 1
  const idx = matching.findIndex(e => e.id === entryId)
  return idx === -1 ? matching.length + 1 : idx + 1
}

/** Base points cost for `entry`, resolved fresh from the current data rather than a value
 * cached on the entry — so a correction to `pointsCosts` in the data JSON is reflected on
 * every roster immediately, with nothing to re-save. `costsForTier` must already be narrowed
 * to this entry's tier via `resolveCostsForUnitIndex` (surcharge tiers can share a model count
 * with a different tier's variant). Falls back to the next size up, then the largest variant,
 * for a `modelCount` that no longer matches any variant (e.g. after a data edit). */
export function resolveEntryBaseCost(
  entry: RosterEntry,
  datasheet: Datasheet,
  costsForTier: PointsCost[],
): number {
  if (costsForTier.length === 0) return 0
  const sorted = sortCostVariants(costsForTier)
  const exact = sorted.find(c => resolveModelCount(c, datasheet) === entry.modelCount)
  if (exact) return exact.points
  const next = sorted.find(c => resolveModelCount(c, datasheet) >= entry.modelCount)
  return (next ?? sorted[sorted.length - 1]).points
}

/** Points surcharge from `entry`'s paid wargear selections, resolved fresh against the
 * current `wargearCosts` rather than a stored total. A selection above its item's `max` (or
 * above `entry.modelCount`, for an unbounded item) is clamped rather than trusted verbatim, in
 * case a `max` was added/lowered after the selection was saved, or the model count since shrank. */
export function resolveEntryWargearSurcharge(entry: RosterEntry, wargearCosts: WargearCost[]): number {
  if (!entry.wargearSelections) return 0
  const byName = new Map(wargearCosts.map(w => [w.name, w]))
  return Object.entries(entry.wargearSelections).reduce((sum, [name, count]) => {
    const wc = byName.get(name)
    if (!wc) return sum
    const effectiveMax = wc.max !== undefined ? Math.min(wc.max, entry.modelCount) : entry.modelCount
    return sum + wc.points * Math.min(count, effectiveMax)
  }, 0)
}

/** Points cost of `entry`'s enhancement (0 if none selected), resolved fresh from `enhancements`. */
export function resolveEntryEnhancementCost(entry: RosterEntry, enhancements: Enhancement[]): number {
  if (!entry.enhancementId) return 0
  return enhancements.find(e => e.id === entry.enhancementId)?.cost ?? 0
}

/** Base cost + wargear surcharge for `entry` — what the roster editor shows as the unit's
 * own points line (enhancement cost is shown separately there). */
export function resolveEntryPoints(
  entry: RosterEntry,
  datasheet: Datasheet,
  costsForTier: PointsCost[],
  wargearCosts: WargearCost[],
): number {
  return resolveEntryBaseCost(entry, datasheet, costsForTier) + resolveEntryWargearSurcharge(entry, wargearCosts)
}

/** Full points cost of `entry` — base + wargear + enhancement — for contexts (export text,
 * roster totals) that want one number per unit. */
export function resolveEntryTotalPoints(
  entry: RosterEntry,
  datasheet: Datasheet,
  costsForTier: PointsCost[],
  wargearCosts: WargearCost[],
  enhancements: Enhancement[],
): number {
  return resolveEntryPoints(entry, datasheet, costsForTier, wargearCosts) + resolveEntryEnhancementCost(entry, enhancements)
}

/** Grand total for a whole roster (every entry's base + wargear + enhancement cost), computed
 * fresh from current game data every time rather than read off a stored `totalPoints` field. */
export function resolveRosterTotalPoints(
  roster: RosterList,
  datasheets: Datasheet[],
  pointsCostMap: Record<string, PointsCost[]>,
  wargearCostMap: Record<string, WargearCost[]>,
  enhancements: Enhancement[],
): number {
  const datasheetById = new Map(datasheets.map(d => [d.id, d]))
  return roster.entries.reduce((sum, entry) => {
    const datasheet = datasheetById.get(entry.datasheetId)
    if (!datasheet) return sum
    const unitIndex = unitIndexInRoster(roster.entries, entry.datasheetId, entry.id)
    const contextCosts = resolveCostsForFactionContext(
      pointsCostMap[entry.datasheetId] ?? [], datasheet.factionId, roster.factionId,
    )
    const costsForTier = resolveCostsForUnitIndex(contextCosts, unitIndex)
    const wargearCosts = wargearCostMap[entry.datasheetId] ?? []
    return sum + resolveEntryTotalPoints(entry, datasheet, costsForTier, wargearCosts, enhancements)
  }, 0)
}

const ROLE_PRIORITY: Record<string, number> = {
  Characters: 0,
  Battleline: 1,
  'Dedicated Transports': 2,
  Fortifications: 3,
  Other: 3,
}

/** Display buckets mirroring the official GW app's unit grouping (Characters / Battleline /
 * Dedicated Transports, then every other role - Fire Support, Transport, Fortifications, "Other
 * Datasheets", etc. - lumped into one "Otros" bucket) rather than one section per raw `role`
 * string, since factions have many more distinct roles than that 4-way split. Index matches
 * `rolePriority`'s output. */
export const ROLE_CATEGORY_LABELS = ['Personajes', 'Battleline', 'Transporte Dedicado', 'Otros']

function rolePriority(role: string): number {
  return ROLE_PRIORITY[role] ?? 3
}

export function compareByRolePriority(a: { role: string; name: string }, b: { role: string; name: string }): number {
  return rolePriority(a.role) - rolePriority(b.role) || a.name.localeCompare(b.name, 'es')
}

export function roleCategoryLabel(role: string): string {
  return ROLE_CATEGORY_LABELS[rolePriority(role)]
}

/** Groups items into the same Characters/Battleline/Dedicated Transports/Otros buckets used for
 * sorting, in that display order, omitting empty buckets. */
export function groupByRoleCategory<T>(items: T[], getRole: (item: T) => string): { label: string; items: T[] }[] {
  const buckets: T[][] = ROLE_CATEGORY_LABELS.map(() => [])
  for (const item of items) buckets[rolePriority(getRole(item))].push(item)
  return ROLE_CATEGORY_LABELS
    .map((label, i) => ({ label, items: buckets[i] }))
    .filter(group => group.items.length > 0)
}

export function getRuleSelection(entry: RosterEntry, rule: WeaponOptionRule): number[] {
  const stored = entry.weaponOptionSelections?.[rule.id]
  if (stored && stored.length === rule.choices.length) return stored
  return new Array(rule.choices.length).fill(0)
}

export function ruleSelectionTotal(selection: number[]): number {
  return selection.reduce((a, b) => a + b, 0)
}

/** Rules whose 'replace' picks draw from the same finite pool of base weapons as `rule`
 * (one instance per model), including `rule` itself. */
function replacePoolRules(rule: WeaponOptionRule, allRules: WeaponOptionRule[]): WeaponOptionRule[] {
  if (rule.kind !== 'replace') return []
  return allRules.filter(r => r.kind === 'replace' && r.fromWeapons.some(w => rule.fromWeapons.includes(w)))
}

/** How many of the shared base weapon remain unreplaced once every rule drawing from the
 * same pool (e.g. two different "replace your guardian spear" options) is accounted for. */
export function replaceWeaponRemaining(
  rule: WeaponOptionRule,
  allRules: WeaponOptionRule[],
  entry: RosterEntry,
  totalModelCount: number,
): number {
  const pool = replacePoolRules(rule, allRules)
  if (pool.length === 0) return totalModelCount
  const used = pool.reduce((sum, r) => sum + ruleSelectionTotal(getRuleSelection(entry, r)), 0)
  return totalModelCount - used
}

export function ruleSelectionCap(
  rule: WeaponOptionRule,
  allRules: WeaponOptionRule[],
  entry: RosterEntry,
  roleCounts: Record<string, number>,
  totalModelCount: number,
): number {
  const eligible = ruleEligibleCount(rule, roleCounts, totalModelCount)
  const structuralCap = rule.exclusive ? eligible : eligible * rule.maxStack

  const pool = replacePoolRules(rule, allRules)
  if (pool.length <= 1) return structuralCap

  const ownTotal = ruleSelectionTotal(getRuleSelection(entry, rule))
  const remaining = replaceWeaponRemaining(rule, allRules, entry, totalModelCount) + ownTotal
  return Math.max(0, Math.min(structuralCap, remaining))
}

/** Max value the stepper for a given choice can reach, given the rule's overall budget and repeat rules. */
export function ruleChoiceMax(rule: WeaponOptionRule, choiceIndex: number, selection: number[], cap: number): number {
  const remaining = cap - ruleSelectionTotal(selection) + selection[choiceIndex]
  if (!rule.exclusive && !rule.allowRepeatChoice) return Math.max(0, Math.min(1, remaining))
  return Math.max(0, remaining)
}

/** Weapons with multiple firing modes (e.g. "Plasma pistol – standard" / "– supercharge") are
 * listed as separate profile rows in the wargear table but share one physical instance per
 * model, and wargear-option text only ever names the weapon once, without a profile suffix.
 * Stripping the suffix lets quantity lookups match every profile row to the same pick. */
export function weaponBaseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+[-–—]\s+\S.*$/, '')
}

/** Resolves the unit's actual weapon loadout as instance counts, decrementing replaced weapons
 * by however many picks were made rather than dropping them entirely (other models in the unit
 * may still carry the unmodified weapon). */
export function resolveWeaponQuantities(datasheet: Datasheet, entry: RosterEntry): Map<string, number> {
  const counts = new Map<string, number>()

  // Free-text loadout/option descriptions pluralize a weapon's name when a model carries
  // more than one (e.g. "2 twin bolt cannons"), but the datasheet's own weapon profile is
  // always named in the singular ("Twin bolt cannon"). Resolve to whichever form actually
  // matches a real profile so counts land on the same key WeaponSelector looks up.
  const profileBases = new Set(datasheet.weapons.map(w => weaponBaseName(w.name)))
  const canonicalKey = (name: string): string => {
    const base = weaponBaseName(name)
    if (profileBases.has(base)) return base
    const singular = base.replace(/s$/, '')
    return profileBases.has(singular) ? singular : base
  }

  // A unit whose sub-roles carry different base wargear (e.g. Deathwing Knights: 1 Knight
  // Master with a great weapon, 4 Deathwing Knights with a mace) must multiply each weapon's
  // count by however many models of its *own* role there are, not by the unit's total model
  // count - otherwise every default weapon comes out equal to the full squad size regardless
  // of who actually carries it. Falls back to the old whole-unit multiplier for a uniform
  // loadout (the common case) or when the role can't be confidently resolved from the text.
  const slots = parseUnitSlots(datasheet.unitComposition)
  const roleCounts = resolveRoleCounts(slots, entry.modelCount)
  const loadoutRoles = parseLoadoutWeaponRoles(datasheet.loadout, slots)

  datasheet.defaultWeaponNames.forEach(({ name, count }) => {
    const role = loadoutRoles.get(name.toLowerCase())
    const models = role !== undefined ? roleCounts[role] ?? entry.modelCount : entry.modelCount
    counts.set(canonicalKey(name), count * models)
  })

  for (const rule of datasheet.weaponOptionRules) {
    if (rule.scope === 'unparsed' || rule.choices.length === 0) continue
    const selection = getRuleSelection(entry, rule)
    const total = ruleSelectionTotal(selection)
    if (total === 0) continue

    if (rule.kind === 'replace') {
      rule.fromWeapons.forEach(w => {
        const key = canonicalKey(w)
        const remaining = Math.max(0, (counts.get(key) ?? 0) - total)
        if (remaining === 0) counts.delete(key)
        else counts.set(key, remaining)
      })
    }

    selection.forEach((qty, i) => {
      if (qty <= 0) return
      rule.choices[i].forEach(w => {
        const key = canonicalKey(w)
        counts.set(key, (counts.get(key) ?? 0) + qty)
      })
    })
  }

  return counts
}
