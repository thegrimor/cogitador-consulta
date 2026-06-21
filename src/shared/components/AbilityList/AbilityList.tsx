import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Ability, DetachmentAbility } from '@/types'

interface Props {
  abilities: Ability[]
  detachmentAbilities: DetachmentAbility[]
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function AbilityGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim/60">{label}</p>
      {children}
    </div>
  )
}

function AbilityItem({ ability }: { ability: Ability }) {
  return (
    <div className="border-l-2 border-l-rim-bright pl-2">
      <p className="text-[12px] font-display uppercase tracking-widest text-parchment mb-0.5">
        {ability.name}
        {ability.model && (
          <span className="text-parchment-dim normal-case tracking-normal font-mono ml-1">
            ({ability.model})
          </span>
        )}
      </p>
      <p className="text-[13px] font-mono text-parchment-dim leading-relaxed">{stripHtml(ability.description)}</p>
    </div>
  )
}

export function AbilityList({ abilities, detachmentAbilities }: Props) {
  const [open, setOpen] = useState(false)
  const total = abilities.length + detachmentAbilities.length
  if (total === 0) return null

  const datasheetAbilities = abilities.filter(a => a.type === 'Datasheet')
  const factionAbilities = abilities.filter(a => a.type === 'Faction')
  // Catches Core plus the data's other rule-ish types (Wargear, Primarch, Fortification, etc.)
  // so every ability still renders even though the user-facing grouping only distinguishes four buckets.
  const commonAbilities = abilities.filter(a => a.type !== 'Datasheet' && a.type !== 'Faction')

  return (
    <div className="border-b border-rim-bright">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-display uppercase tracking-widest text-gold hover:text-gold-bright transition-colors"
      >
        <span>Habilidades ({total})</span>
        <span>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          {datasheetAbilities.length > 0 && (
            <AbilityGroup label="Habilidades de Unidad">
              <div className="space-y-2">
                {datasheetAbilities.map((ab, i) => (
                  <AbilityItem key={i} ability={ab} />
                ))}
              </div>
            </AbilityGroup>
          )}

          {detachmentAbilities.length > 0 && (
            <AbilityGroup label="Habilidades de Destacamento">
              <div className="space-y-2">
                {detachmentAbilities.map(da => (
                  <div key={da.id} className="border border-gold/30 bg-gold/5 p-2">
                    <p className="text-[12px] font-display uppercase tracking-widest text-gold mb-1">
                      ◆ {da.name}
                    </p>
                    <p className="text-[13px] font-mono text-parchment-dim leading-relaxed">
                      {stripHtml(da.description)}
                    </p>
                  </div>
                ))}
              </div>
            </AbilityGroup>
          )}

          {factionAbilities.length > 0 && (
            <AbilityGroup label="Habilidades de Ejército">
              <div className="space-y-2">
                {factionAbilities.map((ab, i) => (
                  <AbilityItem key={i} ability={ab} />
                ))}
              </div>
            </AbilityGroup>
          )}

          {commonAbilities.length > 0 && (
            <AbilityGroup label="Habilidades Comunes">
              <div className="space-y-2">
                {commonAbilities.map((ab, i) => (
                  <AbilityItem key={i} ability={ab} />
                ))}
              </div>
            </AbilityGroup>
          )}
        </div>
      )}
    </div>
  )
}
