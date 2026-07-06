import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import type { RosterList, RosterEntry, GameData } from '@/types'

/** Above this length (post-compression), the export modal warns the QR may be hard to scan. */
export const QR_PAYLOAD_WARN_THRESHOLD = 1200

interface QrEntry {
  d: string
  m: number
  p: number | null
  n?: string
  e?: string
  a?: number
  w?: Record<string, number[]>
  g?: Record<string, number>
  s?: number
}

interface QrRoster {
  v: 1
  n: string
  f: string
  t: string[]
  l: number | null
  e: QrEntry[]
}

function isQrRoster(value: unknown): value is QrRoster {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    v.v === 1 &&
    typeof v.n === 'string' &&
    typeof v.f === 'string' &&
    Array.isArray(v.t) &&
    v.t.every(id => typeof id === 'string') &&
    (v.l === null || typeof v.l === 'number') &&
    Array.isArray(v.e) &&
    v.e.every(
      entry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as Record<string, unknown>).d === 'string' &&
        typeof (entry as Record<string, unknown>).m === 'number',
    )
  )
}

export function encodeRosterForQr(roster: RosterList): string {
  const idToIndex = new Map(roster.entries.map((entry, index) => [entry.id, index]))
  const qrRoster: QrRoster = {
    v: 1,
    n: roster.name,
    f: roster.factionId,
    t: roster.detachmentIds,
    l: roster.pointsLimit,
    e: roster.entries.map(entry => {
      const qrEntry: QrEntry = { d: entry.datasheetId, m: entry.modelCount, p: entry.pointsCost }
      if (entry.customName) qrEntry.n = entry.customName
      if (entry.enhancementId) qrEntry.e = entry.enhancementId
      if (entry.attachedToEntryId) {
        const index = idToIndex.get(entry.attachedToEntryId)
        if (index !== undefined) qrEntry.a = index
      }
      if (entry.weaponOptionSelections) qrEntry.w = entry.weaponOptionSelections
      if (entry.wargearSelections) qrEntry.g = entry.wargearSelections
      if (entry.wargearSurcharge) qrEntry.s = entry.wargearSurcharge
      return qrEntry
    }),
  }
  return compressToEncodedURIComponent(JSON.stringify(qrRoster))
}

function recomputeTotalPoints(entries: RosterEntry[]): number {
  return entries.reduce((sum, e) => sum + (e.pointsCost ?? 0) + (e.wargearSurcharge ?? 0), 0)
}

export function decodeRosterFromQr(data: string): Omit<RosterList, 'id' | 'createdAt' | 'updatedAt'> {
  try {
    const json = decompressFromEncodedURIComponent(data)
    if (!json) throw new Error('empty payload')
    const parsed: unknown = JSON.parse(json)
    if (!isQrRoster(parsed)) throw new Error('unrecognized shape')

    const indexToId = parsed.e.map(() => crypto.randomUUID())
    const entries: RosterEntry[] = parsed.e.map((qrEntry, index) => {
      const entry: RosterEntry = {
        id: indexToId[index],
        datasheetId: qrEntry.d,
        modelCount: qrEntry.m,
        pointsCost: qrEntry.p,
      }
      if (qrEntry.n) entry.customName = qrEntry.n
      if (qrEntry.e) entry.enhancementId = qrEntry.e
      if (qrEntry.a !== undefined && indexToId[qrEntry.a]) entry.attachedToEntryId = indexToId[qrEntry.a]
      if (qrEntry.w) entry.weaponOptionSelections = qrEntry.w
      if (qrEntry.g) entry.wargearSelections = qrEntry.g
      if (qrEntry.s) entry.wargearSurcharge = qrEntry.s
      return entry
    })

    return {
      name: parsed.n,
      factionId: parsed.f,
      detachmentIds: parsed.t,
      entries,
      totalPoints: recomputeTotalPoints(entries),
      pointsLimit: parsed.l,
    }
  } catch {
    throw new Error('Este código QR no es una lista de ejército válida.')
  }
}

export function validateDecodedRoster(
  roster: Omit<RosterList, 'id' | 'createdAt' | 'updatedAt'>,
  gameData: Pick<GameData, 'datasheets' | 'detachments' | 'enhancements' | 'factions'>,
): { roster: Omit<RosterList, 'id' | 'createdAt' | 'updatedAt'>; warnings: string[] } {
  const warnings: string[] = []
  const datasheetIds = new Set(gameData.datasheets.map(d => d.id))
  const detachmentIds = new Set(gameData.detachments.map(d => d.id))
  const enhancementIds = new Set(gameData.enhancements.map(e => e.id))

  if (!gameData.factions.some(f => f.id === roster.factionId)) {
    warnings.push('La facción de la lista no se reconoce en los datos actuales.')
  }

  const entries = roster.entries
    .filter(entry => {
      if (datasheetIds.has(entry.datasheetId)) return true
      warnings.push(`Se ha omitido una unidad desconocida (${entry.datasheetId}).`)
      return false
    })
    .map(entry => {
      if (entry.enhancementId && !enhancementIds.has(entry.enhancementId)) {
        warnings.push('Se ha omitido una mejora desconocida.')
        const rest = { ...entry }
        delete rest.enhancementId
        return rest
      }
      return entry
    })

  const validEntryIds = new Set(entries.map(e => e.id))
  const finalEntries = entries.map(entry => {
    if (entry.attachedToEntryId && !validEntryIds.has(entry.attachedToEntryId)) {
      const rest = { ...entry }
      delete rest.attachedToEntryId
      return rest
    }
    return entry
  })

  const filteredDetachmentIds = roster.detachmentIds.filter(id => {
    if (detachmentIds.has(id)) return true
    warnings.push('Se ha omitido un destacamento desconocido.')
    return false
  })

  return {
    roster: {
      ...roster,
      detachmentIds: filteredDetachmentIds,
      entries: finalEntries,
      totalPoints: recomputeTotalPoints(finalEntries),
    },
    warnings,
  }
}
