import { useState } from 'react'
import { calculateDamage, getBlastBonusAttacks, parseDiceAverage } from '../../utils/mathhammer'
import type { Weapon, ModelProfile, CombatType } from '@/types'
import type { CombatModifiers } from '../../types'
import { GaussianChart } from './GaussianChart'

interface Props {
  weapons: Weapon[]
  weaponQuantities?: Record<string, number>
  defenderModel: ModelProfile | null
  defenderKeywords?: string[]
  attackerName: string
  defenderName: string
  mods: CombatModifiers
  /** Mods to use instead of `mods` for weapons that belong to the attached leader
   * (see `leaderWeapons`) — includes bearer-only enhancement/ability effects. */
  leaderMods?: CombatModifiers
  /** Weapon objects belonging to the currently attached leader/character, if any.
   * Used to tell its own weapons apart from the led unit's weapons so bearer-only
   * modifiers (e.g. "this model's melee attacks have +1 A") don't leak onto the unit. */
  leaderWeapons?: Weapon[]
  combatType: CombatType
  onCombatTypeChange: (t: CombatType) => void
  unitMin?: number
  unitMax?: number
  /** Keys (wKey format) of weapons whose Melta/Rapid Fire half-range bonus is active. */
  meltaActiveKeys?: string[]
  rapidFireActiveKeys?: string[]
  defenderMin?: number
  defenderMax?: number
  overwatchActive?: boolean
  onOverwatchToggle?: () => void
}

function Row({ label, value, detail, highlight }: { label: string; value: string; detail?: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-rim-bright last:border-0 gap-2">
      <span className={`text-xs font-display uppercase tracking-wide shrink-0 ${highlight ? 'text-crimson-bright' : 'text-gold'}`}>
        {label}
      </span>
      <div className="text-right">
        <span className={`text-sm font-mono font-bold ${highlight ? 'text-crimson-bright' : 'text-parchment'}`}>{value}</span>
        {detail && <span className="text-xs font-mono text-parchment-dim ml-2">{detail}</span>}
      </div>
    </div>
  )
}

