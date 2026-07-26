import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  Battle, BattlePlayerSetup, BattleRound, BattleRoundPlayerState,
  ConditionKey, ConditionSelectionState, TacticalDeckState,
} from '@/types'
import { emptySelectionState } from '@/core/utils/battleScoring'

export interface BattleState {
  battles: Battle[]
}

const initialState: BattleState = {
  battles: [],
}

type PlayerSlot = 'player1' | 'player2'
type ConditionTarget = 'primary' | { secondaryCardId: string }

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function makeTacticalDeck(allSecondaryCardIds: string[]): TacticalDeckState {
  const deck = shuffle(allSecondaryCardIds)
  const hand = deck.splice(0, 2)
  return { deck, hand, discard: [] }
}

function activeSecondaryCardIds(player: BattlePlayerSetup, tactical?: TacticalDeckState): string[] {
  return player.secondaryMode === 'fixed' ? (player.fixedSecondaryCardIds ?? []) : (tactical?.hand ?? [])
}

function makeRoundPlayerState(cardIds: string[]): BattleRoundPlayerState {
  const secondarySelections: Record<string, ConditionSelectionState> = {}
  cardIds.forEach(id => { secondarySelections[id] = emptySelectionState() })
  return { primarySelection: emptySelectionState(), secondarySelections }
}

function makeRound(
  roundNumber: 1 | 2 | 3 | 4 | 5,
  player1: BattlePlayerSetup,
  player2: BattlePlayerSetup,
  tactical1?: TacticalDeckState,
  tactical2?: TacticalDeckState,
): BattleRound {
  return {
    roundNumber,
    player1: makeRoundPlayerState(activeSecondaryCardIds(player1, tactical1)),
    player2: makeRoundPlayerState(activeSecondaryCardIds(player2, tactical2)),
  }
}

function selectionFor(round: BattleRound, player: PlayerSlot, target: ConditionTarget): ConditionSelectionState {
  const state = round[player]
  if (target === 'primary') return state.primarySelection
  if (!state.secondarySelections[target.secondaryCardId]) {
    state.secondarySelections[target.secondaryCardId] = emptySelectionState()
  }
  return state.secondarySelections[target.secondaryCardId]
}

