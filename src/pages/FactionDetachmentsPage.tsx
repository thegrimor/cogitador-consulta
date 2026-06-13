import { useParams, NavLink, useNavigate } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { factionPath, detachmentPath } from '@/core/constants/routes'

export function FactionDetachmentsPage() {
  const { factionId } = useParams<{ factionId: string }>()
  const { factions, detachments, detachmentAbilities, stratagems } = useGameDataContext()
  const navigate = useNavigate()

  const faction = factions.find(f => f.id === factionId)
  const factionDetachments = detachments.filter(d => d.factionId === factionId)

  if (!faction) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[9px] font-mono text-parchment-dim uppercase tracking-widest">
          Facción no encontrada
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(factionPath(factionId!))}
          className="text-[8px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mb-3 flex items-center gap-1"
        >
          ← {faction.name}
        </button>
        <div className="h-1 bg-crimson mb-2" />
        <h1 className="text-[13px] font-display uppercase tracking-[3px] text-parchment">
          Destacamentos
        </h1>
        <p className="text-[8px] font-mono uppercase tracking-[2px] text-parchment-dim mt-0.5">
          {faction.name} · {factionDetachments.length} destacamentos
        </p>
      </div>

      {factionDetachments.length === 0 ? (
        <p className="text-[9px] font-mono text-parchment-dim text-center py-10 uppercase tracking-widest">
          Sin destacamentos
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {factionDetachments.map(det => {
            const abilCount = detachmentAbilities.filter(a => a.detachmentId === det.id).length
            const stratCount = stratagems.filter(s => s.detachmentId === det.id).length
            return (
              <NavLink
                key={det.id}
                to={detachmentPath(det.id)}
                className="group bg-surface-2 border border-rim-bright hover:border-crimson-bright px-3 py-3 transition-colors flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-display uppercase tracking-widest text-parchment group-hover:text-parchment mb-1">
                    {det.name}
                  </p>
                  {det.legend && (
                    <p className="wh-html text-[8px] font-mono text-parchment-dim italic leading-relaxed line-clamp-2 mb-2"
                      dangerouslySetInnerHTML={{ __html: det.legend }}
                    />
                  )}
                  <div className="flex gap-3">
                    {abilCount > 0 && (
                      <span className="text-[7px] font-mono uppercase tracking-widest text-parchment-dim">
                        {abilCount} mejora{abilCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {stratCount > 0 && (
                      <span className="text-[7px] font-mono uppercase tracking-widest text-parchment-dim">
                        {stratCount} estratagema{stratCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-mono text-parchment-dim shrink-0 mt-0.5">›</span>
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}
