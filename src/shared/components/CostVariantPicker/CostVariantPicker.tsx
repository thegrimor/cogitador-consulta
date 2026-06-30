import type { PointsCost } from '@/types'
import { sortCostVariants, stripTierSuffix } from '@/core/utils/roster'

interface Props {
  costs: PointsCost[]
  selectedDescription: string
  onSelect: (cost: PointsCost) => void
}

export function CostVariantPicker({ costs, selectedDescription, onSelect }: Props) {
  const sorted = sortCostVariants(costs)

  return (
    <div className="flex flex-wrap gap-1">
      {sorted.map(cost => (
        <button
          key={cost.description}
          onClick={() => onSelect(cost)}
          className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 border transition-colors whitespace-nowrap ${
            cost.description === selectedDescription
              ? 'border-crimson-bright text-parchment bg-crimson/10'
              : 'border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment'
          }`}
        >
          {stripTierSuffix(cost.description)} · {cost.points}pts
        </button>
      ))}
    </div>
  )
}
