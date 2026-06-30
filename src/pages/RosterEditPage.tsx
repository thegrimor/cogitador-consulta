import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import {
  selectRosterById,
  renameRoster,
  setPointsLimit,
  setDetachments,
  addEntry,
  updateEntry,
  removeEntry,
  setEntryEnhancement,
  setEntryAttachment,
  setEntryWeaponSelection,
} from '@/store/rosterSlice'
import {
  resolveModelCount, compareByRolePriority, sumDetachmentPoints,
  resolveCostsForUnitIndex, unitIndexInRoster,
} from '@/core/utils/roster'
import { RosterEntryRow } from '@/shared/components/RosterEntryRow'
import { AddUnitPanel } from '@/shared/components/AddUnitPanel'
import { DetachmentSelectModal } from '@/shared/components/DetachmentSelectModal'
import { ROUTES } from '@/core/constants/routes'
import type { Datasheet, PointsCost, RosterEntry } from '@/types'

export function RosterEditPage() {
  const { rosterId: rosterIdParam } = useParams<{ rosterId: string }>()
  const {
    factions,
    datasheets,
    detachments,
    detachmentAbilities,
    enhancements,
    datasheetEnhancements,
    pointsCostMap,
    leaderMap,
  } = useGameDataContext()
  const roster = useAppSelector(state =>
    rosterIdParam ? selectRosterById(state, rosterIdParam) : undefined,
  )
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [nameDraft, setNameDraft] = useState(roster?.name ?? '')
  const [limitDraft, setLimitDraft] = useState(roster?.pointsLimit ? String(roster.pointsLimit) : '')
  const [detachmentModalOpen, setDetachmentModalOpen] = useState(false)

  if (!roster || !rosterIdParam) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[12px] font-mono text-parchment-dim uppercase tracking-widest">
          Lista no encontrada
        </p>
      </div>
    )
  }

  const rosterId = rosterIdParam
  const faction = factions.find(f => f.id === roster.factionId)
  const factionDetachments = detachments.filter(d => d.factionId === roster.factionId)
  const factionDatasheets = datasheets.filter(d => d.factionId === roster.factionId && !d.isVirtual)
  const datasheetById = new Map(datasheets.map(d => [d.id, d]))
  const selectedDetachments = factionDetachments.filter(d => roster.detachmentIds.includes(d.id))
  const selectedDetachmentIds = new Set(roster.detachmentIds)
  const activeDetachmentAbilities = detachmentAbilities.filter(da => selectedDetachmentIds.has(da.detachmentId))

  const sortedEntries = roster.entries
    .map(entry => ({ entry, datasheet: datasheetById.get(entry.datasheetId) }))
    .filter((x): x is { entry: RosterEntry; datasheet: Datasheet } => !!x.datasheet)
    .sort((a, b) => compareByRolePriority(a.datasheet, b.datasheet))

  const enhancementsCost = roster.entries.reduce((sum, e) => {
    if (!e.enhancementId) return sum
    return sum + (enhancements.find(en => en.id === e.enhancementId)?.cost ?? 0)
  }, 0)
  const combinedTotal = (roster.totalPoints ?? 0) + enhancementsCost
  const overLimit = roster.pointsLimit !== null && combinedTotal > roster.pointsLimit

  function commitName() {
    const trimmed = nameDraft.trim()
    if (trimmed && trimmed !== roster!.name) dispatch(renameRoster({ id: rosterId!, name: trimmed }))
    else setNameDraft(roster!.name)
  }

  function commitLimit() {
    const parsed = parseInt(limitDraft, 10)
    const value = Number.isFinite(parsed) && parsed > 0 ? parsed : null
    dispatch(setPointsLimit({ id: rosterId!, pointsLimit: value }))
    setLimitDraft(value ? String(value) : '')
  }

  function handleAddUnit(datasheet: Datasheet, cost: PointsCost) {
    dispatch(
      addEntry({
        rosterId,
        entry: {
          datasheetId: datasheet.id,
          modelCount: resolveModelCount(cost, datasheet),
          pointsCost: cost.points,
        },
      }),
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(ROUTES.ROSTER)}
          className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mb-3 flex items-center gap-1"
        >
          ← Listas de Ejército
        </button>
        <div className="h-1 bg-crimson mb-2" />
        <input
          type="text"
          value={nameDraft}
          onChange={e => setNameDraft(e.target.value)}
          onBlur={commitName}
          className="text-[16px] font-display uppercase tracking-[3px] text-parchment bg-transparent focus:outline-none focus:border-b focus:border-crimson-bright w-full"
        />
        <p className="text-[11px] font-mono uppercase tracking-[2px] text-parchment-dim mt-0.5">
          {faction?.name ?? roster.factionId}
        </p>
      </div>

      {/* Destacamento */}
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mb-1.5">
          Destacamento
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedDetachments.length === 0 ? (
            <span className="text-[11px] font-mono text-parchment-dim uppercase tracking-widest">
              Sin destacamento
            </span>
          ) : (
            selectedDetachments.map(d => (
              <span
                key={d.id}
                className="text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 border border-crimson-bright text-parchment bg-crimson/10 flex items-center gap-1.5"
              >
                {d.name}
                {d.dp > 0 && <span className="text-crimson-bright font-bold">{d.dp} DP</span>}
              </span>
            ))
          )}
          {selectedDetachments.length > 1 && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim">
              Total: {sumDetachmentPoints(detachments, roster.detachmentIds)} DP
            </span>
          )}
          <button
            onClick={() => setDetachmentModalOpen(true)}
            className="text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 border border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment transition-colors"
          >
            {selectedDetachments.length === 0 ? 'Elegir destacamento' : 'Cambiar'}
          </button>
        </div>
      </div>

      {detachmentModalOpen && (
        <DetachmentSelectModal
          detachments={factionDetachments}
          selectedIds={roster.detachmentIds}
          pointsLimit={roster.pointsLimit}
          onClose={() => setDetachmentModalOpen(false)}
          onConfirm={detachmentIds => {
            dispatch(setDetachments({ rosterId, detachmentIds }))
            setDetachmentModalOpen(false)
          }}
        />
      )}

      {/* Puntos */}
      <div className="mb-6 flex items-center gap-4">
        <p className={`text-[13px] font-mono uppercase tracking-widest ${overLimit ? 'text-crimson-bright' : 'text-parchment'}`}>
          {combinedTotal}
          {roster.pointsLimit !== null ? ` / ${roster.pointsLimit}` : ''} pts
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim">Límite</span>
          <input
            type="number"
            min={1}
            placeholder="Sin límite"
            value={limitDraft}
            onChange={e => setLimitDraft(e.target.value)}
            onBlur={commitLimit}
            className="w-24 bg-surface-3 border border-rim-bright text-parchment text-[12px] font-mono px-2 py-1 placeholder-parchment-dim focus:outline-none focus:border-crimson-bright"
          />
        </div>
      </div>

      {/* Unidades */}
      <div className="flex flex-col gap-2 mb-6">
        {roster.entries.length === 0 ? (
          <p className="text-[12px] font-mono text-parchment-dim text-center py-8 uppercase tracking-widest">
            Sin unidades añadidas
          </p>
        ) : (
          sortedEntries.map(({ entry, datasheet }) => {
            // Surcharge tiers (2nd+/3rd+ copy of a datasheet) aren't a player choice -
            // narrow to whichever tier this entry's position in the roster falls into,
            // leaving only genuine squad-size choices (if any) selectable.
            const unitIndex = unitIndexInRoster(roster.entries, entry.datasheetId, entry.id)
            const costs = resolveCostsForUnitIndex(pointsCostMap[entry.datasheetId] ?? [], unitIndex)
            const validEnhancementIds = new Set(datasheetEnhancements[entry.datasheetId] ?? [])
            const availableEnhancements = enhancements.filter(
              e => selectedDetachmentIds.has(e.detachmentId) && validEnhancementIds.has(e.id),
            )
            const eligibleTargetIds = new Set(leaderMap[datasheet.id] ?? [])
            const attachableEntries = roster.entries
              .filter(other => other.id !== entry.id && eligibleTargetIds.has(other.datasheetId))
              .map(other => ({ entry: other, datasheet: datasheetById.get(other.datasheetId) }))
              .filter((x): x is { entry: RosterEntry; datasheet: Datasheet } => !!x.datasheet)
            return (
              <RosterEntryRow
                key={entry.id}
                entry={entry}
                datasheet={datasheet}
                rosterId={rosterId}
                costs={costs}
                detachmentAbilities={activeDetachmentAbilities}
                selectedDetachments={selectedDetachments}
                availableEnhancements={availableEnhancements}
                attachableEntries={attachableEntries}
                onChangeCost={cost =>
                  dispatch(
                    updateEntry({
                      rosterId,
                      entryId: entry.id,
                      changes: { modelCount: resolveModelCount(cost, datasheet), pointsCost: cost.points },
                    }),
                  )
                }
                onChangeEnhancement={enhancementId =>
                  dispatch(setEntryEnhancement({ rosterId, entryId: entry.id, enhancementId }))
                }
                onChangeAttachment={attachedToEntryId =>
                  dispatch(setEntryAttachment({ rosterId, entryId: entry.id, attachedToEntryId }))
                }
                onChangeWeaponSelection={(ruleId, selection) =>
                  dispatch(setEntryWeaponSelection({ rosterId, entryId: entry.id, ruleId, selection }))
                }
                onRemove={() => dispatch(removeEntry({ rosterId, entryId: entry.id }))}
              />
            )
          })
        )}
      </div>

      <AddUnitPanel
        datasheets={factionDatasheets}
        pointsCostMap={pointsCostMap}
        entries={roster.entries}
        pointsLimit={roster.pointsLimit}
        onAdd={handleAddUnit}
      />
    </div>
  )
}
