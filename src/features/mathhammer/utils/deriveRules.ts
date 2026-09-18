import type { GameData, CombatEffect, CombatType, Datasheet, DetachmentAbility, Stratagem } from '@/types'
import type { ModifierRule } from '../types'
import type { PanelSelection } from '../types'

/** The slice of PanelState this derivation actually needs — kept narrow (rather than importing
 * the full PanelState type) so callers can pass a destructured object literal and list each
 * field individually in a useMemo's dependency array without an exhaustive-deps warning. */
export interface ModifierRuleScope {
  selection: PanelSelection
  detachmentAbilities: DetachmentAbility[]
  applicableStratagems: Stratagem[]
  selectedUnit: Datasheet | null
  selectedCharacter: Datasheet | null
  rosterIds: string[] | null
}

function effectToRule(
  id: string,
  label: string,
  description: string | undefined,
  effect: CombatEffect,
  extra?: Partial<ModifierRule>,
): ModifierRule {
  return {
    id,
    label,
    description,
    combatType: effect.combatType,
    target: effect.target,
    isStratagem: effect.isStratagem,
    cpCost: effect.cpCost,
    requiresAntiKeyword: effect.requiresAntiKeyword,
    requiresTargetKeyword: effect.requiresTargetKeyword,
    requiresAttackerKeyword: effect.requiresAttackerKeyword,
    bearerOnly: effect.bearerOnly,
    effects: effect.effects,
    ...extra,
  }
}

interface EffectBearer {
  id: string
  name: string
  description: string
  effect?: CombatEffect
  options?: { name: string; effect?: CombatEffect }[]
}

/** An ability's (or detachment ability's) own effect, plus one rule per mutually-exclusive
 * option it offers (e.g. the Ka'tah stances under Martial Ka'tah, or Doctrina Imperatives'
 * Protector/Conqueror Imperatives), each still toggleable independently like today. */
function abilityRules(ability: EffectBearer, extra: Partial<ModifierRule>): ModifierRule[] {
  const rules: ModifierRule[] = []
  if (ability.effect) rules.push(effectToRule(ability.id, ability.name, ability.description, ability.effect, extra))
  ability.options?.forEach((opt, i) => {
    if (opt.effect) {
      rules.push(effectToRule(`${ability.id}::${i}`, `${ability.name} — ${opt.name}`, ability.description, opt.effect, { ...extra, isOption: true }))
    }
  })
  return rules
}

/**
 * Rebuilds the flat, toggleable `ModifierRule[]` the mathhammer calculator used to get from the
 * static `MODIFIER_RULES` catalog, but derived on the fly from whichever abilities/stratagems/
 * enhancements are already loaded and in scope for the current panel selection. Every entity
 * involved (Ability, Stratagem, Enhancement, DetachmentAbility) now carries its own optional
 * `effect`/`options` directly — this just collects the ones that apply and reconstructs the
 * scope-linking fields (datasheetId/leaderDatasheetId/sourceDatasheetId/enhancementId) that used
 * to live on the separate ModifierRule row, since ModifierPanel/AbilityList still bucket rules
 * by those fields.
 */
