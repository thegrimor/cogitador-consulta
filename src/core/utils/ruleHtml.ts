import type { CoreRule, Datasheet, Faction } from '@/types'
import { factionPath, datasheetPath } from '@/core/constants/routes'
import { factionColor } from '@/core/constants/factionColors'
import { DECK_COLORS } from '@/core/constants/missionDeckColors'

/**
 * Post-processes the raw `wh-html` description strings (stratagems, abilities, rules,
 * missions) to turn things that were previously just inert bold/keyword text into something
 * actually useful, without touching the source JSON:
 *
 * 1. `[BRACKETED ABILITY]` mentions (e.g. "[SUSTAINED HITS 1]", "[LETHAL HITS]" — over 1000
 *    occurrences across the faction data, same vocabulary as the weapon-table `RuleBadge`s in
 *    DatasheetDetailPage) get the same rule-badge treatment plus a native `title` tooltip with
 *    the rule's summary, instead of rendering as plain bracket text.
 * 2. A run of consecutive `.kwb`-wrapped words that spells out a known faction's name (e.g.
 *    `<span class="kwb">ADEPTUS</span> <span class="kwb">CUSTODES</span>`) becomes a link to
 *    that faction's catalog page, colored with THAT faction's own fixed color (see
 *    factionColors.ts) — only for text the data already highlighted, not every plain-text
 *    mention, so this doesn't turn ordinary prose into a link farm.
 * 3. A plain-text mention of a datasheet's name — unit names aren't pre-highlighted in the
 *    data the way faction names sometimes are (e.g. "Allarus Custodians or Aquilon Custodians
 *    unit from your battlefield", no markup at all) — becomes a link to that unit's page,
 *    colored with its FACTION's fixed color (a unit doesn't have its own — it's a member of
 *    a faction). Scoped to the current `factionId` (see RuleHtml's prop), not matched against
 *    all ~800 datasheets in the game: an Adeptus Custodes stratagem should only ever try to
 *    match Custodes' own ~20 units, both for correctness (never links a Sororitas unit that
 *    happens to share wording with a Custodes one) and so the search stays small.
 * 4. A standalone `.kwb` word naming a battlefield-role keyword (CHARACTER, INFANTRY,
 *    VEHICLE...) gets `.kw-unit`, a theme-relative accent distinct from both of the above.
 * 5. A plain-text mention of one of the 5 primary-mission-deck names ("Take and Hold",
 *    "Purge the Foe"...) gets that deck's fixed color (DECK_COLORS, same table the mission
 *    pages already use) — colored only, not linked, since there's no single natural page a
 *    bare deck mention should point at.
 *
 * (1), (2) and (3) use `data-nav`/native `title` rather than embedded React components
 * because this runs on a raw HTML string for `dangerouslySetInnerHTML` — `RuleHtml` (the
 * component that calls this) intercepts clicks on `[data-nav]` to route client-side instead
 * of hard-navigating.
 */

// Battlefield-role / unit-type keywords — the standard 40k vocabulary for "what kind of unit
// is this", as opposed to a named ability or a faction name. Checked against actual usage
// (grep across every faction's .kwb spans) rather than assumed from memory; weapon-ability
// terms (ASSAULT, HEAVY, SUSTAINED HITS...) essentially never appear as bare .kwb spans in
// the data — they're expressed as [BRACKETED] text instead, which linkifyAbilityBrackets
// already handles, so there's no separate "weapon .kwb" list to build here.
const UNIT_TYPE_KEYWORDS = new Set([
  'CHARACTER', 'INFANTRY', 'VEHICLE', 'VEHICLES', 'MONSTER', 'MONSTERS', 'TRANSPORT',
  'DEDICATED', 'BATTLELINE', 'AIRCRAFT', 'TITANIC', 'FORTIFICATION', 'FLY', 'PSYKER',
  'WARLORD', 'OFFICER', 'HERO', 'EPIC', 'MOUNTED', 'WALKER', 'DAEMON', 'SWARM',
])

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function findCoreRule(term: string, coreRulesMap: Record<string, CoreRule>): CoreRule | undefined {
  const key = term.toLowerCase()
  return coreRulesMap[key] ?? Object.values(coreRulesMap).find(r => key.startsWith(r.name.toLowerCase()))
}

