import { useMemo } from 'react'
import type { GameData, Datasheet, Detachment, DetachmentAbility, Stratagem, Enhancement } from '@/types'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import type { PanelSelection } from '../types'

const EMPTY_SELECTION: PanelSelection = {
  factionId: null, detachmentIds: [], datasheetId: null, characterId: null, enhancementId: null,
}

export interface PanelState {
  selection: PanelSelection
  availableDetachments: Detachment[]
  availableUnits: Datasheet[]
  allUnitsForFaction: Datasheet[]
  selectedUnit: Datasheet | null
  availableCharacters: Datasheet[]
  availableEnhancements: Enhancement[]
  detachmentAbilities: DetachmentAbility[]
  applicableStratagems: Stratagem[]
  rosterIds: string[] | null
  selectFaction: (id: string | null) => void
  selectDetachments: (ids: string[]) => void
  toggleDetachment: (id: string) => void
  selectUnit: (id: string | null) => void
  selectCharacter: (id: string | null) => void
  selectEnhancement: (id: string | null) => void
  setRosterIds: (ids: string[] | null) => void
}

export function usePanelState(gameData: GameData, storageKey: string): PanelState {
  const [selection, setSelection] = useLocalStorage<PanelSelection>(storageKey, EMPTY_SELECTION)
  const [rosterIds, setRosterIdsState] = useLocalStorage<string[] | null>(`${storageKey}-roster`, null)

  const availableDetachments = useMemo(
    () => selection.factionId
      ? gameData.detachments.filter(d => d.factionId === selection.factionId)
      : [],
    [gameData.detachments, selection.factionId],
  )

  const allUnitsForFaction = useMemo(
    () => selection.factionId
      ? gameData.datasheets
          .filter(ds => ds.factionId === selection.factionId && !ds.isVirtual)
          .sort((a, b) => a.name.localeCompare(b.name))
      : [],
    [gameData.datasheets, selection.factionId],
  )

  const availableUnits = useMemo(
    () => rosterIds !== null
      ? allUnitsForFaction.filter(ds => rosterIds.includes(ds.id))
      : allUnitsForFaction,
    [allUnitsForFaction, rosterIds],
  )

  const selectedUnit = useMemo(
    () => selection.datasheetId
      ? gameData.datasheets.find(ds => ds.id === selection.datasheetId) ?? null
      : null,
    [gameData.datasheets, selection.datasheetId],
  )

  const availableCharacters = useMemo(() => {
    if (!selectedUnit) return []
    const factionId = selectedUnit.factionId
    const unitId = selectedUnit.id
    const leaderIds = new Set(
      Object.entries(gameData.leaderMap)
        .filter(([, followerIds]) => followerIds.includes(unitId))
        .map(([leaderId]) => leaderId)
    )
    return [...leaderIds]
      .map(id => gameData.datasheets.find(ds => ds.id === id && ds.factionId === factionId))
      .filter((ds): ds is Datasheet => ds !== undefined)
      .filter(ds => rosterIds === null || rosterIds.includes(ds.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [gameData.datasheets, gameData.leaderMap, selectedUnit, rosterIds])

  const detachmentAbilities = useMemo(
    () => gameData.detachmentAbilities.filter(da => selection.detachmentIds.includes(da.detachmentId)),
    [gameData.detachmentAbilities, selection.detachmentIds],
  )

  const applicableStratagems = useMemo(() => {
    if (!selectedUnit) return []
    const unitStratIds = new Set(gameData.datasheetStratagems[selectedUnit.id] ?? [])
    return gameData.stratagems
      .filter(s =>
        unitStratIds.has(s.id) &&
        (s.detachmentId === '' || selection.detachmentIds.includes(s.detachmentId)),
      )
      .sort((a, b) => a.cpCost - b.cpCost || a.phase.localeCompare(b.phase))
  }, [gameData.stratagems, gameData.datasheetStratagems, selectedUnit, selection.detachmentIds])

  const availableEnhancements = useMemo(() => {
    // A led unit can bear an Enhancement either on the attached character or on the unit
    // itself (some Enhancements are "UNIT only" and don't require a character at all), so
    // the eligible list is the union of both — attaching a character must not hide
    // Enhancements the base unit already qualified for.
    const targetIds = [selection.characterId, selectedUnit?.id].filter((id): id is string => id != null)
    if (targetIds.length === 0) return []
    const validEnhancementIds = new Set(targetIds.flatMap(id => gameData.datasheetEnhancements[id] ?? []))
    const detachmentIds = new Set(selection.detachmentIds)
    return gameData.enhancements.filter(e => detachmentIds.has(e.detachmentId) && validEnhancementIds.has(e.id))
  }, [gameData.datasheetEnhancements, gameData.enhancements, selection.characterId, selection.detachmentIds, selectedUnit])

  const selectFaction = (factionId: string | null) => {
    setSelection({ factionId, detachmentIds: [], datasheetId: null, characterId: null, enhancementId: null })
    setRosterIdsState(null)
  }

  const selectDetachments = (detachmentIds: string[]) =>
    setSelection(s => ({ ...s, detachmentIds, enhancementId: null }))

  const toggleDetachment = (detachmentId: string) =>
    setSelection(s => ({
      ...s,
      detachmentIds: s.detachmentIds.includes(detachmentId)
        ? s.detachmentIds.filter(id => id !== detachmentId)
        : [...s.detachmentIds, detachmentId],
      enhancementId: null,
    }))

  const selectUnit = (datasheetId: string | null) =>
    setSelection(s => ({ ...s, datasheetId, characterId: null, enhancementId: null }))

  const selectCharacter = (characterId: string | null) =>
    setSelection(s => ({ ...s, characterId, enhancementId: null }))

  const selectEnhancement = (enhancementId: string | null) =>
    setSelection(s => ({ ...s, enhancementId }))

  const setRosterIds = (ids: string[] | null) => setRosterIdsState(ids)

  return {
    selection, availableDetachments, availableUnits, allUnitsForFaction, selectedUnit,
    availableCharacters, availableEnhancements, detachmentAbilities, applicableStratagems,
    rosterIds,
    selectFaction, selectDetachments, toggleDetachment, selectUnit, selectCharacter, selectEnhancement, setRosterIds,
  }
}
