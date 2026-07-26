import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMissionsData } from '@/infrastructure/data/useMissionsData'
import { useAppDispatch } from '@/store/hooks'
import { createBattle } from '@/store/battleSlice'
import { missionSlug } from '@/core/utils/missionText'
import { ROUTES, battleScorePath } from '@/core/constants/routes'
import type { SecondaryMode } from '@/types'

interface MatcherState {
  player1Name?: string
  player2Name?: string
  deck1?: string
  deck2?: string
}

const selectCls =
  'w-full bg-surface-2 border border-rim-bright text-parchment font-mono text-xs ' +
  'px-2 py-1.5 rounded-none outline-none cursor-pointer ' +
  'focus:border-gold transition-colors'

function ModeToggle({ mode, onChange }: { mode: SecondaryMode; onChange: (m: SecondaryMode) => void }) {
  return (
    <div className="flex gap-1">
      {(['fixed', 'tactical'] as const).map(m => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`flex-1 text-[10px] font-mono uppercase tracking-widest px-2 py-1.5 border transition-colors ${
            mode === m
              ? 'border-crimson-bright text-parchment bg-crimson/10'
              : 'border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment'
          }`}
        >
          {m === 'fixed' ? 'Fija' : 'Táctica'}
        </button>
      ))}
    </div>
  )
}

function PlayerSetupPanel({
  label,
  playerName,
  onPlayerNameChange,
  deck,
  onDeckChange,
  deckOptions,
  mode,
  onModeChange,
  fixedOptions,
  fixedSelected,
  onToggleFixed,
}: {
  label: string
  playerName: string
  onPlayerNameChange: (v: string) => void
  deck: string
  onDeckChange: (v: string) => void
  deckOptions: string[]
  mode: SecondaryMode
  onModeChange: (m: SecondaryMode) => void
  fixedOptions: { id: string; name: string }[]
  fixedSelected: string[]
  onToggleFixed: (id: string) => void
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

      <label className="block text-[9px] font-display uppercase tracking-widest text-gold mt-1">
        Secundarias
      </label>
      <ModeToggle mode={mode} onChange={onModeChange} />

      {mode === 'fixed' && (
        <div className="flex flex-wrap gap-1 mt-1">
          {fixedOptions.map(card => {
            const selected = fixedSelected.includes(card.id)
            const disabled = !selected && fixedSelected.length >= 2
            return (
              <button
                key={card.id}
                type="button"
                disabled={disabled}
                onClick={() => onToggleFixed(card.id)}
                className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 border transition-colors whitespace-nowrap ${
                  selected
                    ? 'border-crimson-bright text-parchment bg-crimson/10'
                    : 'border-rim-bright text-parchment-dim hover:border-crimson hover:text-parchment disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                {card.name}
              </button>
            )
          })}
        </div>
      )}
      {mode === 'tactical' && (
        <p className="text-[10px] font-mono text-parchment-dim italic mt-1">
          Se reparten 2 cartas al azar al empezar; se puede cambiar una por ronda.
        </p>
      )}
    </div>
  )
}

export function BattleNewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state ?? {}) as MatcherState
  const dispatch = useAppDispatch()
  const { missions, loading, error } = useMissionsData()

  const [player1Name, setPlayer1Name] = useState(prefill.player1Name ?? 'Jugador 1')
  const [player2Name, setPlayer2Name] = useState(prefill.player2Name ?? 'Jugador 2')
  const [deck1, setDeck1] = useState(prefill.deck1 ?? '')
  const [deck2, setDeck2] = useState(prefill.deck2 ?? '')
  const [mode1, setMode1] = useState<SecondaryMode>('fixed')
  const [mode2, setMode2] = useState<SecondaryMode>('fixed')
  const [fixed1, setFixed1] = useState<string[]>([])
  const [fixed2, setFixed2] = useState<string[]>([])

  if (loading || error || !missions) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[12px] font-mono text-parchment-dim uppercase tracking-widest">
          {error ?? 'Cargando misiones…'}
        </p>
      </div>
    )
  }

  const fixedOptions = missions.secondaryMissions
    .filter(c => c.sections.some(s => s.chip === 'FIXED'))
    .map(c => ({ id: missionSlug(c.url), name: c.name }))

  function toggleFixed(list: string[], setList: (v: string[]) => void, id: string) {
    if (list.includes(id)) setList(list.filter(x => x !== id))
    else if (list.length < 2) setList([...list, id])
  }

  const canSubmit =
    player1Name.trim() !== '' && player2Name.trim() !== '' && deck1 !== '' && deck2 !== ''
    && (mode1 === 'tactical' || fixed1.length === 2)
    && (mode2 === 'tactical' || fixed2.length === 2)

  function handleSubmit() {
    if (!canSubmit || !missions) return
    const allSecondaryCardIds = missions!.secondaryMissions.map(c => missionSlug(c.url))
    const action = dispatch(createBattle({
      player1: {
        name: player1Name.trim(),
        primaryDeck: deck1,
        secondaryMode: mode1,
        fixedSecondaryCardIds: mode1 === 'fixed' ? [fixed1[0], fixed1[1]] : undefined,
      },
      player2: {
        name: player2Name.trim(),
        primaryDeck: deck2,
        secondaryMode: mode2,
        fixedSecondaryCardIds: mode2 === 'fixed' ? [fixed2[0], fixed2[1]] : undefined,
      },
      allSecondaryCardIds,
    }))
    navigate(battleScorePath(action.payload.id))
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
        <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment">
          Nueva Partida
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <PlayerSetupPanel
          label="Jugador 1"
          playerName={player1Name}
          onPlayerNameChange={setPlayer1Name}
          deck={deck1}
          onDeckChange={setDeck1}
          deckOptions={missions.matrix.rows}
          mode={mode1}
          onModeChange={setMode1}
          fixedOptions={fixedOptions}
          fixedSelected={fixed1}
          onToggleFixed={id => toggleFixed(fixed1, setFixed1, id)}
        />
        <PlayerSetupPanel
          label="Jugador 2"
          playerName={player2Name}
          onPlayerNameChange={setPlayer2Name}
          deck={deck2}
          onDeckChange={setDeck2}
          deckOptions={missions.matrix.rows}
          mode={mode2}
          onModeChange={setMode2}
          fixedOptions={fixedOptions}
          fixedSelected={fixed2}
          onToggleFixed={id => toggleFixed(fixed2, setFixed2, id)}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="text-[12px] font-mono uppercase tracking-widest px-4 py-2.5 border border-crimson-bright text-parchment hover:bg-crimson/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Empezar Partida
      </button>
    </div>
  )
}
