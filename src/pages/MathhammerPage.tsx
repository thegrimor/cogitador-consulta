import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import { usePanelState } from '@/features/mathhammer/hooks/usePanelState'
import { UnitPanel } from '@/features/mathhammer/components/UnitPanel'
import { DamageCalculator } from '@/features/mathhammer/components/DamageCalculator'
import { resolveModifiers, mergeMods, combineAttackerMods, DEFAULT_MODS, getInnateFeelNoPain } from '@/features/mathhammer/utils/mathhammer'
import { deriveModifierRules, isRuleApplicable } from '@/features/mathhammer/utils/deriveRules'
import { useAppSelector } from '@/store/hooks'
import { selectRosterById } from '@/store/rosterSlice'
import type { Datasheet, Weapon, ModelProfile, CombatType } from '@/types'
import type { CombatModifiers, ModifierRule } from '@/features/mathhammer/types'

type MobileTab = 'attacker' | 'result' | 'defender'

/** Ids of a datasheet's own (non-`isOption`) ability rules — these are the "habilidades
 * propias" that should be active out of the box instead of requiring a manual toggle, unlike
 * stratagems/enhancements/army rules or a mutually-exclusive option variant (e.g. a Ka'tah
 * stance) that still needs the player to pick one. */
function ownAbilityIds(rules: ModifierRule[], key: 'datasheetId' | 'leaderDatasheetId', id: string | null): string[] {
  if (!id) return []
  return rules.filter(r => r[key] === id && !r.isOption).map(r => r.id)
}

/** Whether `unit` carries an ability literally named `name` (case-insensitive) — used to check
 * for Stealth, since that ability is stored as a bare Core-rules stub with no `effect` of its
 * own — Mathhammer has no dedicated Stealth rule to toggle (the earlier `unit-stealth` universal
 * effect was removed entirely, per explicit instruction, over the same Benefit of Cover rule
 * being represented twice and double-stacking with the plain "Cobertura" toggle — see git log on
 * `public/data/catalog/core-rules.json`). A Stealth unit's benefit of cover is unconditional
 * rather than terrain-dependent, so this defaults the "cover" rule on for it instead. */
function hasAbilityNamed(unit: Datasheet | null, name: string): boolean {
  return unit?.abilities.some(a => a.name.trim().toLowerCase() === name.toLowerCase()) ?? false
}

