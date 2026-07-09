import { useParams, useNavigate } from 'react-router-dom'
import { useMissionsData } from '@/infrastructure/data/useMissionsData'
import { ROUTES } from '@/core/constants/routes'
import { cleanMissionHtml, missionSlug } from '@/core/utils/missionText'
import { VpBadge } from '@/shared/components/VpBadge'
import { MissionActionBox } from '@/shared/components/MissionActionBox/MissionActionBox'
import type { SecondaryMissionSection } from '@/types'

function ChipBadge({ chip }: { chip: 'FIXED' | 'TACTICAL' }) {
  const isFixed = chip === 'FIXED'
  return (
    <span
      className={`text-[10px] font-mono uppercase tracking-wide border px-1.5 py-px leading-none ${
        isFixed ? 'border-gold/50 text-gold' : 'border-crimson/60 text-crimson-bright'
      }`}
    >
      {isFixed ? 'Fija' : 'Táctica'}
    </span>
  )
}

function SecondarySectionBlock({ section }: { section: SecondaryMissionSection }) {
  return (
    <div className="border border-rim-bright mb-px">
      <div className="px-4 py-2 bg-surface-2 border-b border-rim-bright flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim">
            {section.when}
          </span>
          {section.chip && <ChipBadge chip={section.chip} />}
        </div>
        <div className="flex items-center gap-2">
          {section.cap && (
            <span className="text-[10px] font-mono uppercase text-parchment-dim">{section.cap}</span>
          )}
          <span className="text-[10px] font-mono text-parchment-dim italic text-right">{section.trigger}</span>
        </div>
      </div>
      <div className="bg-surface-1">
        {section.rows.map((row, i) => (
          <div key={i}>
            {row.or && i > 0 && (
              <div className="text-center text-[10px] font-mono uppercase text-parchment-dim py-0.5">o</div>
            )}
            <div
              className={`flex items-start justify-between gap-3 px-4 py-2 ${
                i > 0 && !row.or ? 'border-t border-rim-bright/50' : ''
              }`}
            >
              <div className="flex-1">
                <p
                  className="wh-html text-[12px] font-mono text-parchment leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: cleanMissionHtml(row.text) }}
                />
                {row.cumulative && (
                  <p className="text-[10px] font-mono text-gold italic mt-0.5">Acumulable con el anterior</p>
                )}
              </div>
              <VpBadge value={row.vp} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

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
      <div className="flex flex-col gap-px">
        {card.sections.map((section, i) => (
          <SecondarySectionBlock key={i} section={section} />
        ))}
      </div>
    </div>
  )
}
