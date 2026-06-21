import { useState } from 'react'
import type { Datasheet, PointsCost } from '@/types'
import { CostVariantPicker } from '@/shared/components/CostVariantPicker'
import { compareByRolePriority } from '@/core/utils/roster'

interface Props {
  datasheets: Datasheet[]
  pointsCostMap: Record<string, PointsCost[]>
  onAdd: (datasheet: Datasheet, cost: PointsCost) => void
}

export function AddUnitPanel({ datasheets, pointsCostMap, onAdd }: Props) {
  const roles = [
    'Todos',
    ...Array.from(new Set(datasheets.map(d => d.role))).sort((a, b) =>
      compareByRolePriority({ role: a }, { role: b }),
    ),
  ]
  const [activeRole, setActiveRole] = useState('Todos')
  const [search, setSearch] = useState('')

  const filtered = datasheets.filter(d => {
    const matchRole = activeRole === 'Todos' || d.role === activeRole
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  return (
    <div className="bg-surface-2 border border-rim-bright p-3">
      <p className="text-[12px] font-display uppercase tracking-widest text-parchment mb-3">
        Añadir Unidad
      </p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {roles.map(role => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 border transition-colors ${
              activeRole === role
                ? 'border-crimson-bright text-parchment bg-crimson/10'
                : 'border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment'
            }`}
          >
            {role}
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
        <div className="flex flex-col gap-px max-h-[420px] overflow-y-auto">
          {filtered.map(ds => {
            const costs = pointsCostMap[ds.id] ?? []
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
                <div className="mt-2">
                  {costs.length > 0 ? (
                    <CostVariantPicker costs={costs} selectedDescription="" onSelect={cost => onAdd(ds, cost)} />
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
      )}
    </div>
  )
}
