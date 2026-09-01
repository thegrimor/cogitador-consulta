// Derives a stratagem's turn-timing color from its existing `turn` string instead of a
// separate `color` field in the JSON — `turn` already distinguishes exactly these three
// cases (1346 stratagems checked across all factions), so a second field would just be
// data that can drift out of sync with it. The only normalization needed is the apostrophe
// (source data mixes "Opponent's turn" and "Opponent’s turn").
export type StratagemTurnKind = 'either' | 'own' | 'enemy'

interface TurnColorClasses {
  text: string
  border: string
  borderSoft: string
  borderLeft: string
}

// Tailwind needs the full literal class string at each call site (see missionDeckColors.ts's
// `borderSoft` comment) — these are pre-composed for that reason, not built by concatenation.
const TURN_COLOR_CLASSES: Record<StratagemTurnKind, TurnColorClasses> = {
  either: { text: 'text-turn-either', border: 'border-turn-either', borderSoft: 'border-turn-either/60', borderLeft: 'border-l-turn-either' },
  own: { text: 'text-turn-own', border: 'border-turn-own', borderSoft: 'border-turn-own/60', borderLeft: 'border-l-turn-own' },
  enemy: { text: 'text-turn-enemy', border: 'border-turn-enemy', borderSoft: 'border-turn-enemy/60', borderLeft: 'border-l-turn-enemy' },
}

export function stratagemTurnKind(turn: string | undefined): StratagemTurnKind {
  const t = (turn ?? '').toLowerCase()
  if (t.includes('opponent')) return 'enemy'
  if (t.includes('either')) return 'either'
  return 'own' // "Your turn", and a safe default for anything unrecognized
}

export function stratagemTurnColors(turn: string | undefined): TurnColorClasses {
  return TURN_COLOR_CLASSES[stratagemTurnKind(turn)]
}
