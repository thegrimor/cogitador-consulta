import type {
  PrimaryMissionSection, PrimaryMissionTier,
  SecondaryMissionSection,
  ConditionKey, ConditionSelectionState,
  MissionsData, Battle,
} from '@/types'
import { resolveCard, missionSlug } from './missionText'

export function conditionKey(sectionIndex: number, itemIndex: number): ConditionKey {
  return `${sectionIndex}-${itemIndex}`
}

/**
 * Agrupa índices de una sección en "runs" excluyentes según la regla `or`: un item con
 * `or: true` es alternativa del run que viene acumulando desde el último item sin `or`.
 */
export function groupExclusiveRuns(items: { or?: boolean }[]): number[][] {
  const groups: number[][] = []
  items.forEach((item, i) => {
    if (item.or && groups.length > 0) groups[groups.length - 1].push(i)
    else groups.push([i])
  })
  return groups
}

function parseVp(vp: string | number): number {
  return typeof vp === 'number' ? vp : parseInt(vp.replace('+', ''), 10) || 0
}

function parseCap(cap: string | undefined): number | null {
  if (!cap) return null
  const m = cap.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

function scoreSection(
  items: { vp: string | number; or?: boolean }[],
  sectionIndex: number,
  selection: ConditionSelectionState,
  isStepper: (item: { vp: string | number; or?: boolean }, index: number) => boolean,
  cap: number | null,
): number {
  let total = 0
  for (const group of groupExclusiveRuns(items)) {
    if (group.length === 1) {
      const i = group[0]
      const key = conditionKey(sectionIndex, i)
      if (isStepper(items[i], i)) total += parseVp(items[i].vp) * (selection.counts[key] ?? 0)
      else if (selection.checked[key]) total += parseVp(items[i].vp)
    } else {
      // Grupo excluyente (radio): toma el marcado; si por error hay más de uno, el de mayor vp.
      const checked = group.filter(i => selection.checked[conditionKey(sectionIndex, i)])
      if (checked.length > 0) total += Math.max(...checked.map(i => parseVp(items[i].vp)))
    }
  }
  return cap !== null ? Math.min(total, cap) : total
}

export function scorePrimarySections(
  sections: PrimaryMissionSection[],
  selection: ConditionSelectionState,
  opts: { includeEob: boolean },
): number {
  return sections.reduce((sum, section, i) => {
    if ((section.headerKind === 'eob') !== opts.includeEob) return sum
    return sum + scoreSection(section.tiers, i, selection, t => !!(t as PrimaryMissionTier).perUnit, null)
  }, 0)
}

export function scoreSecondaryCard(sections: SecondaryMissionSection[], selection: ConditionSelectionState): number {
  return sections.reduce((sum, section, i) =>
    sum + scoreSection(section.rows, i, selection, () => !!section.perEvent, parseCap(section.cap)), 0)
}

/** Suma el VP de una ronda completa de un jugador: primaria (sin EOB) + sus cartas secundarias activas. */
export function scoreRoundForPlayer(
  primarySections: PrimaryMissionSection[],
  primarySelection: ConditionSelectionState,
  secondaryCards: { sections: SecondaryMissionSection[]; selection: ConditionSelectionState }[],
): number {
  return scorePrimarySections(primarySections, primarySelection, { includeEob: false })
    + secondaryCards.reduce((s, c) => s + scoreSecondaryCard(c.sections, c.selection), 0)
}

export function emptySelectionState(): ConditionSelectionState {
  return { checked: {}, counts: {} }
}

/** Suma el VP total (todas las rondas jugadas + fin de partida) de cada jugador de una partida. */
export function computeBattleTotals(missions: MissionsData, battle: Battle): { player1: number; player2: number } {
  const primarySections = {
    player1: resolveCard(missions, battle.player1.primaryDeck, battle.player2.primaryDeck)?.sections ?? [],
    player2: resolveCard(missions, battle.player2.primaryDeck, battle.player1.primaryDeck)?.sections ?? [],
  }

  function secondaryCardSections(cardId: string): SecondaryMissionSection[] {
    return missions.secondaryMissions.find(c => missionSlug(c.url) === cardId)?.sections ?? []
  }

  function totalForPlayer(slot: 'player1' | 'player2'): number {
    const sections = primarySections[slot]
    const roundsTotal = battle.rounds.reduce((sum, round) => {
      const state = round[slot]
      const secondaryCards = Object.entries(state.secondarySelections).map(([cardId, selection]) => ({
        sections: secondaryCardSections(cardId),
        selection,
      }))
      return sum + scoreRoundForPlayer(sections, state.primarySelection, secondaryCards)
    }, 0)
    const eobSelection = slot === 'player1' ? battle.eob.player1Primary : battle.eob.player2Primary
    return roundsTotal + scorePrimarySections(sections, eobSelection, { includeEob: true })
  }

  return { player1: totalForPlayer('player1'), player2: totalForPlayer('player2') }
}
