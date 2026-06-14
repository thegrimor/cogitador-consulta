import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { addEntry } from '@/store/rosterSlice'
import type { AppDispatch } from '@/store'

interface Props {
  rosterId: string
  factionId: string
  onClose: () => void
}

export function AddUnitModal({ rosterId, factionId, onClose }: Props) {
  const { datasheets } = useGameDataContext()
  const dispatch = useDispatch<AppDispatch>()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')

  const units = datasheets.filter(ds => {
    if (ds.factionId !== factionId) return false
    if (ds.isVirtual) return false
    if (search && !ds.name.toLowerCase().includes(search.toLowerCase())) return false
    if (role && ds.role !== role) return false
    return true
  })

  const availableRoles = [...new Set(
    datasheets.filter(ds => ds.factionId === factionId && !ds.isVirtual).map(ds => ds.role)
  )].filter(Boolean).sort()

  function handleAdd(datasheetId: string) {
    dispatch(addEntry({ rosterId, datasheetId }))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 w-full max-w-lg flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700 flex flex-col gap-3">
          <h2 className="font-display text-crimson uppercase tracking-widest text-sm">Añadir Unidad</h2>
          <input
            className="bg-black border border-gray-700 text-parchment px-2 py-1 text-xs font-mono w-full"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setRole('')}
              className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border ${role === '' ? 'border-crimson text-crimson' : 'border-gray-700 text-parchment-dim'}`}
            >
              Todos
            </button>
            {availableRoles.map(r => (
              <button
                key={r}
                onClick={() => setRole(role === r ? '' : r)}
                className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border ${role === r ? 'border-crimson text-crimson' : 'border-gray-700 text-parchment-dim'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {units.length === 0 ? (
            <p className="text-[9px] font-mono text-parchment-dim uppercase tracking-widest text-center py-8">
              Sin resultados
            </p>
          ) : (
            units.map(ds => (
              <button
                key={ds.id}
                onClick={() => handleAdd(ds.id)}
                className="w-full flex items-center justify-between px-4 py-2 border-b border-gray-800 hover:bg-gray-800 text-left"
              >
                <span className="font-mono text-parchment text-[11px]">{ds.name}</span>
                <span className="text-[9px] uppercase tracking-widest text-parchment-dim">{ds.role}</span>
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-700">
          <button
            onClick={onClose}
            className="text-[10px] uppercase tracking-widest text-parchment-dim hover:text-parchment"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
