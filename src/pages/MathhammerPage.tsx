import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import { usePanelState } from '@/features/mathhammer/hooks/usePanelState'
import { UnitPanel } from '@/features/mathhammer/components/UnitPanel'
import { DamageCalculator } from '@/features/mathhammer/components/DamageCalculator'
import { resolveModifiers } from '@/features/mathhammer/utils/mathhammer'
import { MODIFIER_RULES } from '@/features/mathhammer/data/modifiers'
import { useAppSelector } from '@/store/hooks'
import { selectRosterById } from '@/store/rosterSlice'
import type { Weapon, ModelProfile, CombatType } from '@/types'

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
    const detachment = searchParams.get('detachment')
    if (!faction || !datasheet) return

    leftPanel.selectFaction(faction)
    if (detachment) leftPanel.selectDetachments([detachment])
    leftPanel.selectUnit(datasheet)
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
        overwatchActive,
        weaponQuantities,
      }))
    } catch {
      // ignore storage errors (quota exceeded, private browsing)
    }
  }, [selectedWeapons, attackerIdsArr, meltaActive, overwatchActive, weaponQuantities]) // eslint-disable-line react-hooks/exhaustive-deps

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
        setOverwatchActive(saved.overwatchActive ?? false)
        setWeaponQuantities(fillMissingQtys(saved.weaponQuantities ?? {}, restoredWeapons))
      } else {
        setSelectedWeapons([])
        setAttackerIdsArr([])
        setMeltaActive(false)
        setOverwatchActive(false)
        setWeaponQuantities({})
      }
    } catch {
      setSelectedWeapons([])
      setAttackerIdsArr([])
      setMeltaActive(false)
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

  const attackerMods = resolveModifiers(Array.from(attackerActiveIds), MODIFIER_RULES)
  const defenderMods = resolveModifiers(Array.from(defenderActiveIds), MODIFIER_RULES)

  // Merge: defender contributes penalty modifiers into the attacker's calculation
  const mods = {
    ...attackerMods,
    hitMod:              attackerMods.hitMod + defenderMods.hitMod,
    woundMod:            attackerMods.woundMod + defenderMods.woundMod,
    apMod:               attackerMods.apMod + defenderMods.apMod,
    saveMod:             attackerMods.saveMod + defenderMods.saveMod,
    damageReduction:     attackerMods.damageReduction + defenderMods.damageReduction,
    feelNoPainThreshold:
      defenderMods.feelNoPainThreshold !== null
        ? defenderMods.feelNoPainThreshold
        : attackerMods.feelNoPainThreshold,
    overwatchHit: overwatchActive,
  }

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
            combatType={combatType}
            onCombatTypeChange={setCombatType}
            unitMin={leftPanel.selectedUnit?.modelCountMin}
            unitMax={leftPanel.selectedUnit?.modelCountMax}
            meltaActive={meltaActive}
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
              combatType={combatType}
              onCombatTypeChange={setCombatType}
              unitMin={leftPanel.selectedUnit?.modelCountMin}
              unitMax={leftPanel.selectedUnit?.modelCountMax}
              meltaActive={meltaActive}
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
