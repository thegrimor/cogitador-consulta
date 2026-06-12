import { useParams, useNavigate } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { factionPath } from '@/core/constants/routes'

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-3 py-1.5 bg-surface-3 border-b border-rim-bright">
      <span className="text-[9px] font-display uppercase tracking-widest text-crimson-bright">
        {title}
      </span>
    </div>
  )
}

const CP_LABELS: Record<number, string> = { 1: '1CP', 2: '2CP', 3: '3CP' }

export function DetachmentDetailPage() {
  const { detachmentId } = useParams<{ detachmentId: string }>()
  const { detachments, detachmentAbilities, stratagems, factions } = useGameDataContext()
  const navigate = useNavigate()

  const det = detachments.find(d => d.id === detachmentId)
  if (!det) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[9px] font-mono text-parchment-dim uppercase tracking-widest">
          Destacamento no encontrado
        </p>
      </div>
    )
  }

  const faction = factions.find(f => f.id === det.factionId)
  const abilities = detachmentAbilities.filter(a => a.detachmentId === detachmentId)
  const strats = stratagems.filter(s => s.detachmentId === detachmentId)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(factionPath(det.factionId))}
          className="text-[8px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mb-3 flex items-center gap-1"
        >
          ← {faction?.name ?? 'Ejército'}
        </button>
        <div className="h-1 bg-crimson mb-2" />
        <h1 className="text-[13px] font-display uppercase tracking-[3px] text-parchment">
          {det.name}
        </h1>
        {det.legend && (
          <p className="text-[8px] font-mono text-parchment-dim italic mt-1 leading-relaxed max-w-2xl">
            {det.legend}
          </p>
        )}
      </div>

      {/* ── Habilidades / Mejoras ── */}
      {abilities.length > 0 && (
        <section className="mb-6">
          <div className="border border-rim-bright">
            <SectionHeader title={`Mejoras (${abilities.length})`} />
            <div className="divide-y divide-rim-bright">
              {abilities.map(ab => (
                <div key={ab.id} className="px-3 py-3 bg-surface-2">
                  <p className="text-[9px] font-display uppercase tracking-widest text-parchment mb-0.5">
                    {ab.name}
                  </p>
                  {ab.legend && (
                    <p className="text-[8px] font-mono text-parchment-dim italic mb-1.5 leading-relaxed">
                      {ab.legend}
                    </p>
                  )}
                  {ab.description && (
                    <p className="text-[8px] font-mono text-parchment leading-relaxed">
                      {ab.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Estratagemas ── */}
      {strats.length > 0 && (
        <section className="mb-6">
          <div className="border border-rim-bright">
            <SectionHeader title={`Estratagemas (${strats.length})`} />
            <div className="divide-y divide-rim-bright">
              {strats.map(s => (
                <div key={s.id} className="px-3 py-3 bg-surface-2">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-[10px] font-display uppercase tracking-widest text-parchment leading-tight">
                      {s.name}
                    </p>
                    <span className="shrink-0 text-[8px] font-mono font-bold text-gold border border-gold/60 px-1.5 py-0.5 leading-none">
                      {CP_LABELS[s.cpCost] ?? `${s.cpCost}CP`}
                    </span>
                  </div>
                  {/* Metadata */}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2">
                    {s.type && (
                      <span className="text-[7px] font-mono uppercase tracking-widest text-parchment-dim">
                        Tipo: <span className="text-parchment">{s.type}</span>
                      </span>
                    )}
                    {s.turn && (
                      <span className="text-[7px] font-mono uppercase tracking-widest text-parchment-dim">
                        Turno: <span className="text-parchment">{s.turn}</span>
                      </span>
                    )}
                    {s.phase && (
                      <span className="text-[7px] font-mono uppercase tracking-widest text-parchment-dim">
                        Fase: <span className="text-parchment">{s.phase}</span>
                      </span>
                    )}
                  </div>
                  {/* Description */}
                  <p className="text-[8px] font-mono text-parchment leading-relaxed">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {abilities.length === 0 && strats.length === 0 && (
        <p className="text-[9px] font-mono text-parchment-dim text-center py-10 uppercase tracking-widest">
          Sin datos para este destacamento
        </p>
      )}
    </div>
  )
}
