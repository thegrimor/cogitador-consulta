import { useParams, NavLink, useNavigate } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { ROUTES, factionDatasheetsPath, factionDetachmentsPath, factionArmyRulesPath } from '@/core/constants/routes'

function NavTile({ to, label, meta }: { to: string; label: string; meta: string }) {
  return (
    <NavLink
      to={to}
      className="group flex items-center justify-between bg-surface-2 border border-rim-bright hover:border-crimson-bright px-4 py-4 transition-colors"
    >
      <div>
        <p className="text-[14px] font-display uppercase tracking-widest text-parchment group-hover:text-parchment">
          {label}
        </p>
        <p className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim mt-0.5">
          {meta}
        </p>
      </div>
      <span className="text-[18px] font-mono text-parchment-dim group-hover:text-parchment transition-colors">›</span>
    </NavLink>
  )
}

export function FactionPage() {
  const { factionId } = useParams<{ factionId: string }>()
  const { factions, datasheets, detachments, armyRulesByFaction } = useGameDataContext()
  const navigate = useNavigate()

  const faction = factions.find(f => f.id === factionId)
  const sheetCount = datasheets.filter(d => d.factionId === factionId && !d.isVirtual).length
  const detachmentCount = detachments.filter(d => d.factionId === factionId).length
  const armyRuleCount = (armyRulesByFaction[factionId ?? ''] ?? []).length

  if (!faction) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[12px] font-mono text-parchment-dim uppercase tracking-widest">
          Facción no encontrada
        </p>
      </div>
    )
  }

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
          {faction.name}
        </h1>
        <p className="text-[11px] font-mono uppercase tracking-[2px] text-parchment-dim mt-0.5">
          {faction.id}
        </p>
      </div>

      {/* Tiles de navegación */}
      <div className="flex flex-col gap-px">
        <NavTile
          to={factionDatasheetsPath(factionId!)}
          label="Datasheets"
          meta={`${sheetCount} unidades`}
        />
        {detachmentCount > 0 && (
          <NavTile
            to={factionDetachmentsPath(factionId!)}
            label="Destacamentos"
            meta={`${detachmentCount} destacamentos`}
          />
        )}
        {armyRuleCount > 0 && (
          <NavTile
            to={factionArmyRulesPath(factionId!)}
            label="Regla de Ejército"
            meta={`${armyRuleCount} regla${armyRuleCount !== 1 ? 's' : ''}`}
          />
        )}
      </div>
    </div>
  )
}
