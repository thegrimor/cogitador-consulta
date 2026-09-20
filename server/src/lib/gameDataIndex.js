// Loads public/data/*.json (the same files the frontend fetches over HTTP — see
// src/infrastructure/data/useGameData.ts) directly off disk and indexes them in memory, so the
// chat tools (chatTools.js) can look up datasheets/stratagems/rules/missions by name without
// shipping all ~15MB of game data into the model's context on every request.
//
// Loaded once at module init (top-level await-free — fs.readFileSync is fine for a one-time
// startup cost of a few hundred ms) and kept in memory for the life of the process. There's no
// mutation path, so no cache invalidation to worry about — a data edit just needs a server
// restart, same as any other change to public/data.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalize } from './textUtils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', '..', '..', 'public', 'data')

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, relPath), 'utf8'))
}

const factionsIndex = readJson('catalog/factions.json') // [{ id, name }]
const coreRulesCatalog = readJson('catalog/core-rules.json')
const phasesData = readJson('catalog/phases.json') // PhaseData[] — see src/types/index.ts
const missionsData = readJson('missions.json')

/** factionId -> raw faction JSON ({ id, name, armyRules, detachments, stratagems, enhancements, datasheets }) */
const factionsById = new Map()
for (const { id } of factionsIndex) {
  factionsById.set(id, readJson(`factions/${id}.json`))
}

function factionName(factionId) {
  return factionsById.get(factionId)?.name ?? factionId
}

// ── Faction inheritance ──────────────────────────────────────────────────────
// Mirrors src/core/constants/factionFamily.ts: the five Space Marines chapter factions hold
// only what their chapter adds, and field that plus the parent's content. The parent's own
// successor-chapter characters (Calgar and company) are the exception — they don't travel
// down, so the chat gives the same answer as the app about what a chapter can take.

const FACTION_PARENT = {
  'black-templars': 'space-marines',
  'blood-angels': 'space-marines',
  'dark-angels': 'space-marines',
  deathwatch: 'space-marines',
  'space-wolves': 'space-marines',
}

const SM_SUCCESSOR_CHAPTERS = [
  'Imperial Fists', 'Iron Hands', 'Raven Guard', 'Salamanders', 'Ultramarines', 'White Scars',
]

/** The faction ids whose content `factionId` can field: itself, then its parent if it has one. */
function factionFamily(factionId) {
  const parent = FACTION_PARENT[factionId]
  return parent ? [factionId, parent] : [factionId]
}

function isInheritedSuccessorCharacter(ds, fid, factionId) {
  return fid !== factionId &&
    (ds.factionKeywords ?? []).some(k => SM_SUCCESSOR_CHAPTERS.includes(k))
}

/** Concatenates one faction-scoped array across the family, own entries first. */
function acrossFamily(factionId, pick) {
  if (!factionsById.has(factionId)) return null
  return factionFamily(factionId).flatMap(fid => pick(factionsById.get(fid)) ?? [])
}

// ── Datasheets ───────────────────────────────────────────────────────────────

function* allDatasheetEntries(factionId) {
  const ids = factionId ? factionFamily(factionId) : [...factionsById.keys()]
  for (const fid of ids) {
    const faction = factionsById.get(fid)
    if (!faction) continue
    for (const ds of faction.datasheets) {
      if (factionId && isInheritedSuccessorCharacter(ds, fid, factionId)) continue
      yield { factionId: fid, ds }
    }
  }
}

export function listFactions() {
  return factionsIndex
}

export function searchDatasheets(query, factionId, limit = 20) {
  const q = normalize(query)
  const results = []
  for (const { factionId: fid, ds } of allDatasheetEntries(factionId)) {
    if (!normalize(ds.name).includes(q)) continue
    results.push({ id: ds.id, name: ds.name, factionId: fid, factionName: factionName(fid), role: ds.role })
    if (results.length >= limit) break
  }
  return results
}

