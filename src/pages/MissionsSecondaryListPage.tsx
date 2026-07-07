import { NavLink, useNavigate } from 'react-router-dom'
import { useMissionsData } from '@/infrastructure/data/useMissionsData'
import { missionSecondaryPath, ROUTES } from '@/core/constants/routes'
import { missionSlug } from '@/core/utils/missionText'

function NavTile({
  to,
  name,
  subtitle,
  hasAction,
}: {
  to: string
  name: string
  subtitle: string
  hasAction: boolean
}) {
  return (
    <NavLink
      to={to}
      className="group flex items-center justify-between bg-surface-2 border border-rim-bright hover:border-crimson-bright px-4 py-3 transition-colors"
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-display uppercase tracking-widest text-parchment group-hover:text-parchment">
            {name}
          </p>
          {hasAction && (
            <span className="text-[9px] font-mono uppercase tracking-wide border border-gold/50 text-gold px-1.5 py-px leading-none">
              Con acción
            </span>
          )}
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mt-0.5">
          {subtitle}
        </p>
      </div>
      <span className="text-[18px] font-mono text-parchment-dim group-hover:text-parchment transition-colors">›</span>
    </NavLink>
  )
}

export function MissionsSecondaryListPage() {
  const navigate = useNavigate()
  const { missions, loading, error } = useMissionsData()

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(ROUTES.CATALOG)}
          className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mb-3 flex items-center gap-1"
        >
          ← Catálogo
        </button>
        <div className="h-1 bg-crimson mb-2" />
        <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment">
          Misiones Secundarias
        </h1>
        <p className="text-[11px] font-mono uppercase tracking-[2px] text-parchment-dim mt-0.5">
          18 cartas
        </p>
      </div>

      {loading && (
        <p className="text-[12px] font-mono text-parchment-dim text-center py-10 uppercase tracking-widest">
          Cargando misiones…
        </p>
      )}

      {error && (
        <p className="text-[12px] font-mono text-parchment-dim text-center py-10 uppercase tracking-widest">
          {error}
        </p>
      )}

      {missions && (
        <div className="flex flex-col gap-px">
          {missions.secondaryMissions.map(card => (
            <NavTile
              key={card.name}
              to={missionSecondaryPath(missionSlug(card.url))}
              name={card.name}
              subtitle={card.kindLabel ? 'Fija / Táctica' : `${card.sections.length} secciones`}
              hasAction={Boolean(card.action)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
