import type { ModifierRule } from '../../types'
import { describeEffects } from '../../utils/describeEffects'

interface Props {
  rules: ModifierRule[]
  activeIds: Set<string>
  onToggle: (id: string) => void
}

function RuleButton({
  rule, active, onToggle,
}: {
  rule: ModifierRule
  active: boolean
  onToggle: (id: string) => void
}) {
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

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={() => onToggle(rule.id)}
        className={`w-full text-left px-2 py-1.5 border transition-colors ${
          active
            ? 'border-gold bg-gold/20 text-gold-bright'
            : 'border-rim-bright text-parchment hover:border-gold/50 hover:text-parchment'
        }`}
      >
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
        {rule.description && (
          <div className="wh-html text-[10px] font-mono leading-snug mt-0.5 pl-4 opacity-70"
            dangerouslySetInnerHTML={{ __html: rule.description }}
          />
        )}
      </button>
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
