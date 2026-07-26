import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMissionsData } from '@/infrastructure/data/useMissionsData'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import {
  selectBattleById, toggleCondition, setConditionCount,
  toggleEobCondition, setEobConditionCount, swapTacticalCard,
  advanceRound, setCurrentRound, finishBattle,
} from '@/store/battleSlice'
import { resolveCard, missionSlug } from '@/core/utils/missionText'
import { scoreRoundForPlayer, scorePrimarySections, emptySelectionState, computeBattleTotals } from '@/core/utils/battleScoring'
import { PrimaryMissionSections } from '@/shared/components/PrimaryMissionSections'
import { SecondaryMissionSections } from '@/shared/components/SecondaryMissionSections'
import { VpBadge } from '@/shared/components/VpBadge'
import { ROUTES } from '@/core/constants/routes'
import { DECK_COLORS } from '@/core/constants/missionDeckColors'
import type { Battle, BattleRoundPlayerState, ConditionKey, SecondaryMissionCard, MissionsData } from '@/types'

type PlayerSlot = 'player1' | 'player2'

function deckColorsFor(deck: string | undefined) {
  return DECK_COLORS[deck ?? ''] ?? DECK_COLORS['take-and-hold']
}

function PlayerScorePanel({
  battle,
  missions,
  slot,
  roundNumber,
  roundState,
  swappedThisRound,
  onSwap,
}: {
  battle: Battle
  missions: MissionsData
  slot: PlayerSlot
  roundNumber: number
  roundState: BattleRoundPlayerState
  swappedThisRound: boolean
  onSwap: (cardId: string) => void
}) {
  const dispatch = useAppDispatch()
  const player = battle[slot]
  const opponent = battle[slot === 'player1' ? 'player2' : 'player1']
  const tactical = slot === 'player1' ? battle.player1Tactical : battle.player2Tactical
  const primaryCard = resolveCard(missions, player.primaryDeck, opponent.primaryDeck)
  const colors = deckColorsFor(primaryCard?.deck)

  const activeCardIds = player.secondaryMode === 'fixed'
    ? (player.fixedSecondaryCardIds ?? [])
    : (tactical?.hand ?? [])

  const secondaryCards = activeCardIds
    .map(id => missions.secondaryMissions.find(c => missionSlug(c.url) === id))
    .filter((c): c is SecondaryMissionCard => !!c)

  const roundTotal = scoreRoundForPlayer(
    primaryCard?.sections ?? [],
    roundState.primarySelection,
    secondaryCards.map(c => ({
      sections: c.sections,
      selection: roundState.secondarySelections[missionSlug(c.url)] ?? emptySelectionState(),
    })),
  )

  function togglePrimary(key: ConditionKey, clearKeys?: ConditionKey[]) {
    dispatch(toggleCondition({ battleId: battle.id, roundNumber, player: slot, target: 'primary', key, clearKeys }))
  }
  function countPrimary(key: ConditionKey, count: number) {
    dispatch(setConditionCount({ battleId: battle.id, roundNumber, player: slot, target: 'primary', key, count }))
  }
  function toggleSecondary(cardId: string, key: ConditionKey, clearKeys?: ConditionKey[]) {
    dispatch(toggleCondition({ battleId: battle.id, roundNumber, player: slot, target: { secondaryCardId: cardId }, key, clearKeys }))
  }
  function countSecondary(cardId: string, key: ConditionKey, count: number) {
    dispatch(setConditionCount({ battleId: battle.id, roundNumber, player: slot, target: { secondaryCardId: cardId }, key, count }))
  }

  return (
    <div className="flex flex-col gap-3 min-w-0 bg-surface-2/40 border border-rim-bright p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[14px] font-display uppercase tracking-widest text-parchment">{player.name}</h2>
        <VpBadge value={roundTotal} />
      </div>

      {!primaryCard ? (
        <p className="text-[11px] font-mono text-parchment-dim uppercase tracking-widest">
          Sin misión primaria resuelta para este mazo
        </p>
      ) : (
        <div>
          <p className={`text-[10px] font-mono uppercase tracking-widest ${colors.text} mb-1`}>{primaryCard.name}</p>
          <PrimaryMissionSections
            sections={primaryCard.sections}
            accentClass={colors.borderLeft}
            interactive={{
              selection: roundState.primarySelection,
              onToggle: togglePrimary,
              onCountChange: countPrimary,
              showEob: false,
            }}
          />
        </div>
      )}

      {secondaryCards.map(card => {
        const cardId = missionSlug(card.url)
        return (
          <div key={cardId}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim">{card.name}</p>
              {player.secondaryMode === 'tactical' && (
                <button
                  type="button"
                  disabled={swappedThisRound}
                  onClick={() => onSwap(cardId)}
                  className="text-[9px] font-mono uppercase tracking-widest text-parchment-dim hover:text-crimson-bright disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ↺ Cambiar
                </button>
              )}
            </div>
            <SecondaryMissionSections
              sections={card.sections}
              interactive={{
                selection: roundState.secondarySelections[cardId] ?? emptySelectionState(),
                onToggle: (key, clearKeys) => toggleSecondary(cardId, key, clearKeys),
                onCountChange: (key, count) => countSecondary(cardId, key, count),
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

function PlayerEobPanel({ battle, missions, slot }: { battle: Battle; missions: MissionsData; slot: PlayerSlot }) {
  const dispatch = useAppDispatch()
  const player = battle[slot]
  const opponent = battle[slot === 'player1' ? 'player2' : 'player1']
  const primaryCard = resolveCard(missions, player.primaryDeck, opponent.primaryDeck)
  const selection = slot === 'player1' ? battle.eob.player1Primary : battle.eob.player2Primary
  const colors = deckColorsFor(primaryCard?.deck)
  const eobTotal = primaryCard ? scorePrimarySections(primaryCard.sections, selection, { includeEob: true }) : 0

  return (
    <div className="flex flex-col gap-3 min-w-0 bg-surface-2/40 border border-rim-bright p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[14px] font-display uppercase tracking-widest text-parchment">{player.name}</h2>
        <VpBadge value={eobTotal} />
      </div>
      {primaryCard ? (
        <PrimaryMissionSections
          sections={primaryCard.sections}
          accentClass={colors.borderLeft}
          interactive={{
            selection,
            onToggle: (key, clearKeys) => dispatch(toggleEobCondition({ battleId: battle.id, player: slot, key, clearKeys })),
            onCountChange: (key, count) => dispatch(setEobConditionCount({ battleId: battle.id, player: slot, key, count })),
            showEob: true,
          }}
        />
      ) : (
        <p className="text-[11px] font-mono text-parchment-dim uppercase tracking-widest">Sin misión resuelta</p>
      )}
    </div>
  )
}

export function BattleScorePage() {
  const { battleId } = useParams<{ battleId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const battle = useAppSelector(state => (battleId ? selectBattleById(state, battleId) : undefined))
  const { missions, loading, error } = useMissionsData()
  const [viewingRound, setViewingRound] = useState<number | null>(null)
  const [tab, setTab] = useState<'round' | 'eob'>('round')
  const [swapped, setSwapped] = useState<Set<string>>(new Set())

  if (loading || error || !missions) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[12px] font-mono text-parchment-dim uppercase tracking-widest">
          {error ?? 'Cargando misiones…'}
        </p>
      </div>
    )
  }

  if (!battle) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[12px] font-mono text-parchment-dim uppercase tracking-widest">
          Partida no encontrada
        </p>
      </div>
    )
  }

  const roundNumber = viewingRound ?? battle.currentRound
  const round = battle.rounds.find(r => r.roundNumber === roundNumber) ?? battle.rounds[battle.rounds.length - 1]
  const canAdvance = !battle.finished && battle.rounds.length < 5
  const totals = computeBattleTotals(missions, battle)

  function goToRound(n: number) {
    if (!battle) return
    if (n > battle.rounds.length) dispatch(advanceRound({ battleId: battle.id }))
    dispatch(setCurrentRound({ battleId: battle.id, roundNumber: n as 1 | 2 | 3 | 4 | 5 }))
    setViewingRound(n)
    setTab('round')
  }

  function handleSwap(slot: PlayerSlot, cardId: string) {
    if (!battle) return
    dispatch(swapTacticalCard({ battleId: battle.id, player: slot, cardId }))
    setSwapped(prev => new Set(prev).add(`${slot}-${roundNumber}`))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(ROUTES.BATTLES)}
          className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mb-3 flex items-center gap-1"
        >
          ← Partidas
        </button>
        <div className="h-1 bg-crimson mb-2" />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment">
            {battle.player1.name} <span className="text-parchment-dim">vs</span> {battle.player2.name}
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-[12px] font-mono text-gold-bright">
              {totals.player1} – {totals.player2}
            </p>
            {!battle.finished && (
              <button
                onClick={() => dispatch(finishBattle({ battleId: battle.id }))}
                className="text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 border border-crimson-bright text-parchment hover:bg-crimson/10 transition-colors"
              >
                Finalizar Partida
              </button>
            )}
            {battle.finished && (
              <span className="text-[10px] font-mono uppercase tracking-widest text-crimson-bright">Finalizada</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6 flex-wrap">
        {[1, 2, 3, 4, 5].map(n => {
          const exists = n <= battle.rounds.length
          const clickable = exists || (n === battle.rounds.length + 1 && canAdvance)
          return (
            <button
              key={n}
              disabled={!clickable}
              onClick={() => goToRound(n)}
              className={`text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                tab === 'round' && roundNumber === n
                  ? 'border-crimson-bright text-parchment bg-crimson/10'
                  : 'border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment'
              }`}
            >
              Ronda {n}
            </button>
          )
        })}
        <button
          onClick={() => setTab('eob')}
          className={`text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 border transition-colors ${
            tab === 'eob'
              ? 'border-crimson-bright text-parchment bg-crimson/10'
              : 'border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment'
          }`}
        >
          Fin de Partida
        </button>
      </div>

      {tab === 'round' ? (
        <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2">
          <PlayerScorePanel
            battle={battle}
            missions={missions}
            slot="player1"
            roundNumber={roundNumber}
            roundState={round.player1}
            swappedThisRound={swapped.has(`player1-${roundNumber}`)}
            onSwap={cardId => handleSwap('player1', cardId)}
          />
          <PlayerScorePanel
            battle={battle}
            missions={missions}
            slot="player2"
            roundNumber={roundNumber}
            roundState={round.player2}
            swappedThisRound={swapped.has(`player2-${roundNumber}`)}
            onSwap={cardId => handleSwap('player2', cardId)}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2">
          <PlayerEobPanel battle={battle} missions={missions} slot="player1" />
          <PlayerEobPanel battle={battle} missions={missions} slot="player2" />
        </div>
      )}
    </div>
  )
}
