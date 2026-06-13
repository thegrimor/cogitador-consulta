#!/usr/bin/env node
// Data integrity check for WH40K CSV files
import { readFileSync } from 'fs'
import { join } from 'path'

const DATA_DIR = '/home/user/cogitador-consulta/public/data'

function readCsv(filename) {
  const raw = readFileSync(join(DATA_DIR, filename), 'utf-8').replace(/^﻿/, '')
  const lines = raw.split('\n').filter(l => l.trim())
  const headers = lines[0].split('|').map(h => h.trim())
  return lines.slice(1).map(line => {
    const vals = line.split('|')
    const row = {}
    headers.forEach((h, i) => { row[h] = (vals[i] ?? '').trim() })
    return row
  })
}

const issues = []
function issue(category, msg, examples = []) {
  issues.push({ category, msg, examples })
}

// ── Load all CSVs ─────────────────────────────────────────────────────────────
const factions        = readCsv('Factions.csv')
const datasheets      = readCsv('Datasheets.csv')
const models          = readCsv('Datasheets_models.csv')
const wargear         = readCsv('Datasheets_wargear.csv')
const dsAbilities     = readCsv('Datasheets_abilities.csv')
const abilities       = readCsv('Abilities.csv')
const detachments     = readCsv('Detachments.csv')
const detachAbils     = readCsv('Detachment_abilities.csv')
const stratagems      = readCsv('Stratagems.csv')
const dsStratagems    = readCsv('Datasheets_stratagems.csv')
const keywords        = readCsv('Datasheets_keywords.csv')
const unitComp        = readCsv('Datasheets_unit_composition.csv')
const leaders         = readCsv('Datasheets_leader.csv')

// ── Build ID sets ─────────────────────────────────────────────────────────────
const factionIds   = new Set(factions.map(r => r.id))
const datasheetIds = new Set(datasheets.map(r => r.id))
const abilityIds   = new Set(abilities.map(r => r.id))
const detachIds    = new Set(detachments.map(r => r.id))
const stratagemIds = new Set(stratagems.map(r => r.id))

// ── Helper ────────────────────────────────────────────────────────────────────
function checkFk(rows, sourceFile, idField, targetSet, targetFile, label) {
  const bad = rows.filter(r => r[idField] && !targetSet.has(r[idField]))
  if (bad.length)
    issue('Referencias rotas', `${sourceFile}.${idField} → ${targetFile}: ${bad.length} refs inválidas`, bad.slice(0, 5).map(r => r[idField]))
  else
    console.log(`  ✓ ${label}`)
}

function checkEmpty(rows, file, field, critical = true) {
  const bad = rows.filter(r => !r[field] || r[field].trim() === '')
  if (bad.length)
    issue(critical ? 'Campos críticos vacíos' : 'Campos opcionales vacíos',
      `${file}.${field}: ${bad.length} filas vacías`,
      bad.slice(0, 5).map(r => JSON.stringify(r)))
  else
    console.log(`  ✓ ${file}.${field} no tiene vacíos`)
}

// Basic HTML well-formedness: check for unclosed tags (opener without closer)
function checkHtml(rows, file, field) {
  const openTag = /<([a-zA-Z]+)[^>]*>/g
  const closeTag = /<\/([a-zA-Z]+)>/g
  const badRows = []
  for (const row of rows) {
    const html = row[field] || ''
    if (!html.includes('<')) continue
    const opens = [...html.matchAll(openTag)].map(m => m[1].toLowerCase()).filter(t => !['br','li'].includes(t))
    const closes = [...html.matchAll(closeTag)].map(m => m[1].toLowerCase())
    // simple count check (not a full parser)
    const openCounts = {}
    const closeCounts = {}
    opens.forEach(t => { openCounts[t] = (openCounts[t] || 0) + 1 })
    closes.forEach(t => { closeCounts[t] = (closeCounts[t] || 0) + 1 })
    for (const tag of Object.keys(openCounts)) {
      if ((openCounts[tag] || 0) !== (closeCounts[tag] || 0))
        badRows.push({ tag, open: openCounts[tag], close: closeCounts[tag] || 0, name: row.name || row.id })
    }
  }
  if (badRows.length)
    issue('HTML mal formado', `${file}.${field}: ${badRows.length} entradas con tags desbalanceados`, badRows.slice(0, 5))
  else
    console.log(`  ✓ ${file}.${field} HTML bien formado`)
}

