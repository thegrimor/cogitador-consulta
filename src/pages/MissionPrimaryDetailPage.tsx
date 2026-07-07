import { useParams, useNavigate } from 'react-router-dom'
import { useMissionsData } from '@/infrastructure/data/useMissionsData'
import { ROUTES } from '@/core/constants/routes'
import { mdBoldToHtml, missionSlug } from '@/core/utils/missionText'
import { VpBadge } from '@/shared/components/VpBadge'
import { DECK_COLORS } from '@/core/constants/missionDeckColors'
import type { PrimaryMissionSection } from '@/types'

function PrimarySectionBlock({
  section,
  accentClass,
}: {
  section: PrimaryMissionSection
  accentClass: string
}) {
  return (
    <div className={`border border-rim-bright border-l-2 ${accentClass} mb-px`}>
      <div className="px-4 py-2 bg-surface-2 border-b border-rim-bright flex items-center justify-between gap-3">
        <span
          className={`text-[11px] font-mono uppercase tracking-widest ${
            section.headerKind === 'eob' ? 'text-crimson-bright' : 'text-parchment-dim'
          }`}
        >
          {section.when}
        </span>
        {section.trigger && (
          <span className="text-[10px] font-mono text-parchment-dim italic text-right">
            {section.trigger}
          </span>
        )}
      </div>
      <div className="bg-surface-1">
        {section.tiers.map((tier, i) => (
          <div key={i}>
            {tier.or && i > 0 && (
              <div className="text-center text-[10px] font-mono uppercase text-parchment-dim py-0.5">o</div>
            )}
            <div
              className={`flex items-start justify-between gap-3 px-4 py-2 ${
                i > 0 && !tier.or ? 'border-t border-rim-bright/50' : ''
              }`}
            >
              <div className="flex-1">
                <p
                  className="wh-html text-[12px] font-mono text-parchment leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: mdBoldToHtml(tier.text) }}
                />
                {tier.perUnit && (
                  <p className="text-[10px] font-mono text-parchment-dim italic mt-0.5">(por unidad)</p>
                )}
                {tier.cumulative && (
                  <p className="text-[10px] font-mono text-gold italic mt-0.5">Acumulable con el anterior</p>
                )}
              </div>
              <VpBadge value={tier.vp} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

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
      <div className="flex flex-col gap-px">
        {card.sections.map((section, i) => (
          <PrimarySectionBlock key={i} section={section} accentClass={colors.borderLeft} />
        ))}
      </div>
    </div>
  )
}
