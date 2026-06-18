import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

interface Props {
  name: string
  description: string
  ruleId?: string
  children: React.ReactNode
}

interface Pos { top: number; left: number; above: boolean }

export function RuleTooltip({ name, description, ruleId, children }: Props) {
  const [pos, setPos] = useState<Pos | null>(null)
  const ref = useRef<HTMLSpanElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const TOOLTIP_W = 260
  const TOOLTIP_APPROX_H = 100

  function cancelHide() {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }

  function show() {
    cancelHide()
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const spaceAbove = r.top
    const above = spaceAbove >= TOOLTIP_APPROX_H + 8
    const rawLeft = r.left + r.width / 2 - TOOLTIP_W / 2
    const left = Math.max(8, Math.min(rawLeft, window.innerWidth - TOOLTIP_W - 8))
    const top = above ? r.top - 6 : r.bottom + 6
    setPos({ top, left, above })
  }

  function hide() {
    hideTimer.current = setTimeout(() => {
      setPos(null)
      hideTimer.current = null
    }, 150)
  }

  useEffect(() => {
    if (!pos) return
    const onScroll = () => setPos(null)
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [!!pos])

  const coreRulesLink = ruleId
    ? `/core-rules#rule-${ruleId}`
    : `/core-rules#rule-${name.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <span
      ref={ref}
      className="relative inline-block cursor-help"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {pos && createPortal(
        <span
          className="fixed z-[9999] pointer-events-auto"
          style={{ top: pos.top, left: pos.left, width: TOOLTIP_W }}
          onMouseEnter={cancelHide}
          onMouseLeave={hide}
        >
          <span
            className="block bg-surface-4 border border-rim-bright px-2.5 py-2 text-left shadow-xl"
            style={{ transform: pos.above ? 'translateY(-100%)' : 'none' }}
          >
            <span className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-[12px] font-display uppercase tracking-widest text-crimson-bright">
                {name}
              </span>
              <Link
                to={coreRulesLink}
                className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim hover:text-crimson-bright shrink-0 transition-colors"
                onClick={() => setPos(null)}
              >
                Ver regla →
              </Link>
            </span>
            <span
              className="wh-html block text-[12px] font-mono text-parchment-dim leading-relaxed"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </span>
        </span>,
        document.body,
      )}
    </span>
  )
}
