import { configureStore } from '@reduxjs/toolkit'
import { rosterReducer, type RosterState } from './rosterSlice'
import { authReducer, type AuthState } from './authSlice'
import { rosterSyncMiddleware } from './rosterSyncMiddleware'

// Only the auth token is persisted directly. Roster data is NOT blindly mirrored to
// localStorage anymore — it used to be, keyed globally, which is exactly what let one
// user's lists survive into another user's session on reload/login. Rosters now live
// server-side per account and are (re)hydrated by the auth thunks (see authThunks.ts),
// which always run a `resetRosters()` before loading anything in, so a reload or an
// account switch can never show a mix of two users' data.
const AUTH_LS_KEY = 'cogitador-consulta-auth'

function loadPersistedAuth(): { auth: AuthState } | undefined {
  try {
    const raw = localStorage.getItem(AUTH_LS_KEY)
    if (!raw) return undefined
    const { token } = JSON.parse(raw) as { token?: string }
    if (!token) return undefined
    // `user` is intentionally left unset here — bootstrapAuth() validates the token
    // against the server and fills in `user` (or clears everything) before anything
    // renders as authenticated.
    return { auth: { user: null, token, status: 'idle', error: null } }
  } catch {
    return undefined
  }
}

export const store = configureStore({
  reducer: { roster: rosterReducer, auth: authReducer },
  preloadedState: loadPersistedAuth(),
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(rosterSyncMiddleware),
})

store.subscribe(() => {
  try {
    const { token } = store.getState().auth
    if (token) {
      localStorage.setItem(AUTH_LS_KEY, JSON.stringify({ token }))
    } else {
      localStorage.removeItem(AUTH_LS_KEY)
    }
  } catch {
    // localStorage may be full or unavailable; persistence is best-effort
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type { RosterState }
