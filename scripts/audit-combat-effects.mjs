#!/usr/bin/env node
// One-off triage tool for the Mathhammer combat-effect data audit (see CLAUDE.md).
//
// Walks every public/data/factions/<slug>.json file and finds every entity that carries a
// combat `effect` (Ability/DetachmentAbility/Stratagem/Enhancement, plus each `options[].effect`
// variant) — datasheet abilities, army rules, detachment abilities, stratagems and enhancements
// — and dumps one Markdown file per faction with, for each: the bearer name, the ability/rule
// name, its `description` with HTML tags stripped, and the full `effect` JSON.
//
// This does NOT judge correctness itself — it only saves the manual "read every ability's real
// text next to its stored effect" step that was done by hand for Chaos Daemons/World Eaters/
// Adeptus Mechanicus/Space Marines/Necrons during the initial audit pass, so the same read-and-
// compare method can be repeated faction by faction without re-extracting each block from raw
// JSON every time.
//
// Usage: node scripts/audit-combat-effects.mjs [outDir] [--faction=<slug>,<slug>,...]
//   outDir defaults to ./audit-output (gitignored scratch dir, not meant to be committed)

import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, basename } from 'node:path'

const FACTIONS_DIR = new URL('../public/data/factions/', import.meta.url).pathname

const args = process.argv.slice(2)
const outDir = args.find(a => !a.startsWith('--')) ?? 'audit-output'
const factionFilter = args
  .find(a => a.startsWith('--faction='))
  ?.slice('--faction='.length)
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean)

function stripHtml(html) {
  if (!html) return ''
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/\s+/g, ' ')
    .trim()
}

/** One row per effect-bearing entity found. */
function collectEntries(data) {
  const entries = []

  function pushEntity(bearerName, entity, sourceLabel) {
    if (entity.effect) {
      entries.push({ bearer: bearerName, source: sourceLabel, name: entity.name, id: entity.id, description: entity.description, effect: entity.effect })
    }
    for (const opt of entity.options ?? []) {
      if (opt.effect) {
        entries.push({ bearer: bearerName, source: sourceLabel, name: `${entity.name} — ${opt.name}`, id: `${entity.id}::${opt.name}`, description: entity.description, effect: opt.effect })
      }
    }
  }

  for (const rule of data.armyRules ?? []) {
    pushEntity(data.name, rule, 'armyRule')
  }
  for (const det of data.detachments ?? []) {
    for (const ab of det.abilities ?? []) {
      pushEntity(`${det.name} (detachment)`, ab, 'detachmentAbility')
    }
  }
  for (const strat of data.stratagems ?? []) {
    pushEntity(strat.name, strat, 'stratagem')
  }
  for (const enh of data.enhancements ?? []) {
    pushEntity(enh.name, enh, 'enhancement')
  }
  for (const ds of data.datasheets ?? []) {
    for (const ab of ds.abilities ?? []) {
      pushEntity(ds.name, ab, 'datasheetAbility')
    }
  }

  return entries
}

function renderMarkdown(factionName, entries) {
  const lines = [`# ${factionName} — combat effect audit`, '', `${entries.length} entries with an \`effect\`.`, '']
  for (const e of entries) {
    lines.push(`## ${e.bearer} — ${e.name}`)
    lines.push(`- source: ${e.source}  ·  id: \`${e.id}\``)
    lines.push(`- text: ${stripHtml(e.description) || '(no description)'}`)
    lines.push('- effect:')
    lines.push('```json')
    lines.push(JSON.stringify(e.effect, null, 2))
    lines.push('```')
    lines.push('')
  }
  return lines.join('\n')
}

mkdirSync(outDir, { recursive: true })

const files = readdirSync(FACTIONS_DIR).filter(f => f.endsWith('.json'))
let totalEntries = 0

for (const file of files) {
  const slug = basename(file, '.json')
  if (factionFilter && !factionFilter.includes(slug)) continue

  const data = JSON.parse(readFileSync(join(FACTIONS_DIR, file), 'utf8'))
  const entries = collectEntries(data)
  totalEntries += entries.length

  const outPath = join(outDir, `${slug}.md`)
  writeFileSync(outPath, renderMarkdown(data.name ?? slug, entries), 'utf8')
  console.log(`${slug}: ${entries.length} entries -> ${outPath}`)
}

console.log(`\nTotal: ${totalEntries} entries across ${factionFilter ? factionFilter.length : files.length} faction file(s).`)
