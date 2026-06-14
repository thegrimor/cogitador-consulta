import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { selectRosterById } from '@/store/selectors'
import { updateRoster } from '@/store/rosterSlice'
import { RosterEntryCard } from '@/components/roster/RosterEntryCard'
import { AddUnitModal } from '@/components/roster/AddUnitModal'
import type { RootState, AppDispatch } from '@/store'

export function RosterEditPage() {
  const { rosterId } = useParams<{ rosterId: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { factions, detachments, enhancements } = useGameDataContext()

  const roster = useSelector((s: RootState) => selectRosterById(rosterId!)(s))
  const [showAddUnit, setShowAddUnit] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')

  if (!roster) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[9px] font-mono uppercase tracking-widest text-parchment-dim">Lista no encontrada</p>
      </div>
    )
  }

  const faction = factions.find(f => f.id === roster.factionId)
  const detachmentOptions = detachments.filter(d => d.factionId === roster.factionId)

  const enhancementMap = Object.fromEntries(enhancements.map(e => [e.id, e.cost]))
  const totalPoints = roster.entries.reduce((sum, e) => {
    return sum + (e.pointsCost ?? 0) + (e.enhancementId ? (enhancementMap[e.enhancementId] ?? 0) : 0)
  }, 0)
  const overLimit = totalPoints > roster.pointsLimit

  function handleDetachmentChange(newDetachmentId: string) {
    const hasEnhancements = roster!.entries.some(e => e.enhancementId)
    if (hasEnhancements && newDetachmentId !== roster!.detachmentId) {
      if (!window.confirm('Cambiar el destacamento eliminará los enhancements seleccionados. ¿Continuar?')) return
    }
    dispatch(updateRoster({ id: roster!.id, changes: { detachmentId: newDetachmentId || null } }))
  }

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (nameInput.trim()) {
      dispatch(updateRoster({ id: roster!.id, changes: { name: nameInput.trim() } }))
    }
    setEditingName(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3">
        <button
          onClick={() => navigate('/roster')}
          className="text-[9px] uppercase tracking-widest text-parchment-dim hover:text-parchment w-fit"
        >
          ← Listas
        </button>

        {editingName ? (
          <form onSubmit={handleNameSubmit} className="flex gap-2">
            <input
              className="bg-black border border-gray-700 text-parchment px-2 py-1 text-sm font-display uppercase tracking-widest flex-1"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="text-[9px] uppercase tracking-widest bg-crimson text-white px-3">OK</button>
            <button type="button" onClick={() => setEditingName(false)} className="text-[9px] uppercase tracking-widest text-parchment-dim px-2">✕</button>
          </form>
        ) : (
          <h1
            className="font-display text-crimson uppercase tracking-widest text-sm cursor-pointer hover:opacity-80"
            onClick={() => { setNameInput(roster.name); setEditingName(true) }}
            title="Editar nombre"
          >
            {roster.name} ✎
          </h1>
        )}

        <div className="flex items-center gap-4 text-[9px] uppercase tracking-widest text-parchment-dim">
          <span>{faction?.name ?? roster.factionId}</span>
          <span>·</span>
          <select
            className="bg-black border border-gray-700 text-parchment px-1 py-0.5 text-[9px] uppercase tracking-widest font-mono"
            value={roster.detachmentId ?? ''}
            onChange={e => handleDetachmentChange(e.target.value)}
          >
            <option value="">— Sin destacamento —</option>
            {detachmentOptions.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Entry list */}
      <div className="flex flex-col gap-2">
        {roster.entries.length === 0 ? (
          <p className="text-[9px] font-mono uppercase tracking-widest text-parchment-dim text-center py-10">
            Sin unidades. Añade una abajo.
          </p>
        ) : (
          roster.entries.map(entry => (
            <RosterEntryCard
              key={entry.id}
              rosterId={roster.id}
              entry={entry}
              detachmentId={roster.detachmentId}
            />
          ))
        )}
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 px-4 py-3 flex items-center justify-between z-40">
        <span className={`font-mono text-sm tabular-nums ${overLimit ? 'text-red-400' : 'text-parchment'}`}>
          {totalPoints} / {roster.pointsLimit} pts
          {overLimit && <span className="text-[9px] uppercase tracking-widest ml-2">¡Límite superado!</span>}
        </span>
        <button
          onClick={() => setShowAddUnit(true)}
          className="text-[10px] uppercase tracking-widest bg-crimson text-white px-4 py-1.5 hover:opacity-80"
        >
          + Añadir unidad
        </button>
      </div>

      {showAddUnit && (
        <AddUnitModal
          rosterId={roster.id}
          factionId={roster.factionId}
          onClose={() => setShowAddUnit(false)}
        />
      )}
    </div>
  )
}