// ── 1. Foreign key checks ─────────────────────────────────────────────────────
console.log('\n── Comprobaciones de integridad referencial ──')
checkFk(datasheets,   'Datasheets',          'faction_id',    factionIds,   'Factions',   'Datasheets → Factions')
checkFk(models,       'Datasheets_models',   'datasheet_id',  datasheetIds, 'Datasheets', 'Models → Datasheets')
checkFk(wargear,      'Datasheets_wargear',  'datasheet_id',  datasheetIds, 'Datasheets', 'Wargear → Datasheets')
checkFk(dsAbilities,  'Datasheets_abilities','datasheet_id',  datasheetIds, 'Datasheets', 'DS_Abilities → Datasheets')
checkFk(keywords,     'Datasheets_keywords', 'datasheet_id',  datasheetIds, 'Datasheets', 'Keywords → Datasheets')
checkFk(unitComp,     'Datasheets_unitcomp', 'datasheet_id',  datasheetIds, 'Datasheets', 'UnitComp → Datasheets')
checkFk(dsStratagems, 'Datasheets_stratagem','datasheet_id',  datasheetIds, 'Datasheets', 'DS_Stratagems.datasheet → Datasheets')
checkFk(dsStratagems, 'Datasheets_stratagem','stratagem_id',  stratagemIds, 'Stratagems', 'DS_Stratagems.stratagem → Stratagems')
checkFk(detachAbils,  'Detachment_abilities','detachment_id', detachIds,    'Detachments','DetachAbils → Detachments')
checkFk(leaders,      'Datasheets_leader',   'leader_id',     datasheetIds, 'Datasheets', 'Leader.leader → Datasheets')
checkFk(leaders,      'Datasheets_leader',   'attached_id',   datasheetIds, 'Datasheets', 'Leader.attached → Datasheets')

// ability_id in DS_abilities (when not empty) → Abilities
const dsAbilWithId = dsAbilities.filter(r => r.ability_id && r.ability_id.trim() !== '')
checkFk(dsAbilWithId, 'Datasheets_abilities','ability_id',    abilityIds,   'Abilities',  'DS_Abilities.ability_id → Abilities')

// stratagems.detachment_id (when not empty) → Detachments
const stratsWithDet = stratagems.filter(r => r.detachment_id && r.detachment_id.trim() !== '')
checkFk(stratsWithDet,'Stratagems',          'detachment_id', detachIds,    'Detachments','Stratagems.detachment_id → Detachments')

// ── 2. Empty critical fields ──────────────────────────────────────────────────
console.log('\n── Campos vacíos ──')
checkEmpty(datasheets,  'Datasheets',          'name')
checkEmpty(datasheets,  'Datasheets',          'faction_id')
checkEmpty(wargear,     'Datasheets_wargear',  'name')
checkEmpty(abilities,   'Abilities',           'name')
checkEmpty(abilities,   'Abilities',           'description')
checkEmpty(stratagems,  'Stratagems',          'name')
checkEmpty(stratagems,  'Stratagems',          'description')
checkEmpty(detachments, 'Detachments',         'name')
checkEmpty(keywords,    'Datasheets_keywords', 'keyword')

// ── 3. HTML integrity ─────────────────────────────────────────────────────────
console.log('\n── HTML en descripciones ──')
checkHtml(abilities,   'Abilities',              'description')
checkHtml(dsAbilities, 'Datasheets_abilities',   'description')
checkHtml(detachAbils, 'Detachment_abilities',   'description')
checkHtml(stratagems,  'Stratagems',             'description')
checkHtml(datasheets,  'Datasheets',             'loadout')

