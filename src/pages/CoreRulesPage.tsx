import { useState } from 'react'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import type { CoreRule, CoreRuleCategory } from '@/types'

const CATEGORY_LABELS: Record<CoreRuleCategory, string> = {
  weapon_ability: 'Habilidades de Arma',
  unit_ability: 'Habilidades de Unidad',
  concept: 'Conceptos',
  phase: 'Fases',
}

const CATEGORY_ORDER: CoreRuleCategory[] = ['weapon_ability', 'unit_ability', 'concept', 'phase']

function RuleEntry({ rule }: { rule: CoreRule }) {
  return (
    <div
      id={`rule-${rule.id}`}
      className="px-4 py-3 bg-surface-2 border-b border-rim-bright last:border-b-0 scroll-mt-20"
    >
      <p className="text-[10px] font-display uppercase tracking-widest text-parchment mb-0.5">
        {rule.name}
      </p>
      {rule.summary && (
        <p className="text-[8px] font-mono text-parchment-dim italic mb-1">
          {rule.summary}
        </p>
      )}
      <p
        className="wh-html text-[9px] font-mono text-parchment leading-relaxed"
        dangerouslySetInnerHTML={{ __html: rule.description }}
      />
    </div>
  )
}

function CategorySection({ category, rules }: { category: CoreRuleCategory; rules: CoreRule[] }) {
  if (rules.length === 0) return null
  return (
    <section className="mb-6" id={`cat-${category}`}>
      <div className="px-3 py-1.5 bg-surface-3 border border-rim-bright border-b-0">
        <span className="text-[9px] font-display uppercase tracking-widest text-crimson-bright">
          {CATEGORY_LABELS[category]} ({rules.length})
        </span>
      </div>
      <div className="border border-rim-bright divide-y divide-rim-bright">
        {rules.map(r => <RuleEntry key={r.id} rule={r} />)}
      </div>
    </section>
  )
}

export function CoreRulesPage() {
  const { coreRules, lastUpdate } = useGameDataContext()
  const [search, setSearch] = useState('')

  const query = search.toLowerCase().trim()
  const filtered = query
    ? coreRules.filter(r =>
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
        <h1 className="text-[13px] font-display uppercase tracking-[3px] text-parchment">
          Reglamento Core
        </h1>
        {lastUpdate && (
          <p className="text-[7px] font-mono uppercase tracking-widest text-parchment-dim mt-0.5">
            Actualizado: {lastUpdate.split(' ')[0]}
          </p>
        )}
      </div>

      {/* Category anchors */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {CATEGORY_ORDER.map(cat => (
          <a
            key={cat}
            href={`#cat-${cat}`}
            className="text-[7px] font-mono uppercase tracking-widest px-2 py-1 border border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment transition-colors"
          >
            {CATEGORY_LABELS[cat]}
          </a>
        ))}
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Buscar regla…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-surface-3 border border-rim-bright text-parchment text-[10px] font-mono px-3 py-2 placeholder-parchment-dim focus:outline-none focus:border-crimson-bright"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-[9px] font-mono text-parchment-dim text-center py-10 uppercase tracking-widest">
          Sin resultados
        </p>
      ) : query ? (
        <div className="border border-rim-bright divide-y divide-rim-bright">
          {filtered.sort((a, b) => a.name.localeCompare(b.name)).map(r => <RuleEntry key={r.id} rule={r} />)}
        </div>
      ) : (
        CATEGORY_ORDER.map(cat => (
          <CategorySection key={cat} category={cat} rules={byCategory(cat)} />
        ))
      )}
    </div>
  )
}
