import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { useAppDispatch } from '@/store/hooks'
import { createRoster } from '@/store/rosterSlice'
import { ROUTES, rosterEditPath } from '@/core/constants/routes'

const DEFAULT_POINTS_LIMIT = 2000

export function RosterNewPage() {
  const { factions } = useGameDataContext()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [factionId, setFactionId] = useState<string | null>(null)
  const [pointsLimit, setPointsLimitInput] = useState(String(DEFAULT_POINTS_LIMIT))
  const [search, setSearch] = useState('')

  const filtered = factions.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const canSubmit = name.trim() !== '' && factionId !== null

  function handleSubmit() {
    if (!canSubmit) return
    const limit = parseInt(pointsLimit, 10)
    const action = dispatch(
      createRoster({
        name: name.trim(),
        factionId: factionId!,
        pointsLimit: Number.isFinite(limit) && limit > 0 ? limit : null,
      }),
    )
    navigate(rosterEditPath(action.payload.id))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(ROUTES.ROSTER)}
          className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mb-3 flex items-center gap-1"
        >
          ← Listas de Ejército
        </button>
        <div className="h-1 bg-crimson mb-2" />
        <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment">
          Crear Nueva Lista
        </h1>
      </div>

      <div className="flex flex-col gap-4 max-w-md">
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim block mb-1">
            Nombre
          </label>
          <input
            type="text"
            placeholder="Ej. Patrulla de Combate"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-surface-3 border border-rim-bright text-parchment text-[13px] font-mono px-3 py-2 placeholder-parchment-dim focus:outline-none focus:border-crimson-bright"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim block mb-1">
            Límite de puntos
          </label>
          <input
            type="number"
            min={1}
            value={pointsLimit}
            onChange={e => setPointsLimitInput(e.target.value)}
            className="w-full bg-surface-3 border border-rim-bright text-parchment text-[13px] font-mono px-3 py-2 focus:outline-none focus:border-crimson-bright"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim block mb-1">
            Facción
          </label>
          <input
            type="text"
            placeholder="Buscar facción…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-3 border border-rim-bright text-parchment text-[13px] font-mono px-3 py-2 placeholder-parchment-dim focus:outline-none focus:border-crimson-bright mb-3"
          />
          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
            {filtered.map(faction => (
              <button
                key={faction.id}
                onClick={() => setFactionId(faction.id)}
                className={`text-left px-3 py-2 border transition-colors ${
                  factionId === faction.id
                    ? 'border-crimson-bright bg-crimson/10'
                    : 'border-rim-bright hover:border-crimson'
                }`}
              >
                <span className="text-[12px] font-display uppercase tracking-widest text-parchment">
                  {faction.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="text-[12px] font-mono uppercase tracking-widest px-4 py-2.5 border border-crimson-bright text-parchment hover:bg-crimson/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Crear Lista
        </button>
      </div>
    </div>
  )
}
