import type { UnitOption, UnitSlot, WeaponOptionRule } from '@/types'

export function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractListItems(html: string): { items: string[]; head: string } | null {
  const m = html.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i)
  if (!m) return null
  const items = [...m[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(li => stripHtml(li[1]))
  const head = stripHtml(html.slice(0, m.index))
  return { items: items.filter(Boolean), head }
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
}

const NUM_PATTERN = `(\\d+|${Object.keys(NUMBER_WORDS).join('|')})`

/** Parses a count that may be a digit or a spelled-out number word ("two", "three", ...). */
function parseCount(s: string): number {
  const n = parseInt(s, 10)
  return Number.isNaN(n) ? NUMBER_WORDS[s.toLowerCase()] ?? 0 : n
}

/** Splits "1 X and 1 Y" / "1 X, 1 Y and 1 Z" into ["X", "Y", "Z"], dropping leading quantities. */
function splitBundle(text: string): string[] {
  return text
    .split(/,| and /i)
    .map(s => s.trim().replace(/^(?:up to )?\d+\s+/i, '').replace(/[.*]+$/, '').trim())
    .filter(Boolean)
}

// ── Unit composition → slots ────────────────────────────────────────────────

export function parseUnitSlots(compositionLines: string[]): UnitSlot[] {
  const orIdx = compositionLines.findIndex(l => stripHtml(l).toUpperCase() === 'OR')
  const relevant = orIdx >= 0 ? compositionLines.slice(0, orIdx) : compositionLines
  const slots: UnitSlot[] = []
  for (const line of relevant) {
    const clean = stripHtml(line)
    const rangeMatch = clean.match(/^(\d+)\s*-\s*(\d+)\s+(.+)$/)
    const singleMatch = clean.match(/^(\d+)\s+(.+)$/)
    if (rangeMatch) {
      slots.push({ role: rangeMatch[3].trim(), min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) })
    } else if (singleMatch) {
      const n = parseInt(singleMatch[1])
      slots.push({ role: singleMatch[2].trim(), min: n, max: n })
    }
  }
  return slots
}

export function resolveRoleCounts(slots: UnitSlot[], totalModelCount: number): Record<string, number> {
  if (slots.length === 0) return {}
  if (slots.length === 1) return { [slots[0].role]: totalModelCount }
  const counts = slots.map(s => s.min)
  let remaining = totalModelCount - counts.reduce((a, b) => a + b, 0)
  let progress = true
  while (remaining > 0 && progress) {
    progress = false
    for (let i = 0; i < slots.length && remaining > 0; i++) {
      if (counts[i] < slots[i].max) {
        counts[i]++
        remaining--
        progress = true
      }
    }
  }
  return Object.fromEntries(slots.map((s, i) => [s.role, counts[i]]))
}

