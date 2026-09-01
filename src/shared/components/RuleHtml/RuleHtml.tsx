import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { enrichRuleHtml } from '@/core/utils/ruleHtml'

interface Props {
  html: string
  className?: string
  as?: 'p' | 'span' | 'div'
  /** The faction this text belongs to (a datasheet/detachment/stratagem's own factionId) —
   * enables unit-name linking, scoped to that faction's own datasheets. Omit for
   * faction-agnostic content (core rules, phases, mission text) where there's no single
   * faction to scope the unit-name search to. */
  factionId?: string
}

/**
 * Drop-in replacement for `<p className="wh-html ..." dangerouslySetInnerHTML={{__html}} />`.
 * Runs the description through `enrichRuleHtml` (bracketed-ability badges, faction-name
 * links, unit-name links, keyword coloring — see that file) and intercepts clicks on the
 * links it inserts so they route client-side instead of hard-navigating — the linked markup
 * is plain `<a href>` because it's injected into a raw HTML string, not a React tree, so it
 * can't render an actual `<Link>`.
 */
export function RuleHtml({ html, className = '', as = 'p', factionId }: Props) {
  const { factions, coreRulesMap, datasheets } = useGameDataContext()
  const navigate = useNavigate()

  const enriched = useMemo(
    () => enrichRuleHtml(html, factions, coreRulesMap, datasheets, factionId),
    [html, factions, coreRulesMap, datasheets, factionId],
  )

  function handleClick(e: React.MouseEvent) {
    const link = (e.target as HTMLElement).closest('a[data-nav]')
    if (!link) return
    e.preventDefault()
    navigate(link.getAttribute('data-nav')!)
  }

  const Tag = as
  return (
    <Tag
      className={`wh-html ${className}`}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: enriched }}
    />
  )
}
