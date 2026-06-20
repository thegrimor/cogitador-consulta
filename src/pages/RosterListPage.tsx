import { NavLink } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { selectAllRosters, deleteRoster } from '@/store/rosterSlice'
import { RosterCard } from '@/shared/components/RosterCard'
import { ROUTES } from '@/core/constants/routes'

export function RosterListPage() {
  const rosters = useAppSelector(selectAllRosters)
  const { factions, detachments } = useGameDataContext()
  const dispatch = useAppDispatch()

  function handleDelete(id: string, name: string) {
    if (window.confirm(`¿Eliminar la lista "${name}"?`)) {
      dispatch(deleteRoster({ id }))
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment">
          Listas de Ejército
        </h1>
        <NavLink
          to={ROUTES.ROSTER_NEW}
          className="text-[11px] font-mono uppercase tracking-widest px-3 py-2 border border-crimson-bright text-parchment hover:bg-crimson/10 transition-colors"
        >
          Crear Nueva Lista
        </NavLink>
      </div>

      {rosters.length === 0 ? (
        <p className="text-[12px] font-mono text-parchment-dim text-center py-12 uppercase tracking-widest">
          Sin listas creadas
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {rosters.map(roster => {
            const faction = factions.find(f => f.id === roster.factionId)
            const detachment = detachments.find(d => d.id === roster.detachmentId)
            return (
              <RosterCard
                key={roster.id}
                roster={roster}
                factionName={faction?.name ?? roster.factionId}
                detachmentName={detachment?.name ?? null}
                onDelete={() => handleDelete(roster.id, roster.name)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
