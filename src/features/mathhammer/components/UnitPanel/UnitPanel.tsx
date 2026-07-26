import { useState, useMemo } from 'react'
import { UnitSelector } from '../UnitSelector'
import { StatsBar } from '../StatsBar'
import { WeaponCard } from '../WeaponCard'
import { AbilityList } from '../AbilityList'
import { StratList } from '../StratList'
import { ModifierPanel } from '../ModifierPanel'
import { deriveModifierRules } from '../../utils/deriveRules'
import { parseBcpList } from '../../utils/parseBcpList'
import type { GameData, Weapon, ModelProfile, CombatType, Datasheet } from '@/types'
import type { PanelState } from '../../hooks/usePanelState'

function wKey(w: Weapon): string {
  return `${w.line}:${w.name}`
}

interface Props {
  gameData: GameData
  panel: PanelState
  side: 'left' | 'right'
  onWeaponsChange?: (ws: Weapon[]) => void
  onModelChange?: (m: ModelProfile | null) => void
  selectedWeapons?: Weapon[]
  weaponQuantities?: Record<string, number>
  onQuantityChange?: (key: string, qty: number) => void
  onClearWeapons?: () => void
  combatType?: CombatType
  activeModifierIds?: Set<string>
  onModifierToggle?: (id: string) => void
  weaponAntiKeywords?: string[]
  defenderKeywords?: string[]
  /** Keys (wKey format) of weapons whose Melta/Rapid Fire half-range bonus is currently
   * active — one independent toggle per selected weapon, since X varies per weapon. */
  meltaActiveKeys?: string[]
  onMeltaToggle?: (key: string) => void
  rapidFireActiveKeys?: string[]
  onRapidFireToggle?: (key: string) => void
}

