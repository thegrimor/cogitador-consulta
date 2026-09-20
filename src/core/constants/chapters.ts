/** Space Marines chapters that have their own MFM page / Faction Pack detachments.
 * A datasheet with none of these as a faction keyword is generic Codex: Space Marines
 * (including named successor-chapter characters like Ultramarines or Imperial Fists,
 * who play under the vanilla Codex rules rather than their own detachment list). */
export const SM_CHAPTERS = ['Black Templars', 'Blood Angels', 'Dark Angels', 'Deathwatch', 'Space Wolves'] as const

export const SM_CHAPTER_FILTERS = ['Space Marines', ...SM_CHAPTERS] as const

/** Chapters that tag named characters but have no detachments of their own, so they never
 * became factions of their own in the chapter split. Their 18 characters stay with the parent
 * `space-marines` faction and — unlike the rest of the parent's content — are *not* inherited
 * by the chapter factions: a Dark Angels army can't field Marneus Calgar. */
export const SM_SUCCESSOR_CHAPTERS = [
  'Imperial Fists', 'Iron Hands', 'Raven Guard', 'Salamanders', 'Ultramarines', 'White Scars',
] as const

export function hasSuccessorChapterKeyword(factionKeywords: string[]): boolean {
  return factionKeywords.some(k => (SM_SUCCESSOR_CHAPTERS as readonly string[]).includes(k))
}

export function chapterOf(factionKeywords: string[]): string {
  return factionKeywords.find(k => (SM_CHAPTERS as readonly string[]).includes(k)) ?? 'Space Marines'
}

/** Display label for a chapterOf()/detachment.chapters value. The generic bucket is stored as
 * the literal string 'Space Marines' (matches the faction name, for historical/data reasons —
 * see chapterOf above) but reads as "Núcleo" in the filter UI so it isn't confused with the
 * chapter-specific buttons next to it. */
export function chapterLabel(chapter: string): string {
  return chapter === 'Space Marines' ? 'Núcleo' : chapter
}

/** Shared across Datasheets/Detachments/Army Rules so picking a chapter on one
 * page keeps it selected when navigating to the others, and across reloads. */
export const SM_CHAPTER_FILTER_STORAGE_KEY = 'cogitador-sm-chapter-filter'
