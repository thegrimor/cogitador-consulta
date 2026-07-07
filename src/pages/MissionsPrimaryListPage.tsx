import { NavLink, useNavigate } from 'react-router-dom'
import { useMissionsData } from '@/infrastructure/data/useMissionsData'
import { missionPrimaryPath, ROUTES } from '@/core/constants/routes'
import { missionSlug } from '@/core/utils/missionText'
import { DECK_COLORS } from '@/core/constants/missionDeckColors'

function NavTile({
  to,
  name,
  subtitle,
  accentClass,
}: {
  to: string
  name: string
  subtitle: string
  accentClass: string
}) {
  return (
    <NavLink
      to={to}
      className={`group flex items-center justify-between bg-surface-2 border border-rim-bright hover:border-crimson-bright border-l-2 ${accentClass} px-4 py-3 transition-colors`}
    >
      <div>
        <p className="text-[13px] font-display uppercase tracking-widest text-parchment group-hover:text-parchment">
          {name}
        </p>
        <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mt-0.5">
          {subtitle}
        </p>
      </div>
      <span className="text-[18px] font-mono text-parchment-dim group-hover:text-parchment transition-colors">›</span>
    </NavLink>
  )
}

export function MissionsPrimaryListPage() {
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
          Misiones Primarias
        </h1>
        <p className="text-[11px] font-mono uppercase tracking-[2px] text-parchment-dim mt-0.5">
          5 mazos · 25 cartas
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
        <div>
          {missions.primaryMissions.map(deck => {
            const deckSlug = missionSlug(deck.url)
            const colors = DECK_COLORS[deckSlug]
            return (
              <div key={deck.name} className="mb-6">
                <p className={`text-[13px] font-display uppercase tracking-widest ${colors.text} mb-0.5 px-1`}>
                  {deck.name}
                </p>
                <p className="text-[10px] font-mono text-parchment-dim mb-2 px-1">
                  {deck.description}
                </p>
                <div className="flex flex-col gap-px">
                  {deck.cards.map(card => (
                    <NavTile
                      key={card.name}
                      to={missionPrimaryPath(missionSlug(card.url))}
                      name={card.name}
                      subtitle={`vs ${card.vs.replace(/-/g, ' ')}`}
                      accentClass={colors.borderLeft}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
