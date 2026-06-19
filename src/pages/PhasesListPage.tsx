import { NavLink, useNavigate } from 'react-router-dom'
import { PHASES, PHASE_GROUPS, type PhaseGroup } from '@/core/constants/phasesData'
import { corePhasePath, ROUTES } from '@/core/constants/routes'

function NavTile({ to, ref: refNum, name, count }: { to: string; ref: string; name: string; count: number }) {
  return (
    <NavLink
      to={to}
      className="group flex items-center justify-between bg-surface-2 border border-rim-bright hover:border-crimson-bright px-4 py-4 transition-colors"
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-crimson">{refNum}</span>
          <p className="text-[14px] font-display uppercase tracking-widest text-parchment group-hover:text-parchment">
            {name}
          </p>
        </div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim mt-0.5">
          {count} {count === 1 ? 'section' : 'sections'}
        </p>
      </div>
      <span className="text-[18px] font-mono text-parchment-dim group-hover:text-parchment transition-colors">›</span>
    </NavLink>
  )
}

export function PhasesListPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(ROUTES.CORE_RULES)}
          className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mb-3 flex items-center gap-1"
        >
          ← Reglamento
        </button>
        <div className="h-1 bg-crimson mb-2" />
        <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment">
          Fases de Juego
        </h1>
        <p className="text-[11px] font-mono uppercase tracking-[2px] text-parchment-dim mt-0.5">
          Secciones 07 – 23
        </p>
      </div>

      {/* Groups */}
      {PHASE_GROUPS.map((group: PhaseGroup) => {
        const groupPhases = PHASES.filter(p => p.group === group)
        return (
          <div key={group} className="mb-8">
            <h2 className="text-[12px] font-display uppercase tracking-[2px] text-parchment-dim mb-2 px-1">
              {group}
            </h2>
            <div className="flex flex-col gap-px">
              {groupPhases.map(phase => (
                <NavTile
                  key={phase.id}
                  to={corePhasePath(phase.id)}
                  ref={phase.ref}
                  name={phase.name}
                  count={phase.subsections.length}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
