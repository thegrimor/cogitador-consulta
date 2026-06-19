import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PHASES } from '@/core/constants/phasesData'
import { ROUTES } from '@/core/constants/routes'

function SubsectionRow({ refNum, name, description }: { refNum: string; name: string; description: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-rim-bright">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-2 hover:bg-surface-3 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-crimson shrink-0">{refNum}</span>
          <span className="text-[13px] font-display uppercase tracking-widest text-parchment">
            {name}
          </span>
        </div>
        <span className="text-[15px] font-mono text-parchment-dim ml-2 shrink-0 transition-transform" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          ›
        </span>
      </button>
      {open && (
        <div className="px-4 py-3 border-t border-rim-bright bg-surface-1">
          <p className="text-[12px] font-mono text-parchment-dim leading-relaxed whitespace-pre-line">
            {description}
          </p>
        </div>
      )}
    </div>
  )
}

export function PhaseDetailPage() {
  const { phaseId } = useParams<{ phaseId: string }>()
  const navigate = useNavigate()

  const phase = PHASES.find(p => p.id === phaseId)

  if (!phase) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[12px] font-mono text-parchment-dim uppercase tracking-widest">
          Sección no encontrada
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(ROUTES.CORE_RULES_PHASES)}
          className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mb-3 flex items-center gap-1"
        >
          ← Fases de Juego
        </button>
        <div className="h-1 bg-crimson mb-2" />
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-mono uppercase tracking-widest text-crimson">{phase.ref}</span>
          <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment">
            {phase.name}
          </h1>
        </div>
        <p className="text-[11px] font-mono uppercase tracking-[2px] text-parchment-dim mt-1">
          {phase.summary}
        </p>
      </div>

      {/* Subsections */}
      <div className="flex flex-col gap-px">
        {phase.subsections.map(sub => (
          <SubsectionRow
            key={sub.ref}
            refNum={sub.ref}
            name={sub.name}
            description={sub.description}
          />
        ))}
      </div>
    </div>
  )
}
