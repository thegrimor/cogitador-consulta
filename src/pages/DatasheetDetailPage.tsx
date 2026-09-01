import { useState } from 'react'
import { useParams, NavLink, useNavigate } from 'react-router-dom'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { datasheetPath, factionPath, mathhammerAttackerPath } from '@/core/constants/routes'
import { RuleTooltip } from '@/shared/components/RuleTooltip'
import { RuleHtml } from '@/shared/components/RuleHtml'
import { stratagemTurnColors } from '@/core/constants/stratagemTurnColors'
import { factionColor } from '@/core/constants/factionColors'
import type { Weapon, ModelProfile, Ability } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const linkClass =
  'text-[12px] font-mono text-crimson-bright hover:text-parchment uppercase tracking-wide border-b border-crimson-bright/40 hover:border-parchment transition-colors'

// A unit-name link is colored by ITS OWN faction (not always the page's ds.factionId — a
// leader/led relationship can cross factions, e.g. Imperial Agents), same rule
// linkifyUnitNames applies inside prose. Falls back to the generic crimson-bright treatment
// only if that faction has no color defined (shouldn't happen for the 24 real factions).
function LeaderLink({ target }: { target: { id: string; name: string; factionId: string } }) {
  const colors = factionColor(target.factionId)
  return (
    <NavLink
      to={datasheetPath(target.id)}
      className={`text-[12px] font-mono hover:text-parchment uppercase tracking-wide border-b transition-colors ${
        colors ? `${colors.text} border-current/40 hover:border-parchment` : 'text-crimson-bright border-crimson-bright/40 hover:border-parchment'
      }`}
    >
      {target.name}
    </NavLink>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-3 py-1.5 bg-surface-3 border-b border-rim-bright">
      <span className="text-[12px] font-display uppercase tracking-widest text-crimson-bright">
        {title}
      </span>
    </div>
  )
}

// ── Weapon badges con tooltip desde CoreRules ─────────────────────────────────

interface BadgeProps { label: string; ruleKey?: string }

function RuleBadge({ label, ruleKey }: BadgeProps) {
  const { coreRulesMap } = useGameDataContext()
  const key = (ruleKey ?? label).toLowerCase()
  const rule = coreRulesMap[key] ?? Object.values(coreRulesMap).find(r => key.startsWith(r.name.toLowerCase()))
  const badge = (
    <span className="inline-block text-[10px] font-mono uppercase tracking-wide border border-gold/50 text-gold px-1 py-px leading-none">
      {label}
    </span>
  )
  if (!rule) return badge
  return (
    <RuleTooltip name={label} description={rule.description} ruleId={rule.id}>
      {badge}
    </RuleTooltip>
  )
}

function WeaponSpecialBadges({ weapon }: { weapon: Weapon }) {
  const badges: React.ReactNode[] = []

  if (weapon.isPistol) badges.push(<RuleBadge key="pistol" label="Pistol" />)
  if (weapon.isAssault) badges.push(<RuleBadge key="assault" label="Assault" />)
  if (weapon.rapidFireValue) badges.push(<RuleBadge key="rf" label={`Rapid Fire ${weapon.rapidFireValue}`} ruleKey="rapid fire" />)
  if (weapon.isHeavy) badges.push(<RuleBadge key="heavy" label="Heavy" />)
  if (weapon.isIndirectFire) badges.push(<RuleBadge key="indirect" label="Indirect Fire" />)
  if (weapon.isTorrent) badges.push(<RuleBadge key="torrent" label="Torrent" />)
  if (weapon.isBlast) badges.push(<RuleBadge key="blast" label="Blast" />)
  if (weapon.isIgnoresCover) badges.push(<RuleBadge key="ignores" label="Ignores Cover" />)
  if (weapon.isDevastatingWounds) badges.push(<RuleBadge key="dev" label="Devastating Wounds" />)
  if (weapon.isLethalHits) badges.push(<RuleBadge key="lethal" label="Lethal Hits" />)
  if (weapon.isTwinLinked) badges.push(<RuleBadge key="twin" label="Twin-linked" />)
  if (weapon.isMelta) badges.push(<RuleBadge key="melta" label={`Melta ${weapon.meltaValue}`} ruleKey="melta" />)
  if (weapon.sustainedHitsValue > 0) badges.push(<RuleBadge key="sus" label={`Sustained Hits ${weapon.sustainedHitsValue}`} ruleKey="sustained hits" />)
  if (weapon.isHazardous) badges.push(<RuleBadge key="haz" label="Hazardous" />)
  if (weapon.isPsychic) badges.push(<RuleBadge key="psy" label="Psychic" />)
  if (weapon.isPrecision) badges.push(<RuleBadge key="prec" label="Precision" />)
  if (weapon.isExtraAttacks) badges.push(<RuleBadge key="extra" label="Extra Attacks" />)
  if (weapon.isLance) badges.push(<RuleBadge key="lance" label="Lance" />)
  if (weapon.isOneShot) badges.push(<RuleBadge key="one" label="One Shot" />)
  weapon.antiEntries.forEach((a, i) =>
    badges.push(<RuleBadge key={`anti-${i}`} label={`Anti-${a.keyword} ${a.threshold}+`} ruleKey="anti" />),
  )

  return badges.length > 0 ? (
    <span className="flex flex-wrap gap-0.5">{badges}</span>
  ) : null
}

