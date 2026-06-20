import { configureStore } from '@reduxjs/toolkit'
import { rosterReducer, type RosterState } from './rosterSlice'

const LS_KEY = 'cogitador-consulta-rosters'

function loadPersistedState(): { roster: RosterState } | undefined {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as RosterState
    parsed.rosters.forEach(r => {
      const legacy = r as unknown as { detachmentId?: string | null }
      if (!Array.isArray(r.detachmentIds)) {
        r.detachmentIds = legacy.detachmentId ? [legacy.detachmentId] : []
      }
    })
    return { roster: parsed }
  } catch {
    return undefined
  }
}

export const store = configureStore({
  reducer: { roster: rosterReducer },
  preloadedState: loadPersistedState(),
})

store.subscribe(() => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(store.getState().roster))
  } catch {
    // localStorage may be full or unavailable; persistence is best-effort
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
