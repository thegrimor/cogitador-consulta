import { useState } from 'react'
import type { Detachment } from '@/types'
import { DETACHMENT_POINTS_BUDGET, isMultiDetachmentAllowed, sumDetachmentPoints } from '@/core/utils/roster'

interface Props {
  detachments: Detachment[]
  selectedIds: string[]
  pointsLimit: number | null
  onConfirm: (detachmentIds: string[]) => void
  onClose: () => void
  unconstrained?: boolean
}

export function DetachmentSelectModal({ detachments, selectedIds, pointsLimit, onConfirm, onClose, unconstrained }: Props) {
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds)
  const multiMode = unconstrained || isMultiDetachmentAllowed(pointsLimit)
  const totalDp = sumDetachmentPoints(detachments, draftIds)

  function toggle(detachment: Detachment) {
    if (!multiMode) {
      setDraftIds([detachment.id])
      return
    }
    const isSelected = draftIds.includes(detachment.id)
    if (isSelected) {
      setDraftIds(draftIds.filter(id => id !== detachment.id))
      return
    }
    if (!unconstrained && totalDp + detachment.dp > DETACHMENT_POINTS_BUDGET) return
    setDraftIds([...draftIds, detachment.id])
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface-2 border border-rim-bright w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1 bg-crimson shrink-0" />
        <div className="px-4 py-3 border-b border-rim-bright flex items-center justify-between gap-3 shrink-0">
          <p className="text-[14px] font-display uppercase tracking-[2px] text-parchment">
            Destacamento
          </p>
          {multiMode && (
            <span
              className={`text-[11px] font-mono font-bold border px-2 py-0.5 leading-none ${
                totalDp >= DETACHMENT_POINTS_BUDGET
                  ? 'border-crimson-bright text-crimson-bright'
                  : 'border-rim-bright text-parchment-dim'
              }`}
            >
              {totalDp} / {DETACHMENT_POINTS_BUDGET} DP
            </span>
          )}
        </div>

        {multiMode && !unconstrained && (
          <p className="px-4 pt-2 text-[10px] font-mono text-parchment-dim uppercase tracking-widest">
            Lista de {pointsLimit} pts: puedes seleccionar varios destacamentos hasta {DETACHMENT_POINTS_BUDGET} DP
          </p>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1.5">
          {detachments.length === 0 ? (
            <p className="text-[11px] font-mono text-parchment-dim text-center py-6 uppercase tracking-widest">
              Sin destacamentos disponibles
            </p>
          ) : (
            detachments.map(d => {
              const selected = draftIds.includes(d.id)
              const disabled = !selected && multiMode && !unconstrained && totalDp + d.dp > DETACHMENT_POINTS_BUDGET
              return (
                <button
                  key={d.id}
                  onClick={() => toggle(d)}
                  disabled={disabled}
                  className={`text-left px-3 py-2 border transition-colors flex items-center justify-between gap-2 ${
                    selected
                      ? 'border-crimson-bright bg-crimson/10'
                      : disabled
                        ? 'border-rim-bright opacity-40 cursor-not-allowed'
                        : 'border-rim-bright hover:border-crimson'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="text-[12px] font-display uppercase tracking-widest text-parchment block truncate">
                      {d.name}
                    </span>
                    {d.disposition && (
                      <span className="text-[9px] font-mono uppercase tracking-widest text-parchment-dim">
                        {d.disposition}
                      </span>
                    )}
                  </span>
                  {d.dp > 0 && (
                    <span className="text-[10px] font-mono font-bold border border-crimson/60 text-crimson-bright px-1.5 py-px leading-none shrink-0">
                      {d.dp} DP
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        <div className="px-4 py-3 border-t border-rim-bright flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 border border-rim-bright text-parchment-dim hover:text-parchment hover:border-crimson transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(draftIds)}
            className="text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 border border-crimson-bright text-parchment hover:bg-crimson/10 transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
