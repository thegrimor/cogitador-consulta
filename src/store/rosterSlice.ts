import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RosterList, RosterEntry } from '@/types'

interface RostersState {
  rosters: RosterList[]
}

const initialState: RostersState = { rosters: [] }

const rosterSlice = createSlice({
  name: 'rosters',
  initialState,
  reducers: {
    hydrate(_state, action: PayloadAction<RostersState>) {
      return action.payload
    },

    createRoster(state, action: PayloadAction<{
      id: string
      name: string
      factionId: string
      detachmentId: string | null
      pointsLimit: number
    }>) {
      const now = new Date().toISOString()
      state.rosters.push({
        entries: [],
        createdAt: now,
        updatedAt: now,
        ...action.payload,
      })
    },

    deleteRoster(state, action: PayloadAction<string>) {
      state.rosters = state.rosters.filter(r => r.id !== action.payload)
    },

    updateRoster(state, action: PayloadAction<{
      id: string
      changes: Partial<Pick<RosterList, 'name' | 'detachmentId' | 'pointsLimit'>>
    }>) {
      const roster = state.rosters.find(r => r.id === action.payload.id)
      if (!roster) return
      const { changes } = action.payload
      if (changes.detachmentId !== undefined && changes.detachmentId !== roster.detachmentId) {
        roster.entries.forEach(e => { e.enhancementId = undefined })
      }
      Object.assign(roster, changes)
      roster.updatedAt = new Date().toISOString()
    },

    addEntry(state, action: PayloadAction<{ rosterId: string; datasheetId: string }>) {
      const roster = state.rosters.find(r => r.id === action.payload.rosterId)
      if (!roster) return
      const entry: RosterEntry = {
        id: crypto.randomUUID(),
        datasheetId: action.payload.datasheetId,
        modelCount: 1,
        pointsCost: null,
      }
      roster.entries.push(entry)
      roster.updatedAt = new Date().toISOString()
    },

    removeEntry(state, action: PayloadAction<{ rosterId: string; entryId: string }>) {
      const roster = state.rosters.find(r => r.id === action.payload.rosterId)
      if (!roster) return
      roster.entries = roster.entries.filter(e => e.id !== action.payload.entryId)
      roster.updatedAt = new Date().toISOString()
    },

    updateEntry(state, action: PayloadAction<{
      rosterId: string
      entryId: string
      changes: Partial<Pick<RosterEntry, 'modelCount' | 'pointsCost' | 'customName' | 'selectedOptions' | 'enhancementId'>>
    }>) {
      const roster = state.rosters.find(r => r.id === action.payload.rosterId)
      if (!roster) return
      const entry = roster.entries.find(e => e.id === action.payload.entryId)
      if (!entry) return
      Object.assign(entry, action.payload.changes)
      roster.updatedAt = new Date().toISOString()
    },
  },
})

export const { hydrate, createRoster, deleteRoster, updateRoster, addEntry, removeEntry, updateEntry } = rosterSlice.actions
export default rosterSlice.reducer
