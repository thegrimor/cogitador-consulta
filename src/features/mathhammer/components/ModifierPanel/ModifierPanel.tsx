import { useState } from 'react'
import type { ModifierRule } from '../../types'
import { describeEffects } from '../../utils/describeEffects'

interface Props {
  rules: ModifierRule[]
  activeIds: Set<string>
  onToggle: (id: string) => void
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

// Roughly three lines' worth of plain text at this card's font size/width — below this, the
// clamp never actually cuts anything, so there's nothing to expand.
const CLAMP_THRESHOLD = 120

function RuleButton({
  rule, active, onToggle,
}: {
  rule: ModifierRule
  active: boolean
  onToggle: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cpLabel = rule.cpCost ? ` [${rule.cpCost}PC]` : ''
  const sourceLabel = rule.leaderDatasheetId && rule.sourceUnitName
    ? `Líder: ${rule.sourceUnitName}`
    : rule.sourceDatasheetId && rule.sourceUnitName
      ? `Aura: ${rule.sourceUnitName}`
      : null
  // Mutually-exclusive options of the same ability (e.g. the Ka'tah stances) all share the
  // parent's `description` text — spell out this specific option's own effect so the cards
  // aren't indistinguishable from each other.
  const optionEffect = rule.isOption ? describeEffects(rule.effects, rule.combatType) : ''

  const hasDescription = !!rule.description && !rule.isOption
  const isLong = hasDescription && stripHtml(rule.description!).length > CLAMP_THRESHOLD

  return (
    <div
      className={`w-full border transition-colors ${
        active
          ? 'border-gold bg-gold/20 text-gold-bright'
          : 'border-rim-bright text-parchment hover:border-gold/50 hover:text-parchment'
      }`}
    >
      <button onClick={() => onToggle(rule.id)} className="w-full text-left px-2 py-1.5">
        <div className="text-xs font-mono leading-snug">
          <span className="mr-1.5">{active ? '▶' : '○'}</span>
          {rule.label}{cpLabel}
          {sourceLabel && (
            <span className="ml-1.5 text-[9px] uppercase tracking-wide text-parchment-dim opacity-80">
              ({sourceLabel})
            </span>
          )}
        </div>
        {optionEffect && (
          <div className="text-[10px] font-mono leading-snug mt-0.5 pl-4 text-gold-bright">
            {optionEffect}
          </div>
        )}
        {/* Options share their parent ability's full `description` (often a whole army-rule
         * writeup with tables, e.g. Code Chivalric) — `optionEffect` above already says what
         * this specific branch does, so skip re-rendering that huge shared HTML block per
         * option. Non-option rules still show their own description, clamped by default so an
         * unusually long one doesn't blow up the toggle card — "Ver texto completo" below
         * un-clamps it on demand instead of just cutting it off with no way to read the rest. */}
        {hasDescription && (
          <div className={`wh-html text-[10px] font-mono leading-snug mt-0.5 pl-4 opacity-70 ${expanded ? '' : 'line-clamp-3'}`}
            dangerouslySetInnerHTML={{ __html: rule.description! }}
          />
        )}
      </button>
      {isLong && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            setExpanded(v => !v)
          }}
          className="w-full text-left px-2 pb-1.5 pl-6 text-[9px] uppercase tracking-wide text-parchment-dim hover:text-gold-bright transition-colors"
        >
          {expanded ? '▲ Ver menos' : '▼ Ver texto completo'}
        </button>
      )}
    </div>
  )
}

export function ModifierPanel({ rules, activeIds, onToggle }: Props) {
  const unitRules  = rules.filter(r => !r.isStratagem && (r.datasheetId || r.leaderDatasheetId || r.sourceDatasheetId))
  const armyRules  = rules.filter(r => !r.isStratagem && !r.datasheetId && !r.leaderDatasheetId && !r.sourceDatasheetId)
  const stratagems = rules.filter(r => r.isStratagem)

  if (rules.length === 0) return null

  return (
    <div>
      {unitRules.length > 0 && (
        <>
          <div className="px-3 py-2 text-xs font-display uppercase tracking-wide text-parchment border-b border-t border-rim-bright bg-surface-2">
            Reglas de Unidad
          </div>
          <div className="px-3 py-2 flex flex-col gap-1.5">
            {unitRules.map(rule => (
              <RuleButton key={rule.id} rule={rule} active={activeIds.has(rule.id)} onToggle={onToggle} />
            ))}
          </div>
        </>
      )}
      {armyRules.length > 0 && (
        <>
          <div className="px-3 py-2 text-xs font-display uppercase tracking-wide text-gold border-b border-t border-rim-bright bg-surface-2">
            Reglas de Ejército
          </div>
          <div className="px-3 py-2 flex flex-col gap-1.5">
            {armyRules.map(rule => (
              <RuleButton key={rule.id} rule={rule} active={activeIds.has(rule.id)} onToggle={onToggle} />
            ))}
          </div>
        </>
      )}
      {stratagems.length > 0 && (
        <>
          <div className="px-3 py-2 text-xs font-display uppercase tracking-wide text-crimson border-b border-t border-rim-bright bg-surface-2">
            Estratagemas
          </div>
          <div className="px-3 py-2 flex flex-col gap-1.5">
            {stratagems.map(rule => (
              <RuleButton key={rule.id} rule={rule} active={activeIds.has(rule.id)} onToggle={onToggle} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
