import type { RosterList, RosterEntry, Datasheet, Faction, Detachment, Enhancement, WargearCost } from '@/types'
import { weaponBaseName } from '@/core/utils/roster'

// ── Export ─────────────────────────────────────────────────────────────────────

function battleSizeLabel(pointsLimit: number | null): string {
  if (pointsLimit === null) return 'Strike Force'
  if (pointsLimit <= 500) return 'Combat Patrol'
  if (pointsLimit <= 1000) return 'Incursion'
  if (pointsLimit <= 2000) return 'Strike Force'
  return 'Onslaught'
}

function sectionHeader(role: string): string {
  if (role === 'Characters') return 'CHARACTERS'
  if (role === 'Battleline') return 'BATTLELINE'
  if (role === 'Dedicated Transports') return 'DEDICATED TRANSPORTS'
  return 'OTHER DATASHEETS'
}

export function exportRosterToText(
  roster: RosterList,
  datasheets: Datasheet[],
  factions: Faction[],
  detachments: Detachment[],
  enhancements: Enhancement[],
): string {
  const lines: string[] = []

  const totalPoints = roster.totalPoints ?? 0
  lines.push(`${roster.name} (${totalPoints} Points)`)
  lines.push('')

  const factionName = factions.find(f => f.id === roster.factionId)?.name ?? roster.factionId
  lines.push(factionName)

  const detachmentNames = roster.detachmentIds
    .map(id => detachments.find(d => d.id === id)?.name ?? id)
    .join(' + ')
  lines.push(`${detachmentNames || 'No Detachment'} (0 Detachment Points)`)

  const battleSize = battleSizeLabel(roster.pointsLimit)
  const limitLabel = roster.pointsLimit !== null ? `${roster.pointsLimit} Points` : 'Open Play'
  lines.push(`${battleSize} (${limitLabel})`)

  // Group entries by role priority
  const ROLE_ORDER = ['Characters', 'Battleline', 'Dedicated Transports', 'Fortifications', 'Other']
  const grouped = new Map<string, Array<{ entry: RosterEntry; datasheet: Datasheet }>>()

  for (const entry of roster.entries) {
    const datasheet = datasheets.find(d => d.id === entry.datasheetId)
    if (!datasheet) continue
    const role = ROLE_ORDER.includes(datasheet.role) ? datasheet.role : 'Other'
    if (!grouped.has(role)) grouped.set(role, [])
    grouped.get(role)!.push({ entry, datasheet })
  }

  for (const role of ROLE_ORDER) {
    const entries = grouped.get(role)
    if (!entries || entries.length === 0) continue

    lines.push('')
    lines.push(sectionHeader(role))
    lines.push('')

    for (const { entry, datasheet } of entries) {
      const pts = (entry.pointsCost ?? 0) + (entry.wargearSurcharge ?? 0)
      const displayName = entry.customName ?? datasheet.name
      lines.push(`${displayName} (${pts} Points)`)

      if (entry.enhancementId) {
        const enh = enhancements.find(e => e.id === entry.enhancementId)
        if (enh) lines.push(`• Enhancement: ${enh.name}`)
      }

      if (entry.modelCount > 1) {
        lines.push(`• ${entry.modelCount}x ${datasheet.name}`)
      }

      if (entry.wargearSelections) {
        for (const [weaponName, count] of Object.entries(entry.wargearSelections)) {
          if (count > 0) lines.push(`  ◦ ${count}x ${weaponName}`)
        }
      }
    }
  }

  lines.push('')
  lines.push(`Total Points: ${totalPoints}`)
  if (roster.pointsLimit !== null) {
    lines.push(`Points Limit: ${roster.pointsLimit}`)
  }

  return lines.join('\n')
}

// ── Parse ──────────────────────────────────────────────────────────────────────

export interface ParsedWeapon {
  name: string
  count: number
}

export interface ParsedUnit {
  name: string
  points: number
  weapons: ParsedWeapon[]
  enhancementName?: string
  attachedToUnitName?: string
}

export interface ParsedRosterText {
  name: string
  factionName: string
  detachmentNames: string[]
  pointsLimit: number | null
  units: ParsedUnit[]
}

