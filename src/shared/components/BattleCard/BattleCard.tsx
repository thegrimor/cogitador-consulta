import { NavLink } from 'react-router-dom'
import type { Battle } from '@/types'
import { battleScorePath } from '@/core/constants/routes'

interface Props {
  battle: Battle
  player1Total: number
  player2Total: number
  onDelete: () => void
}

export function BattleCard({ battle, player1Total, player2Total, onDelete }: Props) {
  return (
    <NavLink
      to={battleScorePath(battle.id)}
      className="group block bg-surface-2 border border-rim-bright hover:border-crimson-bright transition-colors"
    >
      <div className="h-1 bg-crimson group-hover:bg-crimson-bright transition-colors" />
      <div className="px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-display uppercase tracking-widest text-parchment leading-tight min-w-0">
            {battle.player1.name} <span className="text-parchment-dim">vs</span> {battle.player2.name}
          </p>
          <button
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              onDelete()
            }}
            className="shrink-0 text-[10px] font-mono uppercase tracking-widest text-parchment-dim hover:text-crimson-bright"
          >
            Eliminar
          </button>
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mt-1">
          {battle.player1.primaryDeck} · {battle.player2.primaryDeck}
        </p>
        <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mt-0.5">
          {battle.finished ? 'Finalizada' : `Ronda ${battle.currentRound} / 5`} ·{' '}
          <span className="text-gold-bright">{player1Total}</span> – <span className="text-gold-bright">{player2Total}</span>
        </p>
      </div>
    </NavLink>
  )
}
