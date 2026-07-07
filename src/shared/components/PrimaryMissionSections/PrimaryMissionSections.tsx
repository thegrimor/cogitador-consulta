import { mdBoldToHtml } from '@/core/utils/missionText'
import { VpBadge } from '@/shared/components/VpBadge'
import type { PrimaryMissionSection } from '@/types'

function SectionBlock({ section, accentClass }: { section: PrimaryMissionSection; accentClass: string }) {
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
