/** Indicador de VP tocable (variante interactiva de VpBadge): se enciende cuando la condición está marcada. */
export function ConditionToggle({ vp, active }: { vp: number; active: boolean }) {
  return (
    <div
      className={`flex flex-col items-center border px-2 py-1 min-w-[38px] shrink-0 transition-colors ${
        active ? 'border-gold bg-gold/10' : 'border-rim-bright/50 bg-surface-3'
      }`}
    >
      <span
        className={`text-[9px] font-mono uppercase tracking-widest leading-none ${
          active ? 'text-gold' : 'text-parchment-dim'
        }`}
      >
        VP
      </span>
      <span
        className={`text-[13px] font-display leading-tight mt-0.5 ${
          active ? 'text-gold-bright' : 'text-parchment-dim'
        }`}
      >
        {vp}
      </span>
    </div>
  )
}

/** Contador +/- para condiciones `perUnit`/`perEvent`: el VP mostrado es vp × count. */
export function ConditionStepper({
  vp,
  count,
  onChange,
}: {
  vp: number
  count: number
  onChange: (count: number) => void
}) {
  return (
    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, count - 1))}
        className="w-6 h-6 border border-rim-bright text-parchment-dim hover:text-parchment hover:border-crimson-bright font-mono text-[13px] leading-none transition-colors"
      >
        −
      </button>
      <ConditionToggle vp={vp * count} active={count > 0} />
      <button
        type="button"
        onClick={() => onChange(count + 1)}
        className="w-6 h-6 border border-rim-bright text-parchment-dim hover:text-parchment hover:border-crimson-bright font-mono text-[13px] leading-none transition-colors"
      >
        +
      </button>
    </div>
  )
}
