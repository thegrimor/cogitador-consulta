import { createAsyncThunk } from '@reduxjs/toolkit'
import { api, ApiError } from '@/infrastructure/api/client'
import { authLoading, credentialsSet, credentialsCleared, authFailed } from './authSlice'
import { hydrateRosters, resetRosters } from './rosterSlice'
import type { AppDispatch, RootState } from './index'
import type { RosterList } from '@/types'

const LEGACY_ROSTERS_KEY = 'cogitador-consulta-rosters'

/** Older localStorage rosters (pre-`detachmentIds[]`) carried a single `detachmentId`
 * field. Same migration store/index.ts used to run on every load, applied here instead
 * since it now only matters for this one-time import. */
function normalizeLegacyRoster(roster: RosterList): RosterList {
  const legacy = roster as unknown as RosterList & { detachmentId?: string | null }
  if (Array.isArray(roster.detachmentIds)) return roster
  return { ...roster, detachmentIds: legacy.detachmentId ? [legacy.detachmentId] : [] }
}

/** One-time courtesy: if this account has no rosters yet on the server and this browser
 * still holds pre-account rosters under the old localStorage key, adopt them into the
 * account instead of silently orphaning them. The legacy key is removed once migrated (or
 * once found empty) so this only ever runs once per browser. */
async function migrateLegacyRostersIfEmpty(
  token: string,
  serverRosters: RosterList[],
): Promise<RosterList[]> {
  if (serverRosters.length > 0) return serverRosters

  let legacyRaw: string | null
  try {
    legacyRaw = localStorage.getItem(LEGACY_ROSTERS_KEY)
  } catch {
    return serverRosters
  }
  if (!legacyRaw) return serverRosters

  try {
    const legacy = JSON.parse(legacyRaw) as { rosters?: RosterList[] }
    const rosters = (legacy.rosters ?? []).map(normalizeLegacyRoster)
    if (rosters.length === 0) {
      localStorage.removeItem(LEGACY_ROSTERS_KEY)
      return serverRosters
    }
    for (const roster of rosters) {
      await api.putRoster(token, roster)
    }
    localStorage.removeItem(LEGACY_ROSTERS_KEY)
    return rosters
  } catch {
    // Malformed legacy data — leave it alone rather than risk losing it.
    return serverRosters
  }
}

async function fetchAndHydrateRosters(dispatch: AppDispatch, token: string) {
  const { rosters } = await api.listRosters(token)
  const finalRosters = await migrateLegacyRostersIfEmpty(token, rosters)
  dispatch(hydrateRosters(finalRosters))
}

function authErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback
}

/** Runs once on app load. Validates any persisted token and, only if it's still good,
 * repopulates roster state from the backend. Every path — valid token, invalid token, no
 * token — routes through `resetRosters` first so a stale reload never shows a previous
 * session's lists. */
export const bootstrapAuth = createAsyncThunk<void, void, { state: RootState; dispatch: AppDispatch }>(
  'auth/bootstrap',
  async (_, { dispatch, getState }) => {
    const token = getState().auth.token
    if (!token) {
      dispatch(resetRosters())
      return
    }
    dispatch(authLoading())
    try {
      const { user } = await api.me(token)
      dispatch(resetRosters())
      dispatch(credentialsSet({ user, token }))
      await fetchAndHydrateRosters(dispatch, token)
    } catch {
      dispatch(resetRosters())
      dispatch(credentialsCleared())
    }
  },
)

export const login = createAsyncThunk<
  boolean,
  { username: string; password: string },
  { dispatch: AppDispatch }
>('auth/login', async ({ username, password }, { dispatch }) => {
  dispatch(authLoading())
  try {
    const { token, user } = await api.login(username, password)
    dispatch(resetRosters())
    dispatch(credentialsSet({ user, token }))
    await fetchAndHydrateRosters(dispatch, token)
    return true
  } catch (err) {
    dispatch(authFailed(authErrorMessage(err, 'No se pudo iniciar sesión.')))
    return false
  }
})

export const register = createAsyncThunk<
  boolean,
  { username: string; password: string },
  { dispatch: AppDispatch }
>('auth/register', async ({ username, password }, { dispatch }) => {
  dispatch(authLoading())
  try {
    const { token, user } = await api.register(username, password)
    dispatch(resetRosters())
    dispatch(credentialsSet({ user, token }))
    await fetchAndHydrateRosters(dispatch, token)
    return true
  } catch (err) {
    dispatch(authFailed(authErrorMessage(err, 'No se pudo crear la cuenta.')))
    return false
  }
})

/** Also used internally whenever we switch accounts, so no roster mutation from the
 * previous session can land on the new one mid-flight. */
export const logout = createAsyncThunk<void, void, { dispatch: AppDispatch }>(
  'auth/logout',
  async (_, { dispatch }) => {
    dispatch(resetRosters())
    dispatch(credentialsCleared())
  },
)
