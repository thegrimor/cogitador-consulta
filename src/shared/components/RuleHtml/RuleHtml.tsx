import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { enrichRuleHtml } from '@/core/utils/ruleHtml'
import { datasheetPath } from '@/core/constants/routes'
import { datasheetBelongsToFaction } from '@/core/constants/factionFamily'

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

  const [openKw, setOpenKw] = useState<string | null>(null)
  const kwUnits = useMemo(
    () => openKw && factionId
      ? datasheets
          .filter(d => datasheetBelongsToFaction(d, factionId) && d.keywords.some(k => k.trim().toUpperCase() === openKw))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [],
    [openKw, datasheets, factionId],
  )

  function handleClick(e: React.MouseEvent) {
    const kwBtn = (e.target as HTMLElement).closest('button[data-kw]')
    if (kwBtn) {
      e.preventDefault()
      const kw = kwBtn.getAttribute('data-kw')!
      setOpenKw(cur => (cur === kw ? null : kw))
      return
    }
    const link = (e.target as HTMLElement).closest('a[data-nav]')
    if (!link) return
    e.preventDefault()
    navigate(link.getAttribute('data-nav')!)
  }

  const Tag = as
  return (
    <>
      <Tag
        className={`wh-html ${className}`}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: enriched }}
      />
      {openKw && kwUnits.length > 0 && (
        <span className="block my-2 border-l-2 border-l-crimson bg-surface-3 px-3 py-2">
          <span className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim">
              {openKw} · {kwUnits.length} unidades
            </span>
            <button
              type="button"
              onClick={() => setOpenKw(null)}
              className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment"
            >
              ✕
            </button>
          </span>
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            {kwUnits.map(d => (
              <Link
                key={d.id}
                to={datasheetPath(d.id)}
                className="text-[12px] font-mono text-parchment underline underline-offset-2 hover:text-crimson-bright"
              >
                {d.name}
              </Link>
            ))}
          </span>
        </span>
      )}
    </>
  )
}
