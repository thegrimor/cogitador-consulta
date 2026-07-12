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
    <div className={`flex flex-col items-center border px-1.5 py-0.5 min-w-[32px] ${dim ? 'border-rim-bright/30 bg-surface-3/30' : 'border-rim-bright bg-surface-3'}`}>
      <span className={`text-[8px] font-mono uppercase leading-none ${dim ? 'text-parchment-dim/40' : 'text-parchment-dim'}`}>{label}</span>
      <span className={`text-[11px] font-display leading-tight mt-0.5 whitespace-nowrap ${dim ? 'text-parchment-dim/40' : 'text-parchment'}`}>{value}</span>
    </div>
  )
}

function weaponBadges(weapon: Weapon): string[] {
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
  return badges
}

function WeaponRow({ weapon, qty, alt }: { weapon: Weapon; qty: number; alt: boolean }) {
  const active = qty > 0
  const isMelee = weapon.range.toLowerCase() === 'melee'
  const badges = weaponBadges(weapon)

  return (
    <div className={`px-2.5 py-1.5 ${alt ? 'bg-surface-3/50' : 'bg-surface-2'}`}>
      <p className={`text-[11px] font-display uppercase tracking-wide mb-1 flex items-center gap-1.5 ${active ? 'text-parchment' : 'text-parchment-dim/40'}`}>
        {active && <span className="text-crimson-bright font-bold text-[10px]">x{qty}</span>}
        {weapon.name}
      </p>
      <div className="flex flex-wrap gap-px mb-1">
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

function WeaponGroup({ title, weapons, quantities }: { title: string; weapons: Weapon[]; quantities: Map<string, number> }) {
  if (weapons.length === 0) return null

  return (
    <div className="border border-rim-bright">
      <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim px-2.5 py-1 bg-surface-3 border-b border-rim-bright">
        {title}
      </p>
      <div className="divide-y divide-rim-bright/50">
        {weapons.map((w, i) => (
          <WeaponRow key={w.line} weapon={w} qty={quantities.get(weaponBaseName(w.name)) ?? 0} alt={i % 2 === 1} />
        ))}
      </div>
    </div>
  )
}

export function WeaponSelector({ weapons, quantities }: Props) {
  if (weapons.length === 0) return null

  const ranged = weapons.filter(w => w.range.toLowerCase() !== 'melee')
  const melee = weapons.filter(w => w.range.toLowerCase() === 'melee')

  return (
    <div className="space-y-2">
      <WeaponGroup title="A Distancia" weapons={ranged} quantities={quantities} />
      <WeaponGroup title="Cuerpo a Cuerpo" weapons={melee} quantities={quantities} />
    </div>
  )
}
