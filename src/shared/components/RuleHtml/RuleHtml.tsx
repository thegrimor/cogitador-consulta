import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const closePopup = () => { setOpenKw(null); setPos(null) }

  useEffect(() => {
    if (!openKw) return
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') closePopup() }
    const onScroll = (ev: Event) => {
      if ((ev.target as HTMLElement | Document)?.nodeType === 1 && (ev.target as HTMLElement).closest?.('[data-kw-popup]')) return
      closePopup()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [openKw])
  const kwUnits = useMemo(
    () => openKw && factionId
      ? datasheets
          .filter(d => datasheetBelongsToFaction(d, factionId) && (d.keywords.some(k => k.trim().toUpperCase() === openKw) || (openKw === 'CHARACTER' && d.role === 'Characters')))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [],
    [openKw, datasheets, factionId],
  )

  function handleClick(e: React.MouseEvent) {
    const kwBtn = (e.target as HTMLElement).closest('button[data-kw]')
    if (kwBtn) {
      e.preventDefault()
      const kw = kwBtn.getAttribute('data-kw')!
      if (openKw === kw) { closePopup(); return }
      const r = kwBtn.getBoundingClientRect()
      const W = 280
      setPos({
        top: r.bottom + 6,
        left: Math.max(8, Math.min(r.left, window.innerWidth - W - 8)),
      })
      setOpenKw(kw)
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
      {openKw && pos && kwUnits.length > 0 && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={closePopup} />
          <div
            data-kw-popup
            className="fixed z-[9999] w-[280px] max-h-[60vh] overflow-y-auto bg-surface-4 border border-rim-bright shadow-xl px-2.5 py-2"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <span className="text-[12px] font-display uppercase tracking-widest text-crimson-bright">
                {openKw} · {kwUnits.length}
              </span>
              <button
                type="button"
                onClick={closePopup}
                aria-label="Cerrar"
                className="text-[11px] font-mono text-parchment-dim hover:text-parchment"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-1">
              {kwUnits.map(d => (
                <li key={d.id}>
                  <Link
                    to={datasheetPath(d.id)}
                    onClick={closePopup}
                    className="text-[12px] font-mono text-parchment underline underline-offset-2 hover:text-crimson-bright"
                  >
                    {d.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>,
        document.body,
      )}
    </>
  )
}