export function UnitPanel({
  gameData, panel, side, onWeaponsChange, onModelChange, selectedWeapons = [],
  weaponQuantities = {}, onQuantityChange, onClearWeapons,
  combatType = 'ranged', activeModifierIds, onModifierToggle,
  weaponAntiKeywords = [], defenderKeywords = [],
  meltaActiveKeys = [], onMeltaToggle,
  rapidFireActiveKeys = [], onRapidFireToggle,
}: Props) {
  const [modelIdx, setModelIdx] = useState(0)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const { selectedUnit, detachmentAbilities, applicableStratagems, selectedCharacter, rosterIds, selection } = panel
  const isAttacker = side === 'left'

  function handleImport() {
    const parsed = parseBcpList(importText)
    if (!parsed) { setImportError('Formato no reconocido'); return }

    const faction = gameData.factions.find(
      f => f.name.toLowerCase() === parsed.factionName.toLowerCase()
    )
    if (!faction) { setImportError(`Ejército no encontrado: "${parsed.factionName}"`); return }

    const detachment = gameData.detachments.find(
      d => d.factionId === faction.id &&
           d.name.toLowerCase() === parsed.detachmentName.toLowerCase()
    )

    const matchedIds = parsed.unitNames
      .map(name => gameData.datasheets.find(
        (ds: Datasheet) => ds.factionId === faction.id &&
              ds.name.toLowerCase() === name.toLowerCase()
      ))
      .filter((ds): ds is Datasheet => ds !== undefined)
      .map((ds: Datasheet) => ds.id)

    panel.selectFaction(faction.id)
    if (detachment) panel.selectDetachments([detachment.id])
    panel.setRosterIds(matchedIds)
    setShowImport(false)
    setImportError(null)
    setImportText('')
  }

  function handleModelSelect(i: number) {
    setModelIdx(i)
    onModelChange?.(selectedUnit?.models[i] ?? null)
  }

  function handleWeaponSelect(w: Weapon) {
    if (!isAttacker || !onWeaponsChange) return
    const exists = selectedWeapons.some(x => x.name === w.name && x.line === w.line)
    if (exists) {
      onWeaponsChange(selectedWeapons.filter(x => !(x.name === w.name && x.line === w.line)))
    } else {
      const isMelee = w.range === 'Melee'
      const sameType = selectedWeapons.filter(x => (x.range === 'Melee') === isMelee)
      onWeaponsChange([...sameType, w])
      // Persist the computed default so DamageCalculator sees it immediately
      if (onQuantityChange && !(wKey(w) in weaponQuantities)) {
        onQuantityChange(wKey(w), defaultQtyFor(w))
      }
    }
  }

  const anySelectedHeavy       = selectedWeapons.some(w => w.isHeavy)
  const anySelectedLance       = selectedWeapons.some(w => w.isLance)
  const anySelectedTorrent     = selectedWeapons.some(w => w.isTorrent)
  const anySelectedIndirect    = selectedWeapons.some(w => w.isIndirectFire)
  const anySelectedPsychic     = selectedWeapons.some(w => w.isPsychic)

  const heavyModActive = activeModifierIds?.has('weapon-heavy') ?? false

  function handleHeavyToggle() {
    onModifierToggle?.('weapon-heavy')
  }

  const characterDatasheet = panel.selectedCharacter

  const unitMax = selectedUnit?.modelCountMax
  const unitMin = selectedUnit?.modelCountMin

  const defaultWeaponCounts = useMemo(
    () => new Map((selectedUnit?.defaultWeaponNames ?? []).map(d => [d.name, d.count])),
    [selectedUnit],
  )

  function defaultQtyFor(w: Weapon): number {
    const perModel = defaultWeaponCounts.get(w.name.toLowerCase())
    return perModel !== undefined ? perModel * (unitMin ?? 1) : 1
  }

  function getQty(w: Weapon): number {
    return weaponQuantities[wKey(w)] ?? defaultQtyFor(w)
  }

  function adjustQty(w: Weapon, delta: number, maxQty: number) {
    if (!onQuantityChange) return
    const current = getQty(w)
    const next = Math.max(1, Math.min(maxQty, current + delta))
    onQuantityChange(wKey(w), next)
  }

  const attackerKeywords = useMemo(
    () => selectedUnit
      ? [...selectedUnit.keywords, ...selectedUnit.factionKeywords].map(k => k.toLowerCase())
      : [],
    [selectedUnit],
  )

  const baseRules = useMemo(
    () => deriveModifierRules(gameData, { selection, detachmentAbilities, applicableStratagems, selectedUnit, selectedCharacter, rosterIds }),
    [gameData, selection, detachmentAbilities, applicableStratagems, selectedUnit, selectedCharacter, rosterIds],
  )

  const visibleRules = useMemo(() => {
    const { enhancementId } = selection
    const defKwLower = defenderKeywords.map(k => k.toLowerCase())
    return baseRules.filter(rule => {
      const ruleTarget = rule.target ?? 'attacker'
      if (isAttacker && ruleTarget === 'defender') return false
      if (!isAttacker && ruleTarget === 'attacker') return false
      if (rule.enhancementId && rule.enhancementId !== enhancementId) return false
      if (rule.combatType && rule.combatType !== combatType) return false
      if (rule.id === 'weapon-heavy'       && !anySelectedHeavy)      return false
      if (rule.id === 'weapon-lance'       && !anySelectedLance)      return false
      if (rule.id === 'weapon-torrent'     && !anySelectedTorrent)    return false
      if (rule.id === 'weapon-indirect'    && !anySelectedIndirect)   return false
      if (rule.id === 'weapon-psychic'     && !anySelectedPsychic)    return false
      if (rule.requiresAntiKeyword && !weaponAntiKeywords.includes(rule.requiresAntiKeyword)) return false
      if (rule.requiresTargetKeyword && !defKwLower.includes(rule.requiresTargetKeyword.toLowerCase())) return false
      if (rule.requiresAttackerKeyword && !attackerKeywords.includes(rule.requiresAttackerKeyword.toLowerCase())) return false
      return true
    })
  }, [baseRules, isAttacker, selection, combatType, anySelectedHeavy, anySelectedLance, anySelectedTorrent, anySelectedIndirect, anySelectedPsychic, weaponAntiKeywords, defenderKeywords, attackerKeywords])

  const halfRangeWeapons = useMemo(
    () => selectedWeapons.filter(w => w.isMelta || w.rapidFireValue !== ''),
    [selectedWeapons],
  )

  const roleLabel = selectedUnit?.role ? ` · ${selectedUnit.role}` : ''

  return (
    <div className="flex flex-col">
      {/* Panel header */}
      <div className={`px-3 py-2 border-b-2 ${isAttacker ? 'border-crimson' : 'border-gold'} bg-surface-2`}>
        <span className={`text-[10px] font-display uppercase tracking-[4px] ${isAttacker ? 'text-crimson' : 'text-gold'}`}>
          {isAttacker ? 'Atacante' : 'Defensor'}
        </span>
        {selectedUnit && (
          <span className="text-[9px] font-mono text-parchment-dim ml-2">{selectedUnit.name}{roleLabel}</span>
        )}
      </div>

      {/* Importar lista BCP */}
      <div className="border-b border-rim-bright">
        <div className="flex items-center gap-2 px-3 py-1.5">
          <button
            onClick={() => setShowImport(v => !v)}
            className="flex-1 flex items-center justify-between text-[9px] font-display uppercase tracking-widest text-parchment-dim hover:text-parchment transition-colors"
          >
            <span>Lista BCP</span>
            <span>{showImport ? '▴' : '▾'}</span>
          </button>
          {panel.rosterIds !== null && (
            <>
              <span className="text-[8px] font-mono bg-gold/20 text-gold-bright px-1.5 border border-gold/40">
                {panel.rosterIds.length} uds.
              </span>
              <button
                onClick={() => panel.setRosterIds(null)}
                className="text-[9px] font-display uppercase tracking-widest text-parchment-dim hover:text-crimson transition-colors px-1"
              >
                Limpiar
              </button>
            </>
          )}
        </div>
        {showImport && (
          <div className="px-3 pb-3 flex flex-col gap-2">
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Pega aquí tu lista BCP..."
              rows={6}
              className="w-full bg-surface-2 border border-rim-bright text-parchment font-mono text-[10px] px-2 py-1.5 outline-none focus:border-gold resize-none"
            />
            {importError && (
              <p className="text-[9px] font-mono text-crimson-bright">{importError}</p>
            )}
            <button
              onClick={handleImport}
              className="self-start px-3 py-1 text-[9px] font-display uppercase tracking-widest border border-gold/50 text-gold hover:bg-gold/10 transition-colors"
            >
              Importar
            </button>
          </div>
        )}
      </div>

      <UnitSelector gameData={gameData} panel={panel} />

      {selectedUnit && (
        <>
          <StatsBar
            models={selectedUnit.models}
            selectedIndex={modelIdx}
            onSelectIndex={handleModelSelect}
          />

          {/* Weapons section — attacker only */}
          {isAttacker && (
            <div>
              <div className="px-3 py-2 text-xs font-display uppercase tracking-wide text-gold border-b border-rim-bright bg-surface-2">
                Armamento
                <span className="text-parchment-dim normal-case tracking-normal font-mono ml-2">
                  (multiselección permitida)
                </span>
              </div>
              {selectedUnit.weapons.length === 0 ? (
                <p className="px-3 py-2 text-[10px] font-mono text-parchment-dim">
                  Sin armas registradas.
                </p>
              ) : (
                selectedUnit.weapons.map((w, i) => {
                  const isSelected = selectedWeapons.some(x => x.name === w.name && x.line === w.line)
                  const maxQty = unitMax ?? 99
                  const qty = getQty(w)
                  return (
                    <div key={`${w.name}-${i}`}>
                      <WeaponCard
                        weapon={w}
                        isSelected={isSelected}
                        onSelect={handleWeaponSelect}
                        heavyModActive={w.isHeavy ? heavyModActive : undefined}
                        onHeavyToggle={w.isHeavy ? handleHeavyToggle : undefined}
                      />
                      {isSelected && onQuantityChange && (
                        <div className="flex items-center justify-between px-3 py-1.5 bg-surface-3 border-b border-rim-bright">
                          <span className="text-[9px] font-display uppercase tracking-wide text-gold">Atacantes</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => adjustQty(w, -1, maxQty)}
                              className="w-5 h-5 border border-rim-bright text-parchment hover:border-gold hover:text-gold font-mono text-xs flex items-center justify-center transition-colors"
                            >−</button>
                            <span className="text-xs font-mono font-bold text-parchment w-6 text-center">×{qty}</span>
                            <button
                              onClick={() => adjustQty(w, +1, maxQty)}
                              className="w-5 h-5 border border-rim-bright text-parchment hover:border-gold hover:text-gold font-mono text-xs flex items-center justify-center transition-colors"
                            >+</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}

              {/* Character weapons section */}
              {characterDatasheet && characterDatasheet.weapons.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-display uppercase tracking-wide text-crimson border-b border-rim-bright bg-surface-2 mt-1">
                    {characterDatasheet.name}
                    <span className="text-parchment-dim normal-case tracking-normal font-mono ml-2 text-[9px]">
                      personaje adjunto
                    </span>
                  </div>
                  {characterDatasheet.weapons.map((w, i) => {
                    const isSelected = selectedWeapons.some(x => x.name === w.name && x.line === w.line)
                    const qty = getQty(w)
                    return (
                      <div key={`char-${w.name}-${i}`}>
                        <WeaponCard
                          weapon={w}
                          isSelected={isSelected}
                          onSelect={handleWeaponSelect}
                          heavyModActive={w.isHeavy ? heavyModActive : undefined}
                          onHeavyToggle={w.isHeavy ? handleHeavyToggle : undefined}
                        />
                        {isSelected && onQuantityChange && (
                          <div className="flex items-center justify-between px-3 py-1.5 bg-surface-3 border-b border-rim-bright">
                            <span className="text-[9px] font-display uppercase tracking-wide text-crimson">Atacantes</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => adjustQty(w, -1, 99)}
                                className="w-5 h-5 border border-rim-bright text-parchment hover:border-crimson hover:text-crimson font-mono text-xs flex items-center justify-center transition-colors"
                              >−</button>
                              <span className="text-xs font-mono font-bold text-parchment w-6 text-center">×{qty}</span>
                              <button
                                onClick={() => adjustQty(w, +1, 99)}
                                className="w-5 h-5 border border-rim-bright text-parchment hover:border-crimson hover:text-crimson font-mono text-xs flex items-center justify-center transition-colors"
                              >+</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </>
              )}

              {/* Clear button */}
              {selectedWeapons.length > 0 && onClearWeapons && (
                <div className="px-3 py-2 border-t border-rim-bright flex justify-end">
                  <button
                    onClick={onClearWeapons}
                    className="text-[9px] font-display uppercase tracking-widest text-parchment-dim hover:text-crimson transition-colors"
                  >
                    Limpiar selección
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Rapid Fire / Melta — un toggle por arma seleccionada, ya que el valor X
              depende del arma concreta y solo el usuario sabe si está a media distancia. */}
          {isAttacker && halfRangeWeapons.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-display uppercase tracking-wide text-gold border-b border-t border-rim-bright bg-surface-2">
                Rapid Fire / Melta
                <span className="text-parchment-dim normal-case tracking-normal font-mono ml-2 text-[9px]">
                  ¿el objetivo está a media distancia?
                </span>
              </div>
              <div className="px-3 py-2 flex flex-col gap-1.5">
                {halfRangeWeapons.flatMap(w => {
                  const key = wKey(w)
                  const rows = []
                  if (w.rapidFireValue !== '') {
                    const active = rapidFireActiveKeys.includes(key)
                    rows.push(
                      <button
                        key={`rf-${key}`}
                        onClick={() => onRapidFireToggle?.(key)}
                        className={`w-full text-left px-2 py-1.5 border transition-colors ${
                          active
                            ? 'border-crimson bg-crimson/10 text-crimson-bright'
                            : 'border-rim-bright text-parchment hover:border-crimson-dim hover:text-parchment'
                        }`}
                      >
                        <span className="text-xs font-mono leading-snug">
                          <span className="mr-1.5">{active ? '▶' : '○'}</span>
                          Rapid Fire {w.rapidFireValue} — {w.name}
                        </span>
                      </button>
                    )
                  }
                  if (w.isMelta) {
                    const active = meltaActiveKeys.includes(key)
                    rows.push(
                      <button
                        key={`melta-${key}`}
                        onClick={() => onMeltaToggle?.(key)}
                        className={`w-full text-left px-2 py-1.5 border transition-colors ${
                          active
                            ? 'border-crimson bg-crimson/10 text-crimson-bright'
                            : 'border-rim-bright text-parchment hover:border-crimson-dim hover:text-parchment'
                        }`}
                      >
                        <span className="text-xs font-mono leading-snug">
                          <span className="mr-1.5">{active ? '▶' : '○'}</span>
                          Melta {w.meltaValue} — {w.name}
                        </span>
                      </button>
                    )
                  }
                  return rows
                })}
              </div>
            </>
          )}

          {activeModifierIds && onModifierToggle && (
            <ModifierPanel
              rules={visibleRules}
              activeIds={activeModifierIds}
              onToggle={onModifierToggle}
            />
          )}

          <AbilityList
            abilities={selectedUnit.abilities}
            detachmentAbilities={detachmentAbilities}
            relatedRules={visibleRules}
            activeModifierIds={activeModifierIds}
            onModifierToggle={onModifierToggle}
          />
          <StratList stratagems={applicableStratagems} />
        </>
      )}
    </div>
  )
}
