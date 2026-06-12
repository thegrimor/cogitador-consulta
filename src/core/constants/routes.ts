export const ROUTES = {
  HOME: '/',
  CATALOG: '/catalog',
  FACTION: '/catalog/factions/:factionId',
  DATASHEET: '/catalog/datasheets/:datasheetId',
  DETACHMENT: '/catalog/detachments/:detachmentId',
  ROSTER: '/roster',
  ROSTER_NEW: '/roster/new',
  ROSTER_EDIT: '/roster/:rosterId',
} as const

export function factionPath(id: string) {
  return `/catalog/factions/${id}`
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
