import { useState } from 'react'
import { useParams, NavLink, useNavigate } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { datasheetPath, factionDetachmentsPath, factionArmyRulesPath } from '@/core/constants/routes'

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-px flex-1 bg-rim-bright" />
      <span className="text-[9px] font-display uppercase tracking-[3px] text-crimson-bright shrink-0">
        {title}
      </span>
      <div className="h-px flex-1 bg-rim-bright" />
    </div>
  )
}

function NavTile({ to, label, meta }: { to: string; label: string; meta: string }) {
  return (
    <NavLink
      to={to}
      className="group flex items-center justify-between bg-surface-2 border border-rim-bright hover:border-crimson-bright px-4 py-3.5 transition-colors"
    >
      <div>
        <p className="text-[10px] font-display uppercase tracking-widest text-parchment group-hover:text-parchment">
          {label}
        </p>
        <p className="text-[8px] font-mono uppercase tracking-widest text-parchment-dim mt-0.5">
          {meta}
        </p>
      </div>
      <span className="text-[13px] font-mono text-parchment-dim group-hover:text-parchment transition-colors">›</span>
    </NavLink>
  )
}

export function FactionPage() {
  const { factionId } = useParams<{ factionId: string }>()
  const { factions, datasheets, detachments, abilitiesMap } = useGameDataContext()
  const navigate = useNavigate()

  const faction = factions.find(f => f.id === factionId)
  const factionSheets = datasheets.filter(d => d.factionId === factionId && !d.isVirtual)
  const factionDetachments = detachments.filter(d => d.factionId === factionId)
  const armyRuleCount = Object.values(abilitiesMap).filter(a => a.faction_id === factionId).length

  const roles = ['Todos', ...Array.from(new Set(factionSheets.map(d => d.role))).sort()]
  const [activeRole, setActiveRole] = useState('Todos')
  const [search, setSearch] = useState('')

  const filtered = factionSheets.filter(d => {
    const matchRole = activeRole === 'Todos' || d.role === activeRole
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  if (!faction) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[9px] font-mono text-parchment-dim uppercase tracking-widest">
          Facción no encontrada
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-[8px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mb-3 flex items-center gap-1"
        >
          ← Catálogo
        </button>
        <div className="h-1 bg-crimson mb-2" />
        <h1 className="text-[13px] font-display uppercase tracking-[3px] text-parchment">
          {faction.name}
        </h1>
        <p className="text-[8px] font-mono uppercase tracking-[2px] text-parchment-dim mt-0.5">
          {faction.id} · {factionSheets.length} unidades
        </p>
      </div>

      {/* ── Nav: Destacamentos + Regla de Ejército ── */}
      <section className="mb-8 flex flex-col gap-px">
        {factionDetachments.length > 0 && (
          <NavTile
            to={factionDetachmentsPath(factionId!)}
            label="Destacamentos"
            meta={`${factionDetachments.length} destacamentos`}
          />
        )}
        {armyRuleCount > 0 && (
          <NavTile
            to={factionArmyRulesPath(factionId!)}
            label="Regla de Ejército"
            meta={`${armyRuleCount} regla${armyRuleCount !== 1 ? 's' : ''}`}
          />
        )}
      </section>

      {/* ── Sección: Datasheets ── */}
      <section className="mb-8">
        <SectionHeader title={`Datasheets (${factionSheets.length})`} />

        <div className="flex flex-wrap gap-1.5 mb-3">
          {roles.map(role => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`text-[8px] font-mono uppercase tracking-widest px-2.5 py-1 border transition-colors ${
                activeRole === role
                  ? 'border-crimson-bright text-parchment bg-crimson/10'
                  : 'border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar unidad…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-3 border border-rim-bright text-parchment text-[10px] font-mono px-3 py-2 placeholder-parchment-dim focus:outline-none focus:border-crimson-bright"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-[9px] font-mono text-parchment-dim text-center py-8 uppercase tracking-widest">
            Sin resultados
          </p>
        ) : (
          <div className="flex flex-col gap-px">
            {filtered.map(ds => {
              const primary = ds.models[0]
              return (
                <NavLink
                  key={ds.id}
                  to={datasheetPath(ds.id)}
                  className="group flex items-center justify-between bg-surface-2 border border-rim-bright hover:border-crimson-bright px-3 py-2.5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[8px] font-mono uppercase tracking-[2px] text-parchment-dim shrink-0 w-20">
                      {ds.role}
                    </span>
                    <span className="text-[10px] font-display uppercase tracking-widest text-parchment group-hover:text-parchment truncate">
                      {ds.name}
                    </span>
                  </div>
                  {primary && (
                    <div className="flex items-center gap-px shrink-0 ml-3">
                      {[
                        { label: 'T', value: String(primary.T) },
                        { label: 'SV', value: primary.Sv },
                        { label: 'W', value: String(primary.W) },
                      ].map(stat => (
                        <div
                          key={stat.label}
                          className="flex flex-col items-center bg-surface-3 border border-rim-bright px-1.5 py-0.5 min-w-[28px]"
                        >
                          <span className="text-[7px] font-mono uppercase text-parchment-dim leading-none">
                            {stat.label}
                          </span>
                          <span className="text-[9px] font-display text-parchment leading-none mt-0.5">
                            {stat.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </NavLink>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