const battleSlice = createSlice({
  name: 'battle',
  initialState,
  reducers: {
    createBattle: {
      prepare: (payload: { player1: BattlePlayerSetup; player2: BattlePlayerSetup; allSecondaryCardIds: string[] }) => {
        const tactical1 = payload.player1.secondaryMode === 'tactical'
          ? makeTacticalDeck(payload.allSecondaryCardIds) : undefined
        const tactical2 = payload.player2.secondaryMode === 'tactical'
          ? makeTacticalDeck(payload.allSecondaryCardIds) : undefined
        return {
          payload: {
            id: crypto.randomUUID(),
            player1: payload.player1,
            player2: payload.player2,
            tactical1,
            tactical2,
            createdAt: new Date().toISOString(),
          },
        }
      },
      reducer: (
        state,
        action: PayloadAction<{
          id: string
          player1: BattlePlayerSetup
          player2: BattlePlayerSetup
          tactical1?: TacticalDeckState
          tactical2?: TacticalDeckState
          createdAt: string
        }>,
      ) => {
        const { id, player1, player2, tactical1, tactical2, createdAt } = action.payload
        state.battles.push({
          id,
          player1,
          player2,
          player1Tactical: tactical1,
          player2Tactical: tactical2,
          rounds: [makeRound(1, player1, player2, tactical1, tactical2)],
          eob: { player1Primary: emptySelectionState(), player2Primary: emptySelectionState() },
          currentRound: 1,
          finished: false,
          createdAt,
          updatedAt: createdAt,
        })
      },
    },

    deleteBattle: (state, action: PayloadAction<{ id: string }>) => {
      state.battles = state.battles.filter(b => b.id !== action.payload.id)
    },

    toggleCondition: (
      state,
      action: PayloadAction<{
        battleId: string
        roundNumber: number
        player: PlayerSlot
        target: ConditionTarget
        key: ConditionKey
        clearKeys?: ConditionKey[]
      }>,
    ) => {
      const battle = state.battles.find(b => b.id === action.payload.battleId)
      const round = battle?.rounds.find(r => r.roundNumber === action.payload.roundNumber)
      if (!battle || !round) return
      const selection = selectionFor(round, action.payload.player, action.payload.target)
      selection.checked[action.payload.key] = !selection.checked[action.payload.key]
      action.payload.clearKeys?.forEach(k => { selection.checked[k] = false })
      battle.updatedAt = new Date().toISOString()
    },

    setConditionCount: (
      state,
      action: PayloadAction<{
        battleId: string
        roundNumber: number
        player: PlayerSlot
        target: ConditionTarget
        key: ConditionKey
        count: number
      }>,
    ) => {
      const battle = state.battles.find(b => b.id === action.payload.battleId)
      const round = battle?.rounds.find(r => r.roundNumber === action.payload.roundNumber)
      if (!battle || !round) return
      const selection = selectionFor(round, action.payload.player, action.payload.target)
      selection.counts[action.payload.key] = Math.max(0, action.payload.count)
      battle.updatedAt = new Date().toISOString()
    },

    toggleEobCondition: (
      state,
      action: PayloadAction<{ battleId: string; player: PlayerSlot; key: ConditionKey; clearKeys?: ConditionKey[] }>,
    ) => {
      const battle = state.battles.find(b => b.id === action.payload.battleId)
      if (!battle) return
      const slot = action.payload.player === 'player1' ? battle.eob.player1Primary : battle.eob.player2Primary
      slot.checked[action.payload.key] = !slot.checked[action.payload.key]
      action.payload.clearKeys?.forEach(k => { slot.checked[k] = false })
      battle.updatedAt = new Date().toISOString()
    },

    setEobConditionCount: (
      state,
      action: PayloadAction<{ battleId: string; player: PlayerSlot; key: ConditionKey; count: number }>,
    ) => {
      const battle = state.battles.find(b => b.id === action.payload.battleId)
      if (!battle) return
      const slot = action.payload.player === 'player1' ? battle.eob.player1Primary : battle.eob.player2Primary
      slot.counts[action.payload.key] = Math.max(0, action.payload.count)
      battle.updatedAt = new Date().toISOString()
    },

    swapTacticalCard: (
      state,
      action: PayloadAction<{ battleId: string; player: PlayerSlot; cardId: string }>,
    ) => {
      const battle = state.battles.find(b => b.id === action.payload.battleId)
      if (!battle) return
      const tactical = action.payload.player === 'player1' ? battle.player1Tactical : battle.player2Tactical
      if (!tactical) return
      const idx = tactical.hand.indexOf(action.payload.cardId)
      if (idx === -1) return
      tactical.hand.splice(idx, 1)
      tactical.discard.push(action.payload.cardId)
      if (tactical.deck.length === 0) {
        tactical.deck = shuffle(tactical.discard)
        tactical.discard = []
      }
      const next = tactical.deck.shift()
      if (next) tactical.hand.push(next)
      battle.updatedAt = new Date().toISOString()
    },

    advanceRound: (state, action: PayloadAction<{ battleId: string }>) => {
      const battle = state.battles.find(b => b.id === action.payload.battleId)
      if (!battle || battle.rounds.length >= 5) return
      const nextNumber = (battle.rounds.length + 1) as 1 | 2 | 3 | 4 | 5
      battle.rounds.push(makeRound(nextNumber, battle.player1, battle.player2, battle.player1Tactical, battle.player2Tactical))
      battle.currentRound = nextNumber
      battle.updatedAt = new Date().toISOString()
    },

    setCurrentRound: (state, action: PayloadAction<{ battleId: string; roundNumber: 1 | 2 | 3 | 4 | 5 }>) => {
      const battle = state.battles.find(b => b.id === action.payload.battleId)
      if (!battle) return
      battle.currentRound = action.payload.roundNumber
    },

    finishBattle: (state, action: PayloadAction<{ battleId: string }>) => {
      const battle = state.battles.find(b => b.id === action.payload.battleId)
      if (!battle) return
      battle.finished = true
      battle.updatedAt = new Date().toISOString()
    },
  },
})

export const {
  createBattle,
  deleteBattle,
  toggleCondition,
  setConditionCount,
  toggleEobCondition,
  setEobConditionCount,
  swapTacticalCard,
  advanceRound,
  setCurrentRound,
  finishBattle,
} = battleSlice.actions

export const battleReducer = battleSlice.reducer

export function selectAllBattles(state: { battle: BattleState }): Battle[] {
  return state.battle.battles
}

export function selectBattleById(state: { battle: BattleState }, id: string): Battle | undefined {
  return state.battle.battles.find(b => b.id === id)
}
