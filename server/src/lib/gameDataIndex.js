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

// ── Datasheets ───────────────────────────────────────────────────────────────

function* allDatasheetEntries(factionId) {
  const ids = factionId ? [factionId] : [...factionsById.keys()]
  for (const fid of ids) {
    const faction = factionsById.get(fid)
    if (!faction) continue
    for (const ds of faction.datasheets) yield { factionId: fid, ds }
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
  const faction = factionsById.get(factionId)
  if (!faction) return null
  return faction.detachments.map(d => ({
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
  const faction = factionsById.get(factionId)
  if (!faction) return null
  return detachmentId
    ? faction.stratagems.filter(s => s.detachmentId === detachmentId)
    : faction.stratagems
}

export function getEnhancements(factionId, detachmentId) {
  const faction = factionsById.get(factionId)
  if (!faction) return null
  return detachmentId
    ? faction.enhancements.filter(e => e.detachmentId === detachmentId)
    : faction.enhancements
}

export function getArmyRules(factionId) {
  const faction = factionsById.get(factionId)
  if (!faction) return null
  return faction.armyRules
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
