import { useEffect, useMemo, useRef, useState } from 'react'
import type { Datasheet, PointsCost, RosterEntry } from '@/types'
import { CostVariantPicker } from '@/shared/components/CostVariantPicker'
import {
  compareByRolePriority, resolveCostsForUnitIndex, resolveCostsForFactionContext,
  unitIndexInRoster, maxCopiesAllowed, roleCategoryLabel, groupByRoleCategory,
  ROLE_CATEGORY_LABELS,
} from '@/core/utils/roster'

function modelCountLabel(ds: Datasheet): string {
  if (ds.modelCountMin <= 0) return ''
  if (ds.modelCountMin === ds.modelCountMax) {
    return ds.modelCountMin === 1 ? '1 miniatura' : `${ds.modelCountMin} miniaturas`
  }
  return `${ds.modelCountMin}-${ds.modelCountMax} miniaturas`
}

interface Props {
  factionDatasheets: Datasheet[]
  factionLabel: string
  /** Empty when this roster's faction can't take allies — the source switcher then stays hidden. */
  allyDatasheets: Datasheet[]
  allyLabel: string
  pointsCostMap: Record<string, PointsCost[]>
  entries: RosterEntry[]
  pointsLimit: number | null
  currentPoints: number
  rosterFactionId: string
  onAdd: (datasheet: Datasheet, cost: PointsCost) => void
  onClose: () => void
}

