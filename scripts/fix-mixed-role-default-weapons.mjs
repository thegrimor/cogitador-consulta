#!/usr/bin/env node
// One-off migration: authors `defaultWeaponGroups` (see its doc comment in src/types/index.ts)
// for every datasheet whose sub-roles carry different base wargear (e.g. Dark Angels' Deathwing
// Knights: 1 Knight Master with a great weapon, 4 Deathwing Knights with a mace).
//
// Without this field, resolveWeaponQuantities (src/core/utils/roster.ts) multiplies every
// defaultWeaponNames entry by the unit's whole modelCount, so a mixed-role unit showed the full
// squad size (x5) for *every* weapon regardless of who actually carries it — confirmed wrong
// against the official app for Deathwing Knights (1/4, not 5/5).
//
// This script reads each datasheet's own free-text `loadout` field ONCE, here, to derive the
// per-role/per-individual weapon breakdown, and writes it into the JSON as plain, static data —
// deliberately NOT a runtime parser: the app should never need to re-guess this from prose on
// every render, and CLAUDE.md's own rule is "the JSON *is* the source of truth", edited directly,
// not generated on the fly. This script exists only to do that one-time reading faster than
// typing ~300 JSON objects by hand; every datasheet it touches should still be spot-checked.
//
// It only ever WRITES a datasheet's `defaultWeaponGroups` when every one of its `defaultWeaponNames`
// entries is covered by a resolved group — a partial write would silently drop an unresolved
// weapon from the roster's weapon table entirely, which is worse than the existing (safe, if
// imprecise for mixed units) flat modelCount fallback. Datasheets it can't fully resolve are left
// untouched and printed in the "NEEDS MANUAL REVIEW" report at the end.
//
// Usage: node scripts/fix-mixed-role-default-weapons.mjs [--dry]

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const FACTIONS_DIR = new URL('../public/data/factions/', import.meta.url).pathname
const dry = process.argv.includes('--dry')

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ── Mirrors src/core/utils/weaponOptions.ts's parseUnitSlots/resolveRoleCounts/matchRole ──
// (kept as a plain-JS copy here since this is a standalone one-off script, not app code) ──

function parseUnitSlots(compositionLines) {
  const orIdx = compositionLines.findIndex(l => stripHtml(l).toUpperCase() === 'OR')
  const relevant = orIdx >= 0 ? compositionLines.slice(0, orIdx) : compositionLines
  const slots = []
  for (const line of relevant) {
    const clean = stripHtml(line)
    for (const part of clean.split(/,\s*|\s+and\s+/i)) {
      const segment = part.trim().replace(/\.+$/, '')
      const rangeMatch = segment.match(/^(\d+)\s*[-‑–—]\s*(\d+)\s+(.+)$/)
      const singleMatch = segment.match(/^(\d+)\s+(.+)$/)
      if (rangeMatch) {
        const role = rangeMatch[3].trim()
        if (/^models?(\s+maximum)?$/i.test(role)) continue
        slots.push({ role, min: parseInt(rangeMatch[1], 10), max: parseInt(rangeMatch[2], 10) })
      } else if (singleMatch) {
        const role = singleMatch[2].trim()
        if (/^models?(\s+maximum)?$/i.test(role)) continue
        const n = parseInt(singleMatch[1], 10)
        slots.push({ role, min: n, max: n })
      }
    }
  }
  return slots
}

