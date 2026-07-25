import { mdBoldToHtml } from '@/core/utils/missionText'
import { VpBadge } from '@/shared/components/VpBadge'
import type { PrimaryMissionSection } from '@/types'

type SectionTiming = 'round-start' | 'turn-end' | 'battle-end'

function getSectionTiming(section: PrimaryMissionSection): SectionTiming {
  if (section.headerKind === 'eob') return 'battle-end'
  if (section.trigger?.includes('Command phase')) return 'round-start'
  return 'turn-end'
}

const TIMING_STYLES: Record<SectionTiming, { label: string; text: string; badge: string; header: string }> = {
  'round-start': {
    label: 'Comienzo de ronda',
    text: 'text-gold-bright',
    badge: 'border-gold/50 text-gold-bright bg-gold/10',
    header: 'bg-gold/5',
  },
  'turn-end': {
    label: 'Final de turno',
    text: 'text-teal',
    badge: 'border-teal/50 text-teal bg-teal/10',
    header: 'bg-teal/5',
  },
  'battle-end': {
    label: 'Final de la batalla',
    text: 'text-crimson-bright',
    badge: 'border-crimson-bright/50 text-crimson-bright bg-crimson/10',
    header: 'bg-crimson/5',
  },
}

function SectionBlock({ section, accentClass }: { section: PrimaryMissionSection; accentClass: string }) {
  const timing = getSectionTiming(section)
  const style = TIMING_STYLES[timing]
  return (
    <div className={`border border-rim-bright border-l-2 ${accentClass} mb-px`}>
      <div
        className={`px-4 py-2 ${style.header} border-b border-rim-bright flex items-center justify-between gap-3 flex-wrap`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-mono uppercase tracking-widest ${style.text}`}>
            {section.when}
          </span>
          <span
            className={`text-[9px] font-mono uppercase tracking-wide border px-1.5 py-px leading-none ${style.badge}`}
          >
            {style.label}
          </span>
        </div>
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

export function PrimaryMissionSections({
  sections,
  accentClass,
}: {
  sections: PrimaryMissionSection[]
  accentClass: string
}) {
  return (
    <div className="flex flex-col gap-px">
      {sections.map((section, i) => (
        <SectionBlock key={i} section={section} accentClass={accentClass} />
      ))}
    </div>
  )
}