function matchRole(text: string, slots: UnitSlot[]): string | undefined {
  let norm = text.trim().replace(/^(the|this|any number of|up to \d+|one)\s+/i, '').trim()
  norm = norm.replace(/[’']s$/i, '').trim().toLowerCase()
  const exact = slots.find(s => s.role.toLowerCase() === norm)
  if (exact) return exact.role
  const stripTrailingS = (s: string) => s.replace(/s$/i, '')
  const noS = stripTrailingS(norm)
  const byStem = slots.find(s => stripTrailingS(s.role.toLowerCase()) === noS)
  if (byStem) return byStem.role
  const candidates = slots.filter(
    s => norm.includes(s.role.toLowerCase()) || s.role.toLowerCase().includes(norm),
  )
  if (candidates.length === 1) return candidates[0].role
  return undefined
}

interface SubjectScope {
  scope: WeaponOptionRule['scope']
  roleName?: string
  fixedCount?: number
  scaleEvery?: number
  scaleGrant?: number
}

function parseSubjectScope(subjectRaw: string, slots: UnitSlot[]): SubjectScope {
  const subject = subjectRaw.trim()

  if (/^(every model|each model|all( of the)? models?( in (?:this|the) unit)?)$/i.test(subject)) {
    return { scope: 'all_models' }
  }

  if (/^this model$/i.test(subject)) {
    if (slots.length === 1) return { scope: 'role', roleName: slots[0].role }
    return { scope: 'unparsed' }
  }

  let m = subject.match(/^up to (\d+)\s+(.+)$/i)
  if (m) {
    const n = parseInt(m[1])
    const roleText = m[2].trim()
    if (/^models?$/i.test(roleText)) return { scope: 'fixed_count', fixedCount: n }
    const role = matchRole(roleText.replace(/\s+models?$/i, ''), slots)
    return role ? { scope: 'fixed_count', fixedCount: n, roleName: role } : { scope: 'unparsed' }
  }

  m = subject.match(/^any number of (.+)$/i)
  if (m) {
    if (/^models?$/i.test(m[1].trim())) return { scope: 'all_models' }
    const role = matchRole(m[1], slots)
    return role ? { scope: 'role', roleName: role } : { scope: 'unparsed' }
  }

  if (/^one model in (?:this|the) unit$/i.test(subject)) {
    return { scope: 'fixed_count', fixedCount: 1 }
  }

  m = subject.match(/^(\d+)\s+(.+)$/)
  if (m) {
    const n = parseInt(m[1])
    if (/^models?$/i.test(m[2].trim())) return { scope: 'fixed_count', fixedCount: n }
    const role = matchRole(m[2], slots)
    return { scope: 'fixed_count', fixedCount: n, roleName: role }
  }

  const role = matchRole(subject, slots)
  if (role) return { scope: 'role', roleName: role }

  return { scope: 'unparsed' }
}

let ruleCounter = 0

function makeRule(partial: Omit<WeaponOptionRule, 'id'>): WeaponOptionRule {
  return { id: `wor-${ruleCounter++}`, ...partial }
}

/**
 * Best-effort parser for GW's free-text wargear option lines. Covers the
 * dominant phrasing templates (replace/equip, single weapon, "one of the
 * following" lists, "any of the following" lists, fixed/scaling counts).
 * Anything it can't confidently parse comes back with scope 'unparsed' so
 * the UI can surface it as plain text instead of guessing at legality.
 */
export function parseWeaponOptionRules(options: UnitOption[], slots: UnitSlot[]): WeaponOptionRule[] {
  return options.map(opt => {
    const raw = opt.description ?? ''
    const list = extractListItems(raw)
    const head = list ? list.head : stripHtml(raw)

    // ── "for every N models in this unit, M model(s) ... can be equipped with ..." ──
    const scaling = head.match(/for every (\d+) models? in (?:this|the) unit,\s*(\d+) models?.*?\bequipped with\b/i)
    if (scaling) {
      const choices = list ? list.items.map(splitBundle) : [splitBundle(head.split(/equipped with/i).pop() ?? '')]
      return makeRule({
        raw,
        scope: 'scaling',
        scaleEvery: parseInt(scaling[1]),
        scaleGrant: parseInt(scaling[2]),
        kind: 'add',
        fromWeapons: [],
        choices,
        exclusive: true,
        maxStack: 1,
        allowRepeatChoice: false,
      })
    }

    // ── "for every N models in this unit, M model's <weapon[s]> can be replaced with ..." ──
    const scalingReplace = head.match(
      /^for every (\d+) models? in (?:this|the) unit,\s*(\d+) .+?[’'](?:s)?\s+(.+?) can be replaced with (.+)$/i,
    )
    if (scalingReplace) {
      const [, every, grant, fromText, tail] = scalingReplace
      const choices = list ? list.items.map(splitBundle) : [splitBundle(tail)]
      return makeRule({
        raw,
        scope: 'scaling',
        scaleEvery: parseInt(every),
        scaleGrant: parseInt(grant),
        kind: 'replace',
        fromWeapons: splitBundle(fromText),
        choices,
        exclusive: true,
        maxStack: 1,
        allowRepeatChoice: false,
      })
    }

    // ── "<subject> can (each) have its/their <weapon[s]> replaced with <...>" ──
    let m = head.match(/^(.+?) can (?:each )?have (?:its|their) (.+?) replaced with (.+)$/i)
    // ── "<subject> can have each <weapon> it is equipped with replaced with <...>" ──
    if (!m) m = head.match(/^(.+?) can have each (.+?) it is equipped with replaced with (.+)$/i)
    // ── "each of <subject>'s <weapon[s]> can be replaced with <...>" ──
    if (!m) {
      const eachOf = head.match(/^each of (.+?)[’'](?:s)?\s+(.+?) can be replaced with (.+)$/i)
      if (eachOf) m = eachOf
    }
    // ── "<subject>'s <weapon[s]> can be replaced with <...>" ──
    if (!m) m = head.match(/^(.+?)[’'](?:s)?\s+(.+?) can be replaced with (.+)$/i)
    // ── "<subject> can replace its/their <weapon[s]> with <...>" ──
    if (!m) m = head.match(/^(.+?) can replace (?:its|their) (.+?) with (.+)$/i)
    if (m) {
      const [, subjectRaw, fromText, tail] = m
      const { scope, roleName, fixedCount } = parseSubjectScope(subjectRaw, slots)
      const fromWeapons = splitBundle(fromText.replace(/\beach\b/i, '').trim())
      const choices = list ? list.items.map(splitBundle) : [splitBundle(tail)]
      return makeRule({
        raw,
        scope,
        roleName,
        fixedCount,
        kind: 'replace',
        fromWeapons,
        choices,
        exclusive: true,
        maxStack: 1,
        allowRepeatChoice: false,
      })
    }

    // ── "<subject> can (each) be equipped with up to N of the following[, ...duplicates...]: <ul>" ──
    m = head.match(new RegExp(`^(.+?) can(?: each)? be equipped with:?\\s*up to ${NUM_PATTERN} of the following\\b`, 'i'))
    if (m && list) {
      const [, subjectRaw, nStr] = m
      const { scope, roleName, fixedCount } = parseSubjectScope(subjectRaw, slots)
      const cannotDuplicate = /cannot take duplicate|cannot be equipped with duplicate/i.test(head)
      const allowRepeatChoice = !cannotDuplicate && /\bcan take duplicate/i.test(head)
      return makeRule({
        raw,
        scope,
        roleName,
        fixedCount,
        kind: 'add',
        fromWeapons: [],
        choices: list.items.map(splitBundle),
        exclusive: false,
        maxStack: parseCount(nStr),
        allowRepeatChoice,
      })
    }

    // ── "<subject> can be equipped with up to N <weapon>." (repeatable single weapon) ──
    m = head.match(new RegExp(`^(.+?) can be equipped with:?\\s*up to ${NUM_PATTERN} (.+)$`, 'i'))
    if (m) {
      const [, subjectRaw, nStr, weaponText] = m
      const { scope, roleName, fixedCount } = parseSubjectScope(subjectRaw, slots)
      return makeRule({
        raw,
        scope,
        roleName,
        fixedCount,
        kind: 'add',
        fromWeapons: [],
        choices: [splitBundle(weaponText)],
        exclusive: false,
        maxStack: parseCount(nStr),
        allowRepeatChoice: true,
      })
    }

    // ── "<subject> can be equipped with any of the following: <ul>" (independent adds) ──
    m = head.match(/^(.+?) can be equipped with:?\s*any of the following:?$/i)
    if (m && list) {
      const { scope, roleName, fixedCount } = parseSubjectScope(m[1], slots)
      return makeRule({
        raw,
        scope,
        roleName,
        fixedCount,
        kind: 'add',
        fromWeapons: [],
        choices: list.items.map(splitBundle),
        exclusive: false,
        maxStack: list.items.length,
        allowRepeatChoice: false,
      })
    }

    // ── "<subject> can be equipped with one of the following: <ul>" / "<subject> can be equipped with <weapon>." ──
    m = head.match(/^(.+?) can be equipped with:?\s*(?:one of the following:?|(.+))$/i)
    if (m) {
      const [, subjectRaw, inlineWeapon] = m
      const { scope, roleName, fixedCount } = parseSubjectScope(subjectRaw, slots)
      const choices = list ? list.items.map(splitBundle) : [splitBundle(inlineWeapon ?? '')]
      return makeRule({
        raw,
        scope,
        roleName,
        fixedCount,
        kind: 'add',
        fromWeapons: [],
        choices,
        exclusive: true,
        maxStack: 1,
        allowRepeatChoice: false,
      })
    }

    return makeRule({
      raw,
      scope: 'unparsed',
      kind: 'add',
      fromWeapons: [],
      choices: [],
      exclusive: true,
      maxStack: 1,
      allowRepeatChoice: false,
    })
  })
}

export function ruleEligibleCount(
  rule: WeaponOptionRule,
  roleCounts: Record<string, number>,
  totalModelCount: number,
): number {
  switch (rule.scope) {
    case 'role':
      return rule.roleName ? roleCounts[rule.roleName] ?? 0 : 0
    case 'fixed_count':
      return Math.min(rule.fixedCount ?? 0, rule.roleName ? roleCounts[rule.roleName] ?? 0 : totalModelCount)
    case 'scaling':
      return Math.floor(totalModelCount / (rule.scaleEvery || 1)) * (rule.scaleGrant ?? 0)
    case 'all_models':
      return totalModelCount
    case 'unparsed':
    default:
      return 0
  }
}
