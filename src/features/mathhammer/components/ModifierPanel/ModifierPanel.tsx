import type { CombatModifiers, ModifierRule } from '../../types'

interface Props {
  rules: ModifierRule[]
  activeIds: Set<string>
  onToggle: (id: string) => void
}

function describeBonus(effects: Partial<CombatModifiers>): string {
  const parts: string[] = []
  if (effects.hitMod)         parts.push(`${effects.hitMod > 0 ? '+' : ''}${effects.hitMod} impactar`)
  if (effects.woundMod)       parts.push(`${effects.woundMod > 0 ? '+' : ''}${effects.woundMod} herir`)
  if (effects.apMod)          parts.push(`${effects.apMod > 0 ? '+' : ''}${effects.apMod} PA`)
  if (effects.damageMod)      parts.push(`${effects.damageMod > 0 ? '+' : ''}${effects.damageMod} Daño`)
  if (effects.rerollHitsOf1)  parts.push('repetir impactos 1')
  if (effects.rerollAllHits)  parts.push('repetir impactos')
  if (effects.rerollWoundsOf1) parts.push('repetir heridas 1')
  if (effects.rerollAllWounds) parts.push('repetir heridas')
  return parts.join(', ')
}

function RuleButton({
  rule, active, bonusActive, onToggle,
}: {
  rule: ModifierRule
  active: boolean
  bonusActive: boolean
  onToggle: (id: string) => void
}) {
  const cpLabel = rule.cpCost ? ` [${rule.cpCost}PC]` : ''

  // The bonus condition is strictly stronger than the base condition (e.g. "below
  // half-strength" implies "below Starting Strength"), so enabling it always implies
  // the base is also active, and disabling the base always implies the bonus is too.
  function handleBaseClick() {
    onToggle(rule.id)
    if (active && bonusActive) onToggle(`${rule.id}__bonus`)
  }

  function handleBonusClick() {
    onToggle(`${rule.id}__bonus`)
    if (!bonusActive && !active) onToggle(rule.id)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleBaseClick}
        className={`w-full text-left px-2 py-1.5 border transition-colors ${
          active
            ? 'border-gold bg-gold/20 text-gold-bright'
            : 'border-rim-bright text-parchment hover:border-gold/50 hover:text-parchment'
        }`}
      >
        <div className="text-xs font-mono leading-snug">
          <span className="mr-1.5">{active ? '▶' : '○'}</span>
          {rule.label}{cpLabel}
        </div>
        {rule.isStratagem && rule.description && (
          <div className="text-[10px] font-mono leading-snug mt-0.5 pl-4 opacity-70">
            {rule.description}
          </div>
        )}
      </button>
      {rule.bonusEffects && (
        <button
          onClick={handleBonusClick}
          className={`w-full text-left px-2 py-1.5 border transition-colors ${
            bonusActive
              ? 'border-gold bg-gold/20 text-gold-bright'
              : 'border-rim-bright text-parchment hover:border-gold/50 hover:text-parchment'
          }`}
        >
          <div className="text-xs font-mono leading-snug">
            <span className="mr-1.5">{bonusActive ? '▶' : '○'}</span>
            {describeBonus(rule.bonusEffects)} si {rule.bonusCondition}
          </div>
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
              <RuleButton key={rule.id} rule={rule} active={activeIds.has(rule.id)} bonusActive={activeIds.has(`${rule.id}__bonus`)} onToggle={onToggle} />
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
              <RuleButton key={rule.id} rule={rule} active={activeIds.has(rule.id)} bonusActive={activeIds.has(`${rule.id}__bonus`)} onToggle={onToggle} />
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
              <RuleButton key={rule.id} rule={rule} active={activeIds.has(rule.id)} bonusActive={activeIds.has(`${rule.id}__bonus`)} onToggle={onToggle} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
