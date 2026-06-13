import { useState, useRef } from 'react'

interface Props {
  name: string
  description: string
  children: React.ReactNode
}

export function RuleTooltip({ name, description, children }: Props) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  return (
    <span
      ref={ref}
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 pointer-events-none">
          <span className="block bg-surface-4 border border-rim-bright px-2.5 py-2 text-left shadow-lg">
            <span className="block text-[9px] font-display uppercase tracking-widest text-crimson-bright mb-1">
              {name}
            </span>
            <span className="wh-html block text-[9px] font-mono text-parchment-dim leading-relaxed"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </span>
        </span>
      )}
    </span>
  )
}
