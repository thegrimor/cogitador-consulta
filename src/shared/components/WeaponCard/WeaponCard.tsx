import type { Weapon } from '@/types'

interface Props {
  weapon: Weapon
}

function Badge({ label }: { label: string }) {
  return (
    <span className="text-[7px] uppercase font-mono px-1 py-0.5 bg-crimson/20 border border-crimson/40 text-crimson-bright leading-none">
      {label}
    </span>
  )
}

export function WeaponCard({ weapon }: Props) {
  const hasBadges = weapon.isTorrent || weapon.isBlast || weapon.isDevastatingWounds ||
    weapon.isLethalHits || weapon.isHeavy || weapon.sustainedHitsValue > 0 || weapon.isTwinLinked ||
    weapon.isMelta || weapon.antiEntries.length > 0

  return (
    <div className="w-full text-left p-2 border-b border-rim-bright">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-mono font-bold truncate text-parchment">
          {weapon.name}
        </span>
        <span className="text-xs text-parchment-dim font-mono shrink-0">{weapon.range}</span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs font-mono text-parchment-dim">
        <span title="Ataques">A:{weapon.A}</span>
        <span title="Impacto/Habilidad de combate">{weapon.range === 'Melee' ? 'WS' : 'BS'}:{weapon.bsWs}</span>
        <span title="Fuerza">F:{weapon.S}</span>
        <span title="Penetración de armadura">AP:{weapon.AP}</span>
        <span title="Daño">D:{weapon.D}</span>
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
        </div>
      )}

      {weapon.description && (
        <p className="wh-html text-[9px] font-mono text-parchment-dim/60 mt-1 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: weapon.description }}
        />
      )}
    </div>
  )
}
