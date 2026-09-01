import { RuleHtml } from '@/shared/components/RuleHtml'
import type { MissionAction } from '@/types'

export function MissionActionBox({
  action,
  formatText,
}: {
  action: MissionAction
  formatText: (text: string) => string
}) {
  return (
    <div className="border border-rim-bright mb-4">
      <div className="px-4 py-2 bg-surface-2 border-b border-rim-bright">
        <span className="text-[11px] font-display uppercase tracking-widest text-gold">{action.title}</span>
      </div>
      <div className="bg-surface-1 px-4 py-2 flex flex-col gap-1.5">
        {action.rows.map((row, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-[11px] font-mono text-parchment-dim uppercase w-24 shrink-0">{row.k}</span>
            <RuleHtml html={formatText(row.v)} className="prose-copy" as="span" />
          </div>
        ))}
      </div>
    </div>
  )
}
