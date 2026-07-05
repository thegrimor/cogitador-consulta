import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { selectAllRosters, deleteRoster, importRosterFromData } from '@/store/rosterSlice'
import { RosterCard } from '@/shared/components/RosterCard'
import { ROUTES } from '@/core/constants/routes'
import { exportRosterToText, parseRosterText, resolveImportedRoster } from '@/core/utils/rosterExport'

export function RosterListPage() {
  const rosters = useAppSelector(selectAllRosters)
  const { factions, detachments, datasheets, enhancements, wargearCostMap, leaderMap, pointsCostMap } = useGameDataContext()
  const dispatch = useAppDispatch()

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)

  function handleDelete(id: string, name: string) {
    if (window.confirm(`¿Eliminar la lista "${name}"?`)) {
      dispatch(deleteRoster({ id }))
    }
  }

  function handleExport(roster: typeof rosters[number]) {
    const text = exportRosterToText(roster, datasheets, factions, detachments, enhancements)
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback: show an alert with the text if clipboard is unavailable
      alert(text)
    })
    setCopiedId(roster.id)
    setTimeout(() => setCopiedId(prev => prev === roster.id ? null : prev), 1500)
  }

  function handleImport() {
    setImportError(null)
    try {
      const parsed = parseRosterText(importText)
      const { roster, warnings } = resolveImportedRoster(parsed, datasheets, factions, detachments, wargearCostMap, enhancements, leaderMap, pointsCostMap)
      dispatch(importRosterFromData(roster))
      setImportText('')
      setShowImport(false)
      if (warnings.length > 0) {
        alert(`Lista importada con advertencias:\n${warnings.join('\n')}`)
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Error al parsear la lista')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment">
          Listas de Ejército
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowImport(v => !v); setImportError(null) }}
            className="text-[11px] font-mono uppercase tracking-widest px-3 py-2 border border-rim-bright text-parchment-dim hover:bg-surface-3 transition-colors"
          >
            Importar Lista
          </button>
          <NavLink
            to={ROUTES.ROSTER_NEW}
            className="text-[11px] font-mono uppercase tracking-widest px-3 py-2 border border-crimson-bright text-parchment hover:bg-crimson/10 transition-colors"
          >
            Crear Nueva Lista
          </NavLink>
        </div>
      </div>

      {showImport && (
        <div className="mb-6 bg-surface-2 border border-rim-bright p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mb-2">
            Pega aquí la lista exportada
          </p>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            rows={10}
            placeholder={'Patrulla de Combate (985 Points)\n\nSpace Marines\nGladius Task Force (0 Detachment Points)\nStrike Force (2000 Points)\n\nCHARACTERS\n\nCaptain (100 Points)\n...'}
            className="w-full bg-surface-3 border border-rim-bright text-parchment text-[11px] font-mono px-3 py-2 placeholder-parchment-dim/40 focus:outline-none focus:border-crimson-bright resize-y"
          />
          {importError && (
            <p className="text-[10px] font-mono uppercase tracking-widest text-crimson-bright mt-2">
              {importError}
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleImport}
              disabled={importText.trim() === ''}
              className="text-[11px] font-mono uppercase tracking-widest px-3 py-2 border border-crimson-bright text-parchment hover:bg-crimson/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirmar
            </button>
            <button
              onClick={() => { setShowImport(false); setImportText(''); setImportError(null) }}
              className="text-[11px] font-mono uppercase tracking-widest px-3 py-2 border border-rim-bright text-parchment-dim hover:bg-surface-3 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {rosters.length === 0 ? (
        <p className="text-[12px] font-mono text-parchment-dim text-center py-12 uppercase tracking-widest">
          Sin listas creadas
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {rosters.map(roster => {
            const faction = factions.find(f => f.id === roster.factionId)
            const detachmentNames = roster.detachmentIds
              .map(id => detachments.find(d => d.id === id)?.name)
              .filter((name): name is string => !!name)
            return (
              <RosterCard
                key={roster.id}
                roster={roster}
                factionName={faction?.name ?? roster.factionId}
                detachmentName={detachmentNames.length > 0 ? detachmentNames.join(' + ') : null}
                enhancements={enhancements}
                onDelete={() => handleDelete(roster.id, roster.name)}
                onExport={() => handleExport(roster)}
                exported={copiedId === roster.id}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
