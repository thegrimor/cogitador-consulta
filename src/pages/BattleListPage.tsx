import { NavLink } from 'react-router-dom'
import { useMissionsData } from '@/infrastructure/data/useMissionsData'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { selectAllBattles, deleteBattle } from '@/store/battleSlice'
import { computeBattleTotals } from '@/core/utils/battleScoring'
import { BattleCard } from '@/shared/components/BattleCard'
import { ROUTES } from '@/core/constants/routes'

export function BattleListPage() {
  const battles = useAppSelector(selectAllBattles)
  const dispatch = useAppDispatch()
  const { missions, loading, error } = useMissionsData()

  function handleDelete(id: string, player1: string, player2: string) {
    if (window.confirm(`¿Eliminar la partida "${player1} vs ${player2}"?`)) {
      dispatch(deleteBattle({ id }))
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment">
          Partidas
        </h1>
        <NavLink
          to={ROUTES.BATTLE_NEW}
          className="text-[11px] font-mono uppercase tracking-widest px-3 py-2 border border-crimson-bright text-parchment hover:bg-crimson/10 transition-colors"
        >
          Nueva Partida
        </NavLink>
      </div>

      {loading && (
        <p className="text-[12px] font-mono text-parchment-dim text-center py-12 uppercase tracking-widest">
          Cargando misiones…
        </p>
      )}

      {error && (
        <p className="text-[12px] font-mono text-parchment-dim text-center py-12 uppercase tracking-widest">
          {error}
        </p>
      )}

      {missions && (
        battles.length === 0 ? (
          <p className="text-[12px] font-mono text-parchment-dim text-center py-12 uppercase tracking-widest">
            Sin partidas creadas
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {battles.map(battle => {
              const totals = computeBattleTotals(missions, battle)
              return (
                <BattleCard
                  key={battle.id}
                  battle={battle}
                  player1Total={totals.player1}
                  player2Total={totals.player2}
                  onDelete={() => handleDelete(battle.id, battle.player1.name, battle.player2.name)}
                />
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
