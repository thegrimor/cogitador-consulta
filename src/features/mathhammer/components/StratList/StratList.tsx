import { useState } from 'react'
import { stratagemTurnColors } from '@/core/constants/stratagemTurnColors'
import type { Stratagem } from '@/types'

interface Props {
  stratagems: Stratagem[]
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function StratList({ stratagems }: Props) {
  const [open, setOpen] = useState(false)
  if (stratagems.length === 0) return null

  return (
    <div className="border-b border-rim-bright">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[9px] font-display uppercase tracking-widest text-gold hover:text-gold-bright transition-colors"
      >
        <span>Estratagemas ({stratagems.length})</span>
        <span>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {stratagems.map(s => {
            const turnColors = stratagemTurnColors(s.turn)
            return (
              <div key={s.id} className={`border border-rim-bright bg-surface-3 p-2 border-l-2 ${turnColors.borderLeft}`}>
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-[9px] font-display uppercase tracking-widest text-crimson-bright">
                    {s.name}
                  </span>
                  <span className="text-[9px] font-mono bg-crimson text-parchment px-1.5 py-0.5 shrink-0">
                    {s.cpCost}CP
                  </span>
                </div>
                <p className="text-[8px] font-mono uppercase mb-1">
                  <span className="text-gold/60">{s.phase} · </span>
                  <span className={turnColors.text}>{s.turn}</span>
                </p>
                <p className="text-[10px] font-mono text-parchment-dim leading-relaxed">
                  {stripHtml(s.description)}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
