import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { factionPath, ROUTES } from '@/core/constants/routes'

export function CatalogPage() {
  const { factions } = useGameDataContext()
  const [search, setSearch] = useState('')

  const filtered = factions.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <NavLink
          to={ROUTES.CORE_RULES}
          className="group flex items-center justify-between bg-surface-2 border border-rim-bright hover:border-crimson-bright px-4 py-4 transition-colors mb-3"
        >
          <div>
            <p className="text-[14px] font-display uppercase tracking-widest text-parchment">
              Reglamento
            </p>
            <p className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim mt-0.5">
              Reglas básicas y fases de juego
            </p>
          </div>
          <span className="text-[18px] font-mono text-parchment-dim group-hover:text-parchment transition-colors">›</span>
        </NavLink>
        <input
          type="text"
          placeholder="Buscar facción…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-surface-3 border border-rim-bright text-parchment text-[13px] font-mono px-3 py-2 placeholder-parchment-dim focus:outline-none focus:border-crimson-bright"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-[12px] font-mono text-parchment-dim text-center py-12 uppercase tracking-widest">
          Sin resultados
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map(faction => (
            <NavLink
              key={faction.id}
              to={factionPath(faction.id)}
              className="group block bg-surface-2 border border-rim-bright hover:border-crimson-bright transition-colors"
            >
              <div className="h-1 bg-crimson group-hover:bg-crimson-bright transition-colors" />
              <div className="px-3 py-3">
                <p className="text-[13px] font-display uppercase tracking-widest text-parchment group-hover:text-parchment leading-tight">
                  {faction.name}
                </p>
              </div>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}
