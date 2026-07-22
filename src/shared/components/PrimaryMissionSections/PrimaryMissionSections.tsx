import { mdBoldToHtml } from '@/core/utils/missionText'
import { conditionKey, groupExclusiveRuns } from '@/core/utils/battleScoring'
import { VpBadge } from '@/shared/components/VpBadge'
import { ConditionToggle, ConditionStepper } from '@/shared/components/ConditionToggle'
import type { PrimaryMissionSection, ConditionKey, ConditionSelectionState } from '@/types'

export interface InteractiveProps {
  selection: ConditionSelectionState
  onToggle: (key: ConditionKey, clearKeys?: ConditionKey[]) => void
  onCountChange: (key: ConditionKey, count: number) => void
  /** false = solo secciones de ronda; true = solo secciones de fin de partida (EOB). */
  showEob: boolean
}

function SectionBlock({
  section,
  sectionIndex,
  accentClass,
  interactive,
}: {
  section: PrimaryMissionSection
  sectionIndex: number
  accentClass: string
  interactive?: InteractiveProps
}) {
  const groups = groupExclusiveRuns(section.tiers)

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
        {section.tiers.map((tier, i) => {
          const key = conditionKey(sectionIndex, i)
          const isRadioMember = groups.some(g => g.length > 1 && g.includes(i))
          const checked = !!interactive?.selection.checked[key]
          const count = interactive?.selection.counts[key] ?? 0

          const row = (
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
          )

          const rowClass = `flex items-start justify-between gap-3 px-4 py-2 w-full ${
            i > 0 && !tier.or ? 'border-t border-rim-bright/50' : ''
          }`

          return (
            <div key={i}>
              {tier.or && i > 0 && (
                <div className="text-center text-[10px] font-mono uppercase text-parchment-dim py-0.5">o</div>
              )}
              {!interactive ? (
                <div className={rowClass}>
                  {row}
                  <VpBadge value={tier.vp} />
                </div>
              ) : tier.perUnit ? (
                <div className={rowClass}>
                  {row}
                  <ConditionStepper vp={tier.vp} count={count} onChange={c => interactive.onCountChange(key, c)} />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const group = groups.find(g => g.includes(i))
                    const clearKeys = isRadioMember && group
                      ? group.filter(gi => gi !== i).map(gi => conditionKey(sectionIndex, gi))
                      : undefined
                    interactive.onToggle(key, clearKeys)
                  }}
                  className={`text-left hover:bg-surface-2/60 transition-colors ${rowClass}`}
                >
                  {row}
                  <ConditionToggle vp={tier.vp} active={checked} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function PrimaryMissionSections({
  sections,
  accentClass,
  interactive,
}: {
  sections: PrimaryMissionSection[]
  accentClass: string
  interactive?: InteractiveProps
}) {
  const visible = interactive
    ? sections.filter(s => (s.headerKind === 'eob') === interactive.showEob)
    : sections

  return (
    <div className="flex flex-col gap-px">
      {sections.map((section, i) => {
        if (interactive && (section.headerKind === 'eob') !== interactive.showEob) return null
        return (
          <SectionBlock key={i} section={section} sectionIndex={i} accentClass={accentClass} interactive={interactive} />
        )
      })}
      {interactive && visible.length === 0 && (
        <p className="text-[11px] font-mono text-parchment-dim uppercase tracking-widest text-center py-4">
          Sin condiciones {interactive.showEob ? 'de fin de partida' : 'para esta ronda'}
        </p>
      )}
    </div>
  )
}
