import type { Middleware, UnknownAction } from '@reduxjs/toolkit'
import { api } from '@/infrastructure/api/client'
import type { RosterState } from './rosterSlice'
import type { AuthState } from './authSlice'

// Deliberately not importing RootState from './index': that type is inferred from the
// store, which is configured with this middleware, which would need RootState to type
// itself — a cycle TS can't resolve. This local shape covers everything the middleware
// touches and sidesteps it; store/index.ts is still the source of truth for the real
// RootState used everywhere else.
interface SyncState {
  roster: RosterState
  auth: AuthState
}

/** Debounce window per roster id before a PUT is sent, so rapid edits (typing a points
 * limit, dragging a wargear count) collapse into one request instead of one per keystroke. */
const SYNC_DEBOUNCE_MS = 500

const pendingSyncs = new Map<string, ReturnType<typeof setTimeout>>()

function scheduleSync(token: string, rosterId: string, getState: () => SyncState) {
  const existing = pendingSyncs.get(rosterId)
  if (existing) clearTimeout(existing)
  pendingSyncs.set(
    rosterId,
    setTimeout(() => {
      pendingSyncs.delete(rosterId)
      const roster = getState().roster.rosters.find(r => r.id === rosterId)
      if (!roster) return
      api.putRoster(token, roster).catch(err => {
        console.error('No se pudo sincronizar la lista con el servidor:', err)
      })
    }, SYNC_DEBOUNCE_MS),
  )
}

function affectedRosterId(action: UnknownAction): string | undefined {
  const payload = action.payload as { rosterId?: string; id?: string } | undefined
  return payload?.rosterId ?? payload?.id
}

// Structural actions (a roster coming into/out of existence) sync immediately rather than
// through the debounce below — losing a brand-new roster because the tab closed or a full
// reload happened inside the debounce window would look like data loss, not a sync delay.
const IMMEDIATE_SYNC_ACTIONS = new Set(['roster/createRoster', 'roster/importRosterFromData'])

function syncNow(token: string, rosterId: string, getState: () => SyncState) {
  const pending = pendingSyncs.get(rosterId)
  if (pending) {
    clearTimeout(pending)
    pendingSyncs.delete(rosterId)
  }
  const roster = getState().roster.rosters.find(r => r.id === rosterId)
  if (!roster) return
  api.putRoster(token, roster).catch(err => {
    console.error('No se pudo sincronizar la lista con el servidor:', err)
  })
}

/** Mirrors roster-slice mutations to the backend for whichever user is currently
 * authenticated. Never touches `hydrateRosters`/`resetRosters` — those two are the ones
 * that carry state *from* the server (or clear it), and re-echoing them back out would be
 * pointless at best and a stale-overwrite risk at worst. */
export const rosterSyncMiddleware: Middleware<object, SyncState> = store => next => action => {
  const result = next(action)

  const typedAction = action as UnknownAction
  if (typeof typedAction.type !== 'string' || !typedAction.type.startsWith('roster/')) return result
  if (typedAction.type === 'roster/resetRosters') {
    // Wholesale clear (logout / account switch / failed reload) — drop any in-flight
    // debounced writes rather than let them land against whichever account is current
    // by the time their timer fires.
    for (const timer of pendingSyncs.values()) clearTimeout(timer)
    pendingSyncs.clear()
    return result
  }
  if (typedAction.type === 'roster/hydrateRosters') return result

  const state = store.getState()
  const token = state.auth.token
  if (!token) return result

  if (typedAction.type === 'roster/deleteRoster') {
    const id = (typedAction.payload as { id?: string } | undefined)?.id
    if (id) {
      const pending = pendingSyncs.get(id)
      if (pending) {
        clearTimeout(pending)
        pendingSyncs.delete(id)
      }
      api.deleteRoster(token, id).catch(err => {
        console.error('No se pudo eliminar la lista en el servidor:', err)
      })
    }
    return result
  }

  const rosterId = affectedRosterId(typedAction)
  if (!rosterId) return result

  if (IMMEDIATE_SYNC_ACTIONS.has(typedAction.type)) {
    syncNow(token, rosterId, store.getState)
  } else {
    scheduleSync(token, rosterId, store.getState)
  }

  return result
}
