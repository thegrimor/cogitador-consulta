import { useParams, useNavigate } from 'react-router-dom'
import { useMissionsData } from '@/infrastructure/data/useMissionsData'
import { ROUTES } from '@/core/constants/routes'
import { missionSlug } from '@/core/utils/missionText'
import { PrimaryMissionSections } from '@/shared/components/PrimaryMissionSections'
import { DECK_COLORS } from '@/core/constants/missionDeckColors'

export function MissionPrimaryDetailPage() {
  const { cardId } = useParams<{ cardId: string }>()
  const navigate = useNavigate()
  const { missions, loading, error } = useMissionsData()

  const back = () => navigate(ROUTES.MISSIONS_PRIMARY)

  if (loading || error || !missions) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[12px] font-mono text-parchment-dim uppercase tracking-widest">
          {error ?? 'Cargando misión…'}
        </p>
      </div>
    )
  }

  const deck = missions.primaryMissions.find(d => d.cards.some(c => missionSlug(c.url) === cardId))
  const card = deck?.cards.find(c => missionSlug(c.url) === cardId)

  if (!deck || !card) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[12px] font-mono text-parchment-dim uppercase tracking-widest">
          Misión no encontrada
        </p>
      </div>
    )
  }

  const colors = DECK_COLORS[card.deck]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={back}
          className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mb-3 flex items-center gap-1"
        >
          ← Misiones Primarias
        </button>
        <div className={`h-1 ${colors.bar} mb-2`} />
        <span className={`text-[11px] font-mono uppercase tracking-widest ${colors.text}`}>
          {deck.name}
        </span>
        <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment">
          {card.name}
        </h1>
        <p className="text-[11px] font-mono uppercase tracking-[2px] text-parchment-dim mt-1">
          vs {card.vs.replace(/-/g, ' ')}
        </p>
      </div>

      {/* Sections */}
      <PrimaryMissionSections sections={card.sections} accentClass={colors.borderLeft} />
    </div>
  )
}
