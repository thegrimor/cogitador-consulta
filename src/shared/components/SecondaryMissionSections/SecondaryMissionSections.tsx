import { cleanMissionHtml } from '@/core/utils/missionText'
import { conditionKey, groupExclusiveRuns } from '@/core/utils/battleScoring'
import { VpBadge } from '@/shared/components/VpBadge'
import { ConditionToggle, ConditionStepper } from '@/shared/components/ConditionToggle'
import type { SecondaryMissionSection, ConditionKey, ConditionSelectionState } from '@/types'

export interface SecondaryInteractiveProps {
  selection: ConditionSelectionState
  onToggle: (key: ConditionKey, clearKeys?: ConditionKey[]) => void
  onCountChange: (key: ConditionKey, count: number) => void
}

export function ChipBadge({ chip }: { chip: 'FIXED' | 'TACTICAL' }) {
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

function SecondarySectionBlock({
  section,
  sectionIndex,
  interactive,
}: {
  section: SecondaryMissionSection
  sectionIndex: number
  interactive?: SecondaryInteractiveProps
}) {
  const groups = groupExclusiveRuns(section.rows)

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
        {section.rows.map((row, i) => {
          const key = conditionKey(sectionIndex, i)
          const isRadioMember = groups.some(g => g.length > 1 && g.includes(i))
          const checked = !!interactive?.selection.checked[key]
          const count = interactive?.selection.counts[key] ?? 0
          const isStepper = !!section.perEvent

          const rowContent = (
            <div className="flex-1">
              <p
                className="wh-html text-[12px] font-mono text-parchment leading-relaxed"
                dangerouslySetInnerHTML={{ __html: cleanMissionHtml(row.text) }}
              />
              {row.cumulative && (
                <p className="text-[10px] font-mono text-gold italic mt-0.5">Acumulable con el anterior</p>
              )}
            </div>
          )

          const rowClass = `flex items-start justify-between gap-3 px-4 py-2 w-full ${
            i > 0 && !row.or ? 'border-t border-rim-bright/50' : ''
          }`

          return (
            <div key={i}>
              {row.or && i > 0 && (
                <div className="text-center text-[10px] font-mono uppercase text-parchment-dim py-0.5">o</div>
              )}
              {!interactive ? (
                <div className={rowClass}>
                  {rowContent}
                  <VpBadge value={row.vp} />
                </div>
              ) : isStepper ? (
                <div className={rowClass}>
                  {rowContent}
                  <ConditionStepper
                    vp={parseInt(row.vp.replace('+', ''), 10) || 0}
                    count={count}
                    onChange={c => interactive.onCountChange(key, c)}
                  />
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
                  {rowContent}
                  <ConditionToggle vp={parseInt(row.vp.replace('+', ''), 10) || 0} active={checked} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SecondaryMissionSections({
  sections,
  interactive,
}: {
  sections: SecondaryMissionSection[]
  interactive?: SecondaryInteractiveProps
}) {
  return (
    <div className="flex flex-col gap-px">
      {sections.map((section, i) => (
        <SecondarySectionBlock key={i} section={section} sectionIndex={i} interactive={interactive} />
      ))}
    </div>
  )
}
