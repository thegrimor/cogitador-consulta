export const ROUTES = {
  HOME: '/',
  CATALOG: '/catalog',
  FACTION: '/catalog/factions/:factionId',
  FACTION_DATASHEETS: '/catalog/factions/:factionId/datasheets',
  FACTION_DETACHMENTS: '/catalog/factions/:factionId/detachments',
  FACTION_ARMY_RULES: '/catalog/factions/:factionId/army-rules',
  DATASHEET: '/catalog/datasheets/:datasheetId',
  DETACHMENT: '/catalog/detachments/:detachmentId',
  CORE_RULES: '/core-rules',
  CORE_RULES_PHASES: '/core-rules/phases',
  CORE_RULES_PHASE_DETAIL: '/core-rules/phases/:phaseId',
  MISSIONS_PRIMARY: '/missions/primary',
  MISSIONS_PRIMARY_DETAIL: '/missions/primary/:cardId',
  MISSIONS_SECONDARY: '/missions/secondary',
  MISSIONS_SECONDARY_DETAIL: '/missions/secondary/:cardId',
  MISSIONS_MATCHER: '/missions/matcher',
  ROSTER: '/roster',
  ROSTER_NEW: '/roster/new',
  ROSTER_EDIT: '/roster/:rosterId',
  MATHHAMMER: '/mathhammer',
  LOGIN: '/login',
} as const

export function factionPath(id: string) {
  return `/catalog/factions/${id}`
}

export function factionDatasheetsPath(id: string) {
  return `/catalog/factions/${id}/datasheets`
}

export function factionDetachmentsPath(id: string) {
  return `/catalog/factions/${id}/detachments`
}

export function factionArmyRulesPath(id: string) {
  return `/catalog/factions/${id}/army-rules`
}

/**
 * Router `state` carried from a faction's datasheet/detachment list into a detail page, so the
 * detail page's back button returns to the list the player actually came from — a chapter list
 * (e.g. Dark Angels) that opened an inherited Space Marines datasheet goes back to the chapter
 * list, not the parent's. `fromList` means the previous history entry *is* that list, so going
 * back pops it (keeping its filters/scroll) instead of pushing a fresh copy.
 */
export interface CatalogBackState {
  listFactionId: string
  fromList?: boolean
}

export function readCatalogBackState(state: unknown): CatalogBackState | undefined {
  if (state && typeof state === 'object' && typeof (state as CatalogBackState).listFactionId === 'string') {
    return state as CatalogBackState
  }
  return undefined
}

export function datasheetPath(id: string) {
  return `/catalog/datasheets/${id}`
}

export function detachmentPath(id: string) {
  return `/catalog/detachments/${id}`
}

export function rosterEditPath(id: string) {
  return `/roster/${id}`
}

export function corePhasePath(id: string) {
  return `/core-rules/phases/${id}`
}

export function missionPrimaryPath(id: string) {
  return `/missions/primary/${id}`
}

export function missionSecondaryPath(id: string) {
  return `/missions/secondary/${id}`
}

export function mathhammerAttackerPath(
  datasheetId: string,
  factionId: string,
  options?: { detachmentIds?: string[]; characterId?: string; rosterId?: string },
) {
  const params = new URLSearchParams({ faction: factionId, datasheet: datasheetId })
  if (options?.detachmentIds?.length) params.set('detachments', options.detachmentIds.join(','))
  if (options?.characterId) params.set('character', options.characterId)
  if (options?.rosterId) params.set('roster', options.rosterId)
  return `${ROUTES.MATHHAMMER}?${params.toString()}`
}