function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`
}

function fmt(n: number): string {
  return n.toFixed(2)
}

function wKey(w: Weapon): string {
  return `${w.line}:${w.name}`
}

/** [RAPID FIRE X] / [MELTA X]: X is per-weapon (1, 2, 3, D3...) so neither can be a
 * fixed modifier effect — each selected weapon gets its own half-range toggle, keyed
 * by wKey, and the bonus is read directly from that weapon's own value. */
function rapidFireBonusAttacks(weapon: Weapon, activeKeys: string[] = []): number {
  return weapon.rapidFireValue !== '' && activeKeys.includes(wKey(weapon))
    ? parseDiceAverage(weapon.rapidFireValue)
    : 0
}

function meltaBonusDamage(weapon: Weapon, activeKeys: string[] = []): number {
  return weapon.isMelta && activeKeys.includes(wKey(weapon)) ? weapon.meltaValue : 0
}

function CombatTypeSelector({
  combatType, onChange, locked,
}: {
  combatType: CombatType
  onChange: (t: CombatType) => void
  locked: boolean
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {(['ranged', 'melee'] as const).map(t => (
        <button
          key={t}
          onClick={() => !locked && onChange(t)}
          disabled={locked}
          className={`px-4 py-1 text-xs font-display uppercase tracking-wide border transition-colors ${
            combatType === t
              ? 'border-gold bg-gold/20 text-gold-bright'
              : 'border-rim-bright text-parchment-dim hover:border-parchment-dim hover:text-parchment'
          } ${locked ? 'opacity-60 cursor-default' : ''}`}
        >
          {t === 'ranged' ? 'Disparo' : 'CàC'}
        </button>
      ))}
      {locked && <span className="text-xs font-mono text-parchment-dim ml-1">⊙ auto</span>}
    </div>
  )
}

function WeaponBreakdown({ weapon, defenderModel, mods, qty, blastTargetModels, defenderKeywords, meltaActiveKeys, rapidFireActiveKeys }: {
  weapon: Weapon
  defenderModel: ModelProfile
  mods: CombatModifiers
  qty: number
  blastTargetModels: number
  defenderKeywords?: string[]
  meltaActiveKeys?: string[]
  rapidFireActiveKeys?: string[]
}) {
  const [open, setOpen] = useState(false)
  const effectiveMods = {
    ...mods,
    damageMod: mods.damageMod + meltaBonusDamage(weapon, meltaActiveKeys),
    attacksMod: mods.attacksMod + rapidFireBonusAttacks(weapon, rapidFireActiveKeys),
  }
  const calc = calculateDamage(weapon, defenderModel, effectiveMods, defenderKeywords ?? [], blastTargetModels)
  const total = calc.expectedTotalDamage * qty

  return (
    <div className="border border-rim-bright bg-surface-2">
      <div className="flex items-center gap-2 px-3 py-2 hover:bg-surface-3 transition-colors">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex-1 min-w-0 text-left"
        >
          <span className="text-xs font-mono text-parchment truncate block">{weapon.name}</span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-gold-bright w-5 text-center">×{qty}</span>
          <span className="text-sm font-mono font-bold text-crimson-bright w-12 text-right">{fmt(total)}</span>
          <button onClick={() => setOpen(o => !o)} className="text-parchment-dim text-xs w-4">
            {open ? '▲' : '▼'}
          </button>
        </div>
      </div>
      {open && (
        <div className="px-3 py-2 border-t border-rim-bright">
          {calc.blastBonusAttacks != null && (
            <Row label="↳ Blast bonus" value={`+${calc.blastBonusAttacks}A`} highlight />
          )}
          {calc.cleaveBonusAttacks != null && (
            <Row label="↳ Cleave bonus" value={`+${calc.cleaveBonusAttacks}A`} highlight />
          )}
          <Row label="Ataques" value={fmt(calc.avgAttacks)} />
          <Row
            label="Impactos"
            value={fmt(calc.expectedHits)}
            detail={`${fmt(calc.avgAttacks)} × ${pct(calc.hitProbability)}`}
          />
          {calc.sustainedExtraHits > 0 && (
            <Row label="↳ Extra (Sustained)" value={`+${fmt(calc.sustainedExtraHits)}`} highlight />
          )}
          {calc.autoWoundsFromCrits > 0 && (
            <Row label="↳ Auto (Lethal Hits)" value={`+${fmt(calc.autoWoundsFromCrits)}`} highlight />
          )}
          {calc.antiCritWounds > 0 && (
            <Row label="↳ Crit herida" value={`${fmt(calc.antiCritWounds)}`} highlight />
          )}
          <Row
            label="Heridas"
            value={fmt(calc.expectedWounds)}
            detail={calc.autoWoundsFromCrits > 0
              ? `+${fmt(calc.autoWoundsFromCrits)} auto`
              : `${fmt(calc.expectedHits)} × ${pct(calc.woundProbability)}`}
          />
          <Row
            label="Salv. fallidas"
            value={fmt(calc.expectedFailedSaves)}
            detail={`${fmt(calc.expectedWounds)} × ${pct(calc.saveFailProbability)}`}
          />
          <Row label="Daño/herida" value={fmt(calc.avgDamagePerWound)} detail={weapon.D} />
          {calc.fnpProbability > 0 && (
            <Row
              label={`↳ FNP ${calc.feelNoPainThreshold}+`}
              value={`−${fmt(calc.damageBeforeFNP - calc.expectedTotalDamage)}`}
              detail={`${fmt(calc.damageBeforeFNP)} × ${pct(calc.fnpProbability)} ignorado`}
              highlight
            />
          )}
          <Row label="Bajas esperadas" value={fmt(calc.expectedKills * qty)} detail={`/${defenderModel.W}H · ×${qty}`} highlight />
          {calc.standardDeviation > 0 && (
            <Row label="Desv. típica (σ)" value={`±${calc.standardDeviation.toFixed(2)}`} detail="por modelo atacante" />
          )}
          <Row
            label={`P(matar /${defenderModel.W}H)`}
            value={`${(calc.killProbability * 100).toFixed(0)}%`}
            detail="por modelo atacante"
          />
        </div>
      )}
    </div>
  )
}

export function DamageCalculator({
  weapons, weaponQuantities = {}, defenderModel, defenderKeywords = [], attackerName, defenderName, mods,
  leaderMods, leaderWeapons, combatType, onCombatTypeChange,
  unitMin, unitMax, defenderMin, defenderMax, meltaActiveKeys = [], rapidFireActiveKeys = [], overwatchActive = false, onOverwatchToggle,
}: Props) {
  function modsFor(w: Weapon): CombatModifiers {
    return leaderMods && leaderWeapons?.includes(w) ? leaderMods : mods
  }

  const [defenderModels, setDefenderModels] = useState(defenderMin ?? 1)
  const [syncedDefenderMin, setSyncedDefenderMin] = useState(defenderMin)
  if (defenderMin !== syncedDefenderMin) {
    setSyncedDefenderMin(defenderMin)
    setDefenderModels(defenderMin ?? 1)
  }

  function getQty(w: Weapon): number {
    return weaponQuantities[wKey(w)] ?? 1
  }

  const hasBlastWeapons = weapons.some(w => w.isBlast)
  const hasCleaveWeapons = weapons.some(w => w.cleaveValue > 0) || mods.cleaveBonus > 0 || (leaderMods?.cleaveBonus ?? 0) > 0

  function isActive(m: CombatModifiers): boolean {
    return (
      m.hitMod !== 0 || m.rerollHitsOf1 || m.rerollAllHits ||
      m.critThreshold !== 6 || m.sustainedHitsBonus !== 0 || m.lethalHitsBonus ||
      m.cleaveBonus !== 0 || m.devastatingWoundsBonus ||
      m.strengthMod !== 0 || m.rerollWoundsOf1 || m.rerollAllWounds ||
      m.woundMod !== 0 || m.apMod !== 0 || m.saveMod !== 0 ||
      m.attacksMod !== 0 || m.rerollDamageOf1 || m.rerollAllDamage ||
      m.feelNoPainThreshold !== null
    )
  }
  const hasActiveMods = weapons.some(w => isActive(modsFor(w)))

  const weaponLocked = weapons.length > 0

  const compText = unitMin === undefined ? '' :
    unitMin === unitMax
      ? `${unitMin} modelo${unitMin !== 1 ? 's' : ''}`
      : `${unitMin}–${unitMax} modelos`

  const canOverwatch = combatType === 'ranged'

  if (weapons.length === 0 || !defenderModel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-6 gap-4">
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-crimson-dim to-transparent" />
        <CombatTypeSelector combatType={combatType} onChange={onCombatTypeChange} locked={weaponLocked} />
        {canOverwatch && onOverwatchToggle && weapons.length > 0 && (
          <button
            onClick={onOverwatchToggle}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-display uppercase tracking-wide border transition-colors ${
              overwatchActive
                ? 'border-crimson bg-crimson/20 text-crimson-bright'
                : 'border-rim-bright text-parchment-dim hover:border-crimson-dim hover:text-parchment'
            }`}
          >
            <span className="text-[10px]">⚡</span>
            Overwatch
            {overwatchActive && <span className="font-mono normal-case tracking-normal text-[9px] text-crimson-bright ml-1">6+</span>}
          </button>
        )}
        <p className="text-crimson-dim font-display text-xs uppercase tracking-[4px] text-center leading-loose">
          {weapons.length === 0 ? '// selecciona arma\ndel atacante' : '// selecciona\ndefensor'}
        </p>
        <div className="w-px h-12 bg-gradient-to-b from-crimson-dim via-transparent to-transparent" />
      </div>
    )
  }

  const breakdowns = weapons.map(w => {
    const baseMods = modsFor(w)
    const wMods = {
      ...baseMods,
      damageMod: baseMods.damageMod + meltaBonusDamage(w, meltaActiveKeys),
      attacksMod: baseMods.attacksMod + rapidFireBonusAttacks(w, rapidFireActiveKeys),
    }
    return calculateDamage(w, defenderModel, wMods, defenderKeywords, defenderModels)
  })
  const totalDamage = breakdowns.reduce((s, b, i) => s + b.expectedTotalDamage * getQty(weapons[i]), 0)
  const totalKills = breakdowns.reduce((s, b, i) => s + b.expectedKills * getQty(weapons[i]), 0)

  const isSingle = weapons.length === 1
  const calc = breakdowns[0]
  const singleQty = getQty(weapons[0])

  const sigmaTotal = isSingle
    ? calc.standardDeviation * Math.sqrt(singleQty)
    : Math.sqrt(breakdowns.reduce((s, b, i) => s + b.standardDeviation * b.standardDeviation * getQty(weapons[i]), 0))
  const p10Total = Math.max(0, totalDamage - 1.2816 * sigmaTotal)
  const p90Total = totalDamage + 1.2816 * sigmaTotal

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Combat type selector */}
      <CombatTypeSelector combatType={combatType} onChange={onCombatTypeChange} locked={weaponLocked} />

      {/* Overwatch toggle */}
      {canOverwatch && onOverwatchToggle && (
        <div className="flex items-center justify-center">
          <button
            onClick={onOverwatchToggle}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-display uppercase tracking-wide border transition-colors ${
              overwatchActive
                ? 'border-crimson bg-crimson/20 text-crimson-bright'
                : 'border-rim-bright text-parchment-dim hover:border-crimson-dim hover:text-parchment'
            }`}
          >
            <span className="text-[10px]">⚡</span>
            Overwatch
            {overwatchActive && <span className="font-mono normal-case tracking-normal text-[9px] text-crimson-bright ml-1">6+</span>}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center border-b border-rim-bright pb-3">
        <p className="text-xs font-mono text-parchment-dim">
          <span className="text-crimson">{attackerName || '—'}</span>
          <span className="mx-2 text-rim-bright">▶</span>
          <span className="text-gold">{defenderName || '—'}</span>
        </p>
        <p className="text-sm font-display uppercase tracking-wide text-parchment mt-1">
          {isSingle ? weapons[0].name : `${weapons.length} armas`}
        </p>
      </div>

      {/* Composition info */}
      {compText && (
        <div className="flex items-center justify-between bg-surface-3 border border-rim-bright px-3 py-1.5 rounded-sm">
          <span className="text-xs font-display uppercase tracking-wide text-parchment-dim">Composición</span>
          <span className="text-xs font-mono text-gold">{compText}</span>
        </div>
      )}

      {/* Defender models counter */}
      <div className="flex items-center justify-between bg-surface-3 border border-gold/40 px-3 py-2 rounded-sm">
        <div>
          <span className="text-xs font-display uppercase tracking-wide text-gold">Modelos en objetivo</span>
          {defenderMin !== undefined && (
            <span className="block text-[9px] font-mono text-parchment-dim mt-0.5">
              Composición: {defenderMin === defenderMax ? `${defenderMin} modelo${defenderMin !== 1 ? 's' : ''}` : `${defenderMin}–${defenderMax} modelos`}
            </span>
          )}
          {hasBlastWeapons && (
            <span className="block text-[9px] font-mono text-crimson-bright mt-0.5">
              Blast: +{getBlastBonusAttacks(defenderModels)}A extra (+1A cada 5 modelos)
            </span>
          )}
          {hasCleaveWeapons && (
            <span className="block text-[9px] font-mono text-crimson-bright mt-0.5">
              Cleave: +{getBlastBonusAttacks(defenderModels)}A extra por nivel de Cleave (+1A cada 5 modelos)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDefenderModels(n => Math.max(1, defenderMax !== undefined ? Math.min(defenderMax, n - 1) : n - 1))}
            className="w-8 h-8 border border-gold/40 text-parchment hover:border-gold hover:text-gold font-mono text-lg flex items-center justify-center transition-colors"
          >−</button>
          <span className="text-xl font-mono font-bold text-parchment w-8 text-center">{defenderModels}</span>
          <button
            onClick={() => setDefenderModels(n => defenderMax !== undefined ? Math.min(defenderMax, n + 1) : n + 1)}
            className="w-8 h-8 border border-gold/40 text-parchment hover:border-gold hover:text-gold font-mono text-lg flex items-center justify-center transition-colors"
          >+</button>
        </div>
      </div>

      {/* Big number */}
      <div className="flex flex-col items-center py-2">
        <span className="text-xs font-display uppercase tracking-[3px] text-gold-bright mb-1">
          {isSingle
            ? `Daño esperado · ×${singleQty} modelo${singleQty !== 1 ? 's' : ''}`
            : 'Daño esperado total'
          }
        </span>
        <span
          className="text-6xl font-display font-black text-crimson-bright leading-none"
          style={{ textShadow: '0 0 20px #ff2222, 0 0 50px #c41e1e' }}
        >
          {fmt(totalDamage)}
        </span>
        {sigmaTotal > 0 && (
          <span className="text-xs font-mono text-parchment-dim mt-1">
            ±{sigmaTotal.toFixed(1)} σ
            <span className="text-parchment-dim/60 ml-2">({p10Total.toFixed(1)}–{p90Total.toFixed(1)} rango P10–P90)</span>
          </span>
        )}
        <span className="text-xs font-mono text-gold mt-1">
          ≈ {fmt(totalKills)} bajas{defenderModels > 1 ? ` de ${defenderModels}` : ''}
        </span>
        {hasActiveMods && (
          <span className="text-xs font-mono text-gold mt-1 uppercase tracking-wider">
            con modificadores
          </span>
        )}
      </div>

      {/* Single weapon breakdown */}
      {isSingle && (
        <div className="border border-rim-bright bg-surface-2 px-3 py-2">
          <p className="text-xs font-display uppercase tracking-wide text-gold-bright mb-1">
            Desglose
          </p>
          {calc.blastBonusAttacks != null && (
            <Row label="↳ Blast bonus" value={`+${calc.blastBonusAttacks}A`} highlight />
          )}
          {calc.cleaveBonusAttacks != null && (
            <Row label="↳ Cleave bonus" value={`+${calc.cleaveBonusAttacks}A`} highlight />
          )}
          <Row label="Ataques" value={fmt(calc.avgAttacks)} />
          <Row
            label="Impactos"
            value={fmt(calc.expectedHits)}
            detail={`${fmt(calc.avgAttacks)} × ${pct(calc.hitProbability)}`}
          />
          {calc.sustainedExtraHits > 0 && (
            <Row label="↳ Extra (Sustained)" value={`+${fmt(calc.sustainedExtraHits)}`} highlight />
          )}
          {calc.autoWoundsFromCrits > 0 && (
            <Row label="↳ Auto (Lethal Hits)" value={`+${fmt(calc.autoWoundsFromCrits)}`} highlight />
          )}
          {calc.antiCritWounds > 0 && (
            <Row label="↳ Crit herida" value={`${fmt(calc.antiCritWounds)}`} highlight />
          )}
          <Row
            label="Heridas"
            value={fmt(calc.expectedWounds)}
            detail={calc.autoWoundsFromCrits > 0
              ? `+${fmt(calc.autoWoundsFromCrits)} auto`
              : `${fmt(calc.expectedHits)} × ${pct(calc.woundProbability)}`}
          />
          <Row
            label="Salv. fallidas"
            value={fmt(calc.expectedFailedSaves)}
            detail={`${fmt(calc.expectedWounds)} × ${pct(calc.saveFailProbability)}`}
          />
          <Row label="Daño/herida" value={fmt(calc.avgDamagePerWound)} detail={weapons[0].D} />
          {calc.fnpProbability > 0 && (
            <Row
              label={`↳ FNP ${calc.feelNoPainThreshold}+`}
              value={`−${fmt(calc.damageBeforeFNP - calc.expectedTotalDamage)}`}
              detail={`${fmt(calc.damageBeforeFNP)} × ${pct(calc.fnpProbability)} ignorado`}
              highlight
            />
          )}
          <Row label="Bajas esperadas" value={fmt(calc.expectedKills * singleQty)} detail={`/${defenderModel.W}H por modelo`} highlight />
          {calc.autoWoundsFromCrits > 0 && calc.expectedWounds > 0 && (
            <Row
              label="Contribución críticos"
              value={pct(calc.autoWoundsFromCrits / calc.expectedWounds)}
              detail="heridas auto / total"
            />
          )}
          {calc.standardDeviation > 0 && (
            <>
              <Row label="Desv. típica (σ)" value={`±${calc.standardDeviation.toFixed(2)}`} detail="por modelo atacante" />
              <Row label="Rango P10–P90" value={`${calc.percentile10.toFixed(2)} – ${calc.percentile90.toFixed(2)}`} detail="por modelo atacante" />
            </>
          )}
          <Row
            label={`P(matar 1 modelo /${defenderModel.W}H)`}
            value={`${(calc.killProbability * 100).toFixed(0)}%`}
            detail="por modelo atacante"
            highlight
          />
        </div>
      )}

      {/* Multi-weapon breakdown */}
      {!isSingle && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-display uppercase tracking-wide text-gold-bright">
            Desglose por arma
            <span className="normal-case tracking-normal font-mono text-parchment-dim ml-2 text-[9px]">
              · ajusta ×cantidad por arma
            </span>
          </p>
          {weapons.map((w, i) => (
            <WeaponBreakdown
              key={`${w.name}-${i}`}
              weapon={w}
              defenderModel={defenderModel}
              mods={modsFor(w)}
              qty={getQty(w)}
              blastTargetModels={defenderModels}
              defenderKeywords={defenderKeywords}
              meltaActiveKeys={meltaActiveKeys}
              rapidFireActiveKeys={rapidFireActiveKeys}
            />
          ))}
        </div>
      )}

      {/* Overwatch notice */}
      {overwatchActive && (
        <div className="border border-crimson/60 bg-crimson/10 px-3 py-2 text-[10px] font-mono text-crimson-bright leading-relaxed">
          <span className="font-display uppercase tracking-wide">Overwatch activo</span>
          {' '}— impactos a 6+ (tirada sin modificar).
          Las reglas que mejoran Overwatch (ej. Adeptus Astartes 5+) se aplican con el modificador de impacto correspondiente.
          Armas Torrent siguen impactando automáticamente.
        </div>
      )}

      {/* Campana de Gauss */}
      {sigmaTotal > 0.05 && (
        <GaussianChart mean={totalDamage} sigma={sigmaTotal} targetWounds={defenderModel.W * defenderModels} />
      )}

      {/* Context */}
      <div className="text-xs font-mono text-parchment-dim border border-rim-bright p-3 space-y-1 leading-relaxed">
        {isSingle && (() => {
          const displayMods = modsFor(weapons[0])
          return (
          <p>
            <span className="text-gold">Atacante</span>
            {' '}— F:{weapons[0].S}
            {displayMods.strengthMod !== 0 || displayMods.woundMod !== 0
              ? ` (ef.${weapons[0].S + displayMods.strengthMod + displayMods.woundMod})`
              : ''}
            {' '}AP:{weapons[0].AP}
            {(displayMods.apMod !== 0 || displayMods.saveMod !== 0)
              ? ` (PA ef.${calc.effectiveAP})`
              : ''}
            {weapons[0].isTorrent && ' [Torrent]'}
            {(weapons[0].isDevastatingWounds || displayMods.devastatingWoundsBonus) && ' [Devastating Wounds]'}
            {(weapons[0].isLethalHits || displayMods.lethalHitsBonus) && ' [Lethal Hits]'}
            {(weapons[0].sustainedHitsValue + displayMods.sustainedHitsBonus) > 0
              && ` [Sustained ${weapons[0].sustainedHitsValue + displayMods.sustainedHitsBonus}]`}
            {(weapons[0].cleaveValue + displayMods.cleaveBonus) > 0
              && ` [Cleave ${weapons[0].cleaveValue + displayMods.cleaveBonus}]`}
            {weapons[0].isHeavy && ' [Heavy]'}
            {meltaBonusDamage(weapons[0], meltaActiveKeys) > 0 && ` [Melta ½ dist. +${weapons[0].meltaValue}D]`}
            {rapidFireBonusAttacks(weapons[0], rapidFireActiveKeys) > 0 && ` [Rapid Fire ½ dist. +${weapons[0].rapidFireValue}A]`}
            {displayMods.attacksMod !== 0 && ` [+${displayMods.attacksMod}A]`}
            {(displayMods.rerollDamageOf1 || displayMods.rerollAllDamage) && ' [RR Daño]'}
            {overwatchActive && ' [Overwatch 6+]'}
          </p>
          )
        })()}
        <p>
          <span className="text-gold">Defensor</span> — T:{defenderModel.T}
          {' '}Sv:{defenderModel.Sv}
          {defenderModel.invSv && ` Inv:${defenderModel.invSv}`}
          {mods.saveMod < 0 && ' [Cobertura]'}
          {mods.feelNoPainThreshold !== null && ` FNP:${mods.feelNoPainThreshold}+`}
        </p>
        {defenderModel.invSv && (
          <p className="text-parchment-dim/60">* Se aplica la mejor salvación disponible.</p>
        )}
      </div>
    </div>
  )
}
