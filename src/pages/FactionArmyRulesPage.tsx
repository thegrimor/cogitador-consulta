import { useParams, useNavigate } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { factionPath } from '@/core/constants/routes'
import { SM_CHAPTER_FILTERS, SM_CHAPTER_FILTER_STORAGE_KEY } from '@/core/constants/chapters'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'

export function FactionArmyRulesPage() {
  const { factionId } = useParams<{ factionId: string }>()
  const { factions, armyRulesByFaction, armyRuleChaptersMap } = useGameDataContext()
  const navigate = useNavigate()

  const faction = factions.find(f => f.id === factionId)
  const isSM = factionId === 'SM'
  const allArmyRules = armyRulesByFaction[factionId ?? ''] ?? []
  const [activeChapter, setActiveChapter] = useLocalStorage(SM_CHAPTER_FILTER_STORAGE_KEY, 'Todos')
  const armyRules = isSM && activeChapter !== 'Todos'
    ? allArmyRules.filter(r => (armyRuleChaptersMap[r.id] ?? []).includes(activeChapter))
    : allArmyRules

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
          Regla de Ejército
        </h1>
        <p className="text-[11px] font-mono uppercase tracking-[2px] text-parchment-dim mt-0.5">
          {faction.name}
        </p>
      </div>

      {isSM && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {['Todos', ...SM_CHAPTER_FILTERS].map(chapter => (
            <button
              key={chapter}
              onClick={() => setActiveChapter(c => (c === chapter ? 'Todos' : chapter))}
              className={`text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 border transition-colors ${
                activeChapter === chapter
                  ? 'border-gold text-parchment bg-gold/10'
                  : 'border-rim-bright text-parchment-dim hover:border-gold hover:text-parchment'
              }`}
            >
              {chapter}
            </button>
          ))}
        </div>
      )}

      {armyRules.length === 0 ? (
        <p className="text-[12px] font-mono text-parchment-dim text-center py-10 uppercase tracking-widest">
          Sin reglas de ejército
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {armyRules.map(rule => (
            <div
              key={rule.id}
              className="bg-surface-2 border border-rim-bright border-l-2 border-l-crimson px-4 py-4"
            >
              <p className="text-[14px] font-display uppercase tracking-widest text-parchment mb-1.5">
                {rule.name}
              </p>
              {rule.description && (
                <p className="wh-html text-[12px] font-mono text-parchment leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: rule.description }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