function linkifyAbilityBrackets(html: string, coreRulesMap: Record<string, CoreRule>): string {
  return html.replace(/\[([A-Z][A-Z0-9 ]*)\]/g, (full, term: string) => {
    const rule = findCoreRule(term, coreRulesMap)
    if (!rule) return full
    const tooltip = escapeAttr(rule.summary || stripHtml(rule.description))
    return `<span class="rule-badge" title="${tooltip}">${term}</span>`
  })
}

// A faction name isn't consistently marked up the same way across content types — stratagem
// text tends to wrap it word-by-word (`<span class="kwb">ADEPTUS</span>
// <span class="kwb">CUSTODES</span>`), enhancement text often just writes it as plain prose
// ("Adeptus Custodes Infantry model only."). Each word here matches either form, so one
// pattern covers both instead of only ever catching the pre-highlighted case.
// The bare-word branch gets its own \b boundaries (so "Ork" doesn't match inside "Orkish");
// the kwb-tag branch doesn't need them — it's already unambiguously delimited by the literal
// tag characters, and a trailing \b right after `</span>`'s `>` (a non-word char) would fail
// to assert a boundary at all when the next character is also non-word (e.g. a following
// space), silently breaking every kwb-wrapped match.
function wordOrKwbSpan(word: string): string {
  return `(?:<span class="kwb">${word}</span>|\\b${word}\\b)`
}

function linkifyFactionKeywords(html: string, factions: Faction[]): string {
  // Longest name (by word count) first, so e.g. "Adeptus Custodes" is tried before a
  // shorter alternative could partially match inside it at the same position.
  const candidates = [...factions]
    .filter(f => f.name.trim())
    .sort((a, b) => b.name.split(/\s+/).length - a.name.split(/\s+/).length)

  if (candidates.length === 0) return html

  const alternatives = candidates.map(f => {
    const words = f.name.trim().split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    return { factionId: f.id, pattern: words.map(wordOrKwbSpan).join('\\s*') }
  })

  const combined = new RegExp(alternatives.map(a => `(${a.pattern})`).join('|'), 'gi')

  return html.replace(combined, (full, ...groups) => {
    const matchedIndex = groups.findIndex((g, i) => g !== undefined && i < alternatives.length)
    const faction = matchedIndex >= 0 ? candidates[matchedIndex] : undefined
    if (!faction) return full
    const colorClass = factionColor(faction.id)?.text ?? ''
    return `<a href="${factionPath(faction.id)}" data-nav="${factionPath(faction.id)}" class="kwb-link ${colorClass}">${full}</a>`
  })
}

// Runs after linkifyFactionKeywords, so a faction-name word already wrapped in <a
// class="kwb-link"> keeps that color — UNIT_TYPE_KEYWORDS has no overlap with any faction
// name's words (checked), so this only ever matches spans linkifyFactionKeywords left alone.
function classifyUnitKeywords(html: string): string {
  return html.replace(/<span class="kwb">([A-Z][A-Z]*)<\/span>/g, (full, word: string) => {
    if (!UNIT_TYPE_KEYWORDS.has(word)) return full
    return `<span class="kwb kw-unit">${word}</span>`
  })
}

