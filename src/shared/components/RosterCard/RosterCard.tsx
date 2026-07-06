import { NavLink } from 'react-router-dom'
import type { RosterList, Enhancement } from '@/types'
import { rosterEditPath } from '@/core/constants/routes'

interface Props {
  roster: RosterList
  factionName: string
  detachmentName: string | null
  enhancements: Enhancement[]
  onDelete: () => void
  onExport: () => void
}

export function RosterCard({ roster, factionName, detachmentName, enhancements, onDelete, onExport }: Props) {
  const enhancementsCost = roster.entries.reduce(
    (sum, e) => sum + (enhancements.find(en => en.id === e.enhancementId)?.cost ?? 0), 0,
  )
  const combinedTotal = (roster.totalPoints ?? 0) + enhancementsCost
  const overLimit = roster.pointsLimit !== null && combinedTotal > roster.pointsLimit

  return (
    <NavLink
      to={rosterEditPath(roster.id)}
      className="group block bg-surface-2 border border-rim-bright hover:border-crimson-bright transition-colors"
    >
      <div className="h-1 bg-crimson group-hover:bg-crimson-bright transition-colors" />
      <div className="px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-display uppercase tracking-widest text-parchment leading-tight min-w-0">
            {roster.name}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                onExport()
              }}
              className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim hover:text-crimson-bright transition-colors"
            >
              Exportar
            </button>
            <button
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                onDelete()
              }}
              className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim hover:text-crimson-bright"
            >
              Eliminar
            </button>
          </div>
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mt-1">
          {factionName}
          {detachmentName ? ` · ${detachmentName}` : ''}
        </p>
        <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mt-0.5">
          {roster.entries.length} unidades ·{' '}
          <span className={overLimit ? 'text-crimson-bright' : ''}>
            {combinedTotal}
            {roster.pointsLimit !== null ? ` / ${roster.pointsLimit}` : ''} pts
          </span>
        </p>
      </div>
    </NavLink>
  )
}
