import { useState } from 'react'
import type { Datasheet, RosterEntry, PointsCost, Enhancement } from '@/types'
import { resolveModelCount, resolveSelectedWeaponNames } from '@/core/utils/roster'
import { CostVariantPicker } from '@/shared/components/CostVariantPicker'
import { StatsBar } from '@/shared/components/StatsBar'
import { WeaponSelector } from '@/shared/components/WeaponSelector'
import { AbilityList } from '@/shared/components/AbilityList'

interface Props {
  entry: RosterEntry
  datasheet: Datasheet
  costs: PointsCost[]
  availableEnhancements: Enhancement[]
  attachableEntries: { entry: RosterEntry; datasheet: Datasheet }[]
  onChangeCost: (cost: PointsCost) => void
  onChangeEnhancement: (enhancementId: string | null) => void
  onChangeAttachment: (attachedToEntryId: string | null) => void
  onChangeWeapons: (selectedWeaponNames: string[]) => void
  onRemove: () => void
}

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
  costs,
  availableEnhancements,
  attachableEntries,
  onChangeCost,
  onChangeEnhancement,
  onChangeAttachment,
  onChangeWeapons,
  onRemove,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  const selectedDescription =
    costs.find(c => resolveModelCount(c, datasheet) === entry.modelCount && c.points === entry.pointsCost)
      ?.description ?? ''

  const isCharacter = datasheet.keywords.some(k => k.toUpperCase() === 'CHARACTER')
  const selectedEnhancement = availableEnhancements.find(e => e.id === entry.enhancementId)
  const attachedTo = attachableEntries.find(a => a.entry.id === entry.attachedToEntryId)
  const selectedWeaponNames = resolveSelectedWeaponNames(entry, datasheet)

  function handleToggleWeapon(weaponName: string) {
    const lower = weaponName.toLowerCase()
    const next = selectedWeaponNames.has(lower)
      ? [...selectedWeaponNames].filter(n => n !== lower)
      : [...selectedWeaponNames, lower]
    onChangeWeapons(next)
  }

  return (
    <div className="bg-surface-2 border border-rim-bright px-3 py-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <button onClick={() => setExpanded(v => !v)} className="min-w-0 text-left flex-1">
          <p className="text-[13px] font-display uppercase tracking-widest text-parchment flex items-center gap-1.5">
            <span>{expanded ? '▾' : '▸'}</span>
            {datasheet.name}
          </p>
          <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mt-0.5">
            {entry.pointsCost ?? 0}pts
          </p>
          {attachedTo && (
            <p className="text-[10px] font-mono text-parchment-dim italic mt-0.5">
              Adjuntado a: {attachedTo.datasheet.name}
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
                  {attachableEntries.map(({ entry: target, datasheet: targetDs }) => (
                    <button
                      key={target.id}
                      onClick={() => onChangeAttachment(target.id)}
                      className={pillClass(entry.attachedToEntryId === target.id)}
                    >
                      {targetDs.name}
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
                <p className="text-[11px] font-mono text-parchment-dim leading-relaxed mt-1.5">
                  {selectedEnhancement.description}
                </p>
              )}
            </div>
          )}

          <StatsBar models={datasheet.models} />

          <WeaponSelector
            weapons={datasheet.weapons}
            selectedNames={selectedWeaponNames}
            onToggle={handleToggleWeapon}
          />

          <AbilityList abilities={datasheet.abilities} detachmentAbilities={[]} />
        </div>
      )}
    </div>
  )
}
