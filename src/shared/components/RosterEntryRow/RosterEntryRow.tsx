import type { Datasheet, RosterEntry, PointsCost, Enhancement } from '@/types'
import { resolveModelCount } from '@/core/utils/roster'
import { CostVariantPicker } from '@/shared/components/CostVariantPicker'

interface Props {
  entry: RosterEntry
  datasheet: Datasheet
  costs: PointsCost[]
  availableEnhancements: Enhancement[]
  onChangeCost: (cost: PointsCost) => void
  onChangeEnhancement: (enhancementId: string | null) => void
  onRemove: () => void
}

export function RosterEntryRow({
  entry,
  datasheet,
  costs,
  availableEnhancements,
  onChangeCost,
  onChangeEnhancement,
  onRemove,
}: Props) {
  const selectedDescription =
    costs.find(c => resolveModelCount(c, datasheet) === entry.modelCount && c.points === entry.pointsCost)
      ?.description ?? ''

  const isCharacter = datasheet.keywords.some(k => k.toUpperCase() === 'CHARACTER')
  const selectedEnhancement = availableEnhancements.find(e => e.id === entry.enhancementId)

  return (
    <div className="bg-surface-2 border border-rim-bright px-3 py-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-display uppercase tracking-widest text-parchment">
            {datasheet.name}
          </p>
          <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mt-0.5">
            {entry.pointsCost ?? 0}pts
          </p>
        </div>
        <button
          onClick={onRemove}
          className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim hover:text-crimson-bright shrink-0"
        >
          Quitar
        </button>
      </div>

      {costs.length > 1 && (
        <div className="mt-2">
          <CostVariantPicker costs={costs} selectedDescription={selectedDescription} onSelect={onChangeCost} />
        </div>
      )}

      {isCharacter && (
        <div className="mt-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mb-1">Realce</p>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => onChangeEnhancement(null)}
              className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 border transition-colors ${
                !entry.enhancementId
                  ? 'border-crimson-bright text-parchment bg-crimson/10'
                  : 'border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment'
              }`}
            >
              Ninguno
            </button>
            {availableEnhancements.map(e => (
              <button
                key={e.id}
                onClick={() => onChangeEnhancement(e.id)}
                className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 border transition-colors whitespace-nowrap ${
                  entry.enhancementId === e.id
                    ? 'border-crimson-bright text-parchment bg-crimson/10'
                    : 'border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment'
                }`}
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
    </div>
  )
}
