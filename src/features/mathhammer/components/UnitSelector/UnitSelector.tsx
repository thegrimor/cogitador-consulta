import { useState } from 'react'
import type { GameData } from '@/types'
import type { PanelState } from '../../hooks/usePanelState'
import { DetachmentSelectModal } from '@/shared/components/DetachmentSelectModal'
import { sumDetachmentPoints } from '@/core/utils/roster'

interface Props {
  gameData: GameData
  panel: PanelState
}

const selectCls =
  'w-full bg-surface-2 border border-rim-bright text-parchment font-mono text-xs ' +
  'px-2 py-1.5 rounded-none outline-none cursor-pointer ' +
  'focus:border-gold transition-colors ' +
  'disabled:opacity-30 disabled:cursor-not-allowed'

function pillClass(selected: boolean): string {
  return `text-[10px] font-mono uppercase tracking-widest px-2 py-1 border transition-colors whitespace-nowrap ${
    selected
      ? 'border-crimson-bright text-parchment bg-crimson/10'
      : 'border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment'
  }`
}

export function UnitSelector({ gameData, panel }: Props) {
  const { selection, availableDetachments, availableUnits, availableCharacters, availableEnhancements, selectedUnit } = panel
  const [detachModalOpen, setDetachModalOpen] = useState(false)

  const bearer = selection.characterId
    ? gameData.datasheets.find(ds => ds.id === selection.characterId) ?? null
    : selectedUnit
  const bearerIsCharacter = bearer?.keywords.some(k => k.toUpperCase() === 'CHARACTER') ?? false
  const selectedEnhancement = availableEnhancements.find(e => e.id === selection.enhancementId)

  return (
    <div className="flex flex-col gap-2 p-3 border-b border-rim-bright">
      <div>
        <label className="block text-[9px] font-display uppercase tracking-widest text-gold mb-1">
          Ejército
        </label>
        <select
          className={selectCls}
          value={selection.factionId ?? ''}
          onChange={e => panel.selectFaction(e.target.value || null)}
        >
          <option value="">— Selecciona Ejército —</option>
          {gameData.factions.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-[9px] font-display uppercase tracking-widest text-gold mb-1.5">Destacamento</p>
        {!selection.factionId ? (
          <p className="text-[10px] font-mono text-parchment-dim">Selecciona un Ejército primero.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {selection.detachmentIds.length === 0 ? (
                <span className="text-[10px] font-mono text-parchment-dim uppercase tracking-widest">Sin destacamento</span>
              ) : (
                availableDetachments
                  .filter(d => selection.detachmentIds.includes(d.id))
                  .map(d => (
                    <span
                      key={d.id}
                      className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border border-crimson-bright text-parchment bg-crimson/10 flex items-center gap-1.5"
                    >
                      {d.name}
                      {d.dp > 0 && <span className="text-crimson-bright font-bold">{d.dp} DP</span>}
                    </span>
                  ))
              )}
              {selection.detachmentIds.length > 1 && (
                <span className="text-[9px] font-mono uppercase tracking-widest text-parchment-dim">
                  Total: {sumDetachmentPoints(availableDetachments, selection.detachmentIds)} DP
                </span>
              )}
            </div>
            <button
              onClick={() => setDetachModalOpen(true)}
              className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 border border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment transition-colors"
            >
              {selection.detachmentIds.length === 0 ? 'Elegir destacamento' : 'Cambiar'}
            </button>
          </>
        )}
      </div>

      {detachModalOpen && (
        <DetachmentSelectModal
          detachments={availableDetachments}
          selectedIds={selection.detachmentIds}
          pointsLimit={null}
          unconstrained
          onClose={() => setDetachModalOpen(false)}
          onConfirm={ids => {
            panel.selectDetachments(ids)
            setDetachModalOpen(false)
          }}
        />
      )}

      <div>
        <label className="block text-[9px] font-display uppercase tracking-widest text-gold mb-1">
          Unidad
        </label>
        <select
          className={selectCls}
          value={selection.datasheetId ?? ''}
          onChange={e => panel.selectUnit(e.target.value || null)}
          disabled={!selection.factionId}
        >
          <option value="">— Selecciona Unidad —</option>
          {availableUnits.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {availableCharacters.length > 0 && (
        <div>
          <label className="block text-[9px] font-display uppercase tracking-widest text-gold mb-1">
            Personaje <span className="text-parchment-dim normal-case tracking-normal">(opcional)</span>
          </label>
          <select
            className={selectCls}
            value={selection.characterId ?? ''}
            onChange={e => panel.selectCharacter(e.target.value || null)}
          >
            <option value="">— Sin Personaje —</option>
            {availableCharacters.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {bearerIsCharacter && availableEnhancements.length > 0 && (
        <div>
          <label className="block text-[9px] font-display uppercase tracking-widest text-gold mb-1">
            Mejora <span className="text-parchment-dim normal-case tracking-normal">(opcional)</span>
          </label>
          <div className="flex flex-wrap gap-1">
            <button onClick={() => panel.selectEnhancement(null)} className={pillClass(!selection.enhancementId)}>
              Ninguna
            </button>
            {availableEnhancements.map(e => (
              <button
                key={e.id}
                onClick={() => panel.selectEnhancement(e.id)}
                className={pillClass(selection.enhancementId === e.id)}
              >
                {e.name} · {e.cost}pts
              </button>
            ))}
          </div>
          {selectedEnhancement && (
            <p className="wh-html text-[10px] font-mono text-parchment-dim leading-relaxed mt-1.5"
              dangerouslySetInnerHTML={{ __html: selectedEnhancement.description }}
            />
          )}
        </div>
      )}
    </div>
  )
}
