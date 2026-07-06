import { parseDiceAverage } from '../../utils/mathhammer'
import type { Weapon } from '@/types'

interface Props {
  weapon: Weapon
  isSelected: boolean
  onSelect: (w: Weapon) => void
  heavyModActive?: boolean
  onHeavyToggle?: () => void
  meltaModActive?: boolean
  onMeltaToggle?: () => void
  rapidFireModActive?: boolean
  onRapidFireToggle?: () => void
}

function Badge({ label }: { label: string }) {
  return (
    <span className="text-[7px] uppercase font-mono px-1 py-0.5 bg-crimson/20 border border-crimson/40 text-crimson-bright leading-none">
      {label}
    </span>
  )
}

export function WeaponCard({
  weapon, isSelected, onSelect, heavyModActive, onHeavyToggle, meltaModActive, onMeltaToggle,
  rapidFireModActive, onRapidFireToggle,
}: Props) {
  const avgD = parseDiceAverage(weapon.D)
  const avgA = parseDiceAverage(weapon.A)
  const dFixed = parseFloat(weapon.D)
  const aFixed = parseFloat(weapon.A)

  const hasBadges = weapon.isTorrent || weapon.isBlast || weapon.isDevastatingWounds ||
    weapon.isLethalHits || weapon.isHeavy || weapon.sustainedHitsValue > 0 || weapon.isTwinLinked ||
    weapon.isMelta || weapon.antiEntries.length > 0 ||
    weapon.isAssault || weapon.rapidFireValue !== '' || weapon.isHazardous || weapon.isPistol ||
    weapon.isPsychic || weapon.isPrecision || weapon.isOneShot || weapon.isIndirectFire ||
    weapon.isExtraAttacks || weapon.isLance || weapon.cleaveValue > 0 || weapon.isConversion

  return (
    <button
      onClick={() => onSelect(weapon)}
      className={`w-full text-left p-2 border-b border-rim-bright transition-colors hover:bg-surface-3 ${
        isSelected
          ? 'border-l-2 border-l-gold bg-gold/5'
          : 'border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className={`text-sm font-mono font-bold truncate ${isSelected ? 'text-gold' : 'text-parchment'}`}>
          {weapon.name}
        </span>
        <span className="text-xs text-parchment-dim font-mono shrink-0">{weapon.range}</span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs font-mono text-parchment-dim">
        <span title="Ataques">
          A:{weapon.A}{!isNaN(aFixed) && avgA !== aFixed ? ` (≈${avgA.toFixed(1)})` : ''}
        </span>
        <span title="Impacto/Habilidad de combate">{weapon.range === 'Melee' ? 'WS' : 'BS'}:{weapon.bsWs}</span>
        <span title="Fuerza">F:{weapon.S}</span>
        <span title="Penetración de armadura">AP:{weapon.AP}</span>
        <span title="Daño">
          D:{weapon.D}{!isNaN(dFixed) && avgD !== dFixed ? ` (≈${avgD.toFixed(1)})` : ''}
        </span>
      </div>

      {hasBadges && (
        <div className="flex gap-1 mt-1 flex-wrap items-center">
          {weapon.isTorrent           && <Badge label="Torrent" />}
          {weapon.isBlast             && <Badge label="Blast" />}
          {weapon.isDevastatingWounds && <Badge label="Dev. Wounds" />}
          {weapon.isLethalHits        && <Badge label="Lethal Hits" />}
          {weapon.isHeavy             && <Badge label="Heavy" />}
          {weapon.isTwinLinked        && <Badge label="Twin-Linked" />}
          {weapon.isMelta             && <Badge label={`Melta ${weapon.meltaValue}`} />}
          {weapon.sustainedHitsValue > 0 && <Badge label={`Sustained ${weapon.sustainedHitsValue}`} />}
          {weapon.antiEntries.map((entry, i) => (
            <Badge key={i} label={`Anti-${entry.keyword} ${entry.threshold}+`} />
          ))}
          {weapon.isAssault      && <Badge label="Assault" />}
          {weapon.rapidFireValue !== '' && <Badge label={`Rapid Fire ${weapon.rapidFireValue}`} />}
          {weapon.isHazardous    && <Badge label="Hazardous" />}
          {weapon.isPistol       && <Badge label="Pistol" />}
          {weapon.isPsychic      && <Badge label="Psychic" />}
          {weapon.isPrecision    && <Badge label="Precision" />}
          {weapon.isOneShot      && <Badge label="One Shot" />}
          {weapon.isIndirectFire && <Badge label="Indirect Fire" />}
          {weapon.isExtraAttacks && <Badge label="Extra Attacks" />}
          {weapon.isLance        && <Badge label="Lance" />}
          {weapon.cleaveValue > 0 && <Badge label={`Cleave ${weapon.cleaveValue}`} />}
          {weapon.isConversion   && <Badge label="Conversion" />}
          {weapon.isHeavy && onHeavyToggle && (
            <button
              onClick={e => { e.stopPropagation(); onHeavyToggle() }}
              className={`text-[8px] px-1.5 py-0.5 border font-mono transition-colors ${
                heavyModActive
                  ? 'border-crimson text-crimson bg-crimson/10'
                  : 'border-rim-bright text-parchment-dim hover:border-gold/50'
              }`}
            >
              {heavyModActive ? '▶ Movido (−1)' : '○ Se movió'}
            </button>
          )}
          {weapon.isMelta && onMeltaToggle && (
            <button
              onClick={e => { e.stopPropagation(); onMeltaToggle() }}
              className={`text-[8px] px-1.5 py-0.5 border font-mono transition-colors ${
                meltaModActive
                  ? 'border-crimson text-crimson bg-crimson/10'
                  : 'border-rim-bright text-parchment-dim hover:border-gold/50'
              }`}
            >
              {meltaModActive ? `▶ ½ dist. (+${weapon.meltaValue}D)` : '○ ½ distancia'}
            </button>
          )}
          {weapon.rapidFireValue !== '' && onRapidFireToggle && (
            <button
              onClick={e => { e.stopPropagation(); onRapidFireToggle() }}
              className={`text-[8px] px-1.5 py-0.5 border font-mono transition-colors ${
                rapidFireModActive
                  ? 'border-crimson text-crimson bg-crimson/10'
                  : 'border-rim-bright text-parchment-dim hover:border-gold/50'
              }`}
            >
              {rapidFireModActive ? `▶ ½ dist. (+${weapon.rapidFireValue}A)` : '○ ½ distancia'}
            </button>
          )}
        </div>
      )}
    </button>
  )
}
