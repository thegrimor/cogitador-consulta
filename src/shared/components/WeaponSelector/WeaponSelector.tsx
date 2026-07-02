import type { Weapon } from '@/types'
import { weaponBaseName } from '@/core/utils/roster'

interface Props {
  weapons: Weapon[]
  quantities: Map<string, number>
}

function Badge({ label }: { label: string }) {
  return (
    <span className="text-[7px] uppercase font-mono px-1 py-0.5 bg-crimson/20 border border-crimson/40 text-crimson-bright leading-none whitespace-nowrap">
      {label}
    </span>
  )
}

function WeaponStatBox({ label, value, dim }: { label: string; value: string | number; dim?: boolean }) {
  return (
    <div className={`flex flex-col items-center border px-2 py-1 min-w-[36px] ${dim ? 'border-rim-bright/30 bg-surface-3/30' : 'border-rim-bright bg-surface-3'}`}>
      <span className={`text-[9px] font-display uppercase tracking-[2px] leading-none mb-0.5 ${dim ? 'text-gold/40' : 'text-gold'}`}>{label}</span>
      <span className={`text-[12px] font-display font-black leading-tight mt-0.5 whitespace-nowrap ${dim ? 'text-crimson-bright/40' : 'text-crimson-bright'}`}>{value}</span>
    </div>
  )
}

function WeaponRow({ weapon, qty }: { weapon: Weapon; qty: number }) {
  const active = qty > 0
  const isMelee = weapon.range.toLowerCase() === 'melee'

  const badges: string[] = []
  if (weapon.isTorrent)           badges.push('Torrent')
  if (weapon.isBlast)             badges.push('Blast')
  if (weapon.isDevastatingWounds) badges.push('Dev. Wounds')
  if (weapon.isLethalHits)        badges.push('Lethal Hits')
  if (weapon.isHeavy)             badges.push('Heavy')
  if (weapon.isTwinLinked)        badges.push('Twin-Linked')
  if (weapon.isMelta)             badges.push(`Melta ${weapon.meltaValue}`)
  if (weapon.sustainedHitsValue > 0) badges.push(`Sustained ${weapon.sustainedHitsValue}`)
  weapon.antiEntries.forEach(e => badges.push(`Anti-${e.keyword} ${e.threshold}+`))
  if (weapon.isAssault)           badges.push('Assault')
  if (weapon.rapidFireValue)      badges.push(`Rapid Fire ${weapon.rapidFireValue}`)
  if (weapon.isHazardous)         badges.push('Hazardous')
  if (weapon.isPistol)            badges.push('Pistol')
  if (weapon.isPsychic)           badges.push('Psychic')
  if (weapon.isPrecision)         badges.push('Precision')
  if (weapon.isOneShot)           badges.push('One Shot')
  if (weapon.isIndirectFire)      badges.push('Indirect Fire')
  if (weapon.isExtraAttacks)      badges.push('Extra Attacks')
  if (weapon.isLance)             badges.push('Lance')
  if (weapon.isConversion)        badges.push('Conversion')
  if (weapon.cleaveValue > 0)     badges.push(`Cleave ${weapon.cleaveValue}`)

  return (
    <div
      className={`w-full px-2 py-2 border transition-colors ${
        active
          ? 'border-crimson-bright bg-crimson/10'
          : 'border-rim-bright/40'
      }`}
    >
      <p className={`text-[11px] font-display uppercase tracking-wide mb-1.5 flex items-center gap-1.5 ${active ? 'text-parchment' : 'text-parchment-dim/40'}`}>
        {active && <span className="text-crimson-bright font-bold text-[10px]">x{qty}</span>}
        {weapon.name}
      </p>
      <div className="flex flex-wrap gap-px mb-1.5">
        <WeaponStatBox label="Rango" value={weapon.range} dim={!active} />
        <WeaponStatBox label="A"     value={weapon.A}     dim={!active} />
        <WeaponStatBox label={isMelee ? 'HA' : 'HP'} value={weapon.bsWs} dim={!active} />
        <WeaponStatBox label="F"     value={weapon.S}     dim={!active} />
        <WeaponStatBox label="AP"    value={weapon.AP}    dim={!active} />
        <WeaponStatBox label="D"     value={weapon.D}     dim={!active} />
      </div>
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {badges.map(b => <Badge key={b} label={b} />)}
        </div>
      )}
    </div>
  )
}

export function WeaponSelector({ weapons, quantities }: Props) {
  if (weapons.length === 0) return null

  const ranged = weapons.filter(w => w.range.toLowerCase() !== 'melee')
  const melee = weapons.filter(w => w.range.toLowerCase() === 'melee')

  return (
    <div className="space-y-2">
      {ranged.length > 0 && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mb-1">A Distancia</p>
          <div className="flex flex-col gap-1">
            {ranged.map(w => (
              <WeaponRow key={w.line} weapon={w} qty={quantities.get(weaponBaseName(w.name)) ?? 0} />
            ))}
          </div>
        </div>
      )}
      {melee.length > 0 && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mb-1">Cuerpo a Cuerpo</p>
          <div className="flex flex-col gap-1">
            {melee.map(w => (
              <WeaponRow key={w.line} weapon={w} qty={quantities.get(weaponBaseName(w.name)) ?? 0} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
