import { createContext, useContext } from 'react'
import { useGameData } from './useGameData'
import type { GameData } from '@/types'

const GameDataContext = createContext<GameData | null>(null)

export function GameDataProvider({ children }: { children: React.ReactNode }) {
  const data = useGameData()
  return <GameDataContext.Provider value={data}>{children}</GameDataContext.Provider>
}

export function useGameDataContext(): GameData {
  const ctx = useContext(GameDataContext)
  if (!ctx) throw new Error('useGameDataContext must be used within GameDataProvider')
  return ctx
}
