import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { selectAllRosters } from '@/store/selectors'
import { deleteRoster } from '@/store/rosterSlice'
import { rosterEditPath } from '@/core/constants/routes'
import { NewRosterModal } from '@/components/roster/NewRosterModal'
import type { AppDispatch, RootState } from '@/store'

export function RosterListPage() {
  const rosters = useSelector((s: RootState) => selectAllRosters(s))
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { factions, enhancements } = useGameDataContext()
  const [showNew, setShowNew] = useState(false)

  const factionMap = Object.fromEntries(factions.map(f => [f.id, f.name]))
  const enhancementMap = Object.fromEntries(enhancements.map(e => [e.id, e.cost]))

  function computePoints(roster: (typeof rosters)[0]) {
    return roster.entries.reduce((sum, e) => {
      return sum + (e.pointsCost ?? 0) + (e.enhancementId ? (enhancementMap[e.enhancementId] ?? 0) : 0)
    }, 0)
  }

  function handleDelete(id: string, name: string) {
    if (window.confirm(`¿Eliminar la lista "${name}"?`)) {
      dispatch(deleteRoster(id))
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-crimson uppercase tracking-widest text-sm">Listas de Ejército</h1>
        <button
          onClick={() => setShowNew(true)}
          className="text-[10px] uppercase tracking-widest bg-crimson text-white px-3 py-1 hover:opacity-80"
        >
          + Nueva lista
        </button>
      </div>

      {rosters.length === 0 ? (
        <p className="text-[9px] font-mono uppercase tracking-widest text-parchment-dim text-center py-16">
          No hay listas guardadas
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {rosters.map(roster => {
            const pts = computePoints(roster)
            const overLimit = pts > roster.pointsLimit
            return (
              <div
                key={roster.id}
                className="border border-gray-700 p-4 flex items-center justify-between cursor-pointer hover:border-gray-500"
                onClick={() => navigate(rosterEditPath(roster.id))}
              >
                <div>
                  <p className="font-display text-parchment uppercase tracking-widest text-[11px]">{roster.name}</p>
                  <p className="text-[9px] font-mono text-parchment-dim uppercase tracking-widest mt-1">
                    {factionMap[roster.factionId] ?? roster.factionId}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-mono text-xs tabular-nums ${overLimit ? 'text-red-400' : 'text-parchment'}`}>
                    {pts} / {roster.pointsLimit} pts
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(roster.id, roster.name) }}
                    className="text-[9px] uppercase tracking-widest text-parchment-dim hover:text-red-400 px-2 py-1 border border-gray-700 hover:border-red-400"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showNew && <NewRosterModal onClose={() => setShowNew(false)} />}
    </div>
  )
}
