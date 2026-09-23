import type { Datasheet, RosterEntry, WeaponOptionRule, WargearCost } from '@/types'
import { resolveRoleCounts, ruleEligibleCount, stripHtml } from '@/core/utils/weaponOptions'
import {
  getRuleSelection,
  replaceWeaponRemaining,
  ruleChoiceMax,
  ruleSelectionCap,
  ruleSelectionTotal,
} from '@/core/utils/roster'

interface Props {
  datasheet: Datasheet
  entry: RosterEntry
  wargearCosts: WargearCost[]
  onChangeSelection: (ruleId: string, selection: number[]) => void
  onChangeWargearSelections: (selections: Record<string, number>) => void
}

function stepperButtonClass(disabled: boolean): string {
  return `w-5 h-5 flex items-center justify-center border text-[11px] font-mono leading-none transition-colors ${
    disabled
      ? 'border-rim-bright/40 text-parchment-dim/30 cursor-not-allowed'
      : 'border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment'
  }`
}

function RuleEditor({
  rule,
  allRules,
  roleCounts,
  modelCount,
  entry,
  onChange,
}: {
  rule: WeaponOptionRule
  allRules: WeaponOptionRule[]
  roleCounts: Record<string, number>
  modelCount: number
  entry: RosterEntry
  onChange: (selection: number[]) => void
}) {
  const eligible = ruleEligibleCount(rule, roleCounts, modelCount)
  const cap = ruleSelectionCap(rule, allRules, entry, roleCounts, modelCount)
  const selection = getRuleSelection(entry, rule)
  const total = ruleSelectionTotal(selection)

  if (eligible === 0) return null

  function setQty(i: number, qty: number) {
    const next = [...selection]
    next[i] = qty
    onChange(next)
  }

  const addLabel =
    cap > eligible
      ? `Equipar (${eligible} modelo${eligible === 1 ? '' : 's'} · hasta ${cap})`
      : `Equipar (${eligible} disponible${eligible === 1 ? '' : 's'})`

  const label = rule.label
    ? `${rule.label} (${eligible} disponible${eligible === 1 ? '' : 's'})`
    : rule.kind === 'replace'
      ? `${rule.fromWeapons.join(' / ')} → (${eligible} disponible${eligible === 1 ? '' : 's'})`
      : addLabel

  const baseRemaining = replaceWeaponRemaining(rule, allRules, entry, modelCount)

  return (
    <div className="border border-rim-bright px-2 py-1.5">
      <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mb-1">{label}</p>
      <div className="flex flex-col gap-1">
        {rule.kind === 'replace' && (
          <div className="flex items-center justify-between gap-2 pb-1 mb-0.5 border-b border-rim-bright/30">
            <span className="text-[11px] font-mono text-parchment-dim truncate">
              {rule.fromWeapons.join(' + ')} (equipo base)
            </span>
            <span className="text-[11px] font-mono text-parchment-dim shrink-0">x{baseRemaining}</span>
          </div>
        )}
        {rule.choices.map((choice, i) => {
          const max = ruleChoiceMax(rule, i, selection, cap)
          const qty = selection[i]
          return (
            <div key={i} className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-parchment truncate">{choice.join(' + ')}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={qty === 0}
                  onClick={() => setQty(i, qty - 1)}
                  className={stepperButtonClass(qty === 0)}
                >
                  −
                </button>
                <span className="w-4 text-center text-[11px] font-mono text-parchment">{qty}</span>
                <button
                  type="button"
                  disabled={qty >= max}
                  onClick={() => setQty(i, qty + 1)}
                  className={stepperButtonClass(qty >= max)}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {cap > 1 && (
        <p className="text-[9px] font-mono text-parchment-dim/60 mt-1">
          {total} / {cap} usados
        </p>
      )}
    </div>
  )
}

/** A named upgrade priced via `wargearCosts` (e.g. a squad model equipped as a named character
 * — Chapter Ancient, Vexilla bearer, ...) rendered with the same bordered-box/stepper look as a
 * parsed weapon-swap rule, so it reads as one consistent "Opciones de Equipo" list rather than a
 * separately-styled surcharge panel. */
function WargearCostBox({
  wc,
  modelCount,
  current,
  onChange,
}: {
  wc: WargearCost
  modelCount: number
  current: number
  onChange: (qty: number) => void
}) {
  const effectiveMax = wc.max !== undefined ? Math.min(wc.max, modelCount) : modelCount
  const label = wc.name.replace(/^per /i, '')
  const priceSuffix = wc.points > 0 ? ` (+${wc.points}pts${effectiveMax > 1 ? '/modelo' : ''})` : ''

  if (effectiveMax === 0) return null

  return (
    <div className="border border-rim-bright px-2 py-1.5">
      <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mb-1">
        {label}
        {priceSuffix}
      </p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono text-parchment truncate">
          {current > 0 ? 'Equipado' : 'Sin equipar'}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={current === 0}
            onClick={() => onChange(Math.max(0, current - 1))}
            className={stepperButtonClass(current === 0)}
          >
            −
          </button>
          <span className="w-4 text-center text-[11px] font-mono text-parchment">{current}</span>
          <button
            type="button"
            disabled={current >= effectiveMax}
            onClick={() => onChange(Math.min(effectiveMax, current + 1))}
            className={stepperButtonClass(current >= effectiveMax)}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

export function WeaponOptionsEditor({ datasheet, entry, wargearCosts, onChangeSelection, onChangeWargearSelections }: Props) {
  const roleCounts = resolveRoleCounts(datasheet.unitSlots, entry.modelCount)
  const parsedRules = datasheet.weaponOptionRules.filter(r => r.scope !== 'unparsed' && r.choices.length > 0)
  // A wargearCosts item's core name (its text before any trailing "(...)" annotation) is
  // expected to appear in the plain-English option sentence that documents it (e.g. wargearCost
  // "chapter ancient (banner of macragge)" ↔ option text "...equipped as a Chapter Ancient,
  // carrying..."), so that sentence is dropped from the inert "revisar manualmente" fallback
  // once it has a real interactive control instead.
  const wargearCoreNames = wargearCosts.map(w => w.name.replace(/\s*\([^)]*\)\s*$/, '').toLowerCase())
  const unparsedRules = datasheet.weaponOptionRules.filter(
    r => r.scope === 'unparsed' && !wargearCoreNames.some(name => stripHtml(r.raw).toLowerCase().includes(name)),
  )
  const wargearSelections = entry.wargearSelections ?? {}

  if (parsedRules.length === 0 && unparsedRules.length === 0 && wargearCosts.length === 0) return null

  return (
    <div className="space-y-2">
      {(parsedRules.length > 0 || wargearCosts.length > 0) && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mb-1">
            Opciones de Equipo
          </p>
          <div className="flex flex-col gap-1.5">
            {wargearCosts.map(wc => (
              <WargearCostBox
                key={wc.name}
                wc={wc}
                modelCount={entry.modelCount}
                current={wargearSelections[wc.name] ?? 0}
                onChange={qty => onChangeWargearSelections({ ...wargearSelections, [wc.name]: qty })}
              />
            ))}
            {parsedRules.map(rule => (
              <RuleEditor
                key={rule.id}
                rule={rule}
                allRules={datasheet.weaponOptionRules}
                roleCounts={roleCounts}
                modelCount={entry.modelCount}
                entry={entry}
                onChange={selection => onChangeSelection(rule.id, selection)}
              />
            ))}
          </div>
        </div>
      )}
      {unparsedRules.length > 0 && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mb-1">
            Otras Opciones (revisar manualmente)
          </p>
          <div className="flex flex-col gap-1">
            {unparsedRules.map(rule => (
              <p key={rule.id} className="text-[10px] font-mono text-parchment-dim/70 italic leading-relaxed">
                {stripHtml(rule.raw)}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
