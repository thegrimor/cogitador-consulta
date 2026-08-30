// Parser for newrecruit.eu's plain-text list export — a different shape from the GW-app-style
// "Munitorum" text that parseRosterText (rosterExport.ts) already handles: a "+" bordered
// banner of ALL-CAPS metadata fields, unit lines with an inline ": weapon, weapon" tail
// instead of separate "◦ Nx Weapon" lines, and per-model-type "• Nx SubName: weapons" bullets
// that fold composition and loadout into one line. Kept in its own module (rather than folded
// into rosterExport.ts's line-by-line state machine) since the two formats share no line
// grammar — only the output shape (ParsedRosterText/ParsedUnit) and the downstream
// resolveImportedRoster() are shared.
import type { ParsedRosterText, ParsedUnit, ParsedWeapon } from './rosterExport'

export function isNewRecruitText(text: string): boolean {
  return /Created with newrecruit\.eu/i.test(text) || /FACTION KEYWORD\s*:/i.test(text)
}

// ALL-CAPS "KEY: value" metadata line, whether inside the "+" banner ("+ DETACHMENT: ...") or
// bare (some newrecruit.eu export variants omit the banner border entirely).
const HEADER_LINE_RE = /^\+?\s*([A-Z][A-Z\s/]+):\s*(.*)$/
// Top-level unit line: optional "CharN:" tag, "Nx Name (N pts)", optional inline weapon tail.
const UNIT_LINE_RE = /^(?:Char\d+:\s*)?(\d+)x\s+(.+?)\s+\((\d+)\s*pts\.?\)(?:\s*:\s*(.+))?$/i
// Composition/loadout bullet: "• Nx SubName: [N with] weapon, weapon". The "N with" repeats
// the leading count and is redundant — always the bullet's own count applies per weapon.
const BULLET_WITH_WEAPONS_RE = /^•\s*(\d+)x\s+(.+?):\s*(?:\d+\s+with\s+)?(.+)$/i
// Bare composition bullet with no loadout tail — "• Nx SubName".
const BULLET_BARE_RE = /^•\s*(\d+)x\s+(.+)$/
const ENHANCEMENT_LINE_RE = /^Enhancement:\s*(.+?)(?:\s*\(\+?\d+\s*pts?\))?$/i
const ATTACHED_TO_RE = /^Attached to\s+(.+)$/i
const LEADING_RE = /^Leading\s+.+$/i
const FOOTER_RE = /^Created with newrecruit\.eu/i

function splitWeaponList(raw: string, count: number): ParsedWeapon[] {
  return raw.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ name, count }))
}

// A squad's weapon loadout is split across per-model-type bullets (e.g. the sergeant's own
// "• 1x ... Sergeant: ... Master-crafted Power Weapon" plus the rest of the squad's
// "• 9x ...: ... Master-crafted Power Weapon"), so the same weapon name can appear more than
// once in a unit's weapons list. resolveImportedRoster's wargear/weapon-option matching keys
// its counts by weapon name and assigns rather than accumulates, so two separate entries for
// the same weapon would have the second silently clobber the first — merge same-name entries
// here first so the unit carries one accurate total count per weapon instead.
function mergeWeapons(weapons: ParsedWeapon[]): ParsedWeapon[] {
  const merged = new Map<string, ParsedWeapon>()
  for (const w of weapons) {
    const key = w.name.trim().toLowerCase()
    const existing = merged.get(key)
    if (existing) existing.count += w.count
    else merged.set(key, { name: w.name, count: w.count })
  }
  return [...merged.values()]
}

export function parseNewRecruitText(text: string): ParsedRosterText {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) throw new Error('El texto está vacío')

  let factionName = ''
  const detachmentNames: string[] = []
  const units: ParsedUnit[] = []
  let currentUnit: ParsedUnit | null = null

  function flushUnit() {
    if (currentUnit) {
      currentUnit.weapons = mergeWeapons(currentUnit.weapons)
      units.push(currentUnit)
    }
    currentUnit = null
  }

  for (const line of lines) {
    if (FOOTER_RE.test(line) || LEADING_RE.test(line)) continue

    const headerMatch = line.match(HEADER_LINE_RE)
    if (headerMatch) {
      const key = headerMatch[1].trim().toUpperCase()
      const value = headerMatch[2].trim()
      if (key === 'FACTION KEYWORD' && value) {
        // "Imperium - Adeptus Astartes - Raven Guard" — the most specific term is last, but
        // it's often a Chapter/Legion rather than the faction name itself (e.g. "Raven
        // Guard" for the "Space Marines" faction). Kept only as a best-effort label:
        // resolveImportedRoster() falls back to inferring the faction from the detachment
        // name when this doesn't match anything, which is the case that actually matters.
        const segments = value.split(/\s+-\s+/).map(s => s.trim()).filter(Boolean)
        factionName = segments[segments.length - 1] ?? value
      } else if (key === 'DETACHMENT' && value) {
        const parts = value.split(/\s*\+\s*/).map(s => s.replace(/\s*\([^)]*\)\s*$/, '').trim()).filter(Boolean)
        detachmentNames.push(...parts)
      }
      continue
    }

    const bulletMatch = line.match(BULLET_WITH_WEAPONS_RE)
    if (bulletMatch) {
      if (currentUnit) {
        const count = parseInt(bulletMatch[1], 10)
        currentUnit.bulletItems.push({ count, name: bulletMatch[2].trim() })
        currentUnit.weapons.push(...splitWeaponList(bulletMatch[3], count))
      }
      continue
    }

    const bareBulletMatch = line.match(BULLET_BARE_RE)
    if (bareBulletMatch) {
      if (currentUnit) {
        currentUnit.bulletItems.push({ count: parseInt(bareBulletMatch[1], 10), name: bareBulletMatch[2].trim() })
      }
      continue
    }

    const enhMatch = line.match(ENHANCEMENT_LINE_RE)
    if (enhMatch) {
      if (currentUnit) currentUnit.enhancementName = enhMatch[1].trim()
      continue
    }

    const attachedMatch = line.match(ATTACHED_TO_RE)
    if (attachedMatch) {
      if (currentUnit) currentUnit.attachedToUnitName = attachedMatch[1].trim()
      continue
    }

    const unitMatch = line.match(UNIT_LINE_RE)
    if (unitMatch) {
      flushUnit()
      const count = parseInt(unitMatch[1], 10)
      currentUnit = { name: unitMatch[2].trim(), points: parseInt(unitMatch[3], 10), weapons: [], bulletItems: [] }
      if (unitMatch[4]) currentUnit.weapons.push(...splitWeaponList(unitMatch[4], count))
      continue
    }

    // Unrecognized line (e.g. "WARLORD:"/"SECONDARY:" restated outside the banner, or a
    // future export field) — ignore rather than fail the whole import over it.
  }
  flushUnit()

  if (units.length === 0 && detachmentNames.length === 0) {
    throw new Error('No se encontraron unidades ni destacamentos. Comprueba que el formato sea correcto.')
  }

  const name = detachmentNames.length > 0 ? detachmentNames[0] : 'Lista Importada'

  return { name, factionName, detachmentNames, pointsLimit: null, units }
}
