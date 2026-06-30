/** Space Marines chapters that have their own MFM page / Faction Pack detachments.
 * A datasheet with none of these as a faction keyword is generic Codex: Space Marines
 * (including named successor-chapter characters like Ultramarines or Imperial Fists,
 * who play under the vanilla Codex rules rather than their own detachment list). */
export const SM_CHAPTERS = ['Black Templars', 'Blood Angels', 'Dark Angels', 'Deathwatch', 'Space Wolves'] as const

export const SM_CHAPTER_FILTERS = ['Space Marines', ...SM_CHAPTERS] as const

export function chapterOf(factionKeywords: string[]): string {
  return factionKeywords.find(k => (SM_CHAPTERS as readonly string[]).includes(k)) ?? 'Space Marines'
}
