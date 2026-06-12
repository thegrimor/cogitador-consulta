import { useParams, useNavigate } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { factionPath } from '@/core/constants/routes'

export function FactionArmyRulesPage() {
  const { factionId } = useParams<{ factionId: string }>()
  const { factions, abilitiesMap } = useGameDataContext()
  const navigate = useNavigate()

  const faction = factions.find(f => f.id === factionId)
  const armyRules = Object.values(abilitiesMap).filter(a => a.faction_id === factionId)

  if (!faction) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[9px] font-mono text-parchment-dim uppercase tracking-widest">
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
          className="text-[8px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mb-3 flex items-center gap-1"
        >
          ← {faction.name}
        </button>
        <div className="h-1 bg-crimson mb-2" />
        <h1 className="text-[13px] font-display uppercase tracking-[3px] text-parchment">
          Regla de Ejército
        </h1>
        <p className="text-[8px] font-mono uppercase tracking-[2px] text-parchment-dim mt-0.5">
          {faction.name}
        </p>
      </div>

      {armyRules.length === 0 ? (
        <p className="text-[9px] font-mono text-parchment-dim text-center py-10 uppercase tracking-widest">
          Sin reglas de ejército
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {armyRules.map(rule => (
            <div
              key={rule.id}
              className="bg-surface-2 border border-rim-bright border-l-2 border-l-crimson px-4 py-4"
            >
              <p className="text-[11px] font-display uppercase tracking-widest text-parchment mb-1.5">
                {rule.name}
              </p>
              {rule.legend && (
                <p className="text-[8px] font-mono text-parchment-dim italic mb-2 leading-relaxed">
                  {rule.legend}
                </p>
              )}
              {rule.description && (
                <p className="text-[9px] font-mono text-parchment leading-relaxed">
                  {rule.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