// ── Tabla de armas ────────────────────────────────────────────────────────────

function WeaponStatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center border border-rim-bright bg-surface-3 px-2 py-1 min-w-[38px]">
      <span className="text-[9px] font-mono uppercase text-parchment-dim leading-none">{label}</span>
      <span className="text-[13px] font-display text-parchment leading-tight mt-0.5 whitespace-nowrap">{value}</span>
    </div>
  )
}

function WeaponsTable({ weapons, title }: { weapons: Weapon[]; title: string }) {
  if (weapons.length === 0) return null

  return (
    <div className="border border-rim-bright">
      <SectionHeader title={title} />
      <div className="divide-y divide-rim-bright">
        {weapons.map((w, i) => (
          <div
            key={w.line}
            className={`px-3 py-2 ${i % 2 === 0 ? 'bg-surface-2' : 'bg-surface-3/50'}`}
          >
            <p className="font-display uppercase tracking-wide text-[11px] text-parchment mb-1.5">{w.name}</p>
            <div className="flex flex-wrap gap-px mb-1.5">
              <WeaponStatBox label="Rango" value={w.range} />
              <WeaponStatBox label="A" value={w.A} />
              <WeaponStatBox label="HA/HP" value={w.bsWs} />
              <WeaponStatBox label="F" value={w.S} />
              <WeaponStatBox label="AP" value={w.AP} />
              <WeaponStatBox label="D" value={w.D} />
            </div>
            <WeaponSpecialBadges weapon={w} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Stats en cajas ────────────────────────────────────────────────────────────

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center border border-rim-bright bg-surface-2 px-3 py-1.5 min-w-[40px]">
      <span className="text-[10px] font-mono uppercase text-parchment-dim leading-none">{label}</span>
      <span
        className="text-[18px] font-display text-parchment leading-tight mt-0.5"
        style={{ textShadow: 'var(--color-crimson) 0 0 8px' }}
      >
        {value}
      </span>
    </div>
  )
}

function ModelStats({ model }: { model: ModelProfile }) {
  return (
    <div className="flex flex-wrap gap-px px-3 py-2 bg-surface-3">
      <StatBox label="M" value={model.M} />
      <StatBox label="T" value={String(model.T)} />
      <StatBox label="SV" value={model.Sv} />
      {model.invSv && <StatBox label="INV" value={model.invSv} />}
      <StatBox label="W" value={String(model.W)} />
      <StatBox label="LD" value={model.Ld} />
      <StatBox label="OC" value={String(model.OC)} />
      {model.baseSize && (
        <StatBox label="Base" value={model.baseSize} />
      )}
    </div>
  )
}

// ── Bloque de habilidades ─────────────────────────────────────────────────────

function AbilRow({ ab, factionId }: { ab: Ability; factionId: string }) {
  return (
    <div className="px-3 py-2 bg-surface-2">
      {ab.model && (
        <span className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim block mb-0.5">
          [{ab.model}]
        </span>
      )}
      <p className="prose-copy">
        <strong className="font-display uppercase tracking-wide text-[11px] text-crimson-bright">
          {ab.name}
        </strong>
        {ab.description ? (
          <>
            <span className="text-parchment-dim">: </span>
            <RuleHtml html={ab.description} as="span" factionId={factionId} />
          </>
        ) : null}
      </p>
    </div>
  )
}

function AbilitiesBlock({
  abilities,
  genericOpen,
  onToggleGeneric,
  factionId,
}: {
  abilities: Ability[]
  genericOpen: boolean
  onToggleGeneric: () => void
  factionId: string
}) {
  const unitAbils = abilities.filter(a => a.type === 'Datasheet')
  const genericAbils = abilities.filter(a => a.type !== 'Datasheet')

  return (
    <div className="border border-rim-bright mb-3">
      <SectionHeader title="Habilidades" />
      {unitAbils.length > 0 && (
        <div className="divide-y divide-rim-bright">
          {unitAbils.map((ab, i) => <AbilRow key={i} ab={ab} factionId={factionId} />)}
        </div>
      )}
      {genericAbils.length > 0 && (
        <>
          <button
            onClick={onToggleGeneric}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-surface-3 border-t border-rim-bright hover:bg-surface-4 transition-colors"
          >
            <span className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim">
              Genéricas / Facción ({genericAbils.length})
            </span>
            <span className="text-[11px] font-mono text-parchment-dim">
              {genericOpen ? '▲' : '▼'}
            </span>
          </button>
          {genericOpen && (
            <div className="divide-y divide-rim-bright">
              {genericAbils.map((ab, i) => <AbilRow key={i} ab={ab} factionId={factionId} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export function DatasheetDetailPage() {
  const { datasheetId } = useParams<{ datasheetId: string }>()
  const {
    factions, datasheets, stratagems, detachments,
    pointsCostMap, wargearCostMap, leaderMap, attachedMap,
    datasheetOptions, datasheetDetachmentAbilities, detachmentAbilities,
    sourceMap,
  } = useGameDataContext()
  const navigate = useNavigate()

  const ds = datasheets.find(d => d.id === datasheetId)
  const [activeModel, setActiveModel] = useState(0)
  const [compositionOpen, setCompositionOpen] = useState(true)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [strataOpen, setStrataOpen] = useState(false)
  const [selectedDetachmentId, setSelectedDetachmentId] = useState<string | null>(null)
  const [genericAbilsOpen, setGenericAbilsOpen] = useState(false)
  const [detachAbilsOpen, setDetachAbilsOpen] = useState(false)

  if (!ds) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[12px] font-mono text-parchment-dim uppercase tracking-widest">
          Unidad no encontrada
        </p>
      </div>
    )
  }

  const faction = factions.find(f => f.id === ds.factionId)
  const rangedWeapons = ds.weapons.filter(w => w.range.toLowerCase() !== 'melee')
  const meleeWeapons = ds.weapons.filter(w => w.range.toLowerCase() === 'melee')

  const factionDetachments = detachments.filter(d => d.factionId === ds.factionId)
  const activeDetachmentId = selectedDetachmentId ?? factionDetachments[0]?.id ?? null
  const visibleStrats = activeDetachmentId
    ? stratagems.filter(s => s.detachmentId === activeDetachmentId)
    : []

  // Leaders — from relational CSV (with fallback to old split fields)
  const leaderHeadIds = leaderMap[ds.id]?.length ? leaderMap[ds.id] : ds.leaderHead
  const leaderFooterIds = attachedMap[ds.id]?.length ? attachedMap[ds.id] : ds.leaderFooter
  const leaderHead = leaderHeadIds.map(id => datasheets.find(d => d.id === id)).filter(Boolean)
  const leaderFooter = leaderFooterIds.map(id => datasheets.find(d => d.id === id)).filter(Boolean)

  // Points
  const pointsCosts = pointsCostMap[ds.id] ?? []

  // Wargear options
  const options = datasheetOptions[ds.id] ?? []
  const wargearCosts = wargearCostMap[ds.id] ?? []

  // Detachment abilities specific to this unit
  const unitDetachAbilIds = datasheetDetachmentAbilities[ds.id] ?? []
  const unitDetachAbils = unitDetachAbilIds
    .map(id => detachmentAbilities.find(a => a.id === id))
    .filter(Boolean)

  // Source
  const source = ds.sourceId ? sourceMap[ds.sourceId] : undefined

  const currentModel = ds.models[activeModel] ?? ds.models[0]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back */}
      <button
        onClick={() => navigate(factionPath(ds.factionId))}
        className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mb-3 flex items-center gap-1"
      >
        ← {faction?.name ?? 'Volver'}
      </button>

      {/* Header */}
      <div className="border border-rim-bright mb-3">
        <div className="bg-crimson px-3 py-2 flex items-baseline justify-between gap-2">
          <h1 className="text-[17px] font-display uppercase tracking-[2px] text-parchment leading-tight">
            {ds.name}
          </h1>
          <span className="text-[11px] font-mono uppercase tracking-widest text-parchment shrink-0">
            {ds.role}
          </span>
        </div>
        {ds.factionKeywords.length > 0 && (
          <div className="px-3 py-1 bg-surface-3 border-t border-rim-bright flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-gold">
              {ds.factionKeywords.join(' · ')}
            </span>
            {source && (
              <a
                href={source.errataLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim hover:text-crimson-bright transition-colors shrink-0"
              >
                {source.name} v{source.version}
              </a>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end mb-3">
        <NavLink to={mathhammerAttackerPath(ds.id, ds.factionId)} className={linkClass}>
          Mathhammer
        </NavLink>
      </div>

      {/* Stats */}
      <div className="border border-rim-bright mb-3">
        {ds.models.length > 1 && (
          <div className="flex border-b border-rim-bright overflow-x-auto">
            {ds.models.map((m, i) => (
              <button
                key={i}
                onClick={() => setActiveModel(i)}
                className={`text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 border-r border-rim-bright transition-colors whitespace-nowrap shrink-0 ${
                  i === activeModel
                    ? 'bg-crimson/20 text-parchment'
                    : 'bg-surface-3 text-parchment-dim hover:text-parchment'
                }`}
              >
                {m.name || `Perfil ${i + 1}`}
              </button>
            ))}
          </div>
        )}
        {currentModel && <ModelStats model={currentModel} />}
      </div>

      {/* Armas ranged */}
      {rangedWeapons.length > 0 && (
        <div className="mb-3">
          <WeaponsTable weapons={rangedWeapons} title="Armas a Distancia" />
        </div>
      )}

      {/* Armas melee */}
      {meleeWeapons.length > 0 && (
        <div className="mb-3">
          <WeaponsTable weapons={meleeWeapons} title="Armas de Combate" />
        </div>
      )}

      {/* Habilidades */}
      {ds.abilities.length > 0 && (
        <AbilitiesBlock
          abilities={ds.abilities}
          factionId={ds.factionId}
          genericOpen={genericAbilsOpen}
          onToggleGeneric={() => setGenericAbilsOpen(o => !o)}
        />
      )}

      {/* Habilidades de destacamento específicas de esta unidad */}
      {unitDetachAbils.length > 0 && (
        <div className="border border-rim-bright mb-3">
          <button
            onClick={() => setDetachAbilsOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-surface-3 hover:bg-surface-4 transition-colors"
          >
            <span className="text-[12px] font-display uppercase tracking-widest text-crimson-bright">
              Habilidades de Destacamento ({unitDetachAbils.length})
            </span>
            <span className="text-[11px] font-mono text-parchment-dim">
              {detachAbilsOpen ? '▲' : '▼'}
            </span>
          </button>
          {detachAbilsOpen && (
            <div className="divide-y divide-rim-bright">
              {unitDetachAbils.map(ab => ab && (
                <div key={ab.id} className="px-3 py-2 bg-surface-2">
                  <p className="text-[12px] font-display uppercase tracking-widest text-parchment mb-0.5">
                    {ab.name}
                  </p>
                  {ab.description && <RuleHtml html={ab.description} className="prose-copy" factionId={ds.factionId} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Líderes — puede liderar */}
      {leaderHead.length > 0 && (
        <div className="border border-rim-bright mb-3">
          <SectionHeader title="Puede Liderar" />
          <div className="px-3 py-2 bg-surface-2 flex flex-wrap gap-2">
            {leaderHead.map(led => led && <LeaderLink key={led.id} target={led} />)}
          </div>
        </div>
      )}

      {/* Líderes — puede ser liderado por */}
      {leaderFooter.length > 0 && (
        <div className="border border-rim-bright mb-3">
          <SectionHeader title="Puede Ser Liderado Por" />
          <div className="px-3 py-2 bg-surface-2 flex flex-wrap gap-2">
            {leaderFooter.map(leader => leader && <LeaderLink key={leader.id} target={leader} />)}
          </div>
        </div>
      )}

      {/* Composición + Loadout */}
      {(ds.unitComposition.length > 0 || ds.loadout) && (
        <div className="border border-rim-bright mb-3">
          <button
            onClick={() => setCompositionOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-surface-3 hover:bg-surface-4 transition-colors"
          >
            <span className="text-[12px] font-display uppercase tracking-widest text-crimson-bright">
              Composición y Equipo
            </span>
            <span className="text-[12px] font-mono text-parchment-dim">
              {compositionOpen ? '▲' : '▼'}
            </span>
          </button>
          {compositionOpen && (
            <div className="px-3 py-2 bg-surface-2 space-y-1">
              {ds.unitComposition.map((line, i) => (
                <RuleHtml key={i} html={line} className="prose-copy" factionId={ds.factionId} />
              ))}
              {ds.loadout && (
                <RuleHtml html={ds.loadout} className="prose-copy mt-1 pt-1 border-t border-rim-bright" factionId={ds.factionId} />
              )}
              {pointsCosts.length > 0 && (
                <div className="flex flex-wrap gap-px pt-2 mt-1 border-t border-rim-bright">
                  {pointsCosts.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-baseline gap-1 border border-rim-bright bg-surface-3 px-2 py-1"
                    >
                      <span className="text-[11px] font-mono text-parchment-dim">{p.description}:</span>
                      <span className="text-[13px] font-display text-gold">{p.points} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Opciones de equipo */}
      {options.length > 0 && (
        <div className="border border-rim-bright mb-3">
          <button
            onClick={() => setOptionsOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-surface-3 hover:bg-surface-4 transition-colors"
          >
            <span className="text-[12px] font-display uppercase tracking-widest text-crimson-bright">
              Opciones de Equipo ({options.length})
            </span>
            <span className="text-[12px] font-mono text-parchment-dim">
              {optionsOpen ? '▲' : '▼'}
            </span>
          </button>
          {optionsOpen && (
            <div className="px-3 py-2 bg-surface-2 space-y-1">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-[12px] font-mono text-crimson-bright shrink-0 mt-px">
                    {opt.button}
                  </span>
                  <RuleHtml html={opt.description} className="prose-copy" factionId={ds.factionId} />
                </div>
              ))}
              {wargearCosts.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 mt-1 border-t border-rim-bright">
                  {wargearCosts.map((w, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-mono text-parchment-dim border border-rim-bright bg-surface-3 px-2 py-0.5"
                    >
                      {w.name}: <span className="text-gold">+{w.points} pts</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Estratagemas por destacamento */}
      {factionDetachments.length > 0 && (
        <div className="border border-rim-bright mb-3">
          <button
            onClick={() => setStrataOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-surface-3 hover:bg-surface-4 transition-colors"
          >
            <span className="text-[12px] font-display uppercase tracking-widest text-crimson-bright">
              Estratagemas
            </span>
            <span className="text-[12px] font-mono text-parchment-dim">
              {strataOpen ? '▲' : '▼'}
            </span>
          </button>
          {strataOpen && (
            <>
              <div className="flex flex-wrap gap-1 px-3 py-2 bg-surface-3 border-t border-rim-bright">
                {factionDetachments.map(det => (
                  <button
                    key={det.id}
                    onClick={() => setSelectedDetachmentId(det.id)}
                    className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 border transition-colors ${
                      activeDetachmentId === det.id
                        ? 'border-crimson-bright text-parchment bg-crimson/10'
                        : 'border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment'
                    }`}
                  >
                    {det.name}
                  </button>
                ))}
              </div>
              <div className="divide-y divide-rim-bright">
                {visibleStrats.length === 0 ? (
                  <p className="text-[11px] font-mono text-parchment-dim text-center py-4 uppercase tracking-widest">
                    Sin estratagemas
                  </p>
                ) : (
                  visibleStrats.map(s => {
                    const turnColors = stratagemTurnColors(s.turn)
                    return (
                      <div key={s.id} className={`px-3 py-2.5 bg-surface-2 border-l-2 ${turnColors.borderLeft}`}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-[12px] font-display uppercase tracking-widest text-crimson-bright leading-tight">
                            {s.name}
                          </span>
                          <span className="shrink-0 text-[11px] font-mono border border-gold/60 text-gold px-1.5 py-px leading-none">
                            {s.cpCost}CP
                          </span>
                        </div>
                        {(s.turn || s.phase) && (
                          <div className="flex gap-3 mb-1">
                            {s.turn && (
                              <span className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim">
                                Turno: <span className={turnColors.text}>{s.turn}</span>
                              </span>
                            )}
                            {s.phase && (
                              <span className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim">
                                Fase: <span className="text-parchment">{s.phase}</span>
                              </span>
                            )}
                          </div>
                        )}
                        <RuleHtml html={s.description} className="prose-copy" factionId={ds.factionId} />
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Daño */}
      {ds.damagedW > 0 && (
        <div className="border border-rim-bright mb-3">
          <SectionHeader title={`Dañado (${ds.damagedW}+ heridas)`} />
          <div className="px-3 py-2 bg-surface-2">
            <RuleHtml html={ds.damagedDescription} className="prose-copy" factionId={ds.factionId} />
          </div>
        </div>
      )}

      {/* Keywords */}
      {ds.keywords.length > 0 && (
        <div className="border border-rim-bright bg-surface-2 px-3 py-2">
          <p className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim">
            <span className="text-parchment mr-1">Palabras Clave:</span>
            {ds.keywords.join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}
