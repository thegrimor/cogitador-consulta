import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { createRoster } from '@/store/rosterSlice'
import { rosterEditPath } from '@/core/constants/routes'
import type { AppDispatch } from '@/store'

interface Props {
  onClose: () => void
}

export function NewRosterModal({ onClose }: Props) {
  const { factions, detachments } = useGameDataContext()
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [factionId, setFactionId] = useState('')
  const [detachmentId, setDetachmentId] = useState('')
  const [pointsLimit, setPointsLimit] = useState(2000)

  const availableDetachments = detachments.filter(d => d.factionId === factionId)

  function handleFactionChange(id: string) {
    setFactionId(id)
    setDetachmentId('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !factionId || !detachmentId) return
    const id = crypto.randomUUID()
    dispatch(createRoster({ id, name: name.trim(), factionId, detachmentId, pointsLimit }))
    navigate(rosterEditPath(id))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <form
        className="bg-gray-900 border border-gray-700 p-6 w-full max-w-md flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="font-display text-crimson uppercase tracking-widest text-sm">Nueva Lista</h2>

        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-parchment-dim">
          Nombre
          <input
            className="bg-black border border-gray-700 text-parchment px-2 py-1 text-xs font-mono"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-parchment-dim">
          Facción
          <select
            className="bg-black border border-gray-700 text-parchment px-2 py-1 text-xs font-mono"
            value={factionId}
            onChange={e => handleFactionChange(e.target.value)}
            required
          >
            <option value="">— Selecciona —</option>
            {factions.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-parchment-dim">
          Destacamento
          <select
            className="bg-black border border-gray-700 text-parchment px-2 py-1 text-xs font-mono"
            value={detachmentId}
            onChange={e => setDetachmentId(e.target.value)}
            required
            disabled={!factionId}
          >
            <option value="">— Selecciona —</option>
            {availableDetachments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-parchment-dim">
          Límite de puntos
          <input
            type="number"
            className="bg-black border border-gray-700 text-parchment px-2 py-1 text-xs font-mono"
            value={pointsLimit}
            onChange={e => setPointsLimit(Number(e.target.value))}
            min={500}
            step={250}
            required
          />
        </label>

        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] uppercase tracking-widest text-parchment-dim px-3 py-1 border border-gray-700 hover:border-gray-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!name.trim() || !factionId || !detachmentId}
            className="text-[10px] uppercase tracking-widest bg-crimson text-white px-3 py-1 disabled:opacity-40"
          >
            Crear
          </button>
        </div>
      </form>
    </div>
  )
}
