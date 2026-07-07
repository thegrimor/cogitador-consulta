import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import type { CoreRule, CoreRuleCategory } from '@/types'
import { ROUTES } from '@/core/constants/routes'
import { PHASES } from '@/core/constants/phasesData'

const SECTION_CATEGORIES: CoreRuleCategory[] = ['weapon_ability', 'unit_ability', 'concept']

const SECTION_LABELS: Record<CoreRuleCategory, string> = {
  weapon_ability: 'Habilidades de Arma',
  unit_ability: 'Habilidades de Unidad',
  concept: 'Conceptos',
  phase: 'Fases',
}

function RuleEntry({ rule }: { rule: CoreRule }) {
  const [open, setOpen] = useState(false)

  return (
    <div id={`rule-${rule.id}`} className="border-b border-rim-bright last:border-b-0 scroll-mt-20">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-2 hover:bg-surface-3 transition-colors text-left"
      >
        <span className="text-[13px] font-display uppercase tracking-widest text-parchment">
          {rule.name}
        </span>
        <span
          className="text-[15px] font-mono text-parchment-dim ml-2 shrink-0 transition-transform"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ›
        </span>
      </button>
      {open && (
        <div className="px-4 py-3 bg-surface-1 border-t border-rim-bright">
          {rule.summary && (
            <p className="text-[11px] font-mono text-parchment-dim italic mb-1.5">
              {rule.summary}
            </p>
          )}
          <p
            className="wh-html text-[12px] font-mono text-parchment leading-relaxed"
            dangerouslySetInnerHTML={{ __html: rule.description }}
          />
        </div>
      )}
    </div>
  )
}

function CollapsibleSection({
  category,
  rules,
}: {
  category: CoreRuleCategory
  rules: CoreRule[]
}) {
  const [open, setOpen] = useState(false)
  if (rules.length === 0) return null

  return (
    <section className="mb-2" id={`cat-${category}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-3 border border-rim-bright hover:border-crimson transition-colors text-left"
      >
        <span className="text-[12px] font-display uppercase tracking-widest text-crimson-bright">
          {SECTION_LABELS[category]}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-parchment-dim">{rules.length}</span>
          <span
            className="text-[15px] font-mono text-parchment-dim transition-transform"
            style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            ›
          </span>
        </div>
      </button>
      {open && (
        <div className="border border-t-0 border-rim-bright divide-y divide-rim-bright">
          {rules.map(r => (
            <RuleEntry key={r.id} rule={r} />
          ))}
        </div>
      )}
    </section>
  )
}

function SearchResults({ rules }: { rules: CoreRule[] }) {
  return (
    <div className="border border-rim-bright divide-y divide-rim-bright">
      {rules.map(r => (
        <RuleEntry key={r.id} rule={r} />
      ))}
    </div>
  )
}

export function CoreRulesPage() {
  const { coreRules, lastUpdate } = useGameDataContext()
  const [search, setSearch] = useState('')

  const query = search.toLowerCase().trim()
  const filtered = query
    ? coreRules.filter(
        r =>
          r.name.toLowerCase().includes(query) ||
          r.summary.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query),
      )
    : coreRules

  const byCategory = (cat: CoreRuleCategory) =>
    filtered.filter(r => r.category === cat).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="h-1 bg-crimson mb-2" />
        <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment">
          Reglamento Core
        </h1>
        {lastUpdate && (
          <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mt-0.5">
            Actualizado: {lastUpdate.split(' ')[0]}
          </p>
        )}
      </div>

      {/* Phases NavTile */}
      <div className="mb-5">
        <NavLink
          to={ROUTES.CORE_RULES_PHASES}
          className="group flex items-center justify-between bg-surface-2 border border-rim-bright hover:border-crimson-bright px-4 py-4 transition-colors"
        >
          <div>
            <p className="text-[14px] font-display uppercase tracking-widest text-parchment group-hover:text-parchment">
              Fases de Juego
            </p>
            <p className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim mt-0.5">
              {PHASES.length} secciones · 07 – 23
            </p>
          </div>
          <span className="text-[18px] font-mono text-parchment-dim group-hover:text-parchment transition-colors">
            ›
          </span>
        </NavLink>
      </div>

      {/* Missions NavTile */}
      <div className="mb-5">
        <NavLink
          to={ROUTES.CORE_RULES_MISSIONS}
          className="group flex items-center justify-between bg-surface-2 border border-rim-bright hover:border-crimson-bright px-4 py-4 transition-colors"
        >
          <div>
            <p className="text-[14px] font-display uppercase tracking-widest text-parchment group-hover:text-parchment">
              Misiones
            </p>
            <p className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim mt-0.5">
              5 mazos primarios · 18 secundarias
            </p>
          </div>
          <span className="text-[18px] font-mono text-parchment-dim group-hover:text-parchment transition-colors">
            ›
          </span>
        </NavLink>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Buscar regla…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-surface-3 border border-rim-bright text-parchment text-[13px] font-mono px-3 py-2 placeholder-parchment-dim focus:outline-none focus:border-crimson-bright"
        />
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <p className="text-[12px] font-mono text-parchment-dim text-center py-10 uppercase tracking-widest">
          Sin resultados
        </p>
      ) : query ? (
        <SearchResults rules={filtered.sort((a, b) => a.name.localeCompare(b.name))} />
      ) : (
        <div className="flex flex-col gap-0.5">
          {SECTION_CATEGORIES.map(cat => (
            <CollapsibleSection key={cat} category={cat} rules={byCategory(cat)} />
          ))}
        </div>
      )}
    </div>
  )
}
