import { useState } from 'react'
import type { Datasheet, PointsCost, RosterEntry } from '@/types'
import { CostVariantPicker } from '@/shared/components/CostVariantPicker'
import {
  compareByRolePriority, resolveCostsForUnitIndex, resolveCostsForFactionContext,
  unitIndexInRoster, maxCopiesAllowed, resolveModelCount, roleCategoryLabel, groupByRoleCategory,
  ROLE_CATEGORY_LABELS,
} from '@/core/utils/roster'

function modelCountLabel(ds: Datasheet): string {
  if (ds.modelCountMin <= 0) return ''
  if (ds.modelCountMin === ds.modelCountMax) {
    return ds.modelCountMin === 1 ? '1 miniatura' : `${ds.modelCountMin} miniaturas`
  }
  return `${ds.modelCountMin}-${ds.modelCountMax} miniaturas`
}

interface Props {
  datasheets: Datasheet[]
  pointsCostMap: Record<string, PointsCost[]>
  entries: RosterEntry[]
  pointsLimit: number | null
  rosterFactionId: string
  onAdd: (datasheet: Datasheet, cost: PointsCost) => void
}

export function AddUnitPanel({ datasheets, pointsCostMap, entries, pointsLimit, rosterFactionId, onAdd }: Props) {
  const categories = [
    'Todos',
    ...ROLE_CATEGORY_LABELS.filter(label => datasheets.some(d => roleCategoryLabel(d.role) === label)),
  ]
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [search, setSearch] = useState('')

  const filtered = datasheets
    .filter(d => {
      const matchCategory = activeCategory === 'Todos' || roleCategoryLabel(d.role) === activeCategory
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
    .sort(compareByRolePriority)
  const groups = groupByRoleCategory(filtered, d => d.role)

  return (
    <div className="bg-surface-2 border border-rim-bright p-3">
      <p className="text-[12px] font-display uppercase tracking-widest text-parchment mb-3">
        Añadir Unidad
      </p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 border transition-colors ${
              activeCategory === category
                ? 'border-crimson-bright text-parchment bg-crimson/10'
                : 'border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Buscar unidad…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-surface-3 border border-rim-bright text-parchment text-[13px] font-mono px-3 py-2 placeholder-parchment-dim focus:outline-none focus:border-crimson-bright mb-3"
      />

      {filtered.length === 0 ? (
        <p className="text-[11px] font-mono text-parchment-dim text-center py-6 uppercase tracking-widest">
          Sin resultados
        </p>
      ) : (
        <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto">
          {groups.map(group => (
            <div key={group.label} className="flex flex-col gap-px">
              <p className="text-[10px] font-display uppercase tracking-widest text-crimson-bright px-1">
                {group.label}
              </p>
              {group.items.map(ds => {
                const contextCosts = resolveCostsForFactionContext(pointsCostMap[ds.id] ?? [], ds.factionId, rosterFactionId)
                // The Nth copy of a datasheet (e.g. a 2nd Defiler) can have a different
                // surcharge tier than the 1st - that's not a player choice, so narrow to
                // whichever tier this next copy would fall into before offering any picker.
                const unitIndex = unitIndexInRoster(entries, ds.id, null)
                const costs = resolveCostsForUnitIndex(contextCosts, unitIndex)
                const cap = maxCopiesAllowed(ds, pointsLimit)
                const atCap = unitIndex > cap
                return (
                  <div key={ds.id} className="bg-surface-3 border border-rim-bright px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-display uppercase tracking-widest text-parchment">
                        {ds.name}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim shrink-0">
                        {ds.role}
                      </span>
                    </div>
                    {modelCountLabel(ds) && (
                      <p className="text-[10px] font-mono text-parchment-dim mt-0.5">{modelCountLabel(ds)}</p>
                    )}
                    <div className="mt-2">
                      {atCap ? (
                        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 border border-rim-bright text-parchment-dim/50">
                          {cap === 1 ? 'Héroe Épico ya en la lista' : `Límite alcanzado (${cap})`}
                        </span>
                      ) : costs.length > 1 ? (
                        <CostVariantPicker costs={costs} selectedDescription="" onSelect={cost => onAdd(ds, cost)} />
                      ) : costs.length === 1 ? (
                        <button
                          onClick={() => onAdd(ds, costs[0])}
                          className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 border border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment"
                        >
                          Añadir ({resolveModelCount(costs[0], ds)} · {costs[0].points}pts)
                        </button>
                      ) : (
                        <button
                          onClick={() => onAdd(ds, { datasheetId: ds.id, description: '', points: 0 })}
                          className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 border border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment"
                        >
                          Añadir (0pts)
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
