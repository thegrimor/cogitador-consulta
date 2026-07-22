import { configureStore } from '@reduxjs/toolkit'
import { rosterReducer, type RosterState } from './rosterSlice'
import { battleReducer, type BattleState } from './battleSlice'

const LS_KEY_ROSTERS = 'cogitador-consulta-rosters'
const LS_KEY_BATTLES = 'cogitador-consulta-battles'

function loadPersistedRosterState(): RosterState {
  try {
    const raw = localStorage.getItem(LS_KEY_ROSTERS)
    if (!raw) return { rosters: [] }
    const parsed = JSON.parse(raw) as RosterState
    parsed.rosters.forEach(r => {
      const legacy = r as unknown as { detachmentId?: string | null }
      if (!Array.isArray(r.detachmentIds)) {
        r.detachmentIds = legacy.detachmentId ? [legacy.detachmentId] : []
      }
    })
    return parsed
  } catch {
    return { rosters: [] }
  }
}

function loadPersistedBattleState(): BattleState {
  try {
    const raw = localStorage.getItem(LS_KEY_BATTLES)
    if (!raw) return { battles: [] }
    return JSON.parse(raw) as BattleState
  } catch {
    return { battles: [] }
  }
}

export const store = configureStore({
  reducer: { roster: rosterReducer, battle: battleReducer },
  preloadedState: { roster: loadPersistedRosterState(), battle: loadPersistedBattleState() },
})

store.subscribe(() => {
  try {
    localStorage.setItem(LS_KEY_ROSTERS, JSON.stringify(store.getState().roster))
    localStorage.setItem(LS_KEY_BATTLES, JSON.stringify(store.getState().battle))
  } catch {
    // localStorage may be full or unavailable; persistence is best-effort
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
