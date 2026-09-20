/** Factions that inherit their parent's content instead of duplicating it.
 *
 * The five Space Marines chapters with their own detachments are real factions
 * (`public/data/factions/<id>.json`, listed in `catalog/factions.json`), but their files hold
 * only what that chapter *adds* — see `scripts/sm-chapter-split/README.md`. What a chapter can
 * actually field is "its own + the parent's", and that union is applied here, at read time.
 *
 * Inheritance is one-way: `space-marines` is the plain Codex army (its 67 generic datasheets
 * plus the named characters of successor chapters that have no detachments of their own), so
 * it never sees a child's content — no Dark Angels units in a vanilla Space Marines list, and
 * no Marneus Calgar in a Dark Angels one. */
import { hasSuccessorChapterKeyword } from '@/core/constants/chapters'

export const FACTION_PARENT: Record<string, string> = {
  'black-templars': 'space-marines',
  'blood-angels': 'space-marines',
  'dark-angels': 'space-marines',
  deathwatch: 'space-marines',
  'space-wolves': 'space-marines',
}

export function parentFactionOf(factionId: string): string | undefined {
  return FACTION_PARENT[factionId]
}

/** The faction ids whose content `factionId` can field: itself, then its parent if it has one. */
export function factionFamily(factionId: string): string[] {
  const parent = parentFactionOf(factionId)
  return parent ? [factionId, parent] : [factionId]
}

/** Whether content owned by `contentFactionId` is available to an army of `factionId`. */
export function belongsToFaction(contentFactionId: string, factionId: string): boolean {
  return contentFactionId === factionId || contentFactionId === parentFactionOf(factionId)
}

/** Two factions that share a roster's content pool — a chapter and its parent are the same
 * army as far as "is this an ally?" goes, which is not the same question as `===`. */
export function isSameFactionFamily(a: string, b: string): boolean {
  return a === b || parentFactionOf(a) === b || parentFactionOf(b) === a
}

/** Everything of `items` an army of `factionId` can field, inherited content included. Works
 * for any faction-scoped entity (datasheets, detachments, stratagems, enhancements). */
export function forFaction<T extends { factionId: string }>(items: T[], factionId: string): T[] {
  return items.filter(item => belongsToFaction(item.factionId, factionId))
}

/** Same union, for content keyed by faction id rather than carrying it as a field — the
 * chapter's own entries first, then the parent's (Combat Doctrines and friends). */
export function forFactionFromMap<T>(byFaction: Record<string, T[]>, factionId: string): T[] {
  return factionFamily(factionId).flatMap(id => byFaction[id] ?? [])
}

type FactionScopedDatasheet = { factionId: string; factionKeywords: string[] }

/** Datasheets are the one entity where inheritance isn't blanket: the parent's named
 * characters from successor chapters (Ultramarines, Salamanders, ...) belong to the parent
 * alone, so a chapter army doesn't get them. Everything else follows the plain family rule. */
export function datasheetBelongsToFaction(ds: FactionScopedDatasheet, factionId: string): boolean {
  if (hasSuccessorChapterKeyword(ds.factionKeywords)) return ds.factionId === factionId
  return belongsToFaction(ds.factionId, factionId)
}

export function datasheetsForFaction<T extends FactionScopedDatasheet>(items: T[], factionId: string): T[] {
  return items.filter(ds => datasheetBelongsToFaction(ds, factionId))
}
