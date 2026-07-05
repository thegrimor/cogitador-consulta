import type { RosterList, RosterEntry, Datasheet, Faction, Detachment, Enhancement, WargearCost, PointsCost } from '@/types'
import { weaponBaseName, resolveModelCount, resolveCostsForUnitIndex, sortCostVariants } from '@/core/utils/roster'
import { ENHANCEMENT_ATTACHMENTS } from '@/core/constants/enhancementAttachments'

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
  weapons: ParsedWeapon[]       // ◦ and bare Nx lines (actual weapons)
  bulletItems: ParsedWeapon[]   // • Nx lines (model sub-types or char weapons)
  enhancementName?: string
  attachedToUnitName?: string
  attachmentGroupId?: number    // from "Attached unit N" block
  attachmentRole?: 'Leader' | 'Bodyguard'  // from "• Attached as: Leader/Bodyguard"
}

export interface ParsedRosterText {
  name: string
  factionName: string
  detachmentNames: string[]
  pointsLimit: number | null
  units: ParsedUnit[]
}

// "Name (X Points)" or "Name (1.985 Points)" — European thousands separator. Also
// accepts the Spanish "puntos" some export tools use instead of "Points".
const UNIT_PTS_RE = /^(.+?)\s+\(([\d.]+)\s*(?:[Pp]oints?|[Pp]untos?)\)$/
// "Name (N Detachment Points)" / Spanish "Name (N puntos de destacamento)"
const DETACHMENT_RE = /^(.+?)\s+\(\d+\s+(?:Detachment\s+[Pp]oints?|[Pp]untos\s+de\s+destacamento)\)/i
// Battle size header, English and Spanish labels
const BATTLE_SIZE_RE = /^(Combat Patrol|Incursion|Strike Force|Onslaught|Patrulla de Combate|Incursi[oó]n|Fuerza de Choque|Ofensiva Total|Asalto Total)\s+\(/i
// Weapon line: ◦ bullet or bare "Nx Name" — e.g. "◦ 2x Bolter", "1x Lance"
const WEAPON_RE = /^(?:◦\s*)?(\d+)x\s+(.+)$/
// Model-type line: filled bullet + "Nx Name" — e.g. "• 1x Hesyr", "• 9x Einhyr Hearthguard"
const MODEL_LINE_RE = /^•\s*(\d+)x\s+(.+)$/
// Non-weapon bullet: starts with bullet but no "Nx" — e.g. "• Warlord", "• Enhancement: ..."
const NON_WEAPON_BULLET_RE = /^[•◦]/
// Lines to always skip (English and Spanish)
const SKIP_RE = /^(Force Dispositions|Disposiciones de la fuerza|Total\s+Points|Puntos\s+Totales|Points\s+Limit|L[ií]mite\s+de\s+Puntos|Warlord|Se[ñn]or de la guerra)/i
// "Attached Unit 1: Hearthkyn Warriors" or "• Attached Units: Hearthkyn Warriors"
const ATTACHMENT_LINE_RE = /^(?:[•◦]\s*)?Attached\s+Units?(?:\s+\d+)?:\s*(.+)$/i
// "• Attached as: Leader (Character)" / "• Attached as: Bodyguard (Battleline)"
const ATTACHED_AS_RE = /^[•◦]\s*Attached as:\s*(Leader|Bodyguard)/i
// "Attached unit 1" / "Attached unit 2" — listhammer group headers
const ATTACH_GROUP_RE = /^Attached\s+unit\s+(\d+)$/i

const KNOWN_SECTIONS = new Set([
  'CHARACTERS', 'BATTLELINE', 'OTHER DATASHEETS', 'DEDICATED TRANSPORTS',
  'FORTIFICATIONS', 'INFANTRY', 'MOUNTED', 'VEHICLES', 'MONSTERS',
  'ALLIED UNITS', 'TRANSPORT', 'ATTACHED UNITS',
  // Spanish section headers used by some export tools
  'PERSONAJE', 'PERSONAJES', 'LÍNEA DE BATALLA', 'OTRAS HOJAS DE DATOS',
  'TRANSPORTES DEDICADOS', 'FORTIFICACIONES', 'UNIDADES ALIADAS',
  'UNIDADES ADJUNTAS',
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
  let currentAttachmentGroup = -1
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
      // Leaving the ATTACHED UNITS block resets the group tracker
      if (line.toUpperCase() !== 'ATTACHED UNITS') currentAttachmentGroup = -1
      continue
    }

    // Battle size: "Strike Force (2000 Points)" / "Fuerza de Choque (2000 puntos)"
    if (BATTLE_SIZE_RE.test(line)) {
      const m = line.match(/\(([\d.]+)\s*(?:[Pp]oints?|[Pp]untos?)\)/)
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

    // Model-type bullet: "• 1x Hesyr", "• 9x Einhyr Hearthguard"
    const mMatch = line.match(MODEL_LINE_RE)
    if (mMatch) {
      if (currentUnit) {
        currentUnit.bulletItems.push({ count: parseInt(mMatch[1], 10), name: mMatch[2].trim() })
      }
      continue
    }

    // Weapon line: "◦ 2x Bolter", "1x Lance of Illumination"
    const wMatch = line.match(WEAPON_RE)
    if (wMatch) {
      if (currentUnit) {
        currentUnit.weapons.push({ count: parseInt(wMatch[1], 10), name: wMatch[2].trim() })
      }
      continue
    }

    // Enhancement bullet: "• Enhancement: Nombre" or "• Enhancements: Nombre" (listhammer uses
    // plural), or the Spanish "• Mejora: Nombre" / "• Mejoras: Nombre"
    const enhMatch = line.match(/^[•◦]\s*(?:Enhancements?|Mejoras?):\s*(.+)$/i)
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

    // "• Attached as: Leader (Character)" / "• Attached as: Bodyguard (Battleline)"
    const asMatch = line.match(ATTACHED_AS_RE)
    if (asMatch) {
      if (currentUnit) currentUnit.attachmentRole = asMatch[1] as 'Leader' | 'Bodyguard'
      continue
    }

    // Non-weapon bullet (no count): "• Warlord", etc.
    if (NON_WEAPON_BULLET_RE.test(line)) continue

    // "Attached unit 1" / "Attached unit 2" — listhammer group header
    const agMatch = line.match(ATTACH_GROUP_RE)
    if (agMatch) {
      currentAttachmentGroup = parseInt(agMatch[1], 10)
      continue
    }

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
          currentUnit = { name: unitName, points: pts, weapons: [], bulletItems: [] }
          if (currentAttachmentGroup >= 0) currentUnit.attachmentGroupId = currentAttachmentGroup
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

  // Some exporters list a unit under its "Attached Unit N" group even when that group
  // has no Leader (just a lone Bodyguard-role unit, i.e. no actual leader/bodyguard pair
  // was formed) — and then list the identical unit again in its normal role section
  // (CHARACTERS/BATTLELINE/etc). Genuine Leader+Bodyguard pairs are never repeated this
  // way, so this only fires for the leaderless case, and only once we've confirmed a
  // matching duplicate exists elsewhere — dropping it unconditionally could silently
  // lose a unit that's only ever listed inside its attachment group.
  for (let i = units.length - 1; i >= 0; i--) {
    const u = units[i]
    if (u.attachmentGroupId === undefined || u.attachmentRole !== 'Bodyguard') continue
    const hasLeaderSibling = units.some(o =>
      o !== u && o.attachmentGroupId === u.attachmentGroupId && o.attachmentRole === 'Leader')
    if (hasLeaderSibling) continue
    const isDuplicateElsewhere = units.some((o, idx) =>
      idx !== i && o.attachmentGroupId === undefined &&
      o.name.toLowerCase() === u.name.toLowerCase() && o.points === u.points)
    if (isDuplicateElsewhere) units.splice(i, 1)
  }

  if (!armyName) {
    armyName = detachmentNames.length > 0 ? detachmentNames[0] : 'Lista Importada'
  }

  if (units.length === 0 && detachmentNames.length === 0) {
    throw new Error('No se encontraron unidades ni destacamentos. Comprueba que el formato sea correcto.')
  }

  return { name: armyName, factionName, detachmentNames, pointsLimit, units }
}

// ── Resolve ────────────────────────────────────────────────────────────────────

/** Case-insensitive name match that also tolerates a trailing plural "s" mismatch
 * (some export tools pluralize a datasheet name that's stored singular, e.g.
 * "Myphitic Blight-haulers" for a datasheet named "Myphitic Blight-hauler") and a
 * trailing parenthetical annotation some exporters add to enhancement names, e.g.
 * "Snarling Rivalry (Upgrade)" for an enhancement stored as just "Snarling Rivalry". */
function namesMatch(a: string, b: string): boolean {
  const an = a.trim().toLowerCase()
  const bn = b.trim().toLowerCase()
  if (an === bn) return true
  const stripTrailingS = (s: string) => s.endsWith('s') ? s.slice(0, -1) : s
  const stripParenthetical = (s: string) => s.replace(/\s*\([^)]*\)\s*$/, '')
  const normalize = (s: string) => stripTrailingS(stripParenthetical(s))
  return normalize(an) === normalize(bn)
}

export function resolveImportedRoster(
  parsed: ParsedRosterText,
  datasheets: Datasheet[],
  factions: Faction[],
  detachments: Detachment[],
  wargearCostMap: Record<string, WargearCost[]>,
  enhancements: Enhancement[],
  leaderMap: Record<string, string[]>,
  pointsCostMap: Record<string, PointsCost[]>,
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

  // Build entryId → parsedUnit map during the map() so indices stay correct after filter
  const entryToParsedUnit = new Map<string, ParsedUnit>()
  // Track how many copies of each datasheet we've seen (for tier-range cost lookup)
  const unitIndexCounter = new Map<string, number>()

  const entries = parsed.units
    .map(unit => {
      let datasheet = factionDatasheets.find(d => namesMatch(d.name, unit.name))
      if (!datasheet) datasheet = datasheets.find(d => namesMatch(d.name, unit.name))

      if (!datasheet) {
        warnings.push(`Unidad no encontrada: "${unit.name}"`)
        return null
      }

      // For genuinely single-model datasheets (characters, vehicles), every "• Nx Weapon"
      // bullet is a weapon, never a composition breakdown (there's only one model to break
      // down). Some exporters bullet only the *first* weapon line and leave the rest bare
      // (e.g. "• 2x Bright lance" followed by bare "2x Flamer", "1x Ghostglaive"), so both
      // groups must be combined — picking whichever group is non-empty silently drops the
      // bulleted line whenever the unit also has bare ones.
      // For actual squads, • lines are the model-type breakdown (e.g. "• 10x Intercessor"),
      // regardless of whether the unit also has ◦ weapon lines — a squad with a fully default
      // loadout exports with no ◦ lines at all, so gating on their presence would wrongly treat
      // the composition bullet as a lone weapon and lose the real unit size.
      // Some exporters (e.g. Listhammer-style "Attached unit" text) also mark the *first*
      // weapon line under each model sub-type with "•" instead of "◦"/no bullet, since only
      // the flattening loses which nesting depth it came from. Those look identical to a
      // composition bullet ("• 1x Concussion gauntlet"), so anything whose name matches a
      // weapon this datasheet actually has is excluded from the model-count sum — it's
      // wargear, not a model type — while still being fed into weapon/wargear matching.
      // Per-unit wargear tokens (e.g. "Incubi Shrine Token") sit at the same bullet depth as
      // real composition lines but aren't weapons either — they're named datasheet abilities
      // ("For every 5 models in this unit, it can be equipped with 1 Incubi Shrine token."),
      // so datasheet ability names are excluded from the count the same way.
      const isSingleModelDatasheet = datasheet.modelCountMax <= 1
      const rawBulletItems = unit.bulletItems ?? []
      const datasheetWeaponBases = new Set(datasheet.weapons.map(w => weaponBaseName(w.name)))
      const nonModelBulletBases = new Set([
        ...datasheetWeaponBases,
        ...datasheet.abilities.map(a => weaponBaseName(a.name)),
      ])
      const bulletWeaponLines = rawBulletItems.filter(b => datasheetWeaponBases.has(weaponBaseName(b.name)))
      const bulletModelTypeLines = rawBulletItems.filter(b => !nonModelBulletBases.has(weaponBaseName(b.name)))

      const effectiveWeapons = isSingleModelDatasheet
        ? [...unit.weapons, ...rawBulletItems]
        : [...unit.weapons, ...bulletWeaponLines]

      const parsedModelCount = isSingleModelDatasheet
        ? 0
        : bulletModelTypeLines.reduce((s, m) => s + m.count, 0)

      // Homogeneous squads (every model carries the same default weapon) can still export
      // without a "• Nx ModelType" breakdown, so fall back to the quantity on whichever
      // weapon line matches one of the datasheet's default (one-per-model) weapons —
      // that's a reliable proxy for the actual unit size. Doesn't apply to single-model
      // datasheets: a lone vehicle/character mounting two copies of the same default
      // weapon (e.g. a Venom's twin splinter cannons) would otherwise read as 2 models.
      const defaultWeaponBases = new Set(datasheet.defaultWeaponNames.map(weaponBaseName))
      const modelCountFromWeapons = isSingleModelDatasheet ? 0 : effectiveWeapons
        .filter(w => defaultWeaponBases.has(weaponBaseName(w.name)))
        .reduce((max, w) => Math.max(max, w.count), 0)

      const modelCount = parsedModelCount > 0
        ? parsedModelCount
        : modelCountFromWeapons > 0
          ? modelCountFromWeapons
          : (datasheet.modelCountMin > 0 ? datasheet.modelCountMin : 1)

      const handledBases = new Set<string>()

      // 1. Wargear with surcharge cost — match by base name (strips "– profile" suffix).
      // Per-instance costs are named "per <Weapon>" in the data (surfaced without that
      // prefix in the UI), so strip it before comparing against the imported weapon name.
      const availableWargear = wargearCostMap[datasheet.id] ?? []
      const wargearSelections: Record<string, number> = {}
      let wargearSurcharge = 0

      for (const pw of effectiveWeapons) {
        const pwBase = weaponBaseName(pw.name)
        const wc = availableWargear.find(w => weaponBaseName(w.name.replace(/^per\s+/i, '')) === pwBase)
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
            const pw = effectiveWeapons.find(w => !handledBases.has(weaponBaseName(w.name)) && weaponBaseName(w.name) === cwBase)
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

      // Look up base cost from our data (never trust imported points — they may be wrong).
      // Costs are only priced at specific breakpoints (e.g. 5 or 10 models) even though a
      // unit's composition may allow in-between sizes (e.g. "4-9 Hellblasters"): fielding
      // anywhere above the smaller breakpoint costs the same as the next one up, so an
      // unmatched size rounds up to the cheapest variant that covers it rather than down
      // to the cheapest variant overall.
      const unitIndex = (unitIndexCounter.get(datasheet.id) ?? 0) + 1
      unitIndexCounter.set(datasheet.id, unitIndex)
      const allCosts = sortCostVariants(resolveCostsForUnitIndex(pointsCostMap[datasheet.id] ?? [], unitIndex))
      const matchingCost = allCosts.find(c => resolveModelCount(c, datasheet) === modelCount)
        ?? allCosts.find(c => resolveModelCount(c, datasheet) >= modelCount)
        ?? allCosts[allCosts.length - 1]
      const baseCost = matchingCost?.points ?? 0

      const entry: RosterEntry = {
        id: crypto.randomUUID(),
        datasheetId: datasheet.id,
        modelCount,
        pointsCost: baseCost,
      }
      entryToParsedUnit.set(entry.id, unit)
      if (Object.keys(wargearSelections).length > 0) {
        entry.wargearSelections = wargearSelections
        entry.wargearSurcharge = wargearSurcharge
      }
      if (Object.keys(weaponOptionSelections).length > 0) {
        entry.weaponOptionSelections = weaponOptionSelections
      }
      if (unit.enhancementName) {
        const enh = enhancements.find(e => namesMatch(e.name, unit.enhancementName!))
        if (enh) {
          entry.enhancementId = enh.id
          // Enhancement cost is NOT stored in pointsCost — RosterEditPage computes it
          // separately from enhancementId and adds it to combinedTotal.
        } else {
          warnings.push(`Mejora no encontrada: "${unit.enhancementName}"`)
        }
      }
      return entry
    })
    .filter((e): e is RosterEntry => e !== null)

  // Resolve leader attachments
  const datasheetById = new Map(datasheets.map(d => [d.id, d]))

  for (const entry of entries) {
    const eligibleTargetIds = new Set(leaderMap[entry.datasheetId] ?? [])
    if (entry.enhancementId) {
      for (const id of ENHANCEMENT_ATTACHMENTS[entry.enhancementId] ?? []) eligibleTargetIds.add(id)
    }
    if (eligibleTargetIds.size === 0) continue

    const parsedUnit = entryToParsedUnit.get(entry.id)
    const candidates = entries.filter(other => other.id !== entry.id && eligibleTargetIds.has(other.datasheetId))

    if (parsedUnit?.attachedToUnitName) {
      // Explicit attachment from import text — match by unit name
      const targetName = parsedUnit.attachedToUnitName.toLowerCase()
      const target = candidates.find(other => {
        const ds = datasheetById.get(other.datasheetId)
        return ds?.name.toLowerCase() === targetName
      })
      if (target) entry.attachedToEntryId = target.id
    } else if (parsedUnit?.attachmentGroupId !== undefined) {
      // Listhammer "Attached unit N" block — find the bodyguard in the same group
      const groupId = parsedUnit.attachmentGroupId
      const target = candidates.find(other => {
        const pu = entryToParsedUnit.get(other.id)
        return pu?.attachmentGroupId === groupId
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
