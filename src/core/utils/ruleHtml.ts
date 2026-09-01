import type { CoreRule, Faction } from '@/types'
import { factionPath } from '@/core/constants/routes'

/**
 * Post-processes the raw `wh-html` description strings (stratagems, abilities, rules,
 * missions) to turn two things that were previously just inert bold/keyword text into
 * something actually useful, without touching the source JSON:
 *
 * 1. `[BRACKETED ABILITY]` mentions (e.g. "[SUSTAINED HITS 1]", "[LETHAL HITS]" — over 1000
 *    occurrences across the faction data, same vocabulary as the weapon-table `RuleBadge`s in
 *    DatasheetDetailPage) get the same gold rule-badge treatment plus a native `title` tooltip
 *    with the rule's summary, instead of rendering as plain bracket text.
 * 2. A run of consecutive `.kwb`-wrapped words that spells out a known faction's name (e.g.
 *    `<span class="kwb">ADEPTUS</span> <span class="kwb">CUSTODES</span>`) becomes a link to
 *    that faction's catalog page — only for text the data already highlighted, not every
 *    plain-text mention, so this doesn't turn ordinary prose into a link farm.
 *
 * Both use `data-nav`/native `title` rather than embedded React components because this
 * runs on a raw HTML string for `dangerouslySetInnerHTML` — `RuleHtml` (the component that
 * calls this) intercepts clicks on `[data-nav]` to route client-side instead of hard-navigating.
 */

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

function linkifyFactionKeywords(html: string, factions: Faction[]): string {
  // Longest name (by word count) first, so e.g. "Adeptus Custodes" is tried before a
  // shorter alternative could partially match inside it at the same position.
  const candidates = [...factions]
    .filter(f => f.name.trim())
    .sort((a, b) => b.name.split(/\s+/).length - a.name.split(/\s+/).length)

  if (candidates.length === 0) return html

  const alternatives = candidates.map(f => {
    const words = f.name.trim().split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    return { factionId: f.id, pattern: words.map(w => `<span class="kwb">${w}</span>`).join('\\s*') }
  })

  const combined = new RegExp(alternatives.map(a => `(${a.pattern})`).join('|'), 'gi')

  return html.replace(combined, (full, ...groups) => {
    const matchedIndex = groups.findIndex((g, i) => g !== undefined && i < alternatives.length)
    const faction = matchedIndex >= 0 ? candidates[matchedIndex] : undefined
    if (!faction) return full
    return `<a href="${factionPath(faction.id)}" data-nav="${factionPath(faction.id)}" class="kwb-link">${full}</a>`
  })
}

export function enrichRuleHtml(
  html: string,
  factions: Faction[],
  coreRulesMap: Record<string, CoreRule>,
): string {
  return linkifyFactionKeywords(linkifyAbilityBrackets(html, coreRulesMap), factions)
}
