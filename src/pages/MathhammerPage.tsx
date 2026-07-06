import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import { usePanelState } from '@/features/mathhammer/hooks/usePanelState'
import { UnitPanel } from '@/features/mathhammer/components/UnitPanel'
import { DamageCalculator } from '@/features/mathhammer/components/DamageCalculator'
import { resolveModifiers, mergeMods, combineAttackerMods, DEFAULT_MODS } from '@/features/mathhammer/utils/mathhammer'
import { MODIFIER_RULES, getInnateFeelNoPain } from '@/features/mathhammer/data/modifiers'
import { useAppSelector } from '@/store/hooks'
import { selectRosterById } from '@/store/rosterSlice'
import type { Weapon, ModelProfile, CombatType } from '@/types'
import type { CombatModifiers } from '@/features/mathhammer/types'

type MobileTab = 'attacker' | 'result' | 'defender'

export function MathhammerPage() {
  const gameData = useGameDataContext()
  const leftPanel = usePanelState(gameData, 'mathhammer-left-panel')
  const rightPanel = usePanelState(gameData, 'mathhammer-right-panel')
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
  const [meltaActive, setMeltaActive] = useState(false)
  const [rapidFireActive, setRapidFireActive] = useState(false)
  const [overwatchActive, setOverwatchActive] = useState(false)

  function handleQuantityChange(key: string, qty: number) {
    setWeaponQuantities(prev => ({ ...prev, [key]: qty }))
  }

  function handleClearWeapons() {
    setSelectedWeapons([])
    setWeaponQuantities({})
  }

  const attackerActiveIds = useMemo(() => new Set(attackerIdsArr), [attackerIdsArr])
  const defenderActiveIds = useMemo(() => new Set(defenderIdsArr), [defenderIdsArr])

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
        meltaActive,
        rapidFireActive,
        overwatchActive,
        weaponQuantities,
      }))
    } catch {
      // ignore storage errors (quota exceeded, private browsing)
    }
  }, [selectedWeapons, attackerIdsArr, meltaActive, rapidFireActive, overwatchActive, weaponQuantities]) // eslint-disable-line react-hooks/exhaustive-deps

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
      const defaultNames = new Set(unit.defaultWeaponNames)
      const unitMin = unit.modelCountMin
      for (const w of weapons) {
        const key = `${w.line}:${w.name}`
        if (!(key in result)) {
          result[key] = defaultNames.has(w.name.toLowerCase()) ? unitMin : 1
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
        setMeltaActive(saved.meltaActive ?? false)
        setRapidFireActive(saved.rapidFireActive ?? false)
        setOverwatchActive(saved.overwatchActive ?? false)
        setWeaponQuantities(fillMissingQtys(saved.weaponQuantities ?? {}, restoredWeapons))
      } else {
        setSelectedWeapons([])
        setAttackerIdsArr([])
        setMeltaActive(false)
        setRapidFireActive(false)
        setOverwatchActive(false)
        setWeaponQuantities({})
      }
    } catch {
      setSelectedWeapons([])
      setAttackerIdsArr([])
      setMeltaActive(false)
      setRapidFireActive(false)
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
    try {
      const raw = localStorage.getItem(`mathhammer-defender-${rightPanel.selection.datasheetId}`)
      if (raw) {
        const saved = JSON.parse(raw)
        setDefenderIdsArr(saved.activeModIds ?? [])
      } else {
        setDefenderIdsArr([])
      }
    } catch {
      setDefenderIdsArr([])
    }
  }

  // Auto-activate/deactivate an enhancement's modifier rules the moment it's equipped/changed,
  // instead of requiring a separate manual toggle click in the Reglas de Ejército list below.
  const prevAttackerEnhancementId = useRef<string | null>(null)
  useEffect(() => {
    const enhancementId = leftPanel.selection.enhancementId
    if (enhancementId === prevAttackerEnhancementId.current) return
    const prevRuleIds = MODIFIER_RULES.filter(r => r.enhancementId === prevAttackerEnhancementId.current).map(r => r.id)
    const nextRuleIds = MODIFIER_RULES.filter(r => r.enhancementId === enhancementId).map(r => r.id)
    prevAttackerEnhancementId.current = enhancementId
    setAttackerIdsArr(prev => {
      const withoutOld = prev.filter(id => !prevRuleIds.includes(id))
      return Array.from(new Set([...withoutOld, ...nextRuleIds]))
    })
  }, [leftPanel.selection.enhancementId])

  const prevDefenderEnhancementId = useRef<string | null>(null)
  useEffect(() => {
    const enhancementId = rightPanel.selection.enhancementId
    if (enhancementId === prevDefenderEnhancementId.current) return
    const prevRuleIds = MODIFIER_RULES.filter(r => r.enhancementId === prevDefenderEnhancementId.current).map(r => r.id)
    const nextRuleIds = MODIFIER_RULES.filter(r => r.enhancementId === enhancementId).map(r => r.id)
    prevDefenderEnhancementId.current = enhancementId
    setDefenderIdsArr(prev => {
      const withoutOld = prev.filter(id => !prevRuleIds.includes(id))
      return Array.from(new Set([...withoutOld, ...nextRuleIds]))
    })
  }, [rightPanel.selection.enhancementId])

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

  // Split attacker rules into "applies to any selected weapon" vs "bearer-only" (e.g.
  // enhancements phrased as "this model's melee attacks have +1 A") so a character's own
  // bonus doesn't leak onto the unit it's attached to when both share a weapon selection.
  const attackerIdsList = Array.from(attackerActiveIds)
  const attackerUnitMods = resolveModifiers(attackerIdsList, MODIFIER_RULES.filter(r => !r.bearerOnly))
  const attackerBearerMods = resolveModifiers(attackerIdsList, MODIFIER_RULES.filter(r => r.bearerOnly))
  const defenderMods = resolveModifiers(Array.from(defenderActiveIds), MODIFIER_RULES)

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

  const defenderKeywords: string[] = rightPanel.selectedUnit
    ? [...rightPanel.selectedUnit.keywords, ...rightPanel.selectedUnit.factionKeywords]
    : []
  const selectedWeaponAntiKeywords: string[] = selectedWeapons.flatMap(w =>
    w.antiEntries.map(e => e.keyword)
  )

  const mobileTabs: { id: MobileTab; label: string }[] = [
    { id: 'attacker', label: 'Atacante' },
    { id: 'result',   label: 'Resultado' },
    { id: 'defender', label: 'Defensor' },
  ]

  return (
    <div className="relative">
      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-rim-bright bg-surface-2">
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
            meltaActive={meltaActive}
            onMeltaToggle={() => setMeltaActive(v => !v)}
            rapidFireActive={rapidFireActive}
            onRapidFireToggle={() => setRapidFireActive(v => !v)}
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
            meltaActive={meltaActive}
            rapidFireActive={rapidFireActive}
            defenderMin={rightPanel.selectedUnit?.modelCountMin}
            defenderMax={rightPanel.selectedUnit?.modelCountMax}
            overwatchActive={overwatchActive}
            onOverwatchToggle={() => setOverwatchActive(v => !v)}
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
            meltaActive={meltaActive}
            onMeltaToggle={() => setMeltaActive(v => !v)}
            rapidFireActive={rapidFireActive}
            onRapidFireToggle={() => setRapidFireActive(v => !v)}
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
              meltaActive={meltaActive}
              rapidFireActive={rapidFireActive}
              defenderMin={rightPanel.selectedUnit?.modelCountMin}
              defenderMax={rightPanel.selectedUnit?.modelCountMax}
              overwatchActive={overwatchActive}
              onOverwatchToggle={() => setOverwatchActive(v => !v)}
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
