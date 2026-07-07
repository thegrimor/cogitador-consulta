export function VpBadge({ value }: { value: string | number }) {
  return (
    <div className="flex flex-col items-center border border-gold/50 bg-surface-3 px-2 py-1 min-w-[38px] shrink-0">
      <span className="text-[9px] font-mono uppercase text-parchment-dim leading-none">VP</span>
      <span className="text-[13px] font-display text-gold-bright leading-tight mt-0.5">{value}</span>
    </div>
  )
}