// ── 4. Duplicados en Datasheets_keywords ──────────────────────────────────────
console.log('\n── Duplicados ──')
const kwSeen = new Set()
const kwDups = []
for (const row of keywords) {
  const key = `${row.datasheet_id}|${row.keyword}`
  if (kwSeen.has(key)) kwDups.push(key)
  kwSeen.add(key)
}
if (kwDups.length)
  issue('Duplicados', `Datasheets_keywords: ${kwDups.length} pares (datasheet_id|keyword) duplicados`, kwDups.slice(0, 5))
else
  console.log('  ✓ Datasheets_keywords sin duplicados')

// ── 5. Datasheets sin armas ni modelos ────────────────────────────────────────
console.log('\n── Datasheets incompletos ──')
const dsWithWeapons  = new Set(wargear.map(r => r.datasheet_id))
const dsWithModels   = new Set(models.map(r => r.datasheet_id))
const dsWithAbils    = new Set(dsAbilities.map(r => r.datasheet_id))

const noWeapons = datasheets.filter(r => !dsWithWeapons.has(r.id))
const noModels  = datasheets.filter(r => !dsWithModels.has(r.id))
const noAbils   = datasheets.filter(r => !dsWithAbils.has(r.id))

if (noWeapons.length) issue('Datasheets incompletos', `${noWeapons.length} datasheets sin armas`, noWeapons.slice(0, 5).map(r => `${r.id} ${r.name}`))
else console.log('  ✓ Todos los datasheets tienen armas')
if (noModels.length)  issue('Datasheets incompletos', `${noModels.length} datasheets sin perfiles de modelo`, noModels.slice(0, 5).map(r => `${r.id} ${r.name}`))
else console.log('  ✓ Todos los datasheets tienen modelos')
if (noAbils.length)   issue('Datasheets incompletos', `${noAbils.length} datasheets sin habilidades`, noAbils.slice(0, 5).map(r => `${r.id} ${r.name}`))
else console.log('  ✓ Todos los datasheets tienen habilidades')

// ── 6. Datasheets_leader no cargado en la app ────────────────────────────────
console.log('\n── Archivos no cargados en la app ──')
issue('Archivo no cargado', 'Datasheets_leader.csv existe en /public/data/ pero NO se carga en useGameData.ts', [`${leaders.length} relaciones líder→unidad ignoradas`])
console.log(`  ⚠ Datasheets_leader.csv: ${leaders.length} filas no usadas`)

// ── 7. Facciones sin datasheets ───────────────────────────────────────────────
console.log('\n── Facciones ──')
const factionsWithDs = new Set(datasheets.map(r => r.faction_id))
const emptyFactions  = factions.filter(r => !factionsWithDs.has(r.id))
if (emptyFactions.length) issue('Facciones sin datasheets', `${emptyFactions.length} facciones sin ningún datasheet`, emptyFactions.map(r => `${r.id} ${r.name}`))
else console.log('  ✓ Todas las facciones tienen datasheets')

// ── REPORT ────────────────────────────────────────────────────────────────────
console.log('\n\n══════════════════════════════════════════════')
console.log('INFORME DE DISCREPANCIAS')
console.log('══════════════════════════════════════════════')

if (issues.length === 0) {
  console.log('\n✓ No se encontraron discrepancias.')
} else {
  const byCategory = {}
  for (const iss of issues) {
    if (!byCategory[iss.category]) byCategory[iss.category] = []
    byCategory[iss.category].push(iss)
  }
  for (const [cat, items] of Object.entries(byCategory)) {
    console.log(`\n## ${cat}`)
    for (const item of items) {
      console.log(`  • ${item.msg}`)
      if (item.examples.length) {
        console.log('    Ejemplos:')
        item.examples.forEach(e => console.log(`      - ${typeof e === 'object' ? JSON.stringify(e) : e}`))
      }
    }
  }
}

console.log(`\nTotal: ${issues.length} categorías de problemas encontradas.`)