export function deriveModifierRules(gameData: GameData, panel: ModifierRuleScope): ModifierRule[] {
  const rules: ModifierRule[] = []

  // Universal effects (Cover, Heavy, Command Re-Roll...) apply regardless of faction.
  for (const cr of gameData.coreCombatEffects) {
    rules.push(effectToRule(cr.id, cr.name, cr.description, cr.effect))
  }

  const factionId = panel.selection.factionId
  if (!factionId) return rules

  for (const ar of gameData.armyRulesByFaction[factionId] ?? []) {
    rules.push(...abilityRules(ar, {}))
  }

  for (const da of panel.detachmentAbilities) {
    rules.push(...abilityRules(da, {}))
  }

  for (const s of panel.applicableStratagems) {
    rules.push(...abilityRules(s, {}))
  }

  // Every enhancement for this faction (not just the selected one) — the enhancement
  // auto-toggle effect in MathhammerPage needs to find both the previous and next
  // enhancement's rules regardless of which is currently selected.
  for (const e of gameData.enhancements) {
    if (e.factionId === factionId) rules.push(...abilityRules(e, { enhancementId: e.id }))
  }

  if (panel.selectedUnit) {
    const datasheetId = panel.selectedUnit.id
    for (const ab of panel.selectedUnit.abilities) rules.push(...abilityRules(ab, { datasheetId }))
  }

  if (panel.selectedCharacter) {
    const leaderDatasheetId = panel.selectedCharacter.id
    const sourceUnitName = panel.selectedCharacter.name
    for (const ab of panel.selectedCharacter.abilities) rules.push(...abilityRules(ab, { leaderDatasheetId, sourceUnitName }))
  }

  // Auras from nearby support units that aren't attached as a leader (e.g. a Dreadnought's
  // "Wisdom of the Ancients"): scoped to the imported roster if one is loaded, else to every
  // datasheet in the faction (matching the old behaviour of showing these unconditionally
  // when no roster narrows things down).
  const auraSourceDatasheets = panel.rosterIds !== null
    ? gameData.datasheets.filter(d => panel.rosterIds!.includes(d.id))
    : gameData.datasheets.filter(d => d.factionId === factionId)
  for (const ds of auraSourceDatasheets) {
    for (const ab of ds.abilities) {
      if (ab.effect?.appliesToNearby) {
        rules.push(effectToRule(`${ds.id}::${ab.id}`, ab.name, ab.description, ab.effect, { sourceDatasheetId: ds.id, sourceUnitName: ds.name }))
      }
    }
  }

  return rules
}

/** Everything ModifierPanel needs to know to decide whether a given rule is currently "in
 * scope" — same conditions UnitPanel already used to build its own `visibleRules` list, pulled
 * out here so MathhammerPage can apply the identical check before resolving effects (see
 * `isRuleApplicable`). */
export interface RuleVisibilityContext {
  isAttacker: boolean
  enhancementId: string | null
  combatType?: CombatType
  anySelectedHeavy: boolean
  anySelectedLance: boolean
  anySelectedTorrent: boolean
  anySelectedIndirect: boolean
  anySelectedPsychic: boolean
  weaponAntiKeywords: string[]
  defenderKeywords: string[]
  attackerKeywords: string[]
}

/**
 * Whether `rule` currently applies given the panel/weapon-selection context — the same set of
 * conditions that decide whether ModifierPanel shows it as toggleable at all (combat type,
 * equipped enhancement, which weapon-conditional keywords are in play, ANTI-/target-/attacker-
 * keyword requirements). A rule the player toggled on earlier can fall out of scope later (e.g.
 * switching the selected weapon from melee to ranged after activating a melee-only Ka'tah
 * stance) without the player un-toggling it — `resolveModifiers` must run its active ids through
 * this same check, or a rule that's no longer shown in the panel keeps silently contributing its
 * effect to combat types/targets it was never meant for.
 */
export function isRuleApplicable(rule: ModifierRule, ctx: RuleVisibilityContext): boolean {
  const ruleTarget = rule.target ?? 'attacker'
  if (ctx.isAttacker && ruleTarget === 'defender') return false
  if (!ctx.isAttacker && ruleTarget === 'attacker') return false
  if (rule.enhancementId && rule.enhancementId !== ctx.enhancementId) return false
  if (rule.combatType && rule.combatType !== ctx.combatType) return false
  if (rule.id === 'weapon-heavy'       && !ctx.anySelectedHeavy)      return false
  if (rule.id === 'weapon-lance'       && !ctx.anySelectedLance)      return false
  if (rule.id === 'weapon-torrent'     && !ctx.anySelectedTorrent)    return false
  if (rule.id === 'weapon-indirect'    && !ctx.anySelectedIndirect)   return false
  if (rule.id === 'weapon-psychic'     && !ctx.anySelectedPsychic)    return false
  if (rule.requiresAntiKeyword && !ctx.weaponAntiKeywords.includes(rule.requiresAntiKeyword)) return false
  if (rule.requiresTargetKeyword) {
    const defKwLower = ctx.defenderKeywords.map(k => k.toLowerCase())
    if (!defKwLower.includes(rule.requiresTargetKeyword.toLowerCase())) return false
  }
  if (rule.requiresAttackerKeyword && !ctx.attackerKeywords.includes(rule.requiresAttackerKeyword.toLowerCase())) return false
  return true
}