function matchRole(text, slots) {
  let norm = text.trim().replace(/^(the|this|every|all( of the)?|any number(?:s)? of|each|up to \d+|one)\s+/i, '').trim()
  norm = norm.replace(/[’']s$/i, '').trim().toLowerCase()
  const exact = slots.find(s => s.role.toLowerCase() === norm)
  if (exact) return exact.role
  const singularize = s =>
    /ies$/i.test(s) ? s.slice(0, -3) + 'y' : /men$/i.test(s) ? s.slice(0, -3) + 'man' : s.replace(/s$/i, '')
  const noS = singularize(norm)
  const byStem = slots.find(s => singularize(s.role.toLowerCase()) === noS)
  if (byStem) return byStem.role
  // A role's plural "s" can land on an earlier word than the last ("Sisters Repentia", not
  // "Repentias") - singularizing word-by-word catches that shape the whole-string singularize
  // above can't.
  const singularizeEachWord = s => s.split(' ').map(singularize).join(' ')
  const byWordStem = slots.find(s => singularizeEachWord(s.role.toLowerCase()) === singularizeEachWord(norm))
  if (byWordStem) return byWordStem.role
  // "-ves" plurals ("knives"->"knife", "wolves"->"wolf") are ambiguous to reverse without a
  // dictionary, so try both candidate singular forms per word and accept either matching.
  const wordCandidates = w => (/ves$/i.test(w) ? [singularize(w), w.slice(0, -3) + 'fe', w.slice(0, -3) + 'f'] : [singularize(w)])
  const wordsMatch = (a, b) => wordCandidates(a).some(c => wordCandidates(b).includes(c))
  const byVesStem = slots.find(s => {
    const roleWords = s.role.toLowerCase().split(' ')
    const normWords = norm.split(' ')
    return roleWords.length === normWords.length && roleWords.every((w, i) => wordsMatch(w, normWords[i]))
  })
  if (byVesStem) return byVesStem.role
  // A unit-composition role name often carries a trailing "model(s)" the loadout's own subject
  // text may lack (or vice versa) - e.g. "Sternguard Veteran Sergeant model" vs "Sternguard
  // Veteran models". Comparing with that suffix stripped from both sides disambiguates a leader
  // role whose name would otherwise substring-match the plain troop role below.
  const stripModelSuffix = s => s.replace(/\s+models?$/i, '')
  const normNoModel = singularizeEachWord(stripModelSuffix(norm))
  const byModelStrippedStem = slots.find(s => singularizeEachWord(stripModelSuffix(s.role.toLowerCase())) === normNoModel)
  if (byModelStrippedStem) return byModelStrippedStem.role
  const candidates = slots.filter(s => norm.includes(s.role.toLowerCase()) || s.role.toLowerCase().includes(norm))
  if (candidates.length === 1) return candidates[0].role
  return undefined
}

// ── Loadout -> groups ────────────────────────────────────────────────────────────────────

/** Parses one datasheet's free-text `loadout` into `DefaultWeaponGroup[]`, or returns null if
 * any line/weapon can't be confidently resolved (caller must not write a partial result). */
function parseLoadoutGroups(loadoutHtml, slots, defaultWeaponNames) {
  const groups = []
  const covered = new Set()

  for (const line of loadoutHtml.split(/<br\s*\/?>/i)) {
    const clean = stripHtml(line)
    if (!clean) continue
    const m = clean.match(/^(.+?) (?:is|are) equipped with:?\s*(.+?)\.?$/i)
    // A loadout field can carry a trailing/leading reminder sentence that isn't a wargear clause
    // at all (e.g. "This unit can have up to two Leader units attached to it..."). Skip it rather
    // than failing the whole datasheet - the coverage check below still catches a real miss.
    if (!m) continue
    const [, subjectRaw, weaponListRaw] = m
    const subject = subjectRaw.trim()

    const weapons = []
    for (const part of weaponListRaw.split(';')) {
      const trimmed = part.trim()
      if (!trimmed) continue
      const cm = trimmed.match(/^(\d+)\s+(.+)$/)
      const count = cm ? parseInt(cm[1], 10) : 1
      const name = (cm ? cm[2] : trimmed).trim().toLowerCase()
      if (!name) continue
      weapons.push({ name, count })
      covered.add(name)
    }
    if (weapons.length === 0) continue

    const literalDigit = subject.match(/^(\d+)\s+(?:other\s+)?(.+)$/i)
    const literalWord = subject.match(/^one\s+(?:other\s+)?(.+)$/i)
    if (literalDigit) {
      groups.push({ fixedCount: parseInt(literalDigit[1], 10), weapons })
      continue
    }
    if (literalWord) {
      groups.push({ fixedCount: 1, weapons })
      continue
    }
    const subjectNorm = subject.replace(/^(the|this|every|all( of the)?|each)\s+/i, '').trim().toLowerCase()
    if (/^(other )?models?$/.test(subjectNorm)) {
      return { error: `"every model"/"every other model" (whole-unit-relative, not a named role) - needs manual review: ${JSON.stringify(clean)}` }
    }
    // "Every X and Y is equipped with..." names two distinct roles sharing one loadout (e.g.
    // Imperial Agents' "Every Proctor-Vigilant and Vigilant..."). Only split this way when BOTH
    // sides independently resolve to a *different* role - otherwise leave it for manual review
    // rather than guess (e.g. "The Kill Team Sergeant and every Kill Team Intercessor" combines
    // with other clauses for the same base role and needs to be read as a whole).
    const andParts = subject.replace(/^(the|every)\s+/i, '').split(/\s+and\s+/i)
    if (andParts.length === 2) {
      const rolesOfParts = andParts.map(p => matchRole(p.replace(/\s+models?$/i, ''), slots))
      if (rolesOfParts[0] && rolesOfParts[1] && rolesOfParts[0] !== rolesOfParts[1]) {
        groups.push({ role: rolesOfParts[0], weapons })
        groups.push({ role: rolesOfParts[1], weapons })
        continue
      }
    }
    const role = matchRole(subject.replace(/\s+models?$/i, ''), slots)
    if (!role) return { error: `couldn't resolve subject "${subject}" to a unitComposition role` }
    groups.push({ role, weapons })
  }

  const uncovered = defaultWeaponNames.filter(w => !covered.has(w.name.toLowerCase()))
  if (uncovered.length > 0) {
    return { error: `defaultWeaponNames not covered by any parsed group: ${uncovered.map(w => w.name).join(', ')}` }
  }
  if (groups.length === 0) return { error: 'no groups parsed at all' }
  return { groups }
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────

const files = readdirSync(FACTIONS_DIR).filter(f => f.endsWith('.json'))
let fixedCount = 0
const needsReview = []

for (const file of files) {
  const path = join(FACTIONS_DIR, file)
  const raw = readFileSync(path, 'utf8')
  const data = JSON.parse(raw)
  let changed = false

  for (const ds of data.datasheets ?? []) {
    if (!ds.loadout) continue
    const equippedClauses = ds.loadout.match(/is equipped with|are equipped with/gi)
    if (!equippedClauses || equippedClauses.length <= 1) continue // uniform loadout, no groups needed

    const slots = parseUnitSlots(ds.unitComposition)
    if (slots.length < 2) continue // no distinct sub-roles to split by

    const result = parseLoadoutGroups(ds.loadout, slots, ds.defaultWeaponNames)
    if (result.error) {
      needsReview.push({ file, name: ds.name, reason: result.error })
      continue
    }

    ds.defaultWeaponGroups = result.groups
    changed = true
    fixedCount++
  }

  if (changed && !dry) {
    writeFileSync(path, JSON.stringify(data, null, 2) + '\n')
  }
}

console.log(`${dry ? '[dry run] would fix' : 'Fixed'} ${fixedCount} datasheet(s) with defaultWeaponGroups.`)
console.log(`\n${needsReview.length} datasheet(s) still need manual review:\n`)
for (const { file, name, reason } of needsReview) {
  console.log(`  ${file} :: ${name}\n    ${reason}`)
}
