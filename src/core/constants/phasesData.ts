// The actual phase content (PhaseData[]) lives in public/data/catalog/phases.json now — fetched
// by useGameData.ts like the rest of the game data, so it's also readable by the chat backend
// (server/src/lib/gameDataIndex.js). This file only keeps the display order of the three phase
// groups, which isn't itself part of any phase's own record.
export const PHASE_GROUPS = ['The Battle Round', 'Battlefields and Tactics', 'Advanced Rules'] as const
export type PhaseGroup = (typeof PHASE_GROUPS)[number]