export function MathhammerPage() {
  const gameData = useGameDataContext()
  const leftPanel = usePanelState(gameData, 'mathhammer-left-panel')
  const rightPanel = usePanelState(gameData, 'mathhammer-right-panel')
  const {
    selection: leftSelection, detachmentAbilities: leftDetachmentAbilities, applicableStratagems: leftApplicableStratagems,
    selectedUnit: leftSelectedUnit, selectedCharacter: leftSelectedCharacter, rosterIds: leftRosterIds,
  } = leftPanel
  const {
    selection: rightSelection, detachmentAbilities: rightDetachmentAbilities, applicableStratagems: rightApplicableStratagems,
    selectedUnit: rightSelectedUnit, selectedCharacter: rightSelectedCharacter, rosterIds: rightRosterIds,
  } = rightPanel
  const leftRules = useMemo(
    () => deriveModifierRules(gameData, {
      selection: leftSelection, detachmentAbilities: leftDetachmentAbilities, applicableStratagems: leftApplicableStratagems,
      selectedUnit: leftSelectedUnit, selectedCharacter: leftSelectedCharacter, rosterIds: leftRosterIds,
    }),
    [gameData, leftSelection, leftDetachmentAbilities, leftApplicableStratagems, leftSelectedUnit, leftSelectedCharacter, leftRosterIds],
  )
  const rightRules = useMemo(
    () => deriveModifierRules(gameData, {
      selection: rightSelection, detachmentAbilities: rightDetachmentAbilities, applicableStratagems: rightApplicableStratagems,
      selectedUnit: rightSelectedUnit, selectedCharacter: rightSelectedCharacter, rosterIds: rightRosterIds,
    }),
    [gameData, rightSelection, rightDetachmentAbilities, rightApplicableStratagems, rightSelectedUnit, rightSelectedCharacter, rightRosterIds],
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const presetRosterId = searchParams.get('roster')
  const presetRoster = useAppSelector(state =>
    presetRosterId ? selectRosterById(state, presetRosterId) : undefined,
  )

  // Apply attacker preselection from query params (links from datasheet/roster pages), then clear the URL
  useEffect(() => {
    const faction = searchParams.get('faction')
    const datasheet = searchParams.get('datasheet')
    const detachmentsParam = searchParams.get('detachments')
    const detachmentParam = searchParams.get('detachment') // legacy single-detachment param
    const character = searchParams.get('character')
    if (!faction || !datasheet) return

    leftPanel.selectFaction(faction)
    const detachmentIds = detachmentsParam
      ? detachmentsParam.split(',').filter(Boolean)
      : detachmentParam ? [detachmentParam] : []
    if (detachmentIds.length) leftPanel.selectDetachments(detachmentIds)
    leftPanel.selectUnit(datasheet)
    if (character) leftPanel.selectCharacter(character)
    if (presetRoster) {
      const ids = Array.from(new Set(presetRoster.entries.map(e => e.datasheetId)))
      leftPanel.setRosterIds(ids)
    }
    setSearchParams({}, { replace: true })
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedWeapons, setSelectedWeapons] = useState<Weapon[]>([])
  const [weaponQuantities, setWeaponQuantities] = useState<Record<string, number>>({})
  const [defenderModel, setDefenderModel] = useState<ModelProfile | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>('attacker')
  const [combatType, setCombatType] = useLocalStorage<CombatType>('mathhammer-combat-type', 'ranged')
  const [attackerIdsArr, setAttackerIdsArr] = useState<string[]>([])
  const [defenderIdsArr, setDefenderIdsArr] = useState<string[]>([])
  const [meltaActiveKeys, setMeltaActiveKeys] = useState<string[]>([])
  const [rapidFireActiveKeys, setRapidFireActiveKeys] = useState<string[]>([])
  const [overwatchActive, setOverwatchActive] = useState(false)

  function handleQuantityChange(key: string, qty: number) {
    setWeaponQuantities(prev => ({ ...prev, [key]: qty }))
  }

  function toggleKey(list: string[], key: string): string[] {
    return list.includes(key) ? list.filter(k => k !== key) : [...list, key]
  }

  function handleClearWeapons() {
    setSelectedWeapons([])
    setWeaponQuantities({})
  }

  const attackerActiveIds = useMemo(() => new Set(attackerIdsArr), [attackerIdsArr])
  const defenderActiveIds = useMemo(() => new Set(defenderIdsArr), [defenderIdsArr])

  // Rule-visibility context — mirrors UnitPanel's own `visibleRules` filter (see
  // isRuleApplicable in deriveRules.ts). A modifier the player toggled on can fall out of
  // scope later without them un-toggling it (e.g. switching the selected weapon from melee to
  // ranged after activating a melee-only Ka'tah stance, or deselecting the weapon that made an
  // ANTI-keyword rule available) — resolveModifiers must only honor ids whose rule is still
  // applicable here, or a rule no longer shown in the panel keeps silently affecting combat
  // types/targets it was never meant for. Computed up here (rather than just before the render)
  // so the restore-on-select logic below can also use `applicableRightRules` to seed FNP/Stealth
  // defaults for whichever rules are actually in scope for the selected defender.
  const defenderKeywords: string[] = rightPanel.selectedUnit
    ? [...rightPanel.selectedUnit.keywords, ...rightPanel.selectedUnit.factionKeywords]
    : []
  const attackerKeywords: string[] = leftPanel.selectedUnit
    ? [...leftPanel.selectedUnit.keywords, ...leftPanel.selectedUnit.factionKeywords]
    : []
  const selectedWeaponAntiKeywords: string[] = selectedWeapons.flatMap(w =>
    w.antiEntries.map(e => e.keyword)
  )
  const leftRuleCtx = {
    isAttacker: true,
    enhancementId: leftPanel.selection.enhancementId,
    combatType,
    anySelectedHeavy: selectedWeapons.some(w => w.isHeavy),
    anySelectedLance: selectedWeapons.some(w => w.isLance),
    anySelectedTorrent: selectedWeapons.some(w => w.isTorrent),
    anySelectedIndirect: selectedWeapons.some(w => w.isIndirectFire),
    anySelectedPsychic: selectedWeapons.some(w => w.isPsychic),
    weaponAntiKeywords: selectedWeaponAntiKeywords,
    defenderKeywords,
    attackerKeywords,
  }
  // The defender panel doesn't track a weapon selection of its own (see the right-side
  // UnitPanel instantiation below, which passes none) — so the weapon-conditional and
  // ANTI-keyword fields UnitPanel would default to empty/false stay that way here too.
  const rightRuleCtx = {
    isAttacker: false,
    enhancementId: rightPanel.selection.enhancementId,
    combatType,
    anySelectedHeavy: false,
    anySelectedLance: false,
    anySelectedTorrent: false,
    anySelectedIndirect: false,
    anySelectedPsychic: false,
    weaponAntiKeywords: [] as string[],
    defenderKeywords: [] as string[],
    attackerKeywords: defenderKeywords,
  }
  const applicableLeftRules = leftRules.filter(r => isRuleApplicable(r, leftRuleCtx))
  const applicableRightRules = rightRules.filter(r => isRuleApplicable(r, rightRuleCtx))

  // Derive combatType from first selected weapon
  const firstWeaponRange = selectedWeapons[0]?.range ?? null
  const [syncedWeaponRange, setSyncedWeaponRange] = useState<string | null>(null)
  if (firstWeaponRange !== syncedWeaponRange && firstWeaponRange !== null) {
    setSyncedWeaponRange(firstWeaponRange)
    const isRanged = firstWeaponRange !== 'Melee'
    setCombatType(isRanged ? 'ranged' : 'melee')
    if (!isRanged) setOverwatchActive(false)
  }

  // Save all attacker unit-state together under a per-unit key
  // (datasheetId excluded from deps intentionally — we read it at call time to avoid
  //  saving stale weapons from the previous unit when the key changes)
  useEffect(() => {
    const id = leftPanel.selection.datasheetId
    if (!id) return
    try {
      localStorage.setItem(`mathhammer-attacker-${id}`, JSON.stringify({
        weaponLines: selectedWeapons.map(w => w.line),
        activeModIds: attackerIdsArr,
        meltaActiveKeys,
        rapidFireActiveKeys,
        overwatchActive,
        weaponQuantities,
      }))
    } catch {
      // ignore storage errors (quota exceeded, private browsing)
    }
  }, [selectedWeapons, attackerIdsArr, meltaActiveKeys, rapidFireActiveKeys, overwatchActive, weaponQuantities]) // eslint-disable-line react-hooks/exhaustive-deps

  // Restore attacker state when the selected unit resolves (page load or unit change)
  const [restoredAttackerId, setRestoredAttackerId] = useState<string | null>(null)
  if (leftPanel.selectedUnit && leftPanel.selection.datasheetId && leftPanel.selection.datasheetId !== restoredAttackerId) {
    setRestoredAttackerId(leftPanel.selection.datasheetId)

    const unit = leftPanel.selectedUnit
    function fillMissingQtys(
      qty: Record<string, number>,
      weapons: Weapon[],
    ): Record<string, number> {
      const result = { ...qty }
      const defaultCounts = new Map(unit.defaultWeaponNames.map(d => [d.name, d.count]))
      const unitMin = unit.modelCountMin
      for (const w of weapons) {
        // Matches UnitPanel/DamageCalculator's wKey scheme — these are always unit weapons
        // (restoredWeapons is filtered from unit.weapons below), never the attached character's.
        const key = `unit:${w.line}:${w.name}`
        if (!(key in result)) {
          const perModel = defaultCounts.get(w.name.toLowerCase())
          result[key] = perModel !== undefined ? perModel * unitMin : 1
        }
      }
      return result
    }

    try {
      const raw = localStorage.getItem(`mathhammer-attacker-${leftPanel.selection.datasheetId}`)
      if (raw) {
        const saved = JSON.parse(raw)
        const restoredWeapons = unit.weapons.filter(w => (saved.weaponLines ?? []).includes(w.line))
        setSelectedWeapons(restoredWeapons)
        setAttackerIdsArr(saved.activeModIds ?? [])
        setMeltaActiveKeys(saved.meltaActiveKeys ?? [])
        setRapidFireActiveKeys(saved.rapidFireActiveKeys ?? [])
        setOverwatchActive(saved.overwatchActive ?? false)
        setWeaponQuantities(fillMissingQtys(saved.weaponQuantities ?? {}, restoredWeapons))
      } else {
        setSelectedWeapons([])
        setAttackerIdsArr(ownAbilityIds(leftRules, 'datasheetId', unit.id))
        setMeltaActiveKeys([])
        setRapidFireActiveKeys([])
        setOverwatchActive(false)
        setWeaponQuantities({})
      }
    } catch {
      setSelectedWeapons([])
      setAttackerIdsArr(ownAbilityIds(leftRules, 'datasheetId', unit.id))
      setMeltaActiveKeys([])
      setRapidFireActiveKeys([])
      setOverwatchActive(false)
      setWeaponQuantities({})
    }
  }

  // Save defender modifier IDs per unit
  useEffect(() => {
    const id = rightPanel.selection.datasheetId
    if (!id) return
    try {
      localStorage.setItem(`mathhammer-defender-${id}`, JSON.stringify({ activeModIds: defenderIdsArr }))
    } catch {
      // ignore storage errors (quota exceeded, private browsing)
    }
  }, [defenderIdsArr]) // eslint-disable-line react-hooks/exhaustive-deps

  // Restore defender modifier IDs when defender unit resolves
  const [restoredDefenderId, setRestoredDefenderId] = useState<string | null>(null)
  if (rightPanel.selectedUnit && rightPanel.selection.datasheetId && rightPanel.selection.datasheetId !== restoredDefenderId) {
    setRestoredDefenderId(rightPanel.selection.datasheetId)

    // Default-active for a defender with no saved state: its own abilities (this already
    // covers the unit's own Feel No Pain if that's how the datasheet models it, e.g. "Feel No
    // Pain 5+" or "Living Fortress" — a FNP grant from a Detachment Ability or Army Rule stays
    // a manual toggle, deliberately not defaulted here), and — since a unit having Stealth is a
    // fixed property of the datasheet, not a battlefield situation like actual terrain — the
    // universal "Cobertura" (Cover) rule if the unit has the Stealth ability (Mathhammer has no
    // separate Stealth toggle of its own; see `hasAbilityNamed` above).
    function defaultDefenderIds(): string[] {
      const coverIds = hasAbilityNamed(rightPanel.selectedUnit, 'Stealth')
        ? applicableRightRules.filter(r => r.id === 'cover').map(r => r.id)
        : []
      return Array.from(new Set([
        ...ownAbilityIds(rightRules, 'datasheetId', rightPanel.selection.datasheetId),
        ...coverIds,
      ]))
    }

    try {
      const raw = localStorage.getItem(`mathhammer-defender-${rightPanel.selection.datasheetId}`)
      if (raw) {
        const saved = JSON.parse(raw)
        setDefenderIdsArr(saved.activeModIds ?? [])
      } else {
        setDefenderIdsArr(defaultDefenderIds())
      }
    } catch {
      setDefenderIdsArr(defaultDefenderIds())
    }
  }

  // Auto-activate/deactivate an enhancement's modifier rules the moment it's equipped/changed,
  // instead of requiring a separate manual toggle click in the Reglas de Ejército list below.
  const prevAttackerEnhancementId = useRef<string | null>(null)
  useEffect(() => {
    const enhancementId = leftPanel.selection.enhancementId
    if (enhancementId === prevAttackerEnhancementId.current) return
    const prevRuleIds = leftRules.filter(r => r.enhancementId === prevAttackerEnhancementId.current).map(r => r.id)
    const nextRuleIds = leftRules.filter(r => r.enhancementId === enhancementId).map(r => r.id)
    prevAttackerEnhancementId.current = enhancementId
    setAttackerIdsArr(prev => {
      const withoutOld = prev.filter(id => !prevRuleIds.includes(id))
      return Array.from(new Set([...withoutOld, ...nextRuleIds]))
    })
  }, [leftPanel.selection.enhancementId, leftRules])

  const prevDefenderEnhancementId = useRef<string | null>(null)
  useEffect(() => {
    const enhancementId = rightPanel.selection.enhancementId
    if (enhancementId === prevDefenderEnhancementId.current) return
    const prevRuleIds = rightRules.filter(r => r.enhancementId === prevDefenderEnhancementId.current).map(r => r.id)
    const nextRuleIds = rightRules.filter(r => r.enhancementId === enhancementId).map(r => r.id)
    prevDefenderEnhancementId.current = enhancementId
    setDefenderIdsArr(prev => {
      const withoutOld = prev.filter(id => !prevRuleIds.includes(id))
      return Array.from(new Set([...withoutOld, ...nextRuleIds]))
    })
  }, [rightPanel.selection.enhancementId, rightRules])

  // Same auto-activation, but for an attached character's own abilities: the moment a
  // character is attached (or swapped/detached), its own (non-option) ability rules turn on
  // by default — "habilidades propias del personaje" shouldn't need a manual toggle click.
  const prevAttackerCharacterId = useRef<string | null>(null)
  useEffect(() => {
    const characterId = leftPanel.selection.characterId
    if (characterId === prevAttackerCharacterId.current) return
    const prevRuleIds = ownAbilityIds(leftRules, 'leaderDatasheetId', prevAttackerCharacterId.current)
    const nextRuleIds = ownAbilityIds(leftRules, 'leaderDatasheetId', characterId)
    prevAttackerCharacterId.current = characterId
    setAttackerIdsArr(prev => {
      const withoutOld = prev.filter(id => !prevRuleIds.includes(id))
      return Array.from(new Set([...withoutOld, ...nextRuleIds]))
    })
  }, [leftPanel.selection.characterId, leftRules])

  const prevDefenderCharacterId = useRef<string | null>(null)
  useEffect(() => {
    const characterId = rightPanel.selection.characterId
    if (characterId === prevDefenderCharacterId.current) return
    const prevRuleIds = ownAbilityIds(rightRules, 'leaderDatasheetId', prevDefenderCharacterId.current)
    const nextRuleIds = ownAbilityIds(rightRules, 'leaderDatasheetId', characterId)
    prevDefenderCharacterId.current = characterId
    setDefenderIdsArr(prev => {
      const withoutOld = prev.filter(id => !prevRuleIds.includes(id))
      return Array.from(new Set([...withoutOld, ...nextRuleIds]))
    })
  }, [rightPanel.selection.characterId, rightRules])

  function toggleAttackerModifier(id: string) {
    setAttackerIdsArr(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return Array.from(next)
    })
  }

  function toggleDefenderModifier(id: string) {
    setDefenderIdsArr(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return Array.from(next)
    })
  }

  // Swap attacker/defender: swaps which faction/detachment/unit/character/enhancement sits
  // on each side and lets the existing per-unit restore effects (above) repopulate that
  // side's weapons/modifiers from whatever was last saved for the newly-placed unit — no
  // manual copying of weapon/modifier state needed. Only the defender's chosen model index
  // is reset here since it isn't unit-keyed and would otherwise point at a model profile
  // belonging to the unit that just left the defender side.
  function handleSwapSides() {
    const prevLeftSelection = leftPanel.selection
    const prevRightSelection = rightPanel.selection
    const prevLeftRosterIds = leftPanel.rosterIds
    const prevRightRosterIds = rightPanel.rosterIds
    leftPanel.replaceSelection(prevRightSelection)
    rightPanel.replaceSelection(prevLeftSelection)
    leftPanel.setRosterIds(prevRightRosterIds)
    rightPanel.setRosterIds(prevLeftRosterIds)
    setDefenderModel(null)
  }

  // Split attacker rules into "applies to any selected weapon" vs "bearer-only" (e.g.
  // enhancements phrased as "this model's melee attacks have +1 A") so a character's own
  // bonus doesn't leak onto the unit it's attached to when both share a weapon selection.
  const attackerIdsList = Array.from(attackerActiveIds)
  const attackerUnitMods = resolveModifiers(attackerIdsList, applicableLeftRules.filter(r => !r.bearerOnly))
  const attackerBearerMods = resolveModifiers(attackerIdsList, applicableLeftRules.filter(r => r.bearerOnly))
  const defenderMods = resolveModifiers(Array.from(defenderActiveIds), applicableRightRules)

  // When no character is attached, the selected unit IS the bearer — bearer-only effects
  // apply to it directly, same as a unit-wide effect would.
  const hasAttachedCharacter = leftPanel.selection.characterId !== null
  const attackerEffectiveUnitMods = hasAttachedCharacter
    ? attackerUnitMods
    : combineAttackerMods(attackerUnitMods, attackerBearerMods)
  // An attached leader still benefits from unit-wide auras of the unit it's leading,
  // on top of its own bearer-only bonus.
  const attackerLeaderMods = hasAttachedCharacter
    ? combineAttackerMods(attackerUnitMods, attackerBearerMods)
    : attackerEffectiveUnitMods

  // Merge: defender contributes penalty modifiers into the attacker's calculation.
  // mergeMods also folds in bsMod/wsMod/strengthMod/damageMod from the defender side
  // (e.g. Stealth, Cover, and similar defensive abilities), which the previous inline
  // merge here silently dropped.
  const mergedUnit = mergeMods(DEFAULT_MODS, attackerEffectiveUnitMods, defenderMods)
  const mergedLeader = mergeMods(DEFAULT_MODS, attackerLeaderMods, defenderMods)

  // A model's own 'Feel No Pain X+' Core ability (CSV-driven) is unconditional — it always
  // applies while that unit is the defender, unlike stratagem/leader/aura FNP which are opt-in
  // toggles above. Combine with whichever is best if both are active (only one FNP applies).
  // This doesn't depend on which attacker weapon is selected, so it's folded into both variants.
  const innateFnp = getInnateFeelNoPain(rightPanel.selectedUnit)
  function withInnateFnp(m: CombatModifiers): CombatModifiers {
    const combinedFnp = innateFnp === null
      ? m.feelNoPainThreshold
      : m.feelNoPainThreshold === null
        ? innateFnp
        : Math.min(m.feelNoPainThreshold, innateFnp)
    return { ...m, feelNoPainThreshold: combinedFnp }
  }

  const mods = {
    ...withInnateFnp(mergedUnit),
    overwatchHit: overwatchActive,
  }
  const leaderMods = {
    ...withInnateFnp(mergedLeader),
    overwatchHit: overwatchActive,
  }
  const leaderWeapons = hasAttachedCharacter ? leftPanel.selectedCharacter?.weapons : undefined

  const effectiveDefenderModel = defenderModel ?? rightPanel.selectedUnit?.models[0] ?? null
  const attackerName = leftPanel.selectedUnit?.name ?? ''
  const defenderName = rightPanel.selectedUnit?.name ?? ''

  const mobileTabs: { id: MobileTab; label: string }[] = [
    { id: 'attacker', label: 'Atacante' },
    { id: 'result',   label: 'Resultado' },
    { id: 'defender', label: 'Defensor' },
  ]

  return (
    <div className="relative">
      {/* Mobile tab bar */}
      <div
        className="md:hidden flex sticky z-20 border-b border-rim-bright bg-surface-2"
        style={{ top: 'var(--header-h, 2.5rem)' }}
      >
        {mobileTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={`flex-1 py-2 text-[9px] font-display uppercase tracking-widest transition-colors ${
              mobileTab === tab.id
                ? 'text-gold border-b-2 border-gold'
                : 'text-parchment-dim hover:text-parchment'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile content */}
      <div className="md:hidden">
        {mobileTab === 'attacker' && (
          <UnitPanel
            gameData={gameData}
            panel={leftPanel}
            side="left"
            onWeaponsChange={setSelectedWeapons}
            selectedWeapons={selectedWeapons}
            weaponQuantities={weaponQuantities}
            onQuantityChange={handleQuantityChange}
            onClearWeapons={handleClearWeapons}
            combatType={combatType}
            activeModifierIds={attackerActiveIds}
            onModifierToggle={toggleAttackerModifier}
            weaponAntiKeywords={selectedWeaponAntiKeywords}
            defenderKeywords={defenderKeywords}
            meltaActiveKeys={meltaActiveKeys}
            onMeltaToggle={key => setMeltaActiveKeys(prev => toggleKey(prev, key))}
            rapidFireActiveKeys={rapidFireActiveKeys}
            onRapidFireToggle={key => setRapidFireActiveKeys(prev => toggleKey(prev, key))}
          />
        )}
        {mobileTab === 'result' && (
          <DamageCalculator
            weapons={selectedWeapons}
            weaponQuantities={weaponQuantities}
            defenderModel={effectiveDefenderModel}
            defenderKeywords={defenderKeywords}
            attackerName={attackerName}
            defenderName={defenderName}
            mods={mods}
            leaderMods={leaderMods}
            leaderWeapons={leaderWeapons}
            combatType={combatType}
            onCombatTypeChange={setCombatType}
            unitMin={leftPanel.selectedUnit?.modelCountMin}
            unitMax={leftPanel.selectedUnit?.modelCountMax}
            meltaActiveKeys={meltaActiveKeys}
            rapidFireActiveKeys={rapidFireActiveKeys}
            defenderMin={rightPanel.selectedUnit?.modelCountMin}
            defenderMax={rightPanel.selectedUnit?.modelCountMax}
            overwatchActive={overwatchActive}
            onOverwatchToggle={() => setOverwatchActive(v => !v)}
            onSwapSides={handleSwapSides}
          />
        )}
        {mobileTab === 'defender' && (
          <UnitPanel
            gameData={gameData}
            panel={rightPanel}
            side="right"
            onModelChange={setDefenderModel}
            combatType={combatType}
            activeModifierIds={defenderActiveIds}
            onModifierToggle={toggleDefenderModifier}
          />
        )}
      </div>

      {/* Desktop 3-column layout */}
      <div className="hidden md:grid md:grid-cols-[1fr_280px_1fr] min-h-[calc(100vh-2.5rem)]">
        <div className="border-r border-rim-bright overflow-y-auto">
          <UnitPanel
            gameData={gameData}
            panel={leftPanel}
            side="left"
            onWeaponsChange={setSelectedWeapons}
            selectedWeapons={selectedWeapons}
            weaponQuantities={weaponQuantities}
            onQuantityChange={handleQuantityChange}
            onClearWeapons={handleClearWeapons}
            combatType={combatType}
            activeModifierIds={attackerActiveIds}
            onModifierToggle={toggleAttackerModifier}
            weaponAntiKeywords={selectedWeaponAntiKeywords}
            defenderKeywords={defenderKeywords}
            meltaActiveKeys={meltaActiveKeys}
            onMeltaToggle={key => setMeltaActiveKeys(prev => toggleKey(prev, key))}
            rapidFireActiveKeys={rapidFireActiveKeys}
            onRapidFireToggle={key => setRapidFireActiveKeys(prev => toggleKey(prev, key))}
          />
        </div>
        <div className="border-r border-rim-bright overflow-y-auto bg-surface-2">
          <div className="sticky top-10 max-h-[calc(100vh-2.5rem)] overflow-y-auto">
            <DamageCalculator
              weapons={selectedWeapons}
              weaponQuantities={weaponQuantities}
              defenderModel={effectiveDefenderModel}
              defenderKeywords={defenderKeywords}
              attackerName={attackerName}
              defenderName={defenderName}
              mods={mods}
              leaderMods={leaderMods}
              leaderWeapons={leaderWeapons}
              combatType={combatType}
              onCombatTypeChange={setCombatType}
              unitMin={leftPanel.selectedUnit?.modelCountMin}
              unitMax={leftPanel.selectedUnit?.modelCountMax}
              meltaActiveKeys={meltaActiveKeys}
              rapidFireActiveKeys={rapidFireActiveKeys}
              defenderMin={rightPanel.selectedUnit?.modelCountMin}
              defenderMax={rightPanel.selectedUnit?.modelCountMax}
              overwatchActive={overwatchActive}
              onOverwatchToggle={() => setOverwatchActive(v => !v)}
              onSwapSides={handleSwapSides}
            />
          </div>
        </div>
        <div className="overflow-y-auto">
          <UnitPanel
            gameData={gameData}
            panel={rightPanel}
            side="right"
            onModelChange={setDefenderModel}
            combatType={combatType}
            activeModifierIds={defenderActiveIds}
            onModifierToggle={toggleDefenderModifier}
          />
        </div>
      </div>
    </div>
  )
}
