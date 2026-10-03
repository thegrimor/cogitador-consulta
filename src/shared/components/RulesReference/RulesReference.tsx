import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Ability, Detachment, DetachmentAbility, Stratagem } from '@/types'
import { stratagemTurnColors } from '@/core/constants/stratagemTurnColors'
import { groupArmyRules } from '@/core/utils/armyRules'
import { RuleHtml } from '@/shared/components/RuleHtml'

interface Props {
  factionId: string
  detachments: Detachment[]
  detachmentAbilities: DetachmentAbility[]
  armyRules: Ability[]
  stratagems: Stratagem[]
}

// One collapsible section; everything inside it is listed in full (no further folds).
function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-rim-bright">
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-3 py-2 text-left text-[12px] font-display uppercase tracking-widest text-gold hover:text-gold-bright transition-colors"
      >
        <span>
          {title}
          <span className="font-mono text-parchment-dim ml-2">({count})</span>
        </span>
        <span>{open ? '▴' : '▾'}</span>
      </button>
      {open && <div className="border-t border-rim-bright px-3 py-3 space-y-3">{children}</div>}
    </div>
  )
}

function ArmyRuleCard({ rule, factionId }: { rule: Ability; factionId: string }) {
  return (
    <div className="border-l-2 border-l-rim-bright pl-2">
      <p className="text-[12px] font-display uppercase tracking-widest text-parchment mb-0.5">{rule.name}</p>
      {rule.description && <RuleHtml html={rule.description} className="prose-copy" factionId={factionId} />}
    </div>
  )
}

/** Bottom-of-roster reference: detachment rules, army rules and stratagems, each a collapsible
 * section listing everything in full inside. This content used to repeat on every unit card. Army rules
 * are sectioned by the data's own `group` field (see `groupArmyRules`). */
export function RulesReference({ factionId, detachments, detachmentAbilities, armyRules, stratagems }: Props) {
  const abilitiesByDetachment = detachments
    .map(d => ({ detachment: d, abilities: detachmentAbilities.filter(a => a.detachmentId === d.id) }))
    .filter(x => x.abilities.length > 0)
  const stratagemsByDetachment = detachments
    .map(d => ({ detachment: d, stratagems: stratagems.filter(s => s.detachmentId === d.id) }))
    .filter(x => x.stratagems.length > 0)
  const { groups, ungrouped } = groupArmyRules(armyRules)

  if (abilitiesByDetachment.length + armyRules.length + stratagemsByDetachment.length === 0) return null

  return (
    <section className="mt-8 space-y-3">
      <p className="text-[13px] font-display uppercase tracking-widest text-parchment">Consulta de reglas</p>
      {/* Sections follow flat: only they fold, there is no outer accordion to open first. */}
      <div className="space-y-3">
          {abilitiesByDetachment.length > 0 && (
            <Section title="Reglas de Destacamento" count={abilitiesByDetachment.reduce((n, x) => n + x.abilities.length, 0)}>
              {abilitiesByDetachment.map(({ detachment, abilities }) => (
                <div key={detachment.id} className="space-y-2">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim">{detachment.name}</p>
                  {abilities.map(a => (
                    <div key={a.id} className="border border-gold/30 bg-gold/5 p-2">
                      <p className="text-[12px] font-display uppercase tracking-widest text-gold mb-1">◆ {a.name}</p>
                      <RuleHtml html={a.description} className="prose-copy" factionId={factionId} />
                    </div>
                  ))}
                </div>
              ))}
            </Section>
          )}

          {armyRules.length > 0 && (
            <Section title="Reglas de Ejército" count={armyRules.length}>
              {groups.map(({ group, rules }) => (
                <div key={group} className="space-y-2">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-crimson-bright">{group}</p>
                  {rules.map(r => <ArmyRuleCard key={r.id} rule={r} factionId={factionId} />)}
                </div>
              ))}
              {ungrouped.map(r => <ArmyRuleCard key={r.id} rule={r} factionId={factionId} />)}
            </Section>
          )}

          {stratagemsByDetachment.length > 0 && (
            <Section title="Estratagemas" count={stratagemsByDetachment.reduce((n, x) => n + x.stratagems.length, 0)}>
              {stratagemsByDetachment.map(({ detachment, stratagems: strats }) => (
                <div key={detachment.id} className="space-y-2">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim">{detachment.name}</p>
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
                </div>
              ))}
            </Section>
          )}
      </div>
    </section>
  )
}
