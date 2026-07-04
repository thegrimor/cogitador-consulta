import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import type { Datasheet, RosterEntry, PointsCost, Enhancement, DetachmentAbility, Detachment, WargearCost } from '@/types'
import { resolveModelCount, resolveWeaponQuantities } from '@/core/utils/roster'
import { datasheetPath, detachmentPath, factionArmyRulesPath, mathhammerAttackerPath } from '@/core/constants/routes'
import { CostVariantPicker } from '@/shared/components/CostVariantPicker'
import { StatsBar } from '@/shared/components/StatsBar'
import { WeaponSelector } from '@/shared/components/WeaponSelector'
import { WeaponOptionsEditor } from '@/shared/components/WeaponOptionsEditor'
import { AbilityList } from '@/shared/components/AbilityList'

interface Props {
  entry: RosterEntry
  datasheet: Datasheet
  rosterId: string
  costs: PointsCost[]
  wargearCosts: WargearCost[]
  detachmentAbilities: DetachmentAbility[]
  selectedDetachments: Detachment[]
  availableEnhancements: Enhancement[]
  attachableEntries: { entry: RosterEntry; datasheet: Datasheet; viaEnhancement: boolean }[]
  leadingEntries: { entry: RosterEntry; datasheet: Datasheet }[]
  onChangeCost: (cost: PointsCost) => void
  onChangeEnhancement: (enhancementId: string | null) => void
  onChangeAttachment: (attachedToEntryId: string | null) => void
  onChangeWeaponSelection: (ruleId: string, selection: number[]) => void
  onChangeWargearCosts: (selections: Record<string, number>, surcharge: number) => void
  onRemove: () => void
}

const linkClass =
  'text-[12px] font-mono text-crimson-bright hover:text-parchment uppercase tracking-wide border-b border-crimson-bright/40 hover:border-parchment transition-colors'

function pillClass(selected: boolean): string {
  return `text-[10px] font-mono uppercase tracking-widest px-2 py-1 border transition-colors whitespace-nowrap ${
    selected
      ? 'border-crimson-bright text-parchment bg-crimson/10'
      : 'border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment'
  }`
}

