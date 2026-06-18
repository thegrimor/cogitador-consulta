export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-1">
      <div className="text-center">
        <div className="text-4xl font-display text-crimson-bright mb-4 animate-pulse-mech">
          ⚙
        </div>
        <p className="text-[13px] font-display uppercase tracking-[4px] text-gold animate-pulse">
          Inicializando Cogitador…
        </p>
      </div>
    </div>
  )
}
