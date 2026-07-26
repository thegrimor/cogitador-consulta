import { useParams, useNavigate } from 'react-router-dom'
import { useMissionsData } from '@/infrastructure/data/useMissionsData'
import { ROUTES } from '@/core/constants/routes'
import { cleanMissionHtml, missionSlug } from '@/core/utils/missionText'
import { MissionActionBox } from '@/shared/components/MissionActionBox/MissionActionBox'
import { SecondaryMissionSections } from '@/shared/components/SecondaryMissionSections'

export function MissionSecondaryDetailPage() {
  const { cardId } = useParams<{ cardId: string }>()
  const navigate = useNavigate()
  const { missions, loading, error } = useMissionsData()

  const back = () => navigate(ROUTES.MISSIONS_SECONDARY)

  if (loading || error || !missions) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[12px] font-mono text-parchment-dim uppercase tracking-widest">
          {error ?? 'Cargando misión…'}
        </p>
      </div>
    )
  }

  const card = missions.secondaryMissions.find(c => missionSlug(c.url) === cardId)

  if (!card) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[12px] font-mono text-parchment-dim uppercase tracking-widest">
          Misión no encontrada
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={back}
          className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mb-3 flex items-center gap-1"
        >
          ← Misiones Secundarias
        </button>
        <div className="h-1 bg-crimson mb-2" />
        <div className="flex items-center gap-2">
          <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment">
            {card.name}
          </h1>
          {card.kindLabel && (
            <span className="text-[10px] font-mono uppercase tracking-wide border border-gold/50 text-gold px-1.5 py-px leading-none">
              Fija / Táctica
            </span>
          )}
        </div>
      </div>

      {card.whenDrawn && (
        <div className="border-l-2 border-gold bg-surface-1 px-3 py-2 mb-4">
          <p
            className="wh-html text-[11px] font-mono text-parchment-dim italic leading-relaxed"
            dangerouslySetInnerHTML={{ __html: cleanMissionHtml(card.whenDrawn) }}
          />
        </div>
      )}

      {card.designerNote && (
        <div className="border-l-2 border-crimson/60 bg-surface-1 px-3 py-2 mb-4">
          <p className="text-[11px] font-mono text-parchment-dim italic leading-relaxed">
            {card.designerNote}
          </p>
        </div>
      )}

      {card.action && <MissionActionBox action={card.action} formatText={cleanMissionHtml} />}

      {/* Sections */}
      <SecondaryMissionSections sections={card.sections} />
    </div>
  )
}