export function RosterEntryRow({
  entry,
  datasheet,
  rosterId,
  costs,
  wargearCosts,
  detachmentAbilities,
  selectedDetachments,
  availableEnhancements,
  attachableEntries,
  leadingEntries,
  onChangeCost,
  onChangeEnhancement,
  onChangeAttachment,
  onChangeWeaponSelection,
  onChangeWargearCosts,
  onRemove,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  const selectedDescription =
    costs.find(c => resolveModelCount(c, datasheet) === entry.modelCount && c.points === entry.pointsCost)
      ?.description ?? ''

  const isCharacter = datasheet.keywords.some(k => k.toUpperCase() === 'CHARACTER')
  const selectedEnhancement = availableEnhancements.find(e => e.id === entry.enhancementId)
  const attachedTo = attachableEntries.find(a => a.entry.id === entry.attachedToEntryId)
  const weaponQuantities = resolveWeaponQuantities(datasheet, entry)
  const wargearSelections = entry.wargearSelections ?? {}
  const wargearSurcharge = entry.wargearSurcharge ?? 0

  function handleWargearChange(weaponName: string, count: number) {
    const next = { ...wargearSelections, [weaponName]: count }
    const surcharge = wargearCosts.reduce((sum, wc) => sum + (next[wc.name] ?? 0) * wc.points, 0)
    onChangeWargearCosts(next, surcharge)
  }

  return (
    <div className="bg-surface-2 border border-rim-bright px-3 py-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <button onClick={() => setExpanded(v => !v)} className="min-w-0 text-left flex-1">
          <p className="text-[13px] font-display uppercase tracking-widest text-parchment flex items-center gap-1.5">
            <span>{expanded ? '▾' : '▸'}</span>
            {datasheet.name}
            <span className="text-[10px] font-mono normal-case tracking-normal text-parchment-dim">
              ({entry.modelCount} {entry.modelCount === 1 ? 'miniatura' : 'miniaturas'})
            </span>
          </p>
          <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mt-0.5">
            {(entry.pointsCost ?? 0) + wargearSurcharge}pts
            {wargearSurcharge > 0 && (
              <span className="text-gold ml-1">(+{wargearSurcharge} arm.)</span>
            )}
            {selectedEnhancement && (
              <span className="text-gold ml-1">(+{selectedEnhancement.cost} mej.)</span>
            )}
          </p>
          {attachedTo && (
            <p className="text-[10px] font-mono text-parchment-dim italic mt-0.5">
              Adjuntado a: {attachedTo.datasheet.name}
              {attachedTo.viaEnhancement && ' (por mejora)'}
            </p>
          )}
          {leadingEntries.length > 0 && (
            <p className="text-[10px] font-mono text-parchment-dim italic mt-0.5">
              Liderado por: {leadingEntries.map(l => l.datasheet.name).join(', ')}
            </p>
          )}
        </button>
        <button
          onClick={onRemove}
          className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim hover:text-crimson-bright shrink-0"
        >
          Quitar
        </button>
      </div>

      {expanded && (
        <div className="mt-2 space-y-2">
          {costs.length > 1 && (
            <CostVariantPicker costs={costs} selectedDescription={selectedDescription} onSelect={onChangeCost} />
          )}

          {isCharacter && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mb-1">Adjuntar a</p>
              {attachableEntries.length === 0 ? (
                <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim/50">
                  Sin unidades disponibles
                </p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => onChangeAttachment(null)} className={pillClass(!entry.attachedToEntryId)}>
                    Ninguno
                  </button>
                  {attachableEntries.map(({ entry: target, datasheet: targetDs, viaEnhancement }) => (
                    <button
                      key={target.id}
                      onClick={() => onChangeAttachment(target.id)}
                      className={pillClass(entry.attachedToEntryId === target.id)}
                    >
                      {targetDs.name}
                      {viaEnhancement && ' (por mejora)'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isCharacter && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mb-1">Mejora</p>
              <div className="flex flex-wrap gap-1">
                <button onClick={() => onChangeEnhancement(null)} className={pillClass(!entry.enhancementId)}>
                  Ninguno
                </button>
                {availableEnhancements.map(e => (
                  <button
                    key={e.id}
                    onClick={() => onChangeEnhancement(e.id)}
                    className={pillClass(entry.enhancementId === e.id)}
                  >
                    {e.name} · {e.cost}pts
                  </button>
                ))}
              </div>
              {selectedEnhancement && (
                <p
                  className="wh-html text-[11px] font-mono text-parchment-dim leading-relaxed mt-1.5"
                  dangerouslySetInnerHTML={{ __html: selectedEnhancement.description }}
                />
              )}
            </div>
          )}

          {wargearCosts.length > 0 && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mb-1.5">
                Armamento con sobrecoste
              </p>
              <div className="flex flex-col gap-1.5">
                {wargearCosts.map(wc => {
                  const current = wargearSelections[wc.name] ?? 0
                  const label = wc.name.replace(/^per /i, '')
                  return (
                    <div key={wc.name} className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-mono text-parchment-dim">
                        {label}
                        <span className="text-gold ml-1">+{wc.points}pts/modelo</span>
                      </span>
                      {entry.modelCount === 1 ? (
                        <button
                          onClick={() => handleWargearChange(wc.name, current === 1 ? 0 : 1)}
                          className={pillClass(current === 1)}
                        >
                          {current === 1 ? `+${wc.points}pts` : 'Equipar'}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleWargearChange(wc.name, Math.max(0, current - 1))}
                            className="text-[11px] font-mono px-2 py-0.5 border border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment"
                          >
                            −
                          </button>
                          <span className="text-[11px] font-mono text-parchment w-5 text-center">
                            {current}
                          </span>
                          <button
                            onClick={() => handleWargearChange(wc.name, Math.min(entry.modelCount, current + 1))}
                            className="text-[11px] font-mono px-2 py-0.5 border border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
                {wargearSurcharge > 0 && (
                  <p className="text-[10px] font-mono text-gold mt-0.5">
                    Total armamento: +{wargearSurcharge}pts
                  </p>
                )}
              </div>
            </div>
          )}

          {(datasheet.unitComposition.length > 0 || datasheet.loadout) && (
            <div className="border border-rim-bright">
              <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim px-2 py-1 bg-surface-3">
                Composición y Equipo
              </p>
              <div className="px-2 py-1.5 space-y-1">
                {datasheet.unitComposition.map((line, i) => (
                  <p
                    key={i}
                    className="wh-html text-[11px] font-mono text-parchment-dim"
                    dangerouslySetInnerHTML={{ __html: line }}
                  />
                ))}
                {datasheet.loadout && (
                  <p
                    className="text-[11px] font-mono text-parchment-dim mt-1 pt-1 border-t border-rim-bright"
                    dangerouslySetInnerHTML={{ __html: datasheet.loadout }}
                  />
                )}
              </div>
            </div>
          )}

          <StatsBar models={datasheet.models} />

          <WeaponSelector weapons={datasheet.weapons} quantities={weaponQuantities} />

          <WeaponOptionsEditor datasheet={datasheet} entry={entry} onChangeSelection={onChangeWeaponSelection} />

          <AbilityList abilities={datasheet.abilities} detachmentAbilities={detachmentAbilities} />

          <div className="flex flex-wrap gap-2 pt-1">
            <NavLink to={datasheetPath(datasheet.id)} className={linkClass}>
              Ficha
            </NavLink>
            {selectedDetachments.map(d => (
              <NavLink key={d.id} to={detachmentPath(d.id)} className={linkClass}>
                {d.name}
              </NavLink>
            ))}
            <NavLink to={factionArmyRulesPath(datasheet.factionId)} className={linkClass}>
              Reglas de Ejército
            </NavLink>
            <NavLink
              to={mathhammerAttackerPath(datasheet.id, datasheet.factionId, {
                detachmentIds: selectedDetachments.map(d => d.id),
                characterId: leadingEntries[0]?.datasheet.id,
                rosterId,
              })}
              className={linkClass}
            >
              Mathhammer
            </NavLink>
          </div>

          <button
            onClick={() => setExpanded(false)}
            className="w-full text-center text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment border-t border-rim-bright pt-2"
          >
            ▴ Cerrar
          </button>
        </div>
      )}
    </div>
  )
}
