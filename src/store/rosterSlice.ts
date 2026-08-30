import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RosterList, RosterEntry } from '@/types'

export interface RosterState {
  rosters: RosterList[]
}

const initialState: RosterState = {
  rosters: [],
}

// Points are never cached on the roster or its entries — they're derived fresh from the
// current game data wherever they're displayed (see `resolveRosterTotalPoints` and friends
// in `core/utils/roster.ts`), so a data correction shows up on existing rosters immediately.
// Every mutation here just needs to bump `updatedAt`.
function touch(roster: RosterList) {
  roster.updatedAt = new Date().toISOString()
}

const rosterSlice = createSlice({
  name: 'roster',
  initialState,
  reducers: {
    createRoster: {
      prepare: (payload: { name: string; factionId: string; pointsLimit: number | null }) => ({
        payload: {
          id: crypto.randomUUID(),
          name: payload.name,
          factionId: payload.factionId,
          pointsLimit: payload.pointsLimit,
          createdAt: new Date().toISOString(),
        },
      }),
      reducer: (
        state,
        action: PayloadAction<{ id: string; name: string; factionId: string; pointsLimit: number | null; createdAt: string }>,
      ) => {
        const { id, name, factionId, pointsLimit, createdAt } = action.payload
        state.rosters.push({
          id,
          name,
          factionId,
          detachmentIds: [],
          entries: [],
          pointsLimit,
          createdAt,
          updatedAt: createdAt,
        })
      },
    },

    deleteRoster: (state, action: PayloadAction<{ id: string }>) => {
      state.rosters = state.rosters.filter(r => r.id !== action.payload.id)
    },

    renameRoster: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const roster = state.rosters.find(r => r.id === action.payload.id)
      if (!roster) return
      roster.name = action.payload.name
      touch(roster)
    },

    setPointsLimit: (state, action: PayloadAction<{ id: string; pointsLimit: number | null }>) => {
      const roster = state.rosters.find(r => r.id === action.payload.id)
      if (!roster) return
      roster.pointsLimit = action.payload.pointsLimit
      touch(roster)
    },

    setDetachments: (state, action: PayloadAction<{ rosterId: string; detachmentIds: string[] }>) => {
      const roster = state.rosters.find(r => r.id === action.payload.rosterId)
      if (!roster) return
      roster.detachmentIds = action.payload.detachmentIds
      roster.entries.forEach(e => { e.enhancementId = undefined })
      touch(roster)
    },

    addEntry: {
      prepare: (payload: { rosterId: string; entry: Omit<RosterEntry, 'id'> }) => ({
        payload: { rosterId: payload.rosterId, entry: { ...payload.entry, id: crypto.randomUUID() } },
      }),
      reducer: (state, action: PayloadAction<{ rosterId: string; entry: RosterEntry }>) => {
        const roster = state.rosters.find(r => r.id === action.payload.rosterId)
        if (!roster) return
        roster.entries.push(action.payload.entry)
        touch(roster)
      },
    },

    updateEntry: (
      state,
      action: PayloadAction<{
        rosterId: string
        entryId: string
        changes: Partial<Pick<RosterEntry, 'modelCount' | 'costDescription' | 'customName'>>
      }>,
    ) => {
      const roster = state.rosters.find(r => r.id === action.payload.rosterId)
      if (!roster) return
      const entry = roster.entries.find(e => e.id === action.payload.entryId)
      if (!entry) return
      Object.assign(entry, action.payload.changes)
      touch(roster)
    },

    removeEntry: (state, action: PayloadAction<{ rosterId: string; entryId: string }>) => {
      const roster = state.rosters.find(r => r.id === action.payload.rosterId)
      if (!roster) return
      roster.entries = roster.entries.filter(e => e.id !== action.payload.entryId)
      roster.entries.forEach(e => {
        if (e.attachedToEntryId === action.payload.entryId) e.attachedToEntryId = undefined
      })
      touch(roster)
    },

    setEntryEnhancement: (
      state,
      action: PayloadAction<{ rosterId: string; entryId: string; enhancementId: string | null }>,
    ) => {
      const roster = state.rosters.find(r => r.id === action.payload.rosterId)
      if (!roster) return
      const entry = roster.entries.find(e => e.id === action.payload.entryId)
      if (!entry) return
      entry.enhancementId = action.payload.enhancementId ?? undefined
      touch(roster)
    },

    setEntryAttachment: (
      state,
      action: PayloadAction<{ rosterId: string; entryId: string; attachedToEntryId: string | null }>,
    ) => {
      const roster = state.rosters.find(r => r.id === action.payload.rosterId)
      if (!roster) return
      const entry = roster.entries.find(e => e.id === action.payload.entryId)
      if (!entry) return
      entry.attachedToEntryId = action.payload.attachedToEntryId ?? undefined
      touch(roster)
    },

    setEntryWeaponSelection: (
      state,
      action: PayloadAction<{ rosterId: string; entryId: string; ruleId: string; selection: number[] }>,
    ) => {
      const roster = state.rosters.find(r => r.id === action.payload.rosterId)
      if (!roster) return
      const entry = roster.entries.find(e => e.id === action.payload.entryId)
      if (!entry) return
      if (!entry.weaponOptionSelections) entry.weaponOptionSelections = {}
      entry.weaponOptionSelections[action.payload.ruleId] = action.payload.selection
      touch(roster)
    },

    setEntryWargearSelections: (
      state,
      action: PayloadAction<{
        rosterId: string
        entryId: string
        selections: Record<string, number>
      }>,
    ) => {
      const roster = state.rosters.find(r => r.id === action.payload.rosterId)
      if (!roster) return
      const entry = roster.entries.find(e => e.id === action.payload.entryId)
      if (!entry) return
      entry.wargearSelections = action.payload.selections
      touch(roster)
    },

    importRosterFromData: {
      prepare: (payload: Omit<RosterList, 'id' | 'createdAt' | 'updatedAt'>) => ({
        payload: {
          ...payload,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
      reducer: (state, action: PayloadAction<RosterList>) => {
        state.rosters.push(action.payload)
      },
    },

    /** Replaces the roster list wholesale with what the backend has for the now-current
     * user. Always paired with `resetRosters` beforehand by the auth thunks so a fetch that
     * resolves after a user switch can never merge into the wrong account's state. */
    hydrateRosters: (state, action: PayloadAction<RosterList[]>) => {
      state.rosters = action.payload
    },

    /** Clears roster state outright. Dispatched on logout, before login/register/bootstrap
     * hydration, and on auth failure — the one place responsible for making sure no
     * previous user's (or no-longer-valid) rosters linger across an account switch. */
    resetRosters: state => {
      state.rosters = []
    },
  },
})

export const {
  createRoster,
  deleteRoster,
  renameRoster,
  setPointsLimit,
  setDetachments,
  addEntry,
  updateEntry,
  removeEntry,
  setEntryEnhancement,
  setEntryAttachment,
  setEntryWeaponSelection,
  setEntryWargearSelections,
  importRosterFromData,
  hydrateRosters,
  resetRosters,
} = rosterSlice.actions

export const rosterReducer = rosterSlice.reducer

export function selectAllRosters(state: { roster: RosterState }): RosterList[] {
  return state.roster.rosters
}

export function selectRosterById(state: { roster: RosterState }, id: string): RosterList | undefined {
  return state.roster.rosters.find(r => r.id === id)
}
