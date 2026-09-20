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
  setEntryWargearSelections,
} from '@/store/rosterSlice'
import {
  resolveModelCount, compareByRolePriority, sumDetachmentPoints, groupByRoleCategory,
  resolveCostsForUnitIndex, resolveCostsForFactionContext, unitIndexInRoster, resolveRosterTotalPoints,
} from '@/core/utils/roster'
import { RosterEntryRow } from '@/shared/components/RosterEntryRow'
import { AddUnitModal } from '@/shared/components/AddUnitModal'
import { DetachmentSelectModal } from '@/shared/components/DetachmentSelectModal'
import { RosterQrExportModal } from '@/shared/components/RosterQrModal'
import { ROUTES } from '@/core/constants/routes'
import { forFaction, datasheetsForFaction } from '@/core/constants/factionFamily'
import { ENHANCEMENT_ATTACHMENTS } from '@/core/constants/enhancementAttachments'
import { ALLY_FACTION_ID, canTakeImperialAgents } from '@/core/constants/allies'
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
    wargearCostMap,
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
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [addUnitOpen, setAddUnitOpen] = useState(false)

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
  const factionDetachments = forFaction(detachments, roster.factionId)
  const factionDatasheets = datasheetsForFaction(datasheets, roster.factionId).filter(d => !d.isVirtual)
  const canTakeAllies = canTakeImperialAgents(roster.factionId)
  const allyDatasheets = canTakeAllies
    ? datasheets.filter(d => d.factionId === ALLY_FACTION_ID && !d.isVirtual)
    : []
  const datasheetById = new Map(datasheets.map(d => [d.id, d]))
  const selectedDetachments = factionDetachments.filter(d => roster.detachmentIds.includes(d.id))
  const selectedDetachmentIds = new Set(roster.detachmentIds)
  const activeDetachmentAbilities = detachmentAbilities.filter(da => selectedDetachmentIds.has(da.detachmentId))
  // Some enhancements have no rows in Datasheets_enhancements.csv (a scrape gap, mostly
  // keyword-restricted enhancements like "TERMINATOR model only") — without a fallback
  // they'd never be selectable by anyone. Treat those as unrestricted within their detachment.
  const mappedEnhancementIds = new Set(Object.values(datasheetEnhancements).flat())

  const sortedEntries = roster.entries
    .map(entry => ({ entry, datasheet: datasheetById.get(entry.datasheetId) }))
    .filter((x): x is { entry: RosterEntry; datasheet: Datasheet } => !!x.datasheet)
    .sort((a, b) => compareByRolePriority(a.datasheet, b.datasheet))
  const entryGroups = groupByRoleCategory(sortedEntries, x => x.datasheet.role)

  const combinedTotal = resolveRosterTotalPoints(roster, datasheets, pointsCostMap, wargearCostMap, enhancements)
  const overLimit = roster.pointsLimit !== null && combinedTotal > roster.pointsLimit
  const remaining = roster.pointsLimit === null ? null : roster.pointsLimit - combinedTotal
  const usedPct = roster.pointsLimit ? Math.min(100, (combinedTotal / roster.pointsLimit) * 100) : 0
  const detachmentDp = sumDetachmentPoints(detachments, roster.detachmentIds)

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
        },
      }),
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <button
        onClick={() => navigate(ROUTES.ROSTER)}
        className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mb-3 flex items-center gap-1"
      >
        ← Listas de Ejército
      </button>

      <div className="h-1 bg-crimson mb-3" />

      {/* Identidad de la lista */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={nameDraft}
            onChange={e => setNameDraft(e.target.value)}
            onBlur={commitName}
            aria-label="Nombre de la lista"
            className="w-full text-[16px] font-display uppercase tracking-[3px] text-parchment bg-transparent focus:outline-none focus:border-b focus:border-crimson-bright"
          />
          <p className="text-[11px] font-mono uppercase tracking-[2px] text-parchment-dim mt-0.5">
            {faction?.name ?? roster.factionId}
            <span className="text-parchment-dim/60">
              {' · '}
              {roster.entries.length} {roster.entries.length === 1 ? 'unidad' : 'unidades'}
            </span>
          </p>
        </div>
        <button
          onClick={() => setQrModalOpen(true)}
          className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 border border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment shrink-0 transition-colors"
        >
          Exportar
        </button>
      </div>

      {/* Destacamento y límite */}
      <div className="border border-rim-bright bg-surface-2 mb-4">
        <div className="px-3 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim shrink-0">
            Destacamento
          </span>
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {selectedDetachments.length === 0 ? (
              <span className="text-[11px] font-mono text-parchment-dim/70 uppercase tracking-widest">
                Sin destacamento
              </span>
            ) : (
              selectedDetachments.map(d => (
                <span
                  key={d.id}
                  className="text-[11px] font-mono uppercase tracking-widest px-2 py-0.5 border border-crimson-bright text-parchment bg-crimson/10 flex items-center gap-1.5"
                >
                  {d.name}
                  {d.dp > 0 && <span className="text-crimson-bright font-bold">{d.dp} DP</span>}
                </span>
              ))
            )}
            {selectedDetachments.length > 1 && (
              <span className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim">
                Total {detachmentDp} DP
              </span>
            )}
            <button
              onClick={() => setDetachmentModalOpen(true)}
              className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment transition-colors"
            >
              {selectedDetachments.length === 0 ? 'Elegir' : 'Cambiar'}
            </button>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim">Límite</span>
            <input
              type="number"
              min={1}
              placeholder="Sin límite"
              value={limitDraft}
              onChange={e => setLimitDraft(e.target.value)}
              onBlur={commitLimit}
              aria-label="Límite de puntos"
              className="w-24 bg-surface-3 border border-rim-bright text-parchment text-[12px] font-mono px-2 py-1 placeholder-parchment-dim focus:outline-none focus:border-crimson-bright"
            />
          </div>
        </div>
      </div>

      {/* Puntos + acción principal */}
      <div
        className="sticky z-20 -mx-4 px-4 py-2 mb-5 bg-surface border-b border-rim-bright"
        style={{ top: 'var(--header-h, 2.5rem)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`text-[15px] font-mono uppercase tracking-widest leading-none ${
                overLimit ? 'text-crimson-bright' : 'text-parchment'
              }`}
            >
              {combinedTotal}
              {roster.pointsLimit !== null && (
                <span className="text-parchment-dim text-[12px]"> / {roster.pointsLimit}</span>
              )}
              <span className="text-parchment-dim text-[11px]"> pts</span>
            </p>
            {remaining !== null && (
              <p
                className={`text-[10px] font-mono uppercase tracking-widest mt-1 ${
                  remaining < 0 ? 'text-crimson-bright' : 'text-gold'
                }`}
              >
                {remaining < 0 ? `${Math.abs(remaining)} pts de exceso` : `Quedan ${remaining} pts`}
              </p>
            )}
          </div>
          <button
            onClick={() => setAddUnitOpen(true)}
            className="text-[11px] font-mono uppercase tracking-widest px-3 py-2 border border-crimson-bright text-parchment bg-crimson/10 hover:bg-crimson/25 shrink-0 transition-colors"
          >
            + <span className="hidden sm:inline">Añadir </span>Unidad
          </button>
        </div>
        {roster.pointsLimit !== null && (
          <div className="h-0.5 bg-surface-3 mt-2">
            <div
              className={`h-full transition-all ${overLimit ? 'bg-crimson-bright' : 'bg-crimson'}`}
              style={{ width: `${usedPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Unidades */}
      <div className="flex flex-col gap-4 mb-6">
        {roster.entries.length === 0 ? (
          <div className="border border-dashed border-rim-bright py-12 px-4 flex flex-col items-center gap-3">
            <p className="text-[12px] font-mono text-parchment-dim uppercase tracking-widest text-center">
              Sin unidades añadidas
            </p>
            <button
              onClick={() => setAddUnitOpen(true)}
              className="text-[11px] font-mono uppercase tracking-widest px-4 py-2 border border-crimson-bright text-parchment bg-crimson/10 hover:bg-crimson/25 transition-colors"
            >
              + Añadir Unidad
            </button>
          </div>
        ) : (
          entryGroups.map(group => (
            <div key={group.label} className="flex flex-col gap-1.5">
              <div className="flex items-baseline gap-2 px-0.5">
                <p className="text-[11px] font-display uppercase tracking-widest text-crimson-bright">
                  {group.label}
                </p>
                <span className="text-[10px] font-mono text-parchment-dim">{group.items.length}</span>
                <span className="flex-1 h-px bg-rim-bright" />
              </div>
              {group.items.map(({ entry, datasheet }) => {
                // Surcharge tiers (2nd+/3rd+ copy of a datasheet) aren't a player choice -
                // narrow to whichever tier this entry's position in the roster falls into,
                // leaving only genuine squad-size choices (if any) selectable.
                const unitIndex = unitIndexInRoster(roster.entries, entry.datasheetId, entry.id)
                const contextCosts = resolveCostsForFactionContext(
                  pointsCostMap[entry.datasheetId] ?? [], datasheet.factionId, roster.factionId,
                )
                const costs = resolveCostsForUnitIndex(contextCosts, unitIndex)
                const validEnhancementIds = new Set(datasheetEnhancements[entry.datasheetId] ?? [])
                const availableEnhancements = enhancements.filter(
                  e => selectedDetachmentIds.has(e.detachmentId) &&
                    (validEnhancementIds.has(e.id) || !mappedEnhancementIds.has(e.id)),
                )
                const eligibleTargetIds = new Set(leaderMap[datasheet.id] ?? [])
                const enhancementTargetIds = new Set(
                  entry.enhancementId ? ENHANCEMENT_ATTACHMENTS[entry.enhancementId] ?? [] : [],
                )
                const attachableEntries = roster.entries
                  .filter(other =>
                    other.id !== entry.id && (eligibleTargetIds.has(other.datasheetId) || enhancementTargetIds.has(other.datasheetId)),
                  )
                  .map(other => ({
                    entry: other,
                    datasheet: datasheetById.get(other.datasheetId),
                    viaEnhancement: !eligibleTargetIds.has(other.datasheetId) && enhancementTargetIds.has(other.datasheetId),
                  }))
                  .filter((x): x is { entry: RosterEntry; datasheet: Datasheet; viaEnhancement: boolean } => !!x.datasheet)
                const leadingEntries = roster.entries
                  .filter(other => other.attachedToEntryId === entry.id)
                  .map(other => ({ entry: other, datasheet: datasheetById.get(other.datasheetId) }))
                  .filter((x): x is { entry: RosterEntry; datasheet: Datasheet } => !!x.datasheet)
                return (
                  <RosterEntryRow
                    key={entry.id}
                    entry={entry}
                    datasheet={datasheet}
                    rosterId={rosterId}
                    costs={costs}
                    wargearCosts={wargearCostMap[datasheet.id] ?? []}
                    detachmentAbilities={activeDetachmentAbilities}
                    selectedDetachments={selectedDetachments}
                    availableEnhancements={availableEnhancements}
                    attachableEntries={attachableEntries}
                    leadingEntries={leadingEntries}
                    onChangeCost={cost =>
                      dispatch(
                        updateEntry({
                          rosterId,
                          entryId: entry.id,
                          changes: { modelCount: resolveModelCount(cost, datasheet) },
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
                    onChangeWargearSelections={selections =>
                      dispatch(setEntryWargearSelections({ rosterId, entryId: entry.id, selections }))
                    }
                    onRemove={() => dispatch(removeEntry({ rosterId, entryId: entry.id }))}
                  />
                )
              })}
            </div>
          ))
        )}
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

      {addUnitOpen && (
        <AddUnitModal
          factionDatasheets={factionDatasheets}
          factionLabel={faction?.name ?? roster.factionId}
          allyDatasheets={allyDatasheets}
          allyLabel="Agentes del Imperio"
          pointsCostMap={pointsCostMap}
          entries={roster.entries}
          pointsLimit={roster.pointsLimit}
          currentPoints={combinedTotal}
          rosterFactionId={roster.factionId}
          onAdd={handleAddUnit}
          onClose={() => setAddUnitOpen(false)}
        />
      )}

      {qrModalOpen && <RosterQrExportModal roster={roster} onClose={() => setQrModalOpen(false)} />}
    </div>
  )
}
