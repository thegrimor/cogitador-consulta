import { useDispatch } from 'react-redux'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { updateEntry, removeEntry } from '@/store/rosterSlice'
import type { RosterEntry } from '@/types'
import type { AppDispatch } from '@/store'

interface Props {
  rosterId: string
  entry: RosterEntry
  detachmentId: string | null
}

export function RosterEntryCard({ rosterId, entry, detachmentId }: Props) {
  const { datasheets, pointsCostMap, datasheetOptions, enhancements, datasheetEnhancements } = useGameDataContext()
  const dispatch = useDispatch<AppDispatch>()

  const datasheet = datasheets.find(ds => ds.id === entry.datasheetId)
  if (!datasheet) return null

  const pointsOptions = pointsCostMap[entry.datasheetId] ?? []
  const options = datasheetOptions[entry.datasheetId] ?? []
  const optionLines = [...new Set(options.map(o => o.line))].sort((a, b) => a - b)

  const availableEnhancements = detachmentId
    ? (datasheetEnhancements[entry.datasheetId] ?? [])
        .map(id => enhancements.find(e => e.id === id))
        .filter((e): e is NonNullable<typeof e> => !!e && e.detachmentId === detachmentId)
    : []

  const selectedEnhancement = availableEnhancements.find(e => e.id === entry.enhancementId)
  const enhancementCost = selectedEnhancement?.cost ?? 0
  const totalPts = (entry.pointsCost ?? 0) + enhancementCost

  function update(changes: Parameters<typeof updateEntry>[0]['changes']) {
    dispatch(updateEntry({ rosterId, entryId: entry.id, changes }))
  }

  function handleModelCountChange(desc: string) {
    const match = pointsOptions.find(p => p.description === desc)
    update({ modelCount: parseModelCountFromDesc(desc), pointsCost: match?.points ?? null })
  }

  function handleOptionChange(line: number, button: string) {
    update({ selectedOptions: { ...entry.selectedOptions, [line]: button } })
  }

  function handleEnhancementChange(id: string) {
    update({ enhancementId: id || undefined })
  }

  return (
    <div className="border border-gray-700 p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className="font-display text-parchment uppercase tracking-widest text-[10px]">
          {entry.customName ?? datasheet.name}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-xs tabular-nums text-parchment">{totalPts} pts</span>
          <button
            onClick={() => dispatch(removeEntry({ rosterId, entryId: entry.id }))}
            className="text-[9px] uppercase tracking-widest text-parchment-dim hover:text-red-400"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Model count / points selector */}
      {pointsOptions.length > 0 && (
        <label className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-parchment-dim">
          Tamaño
          <select
            className="bg-black border border-gray-700 text-parchment px-1 py-0.5 text-[10px] font-mono"
            value={pointsOptions.find(p => p.points === entry.pointsCost)?.description ?? ''}
            onChange={e => handleModelCountChange(e.target.value)}
          >
            <option value="">— Elige —</option>
            {pointsOptions.map(p => (
              <option key={p.description} value={p.description}>
                {p.description} — {p.points} pts
              </option>
            ))}
          </select>
        </label>
      )}

      {/* Wargear options */}
      {optionLines.map(line => {
        const lineOptions = options.filter(o => o.line === line)
        const selected = entry.selectedOptions?.[line] ?? ''
        return (
          <div key={line} className="flex flex-wrap gap-1 items-center">
            {lineOptions.map(opt => (
              <button
                key={opt.button}
                onClick={() => handleOptionChange(line, opt.button)}
                title={opt.description}
                className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border ${
                  selected === opt.button
                    ? 'border-crimson text-crimson'
                    : 'border-gray-700 text-parchment-dim hover:border-gray-500'
                }`}
              >
                {opt.button}
              </button>
            ))}
          </div>
        )
      })}

      {/* Enhancement selector */}
      {availableEnhancements.length > 0 && (
        <label className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-parchment-dim">
          Enhancement
          <select
            className="bg-black border border-gray-700 text-parchment px-1 py-0.5 text-[10px] font-mono"
            value={entry.enhancementId ?? ''}
            onChange={e => handleEnhancementChange(e.target.value)}
          >
            <option value="">Ninguno</option>
            {availableEnhancements.map(e => (
              <option key={e.id} value={e.id}>
                {e.name} (+{e.cost} pts)
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}

function parseModelCountFromDesc(desc: string): number {
  const match = desc.match(/\d+/)
  return match ? parseInt(match[0]) : 1
}
