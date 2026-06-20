import type { Weapon } from '@/types'

interface Props {
  weapons: Weapon[]
  selectedNames: Set<string>
  onToggle: (weaponName: string) => void
}

function WeaponRow({ weapon, selected, onToggle }: { weapon: Weapon; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between gap-2 text-left px-2 py-1 border transition-colors ${
        selected
          ? 'border-crimson-bright text-parchment bg-crimson/10'
          : 'border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment'
      }`}
    >
      <span className="text-[11px] font-mono uppercase tracking-wide truncate">{weapon.name}</span>
      <span className="text-[10px] font-mono text-parchment-dim shrink-0">
        A:{weapon.A} · {weapon.range.toLowerCase() === 'melee' ? 'HA' : 'HP'}:{weapon.bsWs} · F{weapon.S} · AP
        {weapon.AP} · D{weapon.D}
      </span>
    </button>
  )
}

export function WeaponSelector({ weapons, selectedNames, onToggle }: Props) {
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
              <WeaponRow
                key={w.line}
                weapon={w}
                selected={selectedNames.has(w.name.toLowerCase())}
                onToggle={() => onToggle(w.name)}
              />
            ))}
          </div>
        </div>
      )}
      {melee.length > 0 && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim mb-1">Cuerpo a Cuerpo</p>
          <div className="flex flex-col gap-1">
            {melee.map(w => (
              <WeaponRow
                key={w.line}
                weapon={w}
                selected={selectedNames.has(w.name.toLowerCase())}
                onToggle={() => onToggle(w.name)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