export function getDatasheet(datasheetId) {
  for (const { factionId, ds } of allDatasheetEntries()) {
    if (ds.id === datasheetId) return { factionId, factionName: factionName(factionId), ...ds }
  }
  return null
}

// ── Detachments (and their abilities) ───────────────────────────────────────

export function getDetachments(factionId) {
  const detachments = acrossFamily(factionId, f => f.detachments)
  if (!detachments) return null
  return detachments.map(d => ({
    id: d.id,
    name: d.name,
    disposition: d.disposition,
    dp: d.dp,
    chapters: d.chapters,
    abilities: d.abilities,
  }))
}

// ── Stratagems / Enhancements / Army rules — faction-scoped, optionally by detachment ──

export function getStratagems(factionId, detachmentId) {
  const stratagems = acrossFamily(factionId, f => f.stratagems)
  if (!stratagems) return null
  return detachmentId ? stratagems.filter(s => s.detachmentId === detachmentId) : stratagems
}

export function getEnhancements(factionId, detachmentId) {
  const enhancements = acrossFamily(factionId, f => f.enhancements)
  if (!enhancements) return null
  return detachmentId ? enhancements.filter(e => e.detachmentId === detachmentId) : enhancements
}

export function getArmyRules(factionId) {
  return acrossFamily(factionId, f => f.armyRules)
}

export function getCoreStratagems() {
  return coreRulesCatalog.coreStratagems
}

// ── Universal combat effects — faction-agnostic rules with a real-combat-math effect (Cover,
// Heavy while stationary, ...). Small and fixed, so no search/paging needed. ────────────────

export function listUniversalEffects() {
  return coreRulesCatalog.coreRuleEffects
}

// ── Core rules glossary (weapon/unit abilities, concepts, phases) ──────────

export function searchCoreRules(query, limit = 15) {
  const q = normalize(query)
  return coreRulesCatalog.coreRules
    .filter(r => normalize(r.name).includes(q) || normalize(r.summary).includes(q))
    .slice(0, limit)
}

// ── Phases (the step-by-step sequence of play — Command/Movement/Shooting/Charge/Fight,
// terrain, objectives, stratagem timing, etc.) — distinct from the core-rules glossary above:
// this is procedure ("when does X happen"), that's terminology ("what does X mean"). ─────

export function listPhases() {
  return phasesData.map(p => ({ id: p.id, ref: p.ref, name: p.name, group: p.group, summary: p.summary }))
}

export function getPhase(phaseId) {
  return phasesData.find(p => p.id === phaseId || normalize(p.name) === normalize(phaseId)) ?? null
}

// ── Missions ─────────────────────────────────────────────────────────────

function flattenMissionCards(deckList) {
  const out = []
  for (const deck of deckList) {
    for (const card of deck.cards ?? []) out.push(card)
  }
  return out
}

export function searchMissions(query, limit = 10) {
  const q = normalize(query)
  const primary = flattenMissionCards(missionsData.primaryMissions).filter(
    c => normalize(c.name).includes(q),
  )
  const secondary = (missionsData.secondaryMissions ?? []).filter(c => normalize(c.name).includes(q))
  return {
    primary: primary.slice(0, limit),
    secondary: secondary.slice(0, limit),
  }
}

// Same cross-reference table MissionMatcherPage reads directly (missions.matrix.grid[own][opp])
// — which Force Disposition deck each player is on decides which Primary Mission card is in
// play. Deck-name matching is accent/case-insensitive since callers (including the model) won't
// always type it exactly as it appears in the grid.
export function getMissionMatchup(ownDeck, opponentDeck) {
  const { rows, columns, grid } = missionsData.matrix
  const matchedRow = rows.find(r => normalize(r) === normalize(ownDeck))
  const matchedCol = columns.find(c => normalize(c) === normalize(opponentDeck))
  return {
    decks: rows,
    missionName: matchedRow && matchedCol ? (grid[matchedRow]?.[matchedCol] ?? null) : null,
  }
}
