import type { Weapon } from '@/types'

interface Props {
  weapons: Weapon[]
  quantities: Map<string, number>
}

function WeaponRow({ weapon, qty }: { weapon: Weapon; qty: number }) {
  const active = qty > 0
  return (
    <div
      className={`w-full flex items-center justify-between gap-2 px-2 py-1 border transition-colors ${
        active
          ? 'border-crimson-bright text-parchment bg-crimson/10'
          : 'border-rim-bright/40 text-parchment-dim/40'
      }`}
    >
      <span className="text-[11px] font-mono uppercase tracking-wide truncate flex items-center gap-1.5">
        {active && <span className="text-crimson-bright font-bold">x{qty}</span>}
        {weapon.name}
      </span>
      <span className="text-[10px] font-mono text-parchment-dim shrink-0">
        A:{weapon.A} · {weapon.range.toLowerCase() === 'melee' ? 'HA' : 'HP'}:{weapon.bsWs} · F{weapon.S} · AP
        {weapon.AP} · D{weapon.D}
      </span>
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
              <WeaponRow key={w.line} weapon={w} qty={quantities.get(w.name.toLowerCase()) ?? 0} />
            ))}
          </div>
        </div>
      )}
      {melee.length > 0 && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mb-1">Cuerpo a Cuerpo</p>
          <div className="flex flex-col gap-1">
            {melee.map(w => (
              <WeaponRow key={w.line} weapon={w} qty={quantities.get(w.name.toLowerCase()) ?? 0} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
