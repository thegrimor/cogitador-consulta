import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RosterList, RosterEntry } from '@/types'

export interface RosterState {
  rosters: RosterList[]
}

const initialState: RosterState = {
  rosters: [],
}

function recomputeTotals(roster: RosterList) {
  roster.totalPoints = roster.entries.reduce((sum, e) => sum + (e.pointsCost ?? 0), 0)
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
          detachmentId: null,
          entries: [],
          totalPoints: 0,
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
      roster.updatedAt = new Date().toISOString()
    },

    setPointsLimit: (state, action: PayloadAction<{ id: string; pointsLimit: number | null }>) => {
      const roster = state.rosters.find(r => r.id === action.payload.id)
      if (!roster) return
      roster.pointsLimit = action.payload.pointsLimit
      roster.updatedAt = new Date().toISOString()
    },

    setDetachment: (state, action: PayloadAction<{ rosterId: string; detachmentId: string | null }>) => {
      const roster = state.rosters.find(r => r.id === action.payload.rosterId)
      if (!roster) return
      roster.detachmentId = action.payload.detachmentId
      roster.entries.forEach(e => { e.enhancementId = undefined })
      roster.updatedAt = new Date().toISOString()
    },

    addEntry: {
      prepare: (payload: { rosterId: string; entry: Omit<RosterEntry, 'id'> }) => ({
        payload: { rosterId: payload.rosterId, entry: { ...payload.entry, id: crypto.randomUUID() } },
      }),
      reducer: (state, action: PayloadAction<{ rosterId: string; entry: RosterEntry }>) => {
        const roster = state.rosters.find(r => r.id === action.payload.rosterId)
        if (!roster) return
        roster.entries.push(action.payload.entry)
        recomputeTotals(roster)
      },
    },

    updateEntry: (
      state,
      action: PayloadAction<{
        rosterId: string
        entryId: string
        changes: Partial<Pick<RosterEntry, 'modelCount' | 'pointsCost' | 'customName'>>
      }>,
    ) => {
      const roster = state.rosters.find(r => r.id === action.payload.rosterId)
      if (!roster) return
      const entry = roster.entries.find(e => e.id === action.payload.entryId)
      if (!entry) return
      Object.assign(entry, action.payload.changes)
      recomputeTotals(roster)
    },

    removeEntry: (state, action: PayloadAction<{ rosterId: string; entryId: string }>) => {
      const roster = state.rosters.find(r => r.id === action.payload.rosterId)
      if (!roster) return
      roster.entries = roster.entries.filter(e => e.id !== action.payload.entryId)
      roster.entries.forEach(e => {
        if (e.attachedToEntryId === action.payload.entryId) e.attachedToEntryId = undefined
      })
      recomputeTotals(roster)
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
      roster.updatedAt = new Date().toISOString()
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
      roster.updatedAt = new Date().toISOString()
    },

    setEntryWeapons: (
      state,
      action: PayloadAction<{ rosterId: string; entryId: string; selectedWeaponNames: string[] }>,
    ) => {
      const roster = state.rosters.find(r => r.id === action.payload.rosterId)
      if (!roster) return
      const entry = roster.entries.find(e => e.id === action.payload.entryId)
      if (!entry) return
      entry.selectedWeaponNames = action.payload.selectedWeaponNames
      roster.updatedAt = new Date().toISOString()
    },
  },
})

export const {
  createRoster,
  deleteRoster,
  renameRoster,
  setPointsLimit,
  setDetachment,
  addEntry,
  updateEntry,
  removeEntry,
  setEntryEnhancement,
  setEntryAttachment,
  setEntryWeapons,
} = rosterSlice.actions

export const rosterReducer = rosterSlice.reducer

export function selectAllRosters(state: { roster: RosterState }): RosterList[] {
  return state.roster.rosters
}

export function selectRosterById(state: { roster: RosterState }, id: string): RosterList | undefined {
  return state.roster.rosters.find(r => r.id === id)
}
