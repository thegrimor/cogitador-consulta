import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from './index'
import type { Enhancement } from '@/types'

export const selectAllRosters = (state: RootState) => state.rosters.rosters

export const selectRosterById = (id: string) =>
  createSelector(selectAllRosters, rosters => rosters.find(r => r.id === id))

export const selectTotalPoints = (id: string, enhancements: Enhancement[]) =>
  createSelector(selectRosterById(id), roster => {
    if (!roster) return 0
    const enhancementMap = Object.fromEntries(enhancements.map(e => [e.id, e.cost]))
    return roster.entries.reduce((sum, entry) => {
      const pts = entry.pointsCost ?? 0
      const enhPts = entry.enhancementId ? (enhancementMap[entry.enhancementId] ?? 0) : 0
      return sum + pts + enhPts
    }, 0)
  })
