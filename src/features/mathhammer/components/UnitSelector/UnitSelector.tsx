import type { GameData } from '@/types'
import type { PanelState } from '../../hooks/usePanelState'

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
        <label className="block text-[9px] font-display uppercase tracking-widest text-gold mb-1">
          Destacamento <span className="text-parchment-dim normal-case tracking-normal">(multiselección)</span>
        </label>
        {!selection.factionId ? (
          <p className="text-[10px] font-mono text-parchment-dim">Selecciona un Ejército primero.</p>
        ) : availableDetachments.length === 0 ? (
          <p className="text-[10px] font-mono text-parchment-dim">Sin destacamentos disponibles.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {availableDetachments.map(d => {
              const selected = selection.detachmentIds.includes(d.id)
              return (
                <button
                  key={d.id}
                  onClick={() => panel.toggleDetachment(d.id)}
                  className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 border transition-colors whitespace-nowrap ${
                    selected
                      ? 'border-crimson-bright text-parchment bg-crimson/10'
                      : 'border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment'
                  }`}
                >
                  {d.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

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
            <p className="text-[10px] font-mono text-parchment-dim leading-relaxed mt-1.5">
              {selectedEnhancement.description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