function linkifyUnitNames(html: string, datasheets: Datasheet[], factionId: string | undefined): string {
  if (!factionId) return html
  const colors = factionColor(factionId)
  if (!colors) return html

  // Longest name first, same reasoning as linkifyFactionKeywords — e.g. "Custodian Guard"
  // tried before a shorter name that happens to be one of its words.
  const candidates = datasheets
    .filter(d => d.factionId === factionId && d.name.trim())
    .sort((a, b) => b.name.length - a.name.length)

  if (candidates.length === 0) return html

  const pattern = candidates.map(d => d.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  // Case-insensitive: the JSON data is not internally consistent about capitalizing
  // hyphenated ranks/proper nouns (e.g. a datasheet named "Shield-captain" while every
  // ability that references it writes "Shield-Captain") — matching case-sensitively missed
  // every one of those. `full` (not `matched`) is used in the replacement, so the prose's own
  // casing is what actually renders — this only affects which datasheet gets found, not what
  // text is shown.
  const re = new RegExp(`\\b(${pattern})\\b`, 'gi')

  return html.replace(re, (full, matched: string) => {
    // Skip a match already sitting inside markup we generated (an href, a title attribute,
    // an already-linked faction name) — cheap guard: only substitute plain text matches by
    // checking the exact-name lookup succeeds, which it always will for a genuine match;
    // the regex itself only targets word-bounded plain text, not attribute values, since
    // datasheet names don't appear inside this function's own generated hrefs/titles.
    const ds = candidates.find(d => d.name.toLowerCase() === matched.toLowerCase())
    if (!ds) return full
    return `<a href="${datasheetPath(ds.id)}" data-nav="${datasheetPath(ds.id)}" class="kwb-link ${colors.text}">${full}</a>`
  })
}

// The 5 Force Disposition / primary-mission-deck names — DECK_COLORS is keyed by slug
// ("take-and-hold"), so this is the display-name side of that same table, colored (not
// linked: there's no single natural page a bare mission-deck mention should point at, unlike
// a faction or a unit). Runs unconditionally, not scoped to a factionId — a deck name isn't
// tied to any one faction.
const DECK_NAMES: Record<string, string> = {
  'take and hold': 'take-and-hold',
  'purge the foe': 'purge-the-foe',
  disruption: 'disruption',
  reconnaissance: 'reconnaissance',
  'priority assets': 'priority-assets',
}

// "Disruption" alone is also plain English and part of at least one unrelated ability name in
// the data ("Psychostatic Disruption") — true if `text` right before `offset` ends with
// another Capitalized word (i.e. this match is part of a longer compound name). A regex
// lookbehind can't do this case-sensitive check on its own match: the /i flag needed for the
// deck-name alternation itself also makes [A-Z] in a lookbehind match lowercase letters,
// silently matching (and blocking) almost everything preceded by any word at all.
function precededByCapitalizedWord(text: string, offset: number): boolean {
  const before = text.slice(0, offset)
  return /[A-Z][a-zA-Z]*\s$/.test(before)
}

function colorizeMissionDecks(html: string): string {
  const pattern = Object.keys(DECK_NAMES)
    .sort((a, b) => b.length - a.length)
    .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  const re = new RegExp(`\\b(${pattern})\\b`, 'gi')

  return html.replace(re, (full, matched: string, offset: number, string: string) => {
    if (precededByCapitalizedWord(string, offset)) return full
    const slug = DECK_NAMES[matched.toLowerCase()]
    const colors = slug ? DECK_COLORS[slug] : undefined
    if (!colors) return full
    return `<span class="${colors.text}">${full}</span>`
  })
}

export function enrichRuleHtml(
  html: string,
  factions: Faction[],
  coreRulesMap: Record<string, CoreRule>,
  datasheets: Datasheet[] = [],
  factionId?: string,
): string {
  const withBadges = linkifyAbilityBrackets(html, coreRulesMap)
  const withFactionLinks = linkifyFactionKeywords(withBadges, factions)
  const withUnitLinks = linkifyUnitNames(withFactionLinks, datasheets, factionId)
  const withDeckColors = colorizeMissionDecks(withUnitLinks)
  return classifyUnitKeywords(withDeckColors)
}
