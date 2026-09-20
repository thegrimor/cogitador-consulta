/** Agents of the Imperium are the only faction taken as allies into a foreign roster. */
export const ALLY_FACTION_ID = 'imperial-agents'

// Keyed by the slug id from public/data/catalog/factions.json (also RosterList.factionId),
// NOT src/themes/themes.ts's `faction` field — that one holds GW short codes ("SM", "AoI")
// and is only a display label for ThemePicker, so matching a factionId against it silently
// never hits. Deriving this from THEMES was exactly that bug: `canTakeAllies` was always
// false and the allied-Agents picker never rendered for any faction. Mirrors the 13 themes
// grouped as `imperium` in themes.ts; Adeptus Titanicus is deliberately out (grouped
// `otros`, and it fields no Agents).
const IMPERIUM_FACTION_IDS = new Set([
  'adepta-sororitas',
  'adeptus-custodes',
  'adeptus-mechanicus',
  'astra-militarum',
  'black-templars',
  'blood-angels',
  'dark-angels',
  'deathwatch',
  'grey-knights',
  'imperial-agents',
  'imperial-knights',
  'space-marines',
  'space-wolves',
])

export function canTakeImperialAgents(factionId: string): boolean {
  return factionId !== ALLY_FACTION_ID && IMPERIUM_FACTION_IDS.has(factionId)
}
