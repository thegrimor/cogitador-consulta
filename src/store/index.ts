import { configureStore } from '@reduxjs/toolkit'
import rosterReducer, { hydrate } from './rosterSlice'

const STORAGE_KEY = 'wh40k_rosters'

export const store = configureStore({
  reducer: {
    rosters: rosterReducer,
  },
})

// Hydrate from localStorage on startup
try {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) store.dispatch(hydrate(JSON.parse(saved)))
} catch {
  // ignore corrupted data
}

// Persist on every change
store.subscribe(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store.getState()))
  } catch {
    // ignore storage errors
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
