import { useState } from 'react'
import { useParams, NavLink, useNavigate } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { factionPath, datasheetPath } from '@/core/constants/routes'

export function FactionDatasheetsPage() {
  const { factionId } = useParams<{ factionId: string }>()
  const { factions, datasheets } = useGameDataContext()
  const navigate = useNavigate()

  const faction = factions.find(f => f.id === factionId)
  const factionSheets = datasheets.filter(d => d.factionId === factionId && !d.isVirtual)

  const roles = ['Todos', ...Array.from(new Set(factionSheets.map(d => d.role))).sort()]
  const [activeRole, setActiveRole] = useState('Todos')
  const [search, setSearch] = useState('')

  const filtered = factionSheets.filter(d => {
    const matchRole = activeRole === 'Todos' || d.role === activeRole
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  if (!faction) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[12px] font-mono text-parchment-dim uppercase tracking-widest">
          Facción no encontrada
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(factionPath(factionId!))}
          className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mb-3 flex items-center gap-1"
        >
          ← {faction.name}
        </button>
        <div className="h-1 bg-crimson mb-2" />
        <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment">
          Datasheets
        </h1>
        <p className="text-[11px] font-mono uppercase tracking-[2px] text-parchment-dim mt-0.5">
          {faction.name} · {factionSheets.length} unidades
        </p>
      </div>

      {/* Filtros de rol */}
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

      {/* Búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar unidad…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-surface-3 border border-rim-bright text-parchment text-[13px] font-mono px-3 py-2 placeholder-parchment-dim focus:outline-none focus:border-crimson-bright"
        />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <p className="text-[12px] font-mono text-parchment-dim text-center py-8 uppercase tracking-widest">
          Sin resultados
        </p>
      ) : (
        <div className="flex flex-col gap-px">
          {filtered.map(ds => {
            const primary = ds.models[0]
            const hasInv = !!primary?.invSv && primary.invSv !== '-'
            const stats = primary
              ? [
                  { label: 'M', value: primary.M },
                  { label: 'T', value: String(primary.T) },
                  { label: 'SV', value: primary.Sv },
                  ...(hasInv ? [{ label: 'INV', value: primary.invSv }] : []),
                ]
              : []
            return (
              <NavLink
                key={ds.id}
                to={datasheetPath(ds.id)}
                className="group flex flex-wrap items-center justify-between gap-y-2 bg-surface-2 border border-rim-bright hover:border-crimson-bright px-3 py-2.5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[13px] font-display uppercase tracking-widest text-parchment group-hover:text-parchment">
                    {ds.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-3">
                  {stats.map(stat => (
                    <div
                      key={stat.label}
                      className="flex flex-col items-center bg-surface-3 border border-rim-bright px-2 py-0.5 min-w-[32px]"
                    >
                      <span className="text-[10px] font-mono uppercase text-parchment-dim leading-none">
                        {stat.label}
                      </span>
                      <span className="text-[12px] font-display text-parchment leading-none mt-0.5 whitespace-nowrap">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}
