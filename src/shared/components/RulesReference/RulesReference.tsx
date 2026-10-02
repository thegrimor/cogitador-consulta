import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Ability, Detachment, DetachmentAbility, Stratagem } from '@/types'
import { stratagemTurnColors } from '@/core/constants/stratagemTurnColors'
import { RuleHtml } from '@/shared/components/RuleHtml'

interface Props {
  factionId: string
  detachments: Detachment[]
  detachmentAbilities: DetachmentAbility[]
  armyRules: Ability[]
  stratagems: Stratagem[]
}

function Accordion({
  title, count, level, children,
}: { title: string; count?: number; level: 1 | 2; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const outer = level === 1
  return (
    <div className={outer ? 'border border-rim-bright bg-surface-2' : 'border-t border-rim-bright'}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between px-3 text-left uppercase tracking-widest transition-colors ${
          outer
            ? 'py-3 text-[13px] font-display text-parchment hover:text-gold-bright'
            : 'py-2 text-[12px] font-display text-gold hover:text-gold-bright'
        }`}
      >
        <span>
          {title}
          {count !== undefined && <span className="font-mono text-parchment-dim ml-2">({count})</span>}
        </span>
        <span>{open ? '▴' : '▾'}</span>
      </button>
      {open && <div className={outer ? 'border-t border-rim-bright' : 'px-3 pb-3 space-y-2'}>{children}</div>}
    </div>
  )
}

/** Bottom-of-roster reference: detachment rules, army rules and stratagem sets, each its own
 * accordion inside one outer accordion. This content used to repeat on every unit card. */
export function RulesReference({ factionId, detachments, detachmentAbilities, armyRules, stratagems }: Props) {
  const abilitiesByDetachment = detachments
    .map(d => ({ detachment: d, abilities: detachmentAbilities.filter(a => a.detachmentId === d.id) }))
    .filter(x => x.abilities.length > 0)
  const stratagemsByDetachment = detachments
    .map(d => ({ detachment: d, stratagems: stratagems.filter(s => s.detachmentId === d.id) }))
    .filter(x => x.stratagems.length > 0)

  if (abilitiesByDetachment.length + armyRules.length + stratagemsByDetachment.length === 0) return null

  return (
    <section className="mt-8">
      <Accordion title="Consulta de reglas" level={1}>
        {abilitiesByDetachment.length > 0 && (
          <Accordion title="Reglas de Destacamento" count={abilitiesByDetachment.length} level={2}>
            {abilitiesByDetachment.map(({ detachment, abilities }) => (
              <Accordion key={detachment.id} title={detachment.name} count={abilities.length} level={2}>
                {abilities.map(a => (
                  <div key={a.id} className="border border-gold/30 bg-gold/5 p-2">
                    <p className="text-[12px] font-display uppercase tracking-widest text-gold mb-1">◆ {a.name}</p>
                    <RuleHtml html={a.description} className="prose-copy" factionId={factionId} />
                  </div>
                ))}
              </Accordion>
            ))}
          </Accordion>
        )}

        {armyRules.length > 0 && (
          <Accordion title="Reglas de Ejército" count={armyRules.length} level={2}>
            {armyRules.map(r => (
              <Accordion key={r.id} title={r.name} level={2}>
                <div className="border-l-2 border-l-rim-bright pl-2">
                  <RuleHtml html={r.description} className="prose-copy" factionId={factionId} />
                </div>
              </Accordion>
            ))}
          </Accordion>
        )}

        {stratagemsByDetachment.length > 0 && (
          <Accordion title="Estratagemas" count={stratagemsByDetachment.length} level={2}>
            {stratagemsByDetachment.map(({ detachment, stratagems: strats }) => (
              <Accordion key={detachment.id} title={detachment.name} count={strats.length} level={2}>
                {strats.map(s => {
                  const turnColors = stratagemTurnColors(s.turn)
                  return (
                    <div key={s.id} className={`border border-rim-bright bg-surface-3 border-l-2 ${turnColors.borderLeft} p-2`}>
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className={`text-[12px] font-display uppercase tracking-widest leading-tight ${turnColors.text}`}>
                          {s.name}
                        </p>
                        <span className="shrink-0 text-[11px] font-mono font-bold text-gold border border-gold/60 px-1.5 py-0.5 leading-none">
                          {s.cpCost}CP
                        </span>
                      </div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mb-1">
                        {[s.type, s.turn, s.phase].filter(Boolean).join(' · ')}
                      </p>
                      <RuleHtml html={s.description} className="prose-copy" factionId={factionId} />
                    </div>
                  )
                })}
              </Accordion>
            ))}
          </Accordion>
        )}
      </Accordion>
    </section>
  )
}
