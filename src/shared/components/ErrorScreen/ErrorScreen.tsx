interface Props {
  error: string
}

export function ErrorScreen({ error }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-1 p-8">
      <div className="border border-crimson/50 bg-crimson/10 p-6 max-w-lg w-full">
        <p className="text-[12px] font-display uppercase tracking-widest text-crimson-bright mb-2">
          ⚠ Error del Cogitador
        </p>
        <p className="text-[14px] font-mono text-parchment-dim leading-relaxed">{error}</p>
      </div>
    </div>
  )
}