export function AddUnitModal({
  factionDatasheets,
  factionLabel,
  allyDatasheets,
  allyLabel,
  pointsCostMap,
  entries,
  pointsLimit,
  currentPoints,
  rosterFactionId,
  onAdd,
  onClose,
}: Props) {
  const [source, setSource] = useState<'faction' | 'ally'>('faction')
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  // Entries grow as the player adds without closing, so the starting count is the only
  // stable reference for "how many did I add in this sitting".
  const [entryCountOnOpen] = useState(entries.length)
  const addedCount = entries.length - entryCountOnOpen

  const canSwitchSource = allyDatasheets.length > 0
  const datasheets = source === 'ally' ? allyDatasheets : factionDatasheets

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  const categories = useMemo(
    () => [
      'Todos',
      ...ROLE_CATEGORY_LABELS.filter(label => datasheets.some(d => roleCategoryLabel(d.role) === label)),
    ],
    [datasheets],
  )

  const groups = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const filtered = datasheets
      .filter(d => {
        const matchCategory = activeCategory === 'Todos' || roleCategoryLabel(d.role) === activeCategory
        const matchSearch = !needle || d.name.toLowerCase().includes(needle)
        return matchCategory && matchSearch
      })
      .sort(compareByRolePriority)
    return groupByRoleCategory(filtered, d => d.role)
  }, [datasheets, activeCategory, search])

  const totalShown = groups.reduce((sum, g) => sum + g.items.length, 0)
  const remaining = pointsLimit === null ? null : pointsLimit - currentPoints

  function switchSource(next: 'faction' | 'ally') {
    setSource(next)
    setActiveCategory('Todos')
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex sm:items-center sm:justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Añadir unidad"
        className="bg-surface-2 border-rim-bright w-full h-full flex flex-col sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:border"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1 bg-crimson shrink-0" />

        <div className="px-4 py-3 border-b border-rim-bright shrink-0 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[14px] font-display uppercase tracking-[2px] text-parchment">
              Añadir Unidad
            </p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mt-0.5">
              {currentPoints}
              {pointsLimit !== null ? ` / ${pointsLimit}` : ''} pts
              {remaining !== null && (
                <span className={remaining < 0 ? 'text-crimson-bright ml-1.5' : 'text-gold ml-1.5'}>
                  {remaining < 0 ? `${Math.abs(remaining)} de exceso` : `quedan ${remaining}`}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-[16px] font-mono leading-none text-parchment-dim hover:text-crimson-bright shrink-0 px-2 py-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {canSwitchSource && (
          <div className="flex shrink-0 border-b border-rim-bright">
            {([
              ['faction', factionLabel] as const,
              ['ally', allyLabel] as const,
            ]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => switchSource(key)}
                className={`flex-1 text-[11px] font-mono uppercase tracking-widest px-3 py-2 border-b-2 transition-colors ${
                  source === key
                    ? 'border-crimson-bright text-parchment bg-crimson/10'
                    : 'border-transparent text-parchment-dim hover:text-parchment'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="px-4 pt-3 pb-2 shrink-0 flex flex-col gap-2">
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar unidad…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-3 border border-rim-bright text-parchment text-[13px] font-mono px-3 py-2 placeholder-parchment-dim focus:outline-none focus:border-crimson-bright"
          />
          <div className="flex flex-wrap gap-1.5">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 border transition-colors ${
                  activeCategory === category
                    ? 'border-crimson-bright text-parchment bg-crimson/10'
                    : 'border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-3">
          {totalShown === 0 ? (
            <p className="text-[11px] font-mono text-parchment-dim text-center py-10 uppercase tracking-widest">
              Sin resultados
            </p>
          ) : (
            groups.map(group => (
              <div key={group.label} className="mb-3">
                <p className="text-[10px] font-display uppercase tracking-widest text-crimson-bright py-1 sticky top-0 bg-surface-2 z-10">
                  {group.label}
                </p>
                <div className="flex flex-col gap-1">
                  {group.items.map(ds => {
                    const contextCosts = resolveCostsForFactionContext(
                      pointsCostMap[ds.id] ?? [], ds.factionId, rosterFactionId,
                    )
                    // The Nth copy of a datasheet (e.g. a 2nd Defiler) can have a different
                    // surcharge tier than the 1st - that's not a player choice, so narrow to
                    // whichever tier this next copy would fall into before offering any picker.
                    const unitIndex = unitIndexInRoster(entries, ds.id, null)
                    const costs = resolveCostsForUnitIndex(contextCosts, unitIndex)
                    const cap = maxCopiesAllowed(ds, pointsLimit)
                    const atCap = unitIndex > cap
                    const inRoster = entries.filter(e => e.datasheetId === ds.id).length
                    const cheapest = costs.length > 0 ? Math.min(...costs.map(c => c.points)) : 0
                    const overBudget = remaining !== null && cheapest > remaining

                    return (
                      <div
                        key={ds.id}
                        className={`bg-surface-3 border px-3 py-2 transition-colors ${
                          atCap ? 'border-rim-bright/50 opacity-60' : 'border-rim-bright'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-display uppercase tracking-widest text-parchment flex items-center gap-1.5 flex-wrap">
                              <span className="min-w-0">{ds.name}</span>
                              {inRoster > 0 && (
                                <span className="text-[9px] font-mono border border-crimson-bright text-crimson-bright px-1 py-px leading-none shrink-0">
                                  ×{inRoster}
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] font-mono text-parchment-dim mt-0.5 truncate">
                              {ds.role}
                              {modelCountLabel(ds) && ` · ${modelCountLabel(ds)}`}
                              {overBudget && !atCap && (
                                <span className="text-gold"> · no cabe</span>
                              )}
                            </p>
                          </div>

                          <div className="shrink-0 flex justify-end">
                            {atCap ? (
                              <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-1 border border-rim-bright text-parchment-dim/60 whitespace-nowrap">
                                {cap === 1 ? 'Ya en la lista' : `Límite ${cap}`}
                              </span>
                            ) : costs.length === 1 ? (
                              <button
                                onClick={() => onAdd(ds, costs[0])}
                                className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 border border-rim-bright text-parchment-dim hover:border-crimson-bright hover:text-parchment hover:bg-crimson/10 transition-colors whitespace-nowrap"
                              >
                                + {costs[0].points}pts
                              </button>
                            ) : costs.length === 0 ? (
                              <button
                                onClick={() => onAdd(ds, { datasheetId: ds.id, description: '', points: 0 })}
                                className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 border border-rim-bright text-parchment-dim hover:border-crimson-bright hover:text-parchment hover:bg-crimson/10 transition-colors whitespace-nowrap"
                              >
                                + 0pts
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {!atCap && costs.length > 1 && (
                          <div className="mt-1.5">
                            <CostVariantPicker costs={costs} selectedDescription="" onSelect={cost => onAdd(ds, cost)} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-rim-bright shrink-0 flex items-center justify-between gap-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim">
            {addedCount > 0
              ? `${addedCount} ${addedCount === 1 ? 'unidad añadida' : 'unidades añadidas'}`
              : `${totalShown} ${totalShown === 1 ? 'unidad' : 'unidades'}`}
          </span>
          <button
            onClick={onClose}
            className="text-[11px] font-mono uppercase tracking-widest px-4 py-1.5 border border-crimson-bright text-parchment hover:bg-crimson/10 transition-colors"
          >
            Hecho
          </button>
        </div>
      </div>
    </div>
  )
}
