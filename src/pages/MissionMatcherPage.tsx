import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMissionsData } from '@/infrastructure/data/useMissionsData'
import { missionPrimaryPath, ROUTES } from '@/core/constants/routes'
import { missionSlug } from '@/core/utils/missionText'
import { DECK_COLORS } from '@/core/constants/missionDeckColors'
import { PrimaryMissionSections } from '@/shared/components/PrimaryMissionSections'
import type { MissionsData, PrimaryMissionCard } from '@/types'

const selectCls =
  'w-full bg-surface-2 border border-rim-bright text-parchment font-mono text-xs ' +
  'px-2 py-1.5 rounded-none outline-none cursor-pointer ' +
  'focus:border-gold transition-colors'

function resolveCard(missions: MissionsData, ownDeck: string, opponentDeck: string): PrimaryMissionCard | null {
  const cardName = missions.matrix.grid[ownDeck]?.[opponentDeck]
  if (!cardName) return null
  const deck = missions.primaryMissions.find(d => d.name === ownDeck)
  return deck?.cards.find(c => c.name === cardName) ?? null
}

function PlayerPanel({
  label,
  playerName,
  onPlayerNameChange,
  deck,
  onDeckChange,
  deckOptions,
}: {
  label: string
  playerName: string
  onPlayerNameChange: (v: string) => void
  deck: string
  onDeckChange: (v: string) => void
  deckOptions: string[]
}) {
  return (
    <div className="flex flex-col gap-2 p-3 bg-surface-2 border border-rim-bright">
      <label className="block text-[9px] font-display uppercase tracking-widest text-gold">{label}</label>
      <input
        type="text"
        value={playerName}
        onChange={e => onPlayerNameChange(e.target.value)}
        className="w-full bg-surface-3 border border-rim-bright text-parchment text-[12px] font-mono px-2 py-1.5 focus:outline-none focus:border-crimson-bright"
      />
      <select className={selectCls} value={deck} onChange={e => onDeckChange(e.target.value)}>
        <option value="">— Mazo de misión primaria —</option>
        {deckOptions.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </div>
  )
}

function ResultCard({ playerName, deck, card }: { playerName: string; deck: string; card: PrimaryMissionCard | null }) {
  const colors = DECK_COLORS[card?.deck ?? missionSlug(deck)] ?? DECK_COLORS['take-and-hold']

  if (!card) {
    return (
      <div className="border border-rim-bright bg-surface-2 px-4 py-8 text-center">
        <p className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim">
          Elige el mazo de ambos jugadores
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className={`h-1 ${colors.bar} mb-2`} />
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className={`text-[11px] font-mono uppercase tracking-widest ${colors.text}`}>
            {playerName} · {deck}
          </span>
          <h2 className="text-[15px] font-display uppercase tracking-[2px] text-parchment">
            {card.name}
          </h2>
        </div>
        <Link
          to={missionPrimaryPath(missionSlug(card.url))}
          className="shrink-0 text-[10px] font-mono uppercase tracking-widest text-parchment-dim hover:text-crimson-bright transition-colors mt-1 flex items-center gap-1"
        >
          Ver ficha ›
        </Link>
      </div>
      <PrimaryMissionSections sections={card.sections} accentClass={colors.borderLeft} />
    </div>
  )
}

export function MissionMatcherPage() {
  const navigate = useNavigate()
  const { missions, loading, error } = useMissionsData()
  const [player1Name, setPlayer1Name] = useState('Jugador 1')
  const [player2Name, setPlayer2Name] = useState('Jugador 2')
  const [deck1, setDeck1] = useState('')
  const [deck2, setDeck2] = useState('')

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(ROUTES.CATALOG)}
          className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mb-3 flex items-center gap-1"
        >
          ← Catálogo
        </button>
        <div className="h-1 bg-crimson mb-2" />
        <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment">
          Emparejador de Misiones
        </h1>
        <p className="text-[11px] font-mono uppercase tracking-[2px] text-parchment-dim mt-0.5">
          Elige el mazo de cada jugador para ver su misión primaria resultante
        </p>
      </div>

      {loading && (
        <p className="text-[12px] font-mono text-parchment-dim text-center py-10 uppercase tracking-widest">
          Cargando misiones…
        </p>
      )}

      {error && (
        <p className="text-[12px] font-mono text-parchment-dim text-center py-10 uppercase tracking-widest">
          {error}
        </p>
      )}

      {missions && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            <PlayerPanel
              label="Jugador 1"
              playerName={player1Name}
              onPlayerNameChange={setPlayer1Name}
              deck={deck1}
              onDeckChange={setDeck1}
              deckOptions={missions.matrix.rows}
            />
            <PlayerPanel
              label="Jugador 2"
              playerName={player2Name}
              onPlayerNameChange={setPlayer2Name}
              deck={deck2}
              onDeckChange={setDeck2}
              deckOptions={missions.matrix.rows}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResultCard
              playerName={player1Name}
              deck={deck1}
              card={deck1 && deck2 ? resolveCard(missions, deck1, deck2) : null}
            />
            <ResultCard
              playerName={player2Name}
              deck={deck2}
              card={deck1 && deck2 ? resolveCard(missions, deck2, deck1) : null}
            />
          </div>
        </>
      )}
    </div>
  )
}
