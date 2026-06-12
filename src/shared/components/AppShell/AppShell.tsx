import { Outlet } from 'react-router-dom'
import { NavBar } from '@/shared/components/NavBar'
import { ThemePicker } from '@/shared/components/ThemePicker'
import { LoadingScreen } from '@/shared/components/LoadingScreen'
import { ErrorScreen } from '@/shared/components/ErrorScreen'
import { useTheme } from '@/shared/hooks/useTheme'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'

export function AppShell() {
  const [currentTheme, setTheme, themes] = useTheme()
  const { loading, error } = useGameDataContext()

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen error={error} />

  return (
    <div className="min-h-screen bg-surface-1 text-parchment">
      <header className="sticky top-0 z-20 border-b border-rim-bright bg-surface-2 flex items-center px-4 h-10 gap-4">
        <span className="text-[9px] font-display uppercase tracking-[3px] text-crimson-bright shrink-0 select-none">
          Cogitador
        </span>
        <NavBar />
        <ThemePicker currentTheme={currentTheme} themes={themes} onSelect={setTheme} />
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}