// "Name (X Points)" or "Name (1.985 Points)" — European thousands separator
const UNIT_PTS_RE = /^(.+?)\s+\(([\d.]+)\s*[Pp]oints?\)$/
// "Name (N Detachment Points)"
const DETACHMENT_RE = /^(.+?)\s+\(\d+\s+Detachment\s+[Pp]oints?\)/i
// Battle size header
const BATTLE_SIZE_RE = /^(Combat Patrol|Incursion|Strike Force|Onslaught)\s+\(/i
// Weapon line: optional bullet/circle + "Nx Name"  e.g. "• 1x Fidelis", "◦ 2x Bolter", "1x Lance"
const WEAPON_RE = /^[•◦]?\s*(\d+)x\s+(.+)$/
// Non-weapon bullet: starts with bullet but no "Nx" — e.g. "• Warlord", "• Enhancement: ..."
const NON_WEAPON_BULLET_RE = /^[•◦]/
// Lines to always skip
const SKIP_RE = /^(Force Dispositions|Total\s+Points|Points\s+Limit|Warlord)/i
// "Attached Unit 1: Hearthkyn Warriors" or "• Attached Units: Hearthkyn Warriors"
const ATTACHMENT_LINE_RE = /^(?:[•◦]\s*)?Attached\s+Units?(?:\s+\d+)?:\s*(.+)$/i

const KNOWN_SECTIONS = new Set([
  'CHARACTERS', 'BATTLELINE', 'OTHER DATASHEETS', 'DEDICATED TRANSPORTS',
  'FORTIFICATIONS', 'INFANTRY', 'MOUNTED', 'VEHICLES', 'MONSTERS',
  'ALLIED UNITS', 'TRANSPORT',
])

function parsePoints(raw: string): number {
  // "1.985" → 1985, "185" → 185
  return parseInt(raw.replace(/\./g, ''), 10)
}

export function parseRosterText(text: string): ParsedRosterText {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) throw new Error('El texto está vacío')

  let armyName = ''
  let factionName = ''
  const detachmentNames: string[] = []
  let pointsLimit: number | null = null
  const units: ParsedUnit[] = []

  let seenDetachment = false
  let seenSection = false
  // The unit currently being accumulated (for collecting its weapon lines)
  let currentUnit: ParsedUnit | null = null

  function flushUnit() {
    if (currentUnit) units.push(currentUnit)
    currentUnit = null
  }

  for (const line of lines) {
    if (SKIP_RE.test(line)) continue

    // Section headers
    if (KNOWN_SECTIONS.has(line.toUpperCase())) {
      seenSection = true
      continue
    }

    // Battle size: "Strike Force (2000 Points)"
    if (BATTLE_SIZE_RE.test(line)) {
      const m = line.match(/\(([\d.]+)\s*[Pp]oints?\)/)
      if (m) pointsLimit = parsePoints(m[1])
      continue
    }

    // Detachment line: "Hallowed Martyrs (3 Detachment Points)"
    const detMatch = line.match(DETACHMENT_RE)
    if (detMatch) {
      const parts = detMatch[1].split(' + ').map(s => s.trim()).filter(Boolean)
      detachmentNames.push(...parts)
      seenDetachment = true
      continue
    }

    // Weapon line: "• 1x Fidelis", "◦ 2x Bolter", "1x Lance of Illumination"
    const wMatch = line.match(WEAPON_RE)
    if (wMatch) {
      if (currentUnit) {
        currentUnit.weapons.push({ count: parseInt(wMatch[1], 10), name: wMatch[2].trim() })
      }
      continue
    }

        // Enhancement bullet: "• Enhancement: Nombre"
    const enhMatch = line.match(/^[•◦]\s*Enhancement:\s*(.+)$/i)
    if (enhMatch) {
      if (currentUnit) currentUnit.enhancementName = enhMatch[1].trim()
      continue
    }

    // Attachment line: "Attached Unit 1: Hearthkyn Warriors" or "• Attached Units: ..."
    const attachMatch = line.match(ATTACHMENT_LINE_RE)
    if (attachMatch) {
      if (currentUnit && !currentUnit.attachedToUnitName) {
        currentUnit.attachedToUnitName = attachMatch[1].trim()
      }
      continue
    }

    // Non-weapon bullet (no count): "• Warlord", etc.
    if (NON_WEAPON_BULLET_RE.test(line)) continue

    // Unit/army-name line: "Name (X Points)"
    const uMatch = line.match(UNIT_PTS_RE)
    if (uMatch) {
      const unitName = uMatch[1].trim()
      const pts = parsePoints(uMatch[2])
      if (!isNaN(pts)) {
        if (armyName === '' && !seenDetachment && !seenSection) {
          armyName = unitName
        } else {
          flushUnit()
          currentUnit = { name: unitName, points: pts, weapons: [] }
        }
      }
      continue
    }

    // Plain text → faction name (only once, after army name, before detachment)
    if (!factionName && armyName && !seenDetachment) {
      factionName = line
    }
  }
  flushUnit()

  if (!armyName) {
    armyName = detachmentNames.length > 0 ? detachmentNames[0] : 'Lista Importada'
  }

  if (units.length === 0 && detachmentNames.length === 0) {
    throw new Error('No se encontraron unidades ni destacamentos. Comprueba que el formato sea correcto.')
  }

  return { name: armyName, factionName, detachmentNames, pointsLimit, units }
}

