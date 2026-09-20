/** Space Marines chapters that have their own detachments. Each one is its own faction since
 * the chapter split (`scripts/sm-chapter-split/README.md`), so these keywords no longer drive
 * a filter — they survive as the tag that says which datasheets are a chapter's own rather
 * than inherited from the `space-marines` parent. */
export const SM_CHAPTERS = ['Black Templars', 'Blood Angels', 'Dark Angels', 'Deathwatch', 'Space Wolves'] as const

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

/** The chapter to badge a datasheet with in a list, or null when there's nothing worth
 * saying. On a chapter faction's page this marks its own units apart from the core ones it
 * inherits; on the parent's page it marks the successor-chapter characters (Calgar and
 * company), which is the one thing that page genuinely mixes. Returns null for datasheets
 * outside the Space Marines family, whose keywords never match either list. */
export function chapterBadgeOf(factionKeywords: string[]): string | null {
  return factionKeywords.find(
    k => (SM_CHAPTERS as readonly string[]).includes(k) ||
      (SM_SUCCESSOR_CHAPTERS as readonly string[]).includes(k),
  ) ?? null
}
