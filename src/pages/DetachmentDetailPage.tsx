import { useParams, useNavigate } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { factionPath } from '@/core/constants/routes'
import { DECK_COLORS, dispositionDeckSlug } from '@/core/constants/missionDeckColors'
import { stratagemTurnColors } from '@/core/constants/stratagemTurnColors'
import { RuleHtml } from '@/shared/components/RuleHtml'

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-3 py-1.5 bg-surface-3 border-b border-rim-bright">
      <span className="text-[12px] font-display uppercase tracking-widest text-crimson-bright">
        {title}
      </span>
    </div>
  )
}

const CP_LABELS: Record<number, string> = { 1: '1CP', 2: '2CP', 3: '3CP' }

export function DetachmentDetailPage() {
  const { detachmentId } = useParams<{ detachmentId: string }>()
  const { detachments, detachmentAbilities, stratagems, factions, enhancements } = useGameDataContext()
  const navigate = useNavigate()

  const det = detachments.find(d => d.id === detachmentId)
  if (!det) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[12px] font-mono text-parchment-dim uppercase tracking-widest">
          Destacamento no encontrado
        </p>
      </div>
    )
  }

  const faction = factions.find(f => f.id === det.factionId)
  const abilities = detachmentAbilities.filter(a => a.detachmentId === detachmentId)
  const strats = stratagems.filter(s => s.detachmentId === detachmentId)
  const detEnhancements = enhancements.filter(e => e.detachmentId === detachmentId)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(factionPath(det.factionId))}
          className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mb-3 flex items-center gap-1"
        >
          ← {faction?.name ?? 'Ejército'}
        </button>
        <div className="h-1 bg-crimson mb-2" />
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment">
            {det.name}
          </h1>
          {det.dp > 0 && (
            <span className="text-[13px] font-mono font-bold border border-crimson/70 text-crimson-bright px-2 py-0.5 leading-none shrink-0">
              {det.dp} DP
            </span>
          )}
        </div>
        {det.disposition && (() => {
          const colors = DECK_COLORS[dispositionDeckSlug(det.disposition)]
          return (
            <div className="mt-1.5 mb-1">
              <span
                className={`text-[10px] font-mono uppercase tracking-[2px] px-2 py-0.5 leading-none border ${
                  colors ? `${colors.text} ${colors.borderSoft}` : 'text-parchment-dim border-rim-bright'
                }`}
              >
                {det.disposition}
              </span>
            </div>
          )
        })()}
      </div>

      {/* ── Habilidades de destacamento ── */}
      {abilities.length > 0 && (
        <section className="mb-6">
          <div className="border border-rim-bright">
            <SectionHeader title={`Habilidades (${abilities.length})`} />
            <div className="divide-y divide-rim-bright">
              {abilities.map(ab => (
                <div key={ab.id} className="px-3 py-3 bg-surface-2">
                  <p className="text-[12px] font-display uppercase tracking-widest text-parchment mb-0.5">
                    {ab.name}
                  </p>
                  {ab.description && <RuleHtml html={ab.description} className="prose-copy" factionId={det.factionId} />}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Enhancements ── */}
      {detEnhancements.length > 0 && (
        <section className="mb-6">
          <div className="border border-rim-bright">
            <SectionHeader title={`Mejoras (${detEnhancements.length})`} />
            <div className="divide-y divide-rim-bright">
              {detEnhancements.map(en => (
                <div key={en.id} className="px-3 py-3 bg-surface-2 border-l-2 border-l-gold">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-[12px] font-display uppercase tracking-widest text-gold">
                      {en.name}
                    </p>
                    {en.cost > 0 && (
                      <span className="shrink-0 text-[11px] font-mono border border-gold/60 text-gold px-1.5 py-px leading-none">
                        {en.cost} pts
                      </span>
                    )}
                  </div>
                  {en.description && <RuleHtml html={en.description} className="prose-copy" factionId={det.factionId} />}
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
              {strats.map(s => {
                const turnColors = stratagemTurnColors(s.turn)
                return (
                  <div key={s.id} className={`px-3 py-3 bg-surface-2 border-l-2 ${turnColors.borderLeft}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className={`text-[13px] font-display uppercase tracking-widest leading-tight ${turnColors.text}`}>
                        {s.name}
                      </p>
                      <span className="shrink-0 text-[11px] font-mono font-bold text-gold border border-gold/60 px-1.5 py-0.5 leading-none">
                        {CP_LABELS[s.cpCost] ?? `${s.cpCost}CP`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2">
                      {s.type && (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim">
                          Tipo: <span className="text-parchment">{s.type}</span>
                        </span>
                      )}
                      {s.turn && (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim">
                          Turno: <span className={turnColors.text}>{s.turn}</span>
                        </span>
                      )}
                      {s.phase && (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim">
                          Fase: <span className="text-parchment">{s.phase}</span>
                        </span>
                      )}
                    </div>
                    <RuleHtml html={s.description} className="prose-copy" factionId={det.factionId} />
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {abilities.length === 0 && strats.length === 0 && detEnhancements.length === 0 && (
        <p className="text-[12px] font-mono text-parchment-dim text-center py-10 uppercase tracking-widest">
          Sin datos para este destacamento
        </p>
      )}
    </div>
  )
}