// ── Resolve ────────────────────────────────────────────────────────────────────

export function resolveImportedRoster(
  parsed: ParsedRosterText,
  datasheets: Datasheet[],
  factions: Faction[],
  detachments: Detachment[],
  wargearCostMap: Record<string, WargearCost[]>,
  enhancements: Enhancement[],
  leaderMap: Record<string, string[]>,
): { roster: Omit<RosterList, 'id' | 'createdAt' | 'updatedAt'>; warnings: string[] } {
  const warnings: string[] = []

  // Faction: match by name; if missing, infer from detachment
  let faction = factions.find(f => f.name.toLowerCase() === parsed.factionName.toLowerCase())
  if (!faction && parsed.detachmentNames.length > 0) {
    const firstDet = detachments.find(d =>
      parsed.detachmentNames.some(n => d.name.toLowerCase() === n.toLowerCase()),
    )
    if (firstDet) faction = factions.find(f => f.id === firstDet.factionId)
  }
  if (!faction && parsed.factionName) warnings.push(`Facción no encontrada: "${parsed.factionName}"`)
  const factionId = faction?.id ?? parsed.factionName

  const detachmentIds: string[] = []
  for (const detName of parsed.detachmentNames) {
    const det = detachments.find(d => d.name.toLowerCase() === detName.toLowerCase())
    if (det) {
      detachmentIds.push(det.id)
    } else {
      // BattleScribe sometimes joins multiple detachments with " and " instead of " + "
      const parts = detName.split(/\s+and\s+/i).map(s => s.trim()).filter(Boolean)
      if (parts.length > 1) {
        for (const part of parts) {
          const d = detachments.find(d2 => d2.name.toLowerCase() === part.toLowerCase())
          if (d) detachmentIds.push(d.id)
          else warnings.push(`Destacamento no encontrado: "${part}"`)
        }
      } else {
        warnings.push(`Destacamento no encontrado: "${detName}"`)
      }
    }
  }

  const factionDatasheets = faction ? datasheets.filter(d => d.factionId === factionId) : datasheets

  const entries = parsed.units
    .map(unit => {
      let datasheet = factionDatasheets.find(d => d.name.toLowerCase() === unit.name.toLowerCase())
      if (!datasheet) datasheet = datasheets.find(d => d.name.toLowerCase() === unit.name.toLowerCase())

      if (!datasheet) {
        warnings.push(`Unidad no encontrada: "${unit.name}"`)
        return null
      }

      const handledBases = new Set<string>()

      // 1. Wargear with surcharge cost — match by base name (strips "– profile" suffix)
      const availableWargear = wargearCostMap[datasheet.id] ?? []
      const wargearSelections: Record<string, number> = {}
      let wargearSurcharge = 0

      for (const pw of unit.weapons) {
        const pwBase = weaponBaseName(pw.name)
        const wc = availableWargear.find(w => weaponBaseName(w.name) === pwBase)
        if (wc) {
          wargearSelections[wc.name] = pw.count
          wargearSurcharge += (Number(wc.points) || 0) * pw.count
          handledBases.add(pwBase)
        }
      }

      // 2. Weapon option rules (free choices) — match each choice bundle against imported weapons
      const weaponOptionSelections: Record<string, number[]> = {}

      for (const rule of datasheet.weaponOptionRules) {
        if (rule.scope === 'unparsed' || rule.choices.length === 0) continue

        const selection = new Array<number>(rule.choices.length).fill(0)
        let anyMatch = false

        for (let ci = 0; ci < rule.choices.length; ci++) {
          for (const choiceWeapon of rule.choices[ci]) {
            const cwBase = weaponBaseName(choiceWeapon)
            const pw = unit.weapons.find(w => !handledBases.has(weaponBaseName(w.name)) && weaponBaseName(w.name) === cwBase)
            if (pw) {
              selection[ci] = pw.count
              handledBases.add(cwBase)
              anyMatch = true
              break
            }
          }
        }

        if (anyMatch) weaponOptionSelections[rule.id] = selection
      }

      const entry: RosterEntry = {
        id: crypto.randomUUID(),
        datasheetId: datasheet.id,
        modelCount: datasheet.modelCountMin > 0 ? datasheet.modelCountMin : 1,
        pointsCost: Math.max(0, unit.points - wargearSurcharge),
      }
      if (Object.keys(wargearSelections).length > 0) {
        entry.wargearSelections = wargearSelections
        entry.wargearSurcharge = wargearSurcharge
      }
      if (Object.keys(weaponOptionSelections).length > 0) {
        entry.weaponOptionSelections = weaponOptionSelections
      }
      if (unit.enhancementName) {
        const enh = enhancements.find(e => e.name.toLowerCase() === unit.enhancementName!.toLowerCase())
        if (enh) {
          entry.enhancementId = enh.id
          // The imported points already include the enhancement cost; subtract it so
          // RosterEditPage doesn't add it a second time when computing combinedTotal.
          entry.pointsCost = Math.max(0, (entry.pointsCost ?? 0) - enh.cost)
        } else {
          warnings.push(`Mejora no encontrada: "${unit.enhancementName}"`)
        }
      }
      return entry
    })
    .filter((e): e is RosterEntry => e !== null)

  // Resolve leader attachments
  const datasheetById = new Map(datasheets.map(d => [d.id, d]))
  const parsedUnitByEntryId = new Map(
    entries.map((e, i) => [e.id, parsed.units[i]] as const).filter(([, u]) => u !== undefined),
  )

  for (const entry of entries) {
    const eligibleTargetIds = new Set(leaderMap[entry.datasheetId] ?? [])
    if (eligibleTargetIds.size === 0) continue

    const parsedUnit = parsedUnitByEntryId.get(entry.id)
    const candidates = entries.filter(other => other.id !== entry.id && eligibleTargetIds.has(other.datasheetId))

    if (parsedUnit?.attachedToUnitName) {
      // Explicit attachment from import text — match by unit name
      const targetName = parsedUnit.attachedToUnitName.toLowerCase()
      const target = candidates.find(other => {
        const ds = datasheetById.get(other.datasheetId)
        return ds?.name.toLowerCase() === targetName
      })
      if (target) entry.attachedToEntryId = target.id
    } else if (candidates.length === 1) {
      // Only one possible target — auto-attach
      entry.attachedToEntryId = candidates[0].id
    }
  }

  const totalPoints = entries.reduce((sum, e) => sum + (e.pointsCost ?? 0) + (e.wargearSurcharge ?? 0), 0)

  return {
    roster: {
      name: parsed.name,
      factionId,
      detachmentIds,
      entries,
      totalPoints,
      pointsLimit: parsed.pointsLimit,
    },
    warnings,
  }
}
